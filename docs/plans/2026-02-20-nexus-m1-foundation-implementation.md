# Nexus M1 Foundation Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build M1 foundation for Nexus with wallet-aware profile, policy editor (biometric-gated), and policy evaluation plumbing for chat flow.

**Architecture:** Keep existing Solana Mobile template runtime wiring, but replace template-facing screens/navigation with Nexus-first tabs (Chat, Policy, History, Profile). Introduce a policy domain module with a tested evaluator and a `PolicyContext` that persists locally and surfaces explicit error state when on-chain sync is unavailable/rejected.

**Tech Stack:** Expo SDK 52, React Native + React Navigation, TypeScript, AsyncStorage, expo-local-authentication, Jest.

---

### Task 1: Add tested policy and intent domain primitives

**Files:**
- Create: `src/features/policy/policy-engine.test.ts`
- Create: `src/features/agent/intent-parser.test.ts`
- Create: `src/features/policy/policy-engine.ts`
- Create: `src/features/agent/intent-parser.ts`

Steps (TDD):
1. Write failing tests for policy allow/block and swap-intent parsing.
2. Run tests and confirm failure due to missing modules.
3. Implement minimal modules to satisfy tests.
4. Run tests and confirm pass.

### Task 2: Add PolicyContext with biometric-gated save and explicit rejection state

**Files:**
- Create: `src/contexts/PolicyContext.tsx`
- Create: `src/services/policy/policy-storage.ts`
- Create: `src/services/policy/policy-vault-client.ts`

Steps:
1. Implement persisted policy load/save with AsyncStorage.
2. Gate save via `expo-local-authentication`.
3. Attempt on-chain sync through a policy-vault client adapter.
4. If sync fails/unavailable, surface explicit user-facing error in context state.

### Task 3: Replace template tabs/screens with Nexus M1 screens

**Files:**
- Modify: `src/navigators/HomeNavigator.tsx`
- Create: `src/screens/ChatScreen.tsx`
- Create: `src/screens/PolicyScreen.tsx`
- Create: `src/screens/HistoryScreen.tsx`
- Create: `src/screens/ProfileScreen.tsx`
- Modify: `src/screens/index.ts`

Steps:
1. Build tab navigation for Chat, Policy, History, Profile.
2. Wire chat to parse/evaluate basic swap intents.
3. Wire policy editor to `PolicyContext`.
4. Wire profile to wallet connect/disconnect/account status.

### Task 4: Wire provider tree and verify

**Files:**
- Modify: `App.tsx`

Steps:
1. Add `PolicyProvider` in app provider chain.
2. Run `npm run test:ci`.
3. Run `npm run typecheck`.
4. Run `npm run lint` and ensure no errors.
