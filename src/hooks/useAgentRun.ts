import { useCallback, useRef, useState } from 'react';
import {
    executeAgent,
    type AgentRunResult,
    type StepEvent,
} from '../services/agent/agent-api';
import { useAuthorization } from '../utils/useAuthorization';
import { useMobileWallet } from '../utils/useMobileWallet';
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

    const [runState, setRunState] = useState<AgentRunState>('idle');
    const [steps, setSteps] = useState<StepEvent[]>([]);
    const [result, setResult] = useState<AgentRunResult | null>(null);
    const [confirmedSig, setConfirmedSig] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const resetRun = useCallback(() => {
        setRunState('idle');
        setSteps([]);
        setResult(null);
        setConfirmedSig(null);
        setError(null);
    }, []);

    // ─── Execute Intent ───────────────────────────────────────────

    const executeIntent = useCallback(
        async (intent: string) => {
            if (!selectedAccount) {
                setError('Wallet not connected');
                setRunState('error');
                return;
            }

            try {
                setRunState('running');
                setSteps([]);
                setResult(null);
                setConfirmedSig(null);
                setError(null);

                const pubkey = selectedAccount.publicKey.toBase58();
                const agentResult = await executeAgent(intent, pubkey);

                setResult(agentResult);

                // Animate steps in one-by-one with a stagger
                for (let i = 0; i < agentResult.steps.length; i++) {
                    await new Promise((resolve) => setTimeout(resolve, 300));
                    setSteps((prev) => [...prev, agentResult.steps[i]]);
                }

                // Determine final state
                if (agentResult.rejection) {
                    setRunState('rejected');
                    setError(agentResult.rejection.reason);
                } else if (agentResult.unsignedTx) {
                    setRunState('awaiting_approval');
                } else {
                    setRunState('error');
                    setError('No transaction returned');
                }
            } catch (err: any) {
                setError(err.message || 'Agent execution failed');
                setRunState('error');
            }
        },
        [selectedAccount],
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
