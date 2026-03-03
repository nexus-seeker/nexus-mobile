# Chat Home + Thread Drawer Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Open directly into Chat after onboarding and merge conversation history access into Chat via an in-screen drawer so users can send messages immediately.

**Architecture:** Keep `Chat` as the primary destination and retain thread identity in `threadId`. Add an in-chat conversation drawer that lists existing threads and supports creating a new thread. Preserve defensive behavior so Chat with no `threadId` never shows cross-thread history.

**Tech Stack:** React Native, React Navigation native stack, TanStack Query, Jest + React Native Testing Library, TypeScript.

---

### Task 1: Add direct-to-chat navigation regression test

**Files:**
- Create: `src/navigators/AppNavigator.test.tsx`
- Modify: `src/navigators/AppNavigator.tsx`

**Step 1: Write the failing test**
- Mock `WalletConnectScreen`, `OnboardingScreen`, and `ChatScreen`.
- Assert flow `WalletConnect -> Onboarding -> Chat` and verify Chat receives `threadId` param.

**Step 2: Run test to verify it fails**
- Run: `npm test -- src/navigators/AppNavigator.test.tsx --runInBand`
- Expected: FAIL because onboarding currently replaces to `ConversationList`.

**Step 3: Write minimal implementation**
- Update onboarding completion in `AppNavigator` to replace into `Chat` with `threadId` from shared helper.

**Step 4: Run test to verify it passes**
- Run same test command and expect PASS.

### Task 2: Add Chat drawer thread-switch regression tests

**Files:**
- Modify: `src/screens/ChatScreen.test.tsx`
- Modify: `src/screens/ChatScreen.history.test.tsx`
- Modify: `src/screens/ChatScreen.tsx`

**Step 1: Write failing tests**
- Add test opening chat drawer and selecting thread updates displayed history scope.
- Add test that drawer `New Chat` clears to empty-state context and does not show prior thread messages.

**Step 2: Run tests to verify they fail**
- Run: `npm test -- src/screens/ChatScreen.test.tsx --runInBand`
- Expected: FAIL due missing drawer controls/behavior.

**Step 3: Write minimal implementation**
- Add drawer UI and thread list using `useConversationThreads`.
- Introduce local `activeThreadId` in Chat that defaults to route thread or generated thread.
- Route all chat-scoped behavior (history filter, execute intent, proactive feed) through `activeThreadId`.

**Step 4: Run tests to verify they pass**
- Re-run screen test command and expect PASS.

### Task 3: Keep thread list freshness and shared thread ID generation

**Files:**
- Modify: `src/hooks/useAgentRun.ts`
- Modify: `src/screens/ConversationListScreen.tsx`
- Modify: `src/components/top-bar/top-bar-feature.tsx`
- Modify: `src/components/top-bar/top-bar-ui.tsx`
- Create/Modify: `src/utils/thread-id.ts`

**Step 1: Write failing expectation in existing tests (if needed)**
- Ensure thread-aware navigation tests still require `threadId`.

**Step 2: Implement minimal update**
- Invalidate `conversationThreads` query when run completes.
- Keep all chat entry points thread-explicit via shared helper.

**Step 3: Verify with targeted tests**
- Run:
  - `npm test -- src/components/top-bar/top-bar-navigation.test.tsx --runInBand`
  - `npm test -- src/components/top-bar/top-bar-ui-settings.test.tsx --runInBand`

### Task 4: Final verification

**Files:**
- Verify all touched files

**Step 1: Run verification suite**
- `npm test -- src/navigators/AppNavigator.test.tsx --runInBand`
- `npm test -- src/screens/ChatScreen.test.tsx --runInBand`
- `npm test -- src/screens/ChatScreen.history.test.tsx --runInBand`
- `npm test -- src/screens/ConversationListScreen.test.tsx --runInBand`
- `npm run typecheck`

**Step 2: Confirm outcomes**
- All commands pass with no TypeScript errors.
