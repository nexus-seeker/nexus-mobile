import { type PolicyProtocol } from "../policy/policy-engine";

export type ParsedSwapIntent = {
  amountSol: number;
  fromToken: "SOL";
  toToken: string;
  protocol: PolicyProtocol;
};

const SWAP_INTENT_REGEX =
  /swap\s+([0-9]*\.?[0-9]+)\s+sol\s+to\s+([a-z0-9]+)/i;

export function parseSwapIntent(intent: string): ParsedSwapIntent | null {
  const match = intent.trim().match(SWAP_INTENT_REGEX);

  if (!match) {
    return null;
  }

  const amountSol = Number.parseFloat(match[1]);
  const toToken = match[2].toUpperCase();

  if (!Number.isFinite(amountSol) || amountSol <= 0) {
    return null;
  }

  return {
    amountSol,
    fromToken: "SOL",
    toToken,
    protocol: "JUPITER",
  };
}
