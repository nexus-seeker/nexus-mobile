import { useCallback, useEffect, useRef, useState } from 'react';
import {
    executeAgent,
    type AgentRunResult,
    openAgentStream,
    type StepEvent,
    broadcastOnboardTx as broadcastSignedTx,
} from '../services/agent/agent-api';
import { useAuthorization } from '../utils/useAuthorization';
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
    const closeStreamRef = useRef<(() => void) | null>(null);
    const streamRunTokenRef = useRef<number | null>(null);
    const heartbeatTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const heartbeatRunTokenRef = useRef<number | null>(null);
    const runTokenRef = useRef(0);
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

    const stopActiveRun = useCallback((targetRunToken?: number) => {
        const token = targetRunToken ?? runTokenRef.current;

        if (
            heartbeatTimerRef.current &&
            heartbeatRunTokenRef.current === token
        ) {
            clearInterval(heartbeatTimerRef.current);
            heartbeatTimerRef.current = null;
            heartbeatRunTokenRef.current = null;
        }

        if (
            closeStreamRef.current &&
            streamRunTokenRef.current === token
        ) {
            closeStreamRef.current();
            closeStreamRef.current = null;
            streamRunTokenRef.current = null;
        }
    }, []);

    const resetRun = useCallback(() => {
        const activeRunToken = runTokenRef.current;
        runTokenRef.current += 1;
        stopActiveRun(activeRunToken);
        setRunState('idle');
        setSteps([]);
        setResult(null);
        setConfirmedSig(null);
        setError(null);
    }, [stopActiveRun]);

    useEffect(() => {
        return () => {
            const activeRunToken = runTokenRef.current;
            runTokenRef.current += 1;
            stopActiveRun(activeRunToken);
        };
    }, [stopActiveRun]);

    // ─── Execute Intent ───────────────────────────────────────────

    const executeIntent = useCallback(
        async (intent: string) => {
            if (!selectedAccount) {
                setError('Wallet not connected');
                setRunState('error');
                return;
            }

            const previousRunToken = runTokenRef.current;
            const runToken = previousRunToken + 1;

            try {
                runTokenRef.current = runToken;
                stopActiveRun(previousRunToken);

                setRunState('running');
                setSteps([]);
                setResult(null);
                setConfirmedSig(null);
                setError(null);

                const pubkey = selectedAccount.publicKey.toBase58();
                const executeResponse = await executeAgent(intent, pubkey);

                if (runTokenRef.current !== runToken) {
                    return;
                }

                setSteps(executeResponse.steps ?? []);

                if (!executeResponse.runId) {
                    throw new Error('Agent run could not be started');
                }

                lastActivityAtRef.current = Date.now();

                const failForTimeout = () => {
                    if (runTokenRef.current !== runToken) {
                        return;
                    }

                    stopActiveRun(runToken);
                    setRunState('error');
                    setError('Agent run timed out. Please retry your intent.');
                };

                heartbeatTimerRef.current = setInterval(() => {
                    if (runTokenRef.current !== runToken) {
                        return;
                    }

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
                heartbeatRunTokenRef.current = runToken;

                closeStreamRef.current = openAgentStream(executeResponse.runId, {
                    onEvent: (event) => {
                        if (runTokenRef.current !== runToken) {
                            return;
                        }

                        lastActivityAtRef.current = Date.now();

                        if (event.type === 'heartbeat') {
                            return;
                        }

                        if (event.type === 'error') {
                            stopActiveRun(runToken);
                            removeStillWorkingStep();
                            setRunState('error');
                            setError(event.message || 'Agent stream failed. Please retry.');
                            return;
                        }

                        if (event.type === 'step') {
                            setSteps((prev) => [...prev.filter((step) => !isStillWorkingStep(step)), event]);
                            return;
                        }

                        if (event.type === 'complete') {
                            stopActiveRun(runToken);
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
                        if (runTokenRef.current !== runToken) {
                            return;
                        }

                        stopActiveRun(runToken);
                        setRunState('error');
                        setError(streamError.message || 'Agent stream failed. Please retry.');
                    },
                });
                streamRunTokenRef.current = runToken;
            } catch (err: any) {
                if (runTokenRef.current !== runToken) {
                    return;
                }

                stopActiveRun(runToken);
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

            // 1. Deserialize the unsigned tx (blockhash already set by API)
            const txBytes = Buffer.from(result.unsignedTx, 'base64');
            const unsignedTx = VersionedTransaction.deserialize(txBytes);

            // 2. Sign via Seed Vault — sign only, do NOT broadcast from the device
            //    (device may not have direct devnet RPC access via USB)
            let signedTxBase64 = '';
            await transact(async (wallet) => {
                await authorizeSession(wallet);
                const [signed] = await wallet.signTransactions({
                    transactions: [unsignedTx],
                });
                signedTxBase64 = Buffer.from(signed.serialize()).toString('base64');
            });

            // 3. Relay broadcast through API server (which has confirmed devnet connectivity)
            const { signature } = await broadcastSignedTx(signedTxBase64);

            setConfirmedSig(signature);
            setRunState('confirmed');
        } catch (err: any) {
            setError(err.message || 'Transaction signing failed');
            setRunState('error');
        }
    }, [result, selectedAccount, authorizeSession]);


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
