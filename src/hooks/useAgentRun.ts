import { useCallback, useEffect, useRef, useState } from 'react';
import {
    executeAgent,
    type AgentRunResult,
    openAgentStream,
    type StepEvent,
} from '../services/agent/agent-api';
import { useAuthorization } from '../utils/useAuthorization';
import { useConnection } from '../utils/ConnectionProvider';
import {
    VersionedTransaction,
} from '@solana/web3.js';
import { transact } from '@solana-mobile/mobile-wallet-adapter-protocol-web3js';

export type AgentRunState =
    | 'idle'
    | 'running'
    | 'awaiting_approval'
    | 'signing'
    | 'confirmed'
    | 'rejected'
    | 'error';

export function useAgentRun() {
    const { selectedAccount, authorizeSession } = useAuthorization();
    const { connection } = useConnection();
    const closeStreamRef = useRef<(() => void) | null>(null);
    const heartbeatTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const lastActivityAtRef = useRef<number>(0);

    const [runState, setRunState] = useState<AgentRunState>('idle');
    const [steps, setSteps] = useState<StepEvent[]>([]);
    const [result, setResult] = useState<AgentRunResult | null>(null);
    const [confirmedSig, setConfirmedSig] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const isStillWorkingStep = useCallback(
        (step: StepEvent) =>
            step.type === 'step' &&
            step.node === 'heartbeat_status' &&
            step.label === 'Still working...',
        [],
    );

    const removeStillWorkingStep = useCallback(() => {
        setSteps((prev) => prev.filter((step) => !isStillWorkingStep(step)));
    }, [isStillWorkingStep]);

    const stopActiveRun = useCallback(() => {
        if (heartbeatTimerRef.current) {
            clearInterval(heartbeatTimerRef.current);
            heartbeatTimerRef.current = null;
        }
        if (closeStreamRef.current) {
            closeStreamRef.current();
            closeStreamRef.current = null;
        }
    }, []);

    const resetRun = useCallback(() => {
        stopActiveRun();
        setRunState('idle');
        setSteps([]);
        setResult(null);
        setConfirmedSig(null);
        setError(null);
    }, [stopActiveRun]);

    useEffect(() => () => stopActiveRun(), [stopActiveRun]);

    // ─── Execute Intent ───────────────────────────────────────────

    const executeIntent = useCallback(
        async (intent: string) => {
            if (!selectedAccount) {
                setError('Wallet not connected');
                setRunState('error');
                return;
            }

            try {
                stopActiveRun();
                setRunState('running');
                setSteps([]);
                setResult(null);
                setConfirmedSig(null);
                setError(null);

                const pubkey = selectedAccount.publicKey.toBase58();
                const executeResponse = await executeAgent(intent, pubkey);

                setSteps(executeResponse.steps ?? []);

                if (!executeResponse.runId) {
                    throw new Error('Agent run could not be started');
                }

                lastActivityAtRef.current = Date.now();

                const failForTimeout = () => {
                    stopActiveRun();
                    setRunState('error');
                    setError('Agent run timed out. Please retry your intent.');
                };

                heartbeatTimerRef.current = setInterval(() => {
                    const elapsed = Date.now() - lastActivityAtRef.current;

                    if (elapsed > 20000) {
                        failForTimeout();
                        return;
                    }

                    if (elapsed > 8000) {
                        setSteps((prev) => {
                            const last = prev[prev.length - 1];
                            if (last && isStillWorkingStep(last)) {
                                return prev;
                            }
                            return [
                                ...prev,
                                {
                                    type: 'step',
                                    node: 'heartbeat_status',
                                    label: 'Still working...',
                                    status: 'running',
                                },
                            ];
                        });
                    }
                }, 1000);

                closeStreamRef.current = openAgentStream(executeResponse.runId, {
                    onEvent: (event) => {
                        lastActivityAtRef.current = Date.now();

                        if (event.type === 'heartbeat') {
                            return;
                        }

                        if (event.type === 'step') {
                            setSteps((prev) => [...prev.filter((step) => !isStillWorkingStep(step)), event]);
                            return;
                        }

                        if (event.type === 'complete') {
                            stopActiveRun();
                            removeStillWorkingStep();
                            const finalResult = event.result as AgentRunResult | undefined;
                            if (!finalResult) {
                                setRunState('error');
                                setError('Agent run completed without a result. Please retry.');
                                return;
                            }

                            setResult(finalResult);

                            if (finalResult.rejection) {
                                setRunState('rejected');
                                setError(finalResult.rejection.reason);
                            } else if (finalResult.unsignedTx) {
                                setRunState('awaiting_approval');
                            } else {
                                setRunState('error');
                                setError('Agent run completed without a transaction. Please retry.');
                            }
                        }
                    },
                    onError: (streamError) => {
                        stopActiveRun();
                        setRunState('error');
                        setError(streamError.message || 'Agent stream failed. Please retry.');
                    },
                });
            } catch (err: any) {
                stopActiveRun();
                setError(err.message || 'Agent execution failed');
                setRunState('error');
            }
        },
        [selectedAccount, stopActiveRun, isStillWorkingStep, removeStillWorkingStep],
    );

    // ─── Approve & Sign Transaction ──────────────────────────────

    const approveTransaction = useCallback(async () => {
        if (!result?.unsignedTx || !selectedAccount) {
            return;
        }

        try {
            setRunState('signing');

            // 1. Deserialize the base64 VersionedTransaction
            const txBytes = Buffer.from(result.unsignedTx, 'base64');
            const unsignedTx = VersionedTransaction.deserialize(txBytes);

            // 2. Get fresh blockhash
            const { blockhash, lastValidBlockHeight } =
                await connection.getLatestBlockhash('confirmed');
            unsignedTx.message.recentBlockhash = blockhash;

            // 3. MWA transact → Seed Vault intercepts → fingerprint
            await transact(async (wallet) => {
                await authorizeSession(wallet);

                const signedTransactions = await wallet.signTransactions({
                    transactions: [unsignedTx],
                });

                const signedTx = signedTransactions[0];

                // 4. Broadcast signed tx
                const sig = await connection.sendRawTransaction(
                    signedTx.serialize(),
                    { skipPreflight: false, maxRetries: 3 },
                );

                await connection.confirmTransaction(
                    { signature: sig, blockhash, lastValidBlockHeight },
                    'confirmed',
                );

                setConfirmedSig(sig);
                setRunState('confirmed');
            });
        } catch (err: any) {
            setError(err.message || 'Transaction signing failed');
            setRunState('error');
        }
    }, [result, selectedAccount, connection, authorizeSession]);

    return {
        // State
        runState,
        steps,
        result,
        confirmedSig,
        error,

        // Actions
        executeIntent,
        approveTransaction,
        resetRun,
    };
}
