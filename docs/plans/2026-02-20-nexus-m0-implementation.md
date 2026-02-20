# Nexus M0 Scaffold Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Initialize a production-ready Expo/Solana Mobile scaffold in this repo with baseline quality gates for M0.

**Architecture:** Use the official Solana Mobile Expo template as the foundation and keep app code at repository root. Add lightweight delivery infrastructure (Node pinning, lint/typecheck/test scripts, and CI) to support rapid milestone iteration without refactor debt.

**Tech Stack:** Expo (TypeScript), Solana Mobile template, React Native, Jest, ESLint, GitHub Actions.

---

### Task 1: Scaffold app from official Solana Mobile template

**Files:**
- Create: template-generated app files in temporary directory
- Modify: repository root via copy/merge of scaffold files

**Step 1: Create scaffold in a temporary directory**

Run:

```bash
yarn create expo-app .tmp-nexus-scaffold --template @solana-mobile/solana-mobile-expo-template
```

**Step 2: Verify scaffold command succeeded**

Run:

```bash
ls .tmp-nexus-scaffold
```

Expected: Expo project files (`package.json`, `app/` or `App.tsx`, `tsconfig.json`, etc.)

**Step 3: Copy scaffold into repo root preserving docs/**

Run:

```bash
rsync -a .tmp-nexus-scaffold/ ./
```

**Step 4: Remove temporary directory**

Run:

```bash
rm -rf .tmp-nexus-scaffold
```

**Step 5: Commit scaffold import**

```bash
git add .
git commit -m "chore: scaffold Expo app from Solana Mobile template"
```

### Task 2: Add baseline repo standards

**Files:**
- Create: `.nvmrc`, `.github/workflows/ci.yml`
- Modify: `package.json`, `README.md` (if needed)

**Step 1: Add Node version pin**

Create `.nvmrc` with `20`.

**Step 2: Ensure scripts cover lint/typecheck/test**

Add or adjust scripts in `package.json`:

- `lint`
- `typecheck`
- `test`

**Step 3: Add CI workflow**

Create GitHub Actions workflow that runs install + lint + typecheck + test on push and pull_request.

**Step 4: Verify locally**

Run:

```bash
yarn lint && yarn typecheck && yarn test --watch=false
```

Expected: all pass.

**Step 5: Commit standards baseline**

```bash
git add .nvmrc package.json .github/workflows/ci.yml
git commit -m "chore: add Node pin and CI quality gates"
```

### Task 3: M0 verification evidence

**Files:**
- Modify: `README.md` (M0 verification notes)

**Step 1: Document M0 local run commands**

Add quickstart commands and note that physical Seeker validation is required for fingerprint/double-tap verification.

**Step 2: Verify dev start command**

Run:

```bash
npx expo start --offline --non-interactive
```

Expected: Metro starts successfully.

**Step 3: Commit verification notes**

```bash
git add README.md
git commit -m "docs: add M0 setup and verification instructions"
```
