import { useQuery } from '@tanstack/react-query';

export function useSeekerId(walletAddress: string | undefined) {
    return useQuery({
        queryKey: ['seekerId', walletAddress],
        queryFn: async () => {
            if (!walletAddress) return null;

            try {
                // The Solana Explorer provides a unified All Name Service (ANS) API
                // that correctly resolves .skr, .sol, and other ecosystem domains.
                const response = await fetch(`https://explorer.solana.com/api/ans-domains/${walletAddress}`);

                if (!response.ok) {
                    throw new Error(`ANS API error: ${response.status}`);
                }

                const data = await response.json();

                // Response format: { "domains": [ { "address": "...", "name": "ben.skr" } ] }
                if (data && data.domains && data.domains.length > 0) {
                    // Find the first .skr domain, or fallback to the first domain available
                    const skrDomain = data.domains.find((d: any) => d.name.endsWith('.skr'));
                    if (skrDomain) {
                        return skrDomain.name;
                    }
                    return data.domains[0].name;
                }

                return null;
            } catch (e) {
                console.error('Error fetching Seeker ID via ANS:', e);
                return null;
            }
        },
        staleTime: 60 * 1000 * 5, // 5 minutes
    });
}
