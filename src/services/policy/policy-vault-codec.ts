import {
  type PolicyProtocol,
  type PolicyState,
} from "../../features/policy/policy-engine";

const LAMPORTS_PER_SOL = 1_000_000_000;

const CODEC_VERSION = 1;
const PAYLOAD_BYTES = 18;
const OFFSET_VERSION = 0;
const OFFSET_DAILY_LIMIT = 1;
const OFFSET_DAILY_SPENT = 9;
const OFFSET_PROTOCOL_FLAGS = 17;

const PROTOCOL_FLAG_JUPITER = 1 << 0;
const PROTOCOL_FLAG_SPL_TRANSFER = 1 << 1;

export function buildPolicyVaultPayload(policy: PolicyState): Uint8Array {
  const payload = new Uint8Array(PAYLOAD_BYTES);
  payload[OFFSET_VERSION] = CODEC_VERSION;

  const view = new DataView(payload.buffer, payload.byteOffset, payload.byteLength);
  view.setBigUint64(OFFSET_DAILY_LIMIT, solToLamports(policy.dailyLimitSol), true);
  view.setBigUint64(OFFSET_DAILY_SPENT, solToLamports(policy.dailySpentSol), true);

  payload[OFFSET_PROTOCOL_FLAGS] = protocolsToFlags(policy.allowedProtocols);

  return payload;
}

export function parsePolicyVaultPayload(payload: Uint8Array): PolicyState {
  if (payload.byteLength < PAYLOAD_BYTES) {
    throw new Error("Policy payload is too short.");
  }

  const view = new DataView(payload.buffer, payload.byteOffset, payload.byteLength);
  const version = view.getUint8(OFFSET_VERSION);

  if (version !== CODEC_VERSION) {
    throw new Error(`Unsupported policy payload version: ${version}.`);
  }

  const dailyLimitSol = lamportsToSol(view.getBigUint64(OFFSET_DAILY_LIMIT, true));
  const dailySpentSol = lamportsToSol(view.getBigUint64(OFFSET_DAILY_SPENT, true));
  const allowedProtocols = flagsToProtocols(view.getUint8(OFFSET_PROTOCOL_FLAGS));

  return {
    dailyLimitSol,
    dailySpentSol,
    allowedProtocols,
  };
}

function protocolsToFlags(protocols: PolicyProtocol[]): number {
  let flags = 0;

  for (const protocol of protocols) {
    if (protocol === "JUPITER") {
      flags |= PROTOCOL_FLAG_JUPITER;
      continue;
    }

    if (protocol === "SPL_TRANSFER") {
      flags |= PROTOCOL_FLAG_SPL_TRANSFER;
    }
  }

  return flags;
}

function flagsToProtocols(flags: number): PolicyProtocol[] {
  const protocols: PolicyProtocol[] = [];

  if ((flags & PROTOCOL_FLAG_JUPITER) !== 0) {
    protocols.push("JUPITER");
  }

  if ((flags & PROTOCOL_FLAG_SPL_TRANSFER) !== 0) {
    protocols.push("SPL_TRANSFER");
  }

  return protocols;
}

function solToLamports(amountSol: number): bigint {
  return BigInt(Math.round(Math.max(amountSol, 0) * LAMPORTS_PER_SOL));
}

function lamportsToSol(amountLamports: bigint): number {
  return Number(amountLamports) / LAMPORTS_PER_SOL;
}
