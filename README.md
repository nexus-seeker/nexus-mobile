# Nexus Mobile

Nexus is a Seeker-first AI agent app for Solana. This repository contains the React Native + Expo mobile client.

## Milestone Status

- M0: Scaffold and engineering baseline (completed)
- M1: Wallet + PolicyVault read/write (in progress)
- M2: Real vertical slice (intent -> policy -> Seed Vault sign -> tx -> receipt -> push)

## Tech Stack

- Expo SDK 52 + React Native 0.76 + TypeScript
- Solana Mobile Wallet Adapter + `@solana/web3.js`
- React Navigation + React Query
- Jest + ESLint + GitHub Actions

## Prerequisites

- Node 20 (managed via `fnm`, see `.nvmrc`)
- Android device/emulator
- Expo account for dev builds

## Setup

```bash
fnm use
npm install
```

Create env values:

```bash
cp .env.example .env
```

## Run

```bash
npm run start
```

For network-constrained environments:

```bash
npm run start:tunnel
```

## Quality Checks

```bash
npm run lint
npm run typecheck
npm run test:ci
```

## Environment Variables

- `EXPO_PUBLIC_AGENT_API_URL`: backend endpoint for agent planning
- `EXPO_PUBLIC_POLICY_PROGRAM_ID`: Anchor PolicyVault program ID on devnet

## M0 Verification Notes

- MWA and Seed Vault flows require an Expo development build (not Expo Go).
- Physical Seeker validation is required for fingerprint/double-tap signing.
- Local emulator checks are useful for non-hardware UI and state flow.

## Judge Runbook (No Mock, Devnet)

Use this runbook for a real, no-mock demo loop.

1. Start API in real mode (`nexus-api`):

```bash
cp .env.example .env
npm install
MOCK_MODE=false npm run start:dev
```

2. Start mobile app (`nexus-mobile`):

```bash
cp .env.example .env
npm install
npm run start
```

3. Confirm mobile env values:

- `EXPO_PUBLIC_AGENT_API_URL=http://localhost:3001`
- `EXPO_PUBLIC_API_KEY=nexus-hackathon-key`
- `EXPO_PUBLIC_POLICY_PROGRAM_ID=DxV7vXf919YddC74X726PpsrPpHLXNZtdBsk6Lweh3HJ`

4. Demo intents (in Chat screen):

- Preferred successful path: `Transfer 0.001 SOL to <recipient_pubkey>`
- Swap path (current devnet route may reject): `Swap 0.01 SOL to USDC`
- On swap rejection, tap `Try Demo-Safe Transfer` and continue signing flow.

5. Policy rejection demo:

- In Policy tab, keep a low daily cap (for example `0.5 SOL`)
- Try: `Transfer 1 SOL to <recipient_pubkey>`
- Expect rejection before approval step.
