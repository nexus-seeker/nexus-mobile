import { Connection, PublicKey } from "@solana/web3.js";
import { Buffer } from "buffer";

async function main() {
    const connection = new Connection("https://api.devnet.solana.com", "confirmed");
    const vaultPubkey = new PublicKey("7o64HNEkZZgTFa9fg2EWsS1stsbzUuZV9CziawESFUN1");

    const accountInfo = await connection.getAccountInfo(vaultPubkey);
    if (!accountInfo) {
        console.log("Account not found");
        return;
    }

    const data = accountInfo.data;
    const discriminatorLength = 8;
    const vaultData = data.slice(discriminatorLength);

    let offset = 0;

    // owner (32)
    const owner = new PublicKey(vaultData.slice(offset, offset + 32)).toBase58();
    offset += 32;

    // dailyMaxLamports (8)
    const dailyMaxLamports = vaultData.readBigUInt64LE(offset);
    offset += 8;

    // currentSpend (8)
    const currentSpendLamports = vaultData.readBigUInt64LE(offset);
    offset += 8;

    // last_reset_ts (8)
    offset += 8;

    // protocols (Vec<String>)
    const protocolCount = vaultData.readUInt32LE(offset);
    offset += 4;

    const protocols = [];
    for (let i = 0; i < protocolCount; i++) {
        const len = vaultData.readUInt32LE(offset);
        offset += 4;
        protocols.push(vaultData.slice(offset, offset + len).toString('utf-8'));
        offset += len;
    }

    console.log("On-Chain Vault Data:");
    console.log("Owner:", owner);
    console.log("Daily Max:", Number(dailyMaxLamports) / 1e9, "SOL");
    console.log("Protocols:", protocols);
}

main().catch(console.error);
