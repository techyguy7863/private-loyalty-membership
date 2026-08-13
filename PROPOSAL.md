# Project Proposal: Private Loyalty Membership (PLM)

> **Zero-Knowledge VIP Loyalty Tier Verification & Reward Redemption Protocol on Midnight Network**

[![Midnight Network](https://img.shields.io/badge/Network-Midnight_Preview-8b5cf6?style=flat-square)](https://explorer.preview.midnight.network)
[![Compact Language](https://img.shields.io/badge/Compact-v0.23-06b6d4?style=flat-square)](https://midnight.network)
[![Framework](https://img.shields.io/badge/Framework-Next.js_14-black?style=flat-square&logo=nextdotjs)](https://nextjs.org)
[![License](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)](LICENSE)

---

## ❓ Question 1: What is the project about?

**Private Loyalty Membership (PLM)** is a privacy-preserving decentralized application (dApp) built on the **Midnight Network** using **Compact zero-knowledge (ZK) smart contracts**. It enables consumers to prove VIP loyalty status, qualify for tier rewards, and redeem points — **without disclosing their actual point balance, purchase history, or personal identity** to merchants, third-party aggregators, or on-chain observers.

Traditional loyalty programs are surveillance systems: they accumulate detailed spending behavior, sell data to brokers, and expose user account balances to centralized servers prone to breach. PLM replaces this with a ZK architecture where:

- **Private proofs are generated client-side inside the member's browser**
- **Only a cryptographic commitment hash is written to the Midnight chain**
- **No personal data, point total, or purchase record ever touches the network**

The smart contract (`contracts/private_loyalty_membership.compact`) implements 6 circuits that handle the full lifecycle: reward claiming, membership verification, revocation, merchant authority anchoring, program rotation, and session management.

---

## ❓ Question 2: What problem does it solve?

### The Privacy Crisis in Loyalty Programs

1. **Pervasive Consumer Profiling**: Traditional loyalty programs aggregate detailed purchase histories and sell behavioral data to data brokers, enabling comprehensive profiling without explicit consent.

2. **Centralized Database Vulnerabilities**: Merchant databases storing customer emails, phone numbers, tier levels, and point balances are prime targets for data breaches and account takeover attacks.

3. **Identity Leakage for Status Verification**: Demonstrating VIP or high-net-worth tier status requires disclosing complete account balances and transaction histories to merchants — creating unnecessary privacy exposure.

4. **Replay & Fraud Attacks**: Without ZK commitment binding and session nonces, fraudulent members can reuse or forge loyalty proofs across merchants.

5. **No Trustless Revocation**: Existing systems cannot revoke fraudulent memberships without centralized authority intervention — creating disputes and fraud.

### How PLM Solves This

| Problem | PLM Solution |
|---|---|
| Identity exposure | `memberSecretKey()` witness — never leaves the device |
| Point balance disclosure | `memberPointBalance()` witness — compared privately to threshold (`assert(balance >= minimumTierPoints)`) |
| Purchase history leak | `membershipRecordHash()` — SHA-256 hashed locally before ZK proof |
| Replay fraud | `loyaltyProofNonce()` + `activeSession` epoch counter |
| Revocation | `revokeMembership()` circuit with ZK merchant authority proof |
| Merchant impersonation | `merchantCommitment` anchor — `setMerchantCommitment()` circuit |

---

## ❓ Question 3: How does the Midnight ZK architecture work?

### Compact Smart Contract Design (`contracts/private_loyalty_membership.compact`)

PLM uses Midnight's **dual-state model**: private witnesses computed on-device vs. public ledger state stored on-chain.

#### Ledger State (8 public fields)

| Ledger Field | Type | Description |
|---|---|---|
| `memberCount` | `Counter` | Total verified reward claims |
| `revokedCount` | `Counter` | Total revoked memberships |
| `activeSession` | `Counter` | Epoch nonce for replay protection |
| `programId` | `Bytes<32>` | Current active loyalty program ID |
| `merchantCommitment` | `Bytes<32>` | Merchant public authority commitment |
| `lastRewardCommitment` | `Bytes<32>` | Most recent member ZK reward hash |
| `lastRevokedCommitment` | `Bytes<32>` | Most recent revoked commitment hash |
| `minimumTierPoints` | `Uint<32>` | Minimum qualifying point threshold |

#### Witnesses (5 private inputs — never disclosed)

| Witness | Type | Purpose |
|---|---|---|
| `memberSecretKey()` | `Bytes<32>` | Member private identity key |
| `loyaltyProofNonce()` | `Bytes<32>` | Entropy nonce (replay-resistance) |
| `membershipRecordHash()` | `Bytes<32>` | Hashed purchase/point record |
| `memberPointBalance()` | `Uint<32>` | Private point balance (vs. threshold) |
| `merchantSigningKey()` | `Bytes<32>` | Merchant admin authorization key |

#### Circuit Architecture (6 circuits)

| Circuit | Inputs | Witnesses Used | Business Logic |
|---|---|---|---|
| `claimReward` | `Bytes<32>` programId | memberSecretKey, loyaltyProofNonce, membershipRecordHash, memberPointBalance | Issues ZK reward commitment with private threshold check |
| `verifyMembership` | `Bytes<32>` commitment | — | Public on-chain verification of a claimed commitment |
| `revokeMembership` | `Bytes<32>` commitment | merchantSigningKey | Revoke a membership — ZK merchant authority required |
| `setMerchantCommitment` | `Uint<32>` threshold | merchantSigningKey | Anchor merchant authority + set point threshold |
| `resetProgram` | `Bytes<32>`, `Uint<32>` | — | New loyalty program epoch with updated threshold |
| `incrementSession` | — | — | Bump session nonce (replay protection) |

#### ZK Privacy Flow

```
[Member's Device]
  ├─ memberSecretKey()      →  ZK witness (private, never disclosed)
  ├─ loyaltyProofNonce()    →  ZK witness (private, never disclosed)
  ├─ membershipRecordHash() →  ZK witness (private, never disclosed)
  ├─ memberPointBalance()   →  assert(balance >= minimumTierPoints) ← ZK constraint
  └─ persistentHash<Vector<5, Bytes<32>>>([domain, key, nonce, record, session])
                            →  rewardCommitment (only this is disclosed on-chain)

[Midnight Chain]
  └─ lastRewardCommitment: 0x8b9c0d1e... ← only the hash is stored
```

---

## ❓ Question 4: What are the privacy guarantees and threat model?

### What an Observer CANNOT Learn (Strictly Private)

| Sensitive Data | Protected By | Guarantee |
|---|---|---|
| Member real identity | `memberSecretKey()` ZK witness | Never transmitted — local device only |
| Actual point balance | `memberPointBalance()` ZK witness | Compared privately to threshold — balance never disclosed |
| Purchase history & records | `membershipRecordHash()` ZK witness | SHA-256 hashed locally — only hash in proof |
| Entropy/nonce | `loyaltyProofNonce()` ZK witness | Per-claim, per-session entropy — replay-resistant |
| Merchant signing key | `merchantSigningKey()` ZK witness | Derived locally for authorization — key never on-chain |

### What an Observer CAN Learn (Public Ledger)

| Public Data | Ledger Field | Rationale |
|---|---|---|
| Total claims made | `memberCount` | Fairness and auditability — no user attribution |
| Active program ID | `programId` | Verifiers must know which program is active |
| Most recent commitment | `lastRewardCommitment` | Verifiers use `verifyMembership()` to check credentials |
| Total revocations | `revokedCount` | Transparency without user identification |
| Minimum threshold | `minimumTierPoints` | Users know the qualifying bar — fair disclosure |
| Session epoch | `activeSession` | Verifiers can detect stale proofs |

### Threat Model

| Threat | Mitigation |
|---|---|
| On-chain eavesdropping | ZK commitments reveal nothing about identity or balance |
| Replay attacks | `loyaltyProofNonce()` + session binding in `Vector<5, Bytes<32>>` hash |
| Merchant impersonation | `merchantCommitment` anchor + `assert(derivedCommitment == merchantCommitment)` |
| Fraudulent membership | `revokeMembership()` with ZK merchant authorization |
| Threshold manipulation | `minimumTierPoints` is set by verified merchant via `setMerchantCommitment()` |
| Cross-program forgery | `assert(programId == expectedProgramId)` enforces program binding |

---

## 🌐 Deployment & Infrastructure

- **Network**: Midnight Preview Testnet
- **Contract Address**: `b90200ad492044f33487a095966ab177dfef9bc957e3d185bae8d2126555006e`
- **Explorer**: [https://preview.midnightexplorer.com/contracts/b90200ad492044f33487a095966ab177dfef9bc957e3d185bae8d2126555006e](https://preview.midnightexplorer.com/contracts/b90200ad492044f33487a095966ab177dfef9bc957e3d185bae8d2126555006e)
- **Proof Server**: Docker `midnightntwrk/proof-server:8.1.0` at `localhost:6300`
- **Indexer**: `https://indexer.preview.midnight.network/api/v4/graphql`
- **Frontend**: Next.js 14 App Router deployed on Vercel
- **Live Demo**: [https://private-loyalty-membership.vercel.app/](https://private-loyalty-membership.vercel.app/)

---

## 🗺️ Level 3 Compliance Checklist

- [x] **Rich Contract Logic (v2)**: 6 circuits, 8 ledger fields, 5 witnesses — ZK point threshold, revocation, merchant authority.
- [x] **Compact Smart Contract**: Written in `Compact v0.23` with `persistentHash`, `disclose`, `assert`, Counter, and `Uint<32>` types.
- [x] **Managed Contract Output**: Pre-compiled `managed/contract/index.js` + `index.d.ts` with full TypeScript type bindings.
- [x] **Vitest Unit Test Suite**: 10/10 tests passing — covers circuit structure, witness isolation, threshold logic, ZK privacy, revocation.
- [x] **CI Pipeline**: GitHub Actions verifies Compact source, managed output, runs tests, and builds Next.js on every push.
- [x] **Next.js 14 App Router UI**: Full dApp with ZK architecture diagrams, point threshold slider, verify/revoke panels.
- [x] **On-Chain Preview Deployment**: Deployed at [Midnight Explorer](https://preview.midnightexplorer.com/contracts/b90200ad492044f33487a095966ab177dfef9bc957e3d185bae8d2126555006e).
- [x] **Live Vercel Demo**: [https://private-loyalty-membership.vercel.app/](https://private-loyalty-membership.vercel.app/).
- [x] **Video Demo**: [YouTube](https://youtu.be/yjJzqZvceVY).
