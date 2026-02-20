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
