const { Connection, PublicKey } = require('@solana/web3.js');
const { TldParser } = require('@onsol/tldparser');

async function check() {
    const HELIUS_RPC_URL = 'https://mainnet.helius-rpc.com/?api-key=8e6d31c6-686b-42e2-81ef-370a1fe4dbcf';
    const connection = new Connection(HELIUS_RPC_URL);
    const wallet = new PublicKey('DasLSgNnPyMmFFGNQf45jraj37GgnQZRaqQ5YptVVsVo');

    try {
        const parser = new TldParser(connection);

        console.log("Looking up domains for:", wallet.toBase58());
        const userDomains = await parser.getAllUserDomains(wallet);
        console.log("User Domains:", userDomains.map(d => d.domain));

        // Let's directly resolve the domain the user told us about
        console.log("Resolving ben.skr...");
        const pubkey = await parser.getOwnerFromDomainTld("ben.skr");
        console.log("Owner of ben.skr:", pubkey?.toBase58());

    } catch (e) {
        console.error("Error looking up onsol/tldparser:", e);
    }
}
check();
