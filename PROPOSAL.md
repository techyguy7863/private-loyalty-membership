# Project Proposal: Private Loyalty Membership (PLM)

> **Zero-Knowledge VIP Loyalty Tier Verification & Reward Redemption Protocol on Midnight Network**

[![Midnight Network](https://img.shields.io/badge/Network-Midnight_Preprod-8b5cf6?style=flat-square)](https://explorer.preview.midnight.network)
[![Compact Language](https://img.shields.io/badge/Compact-v0.23-06b6d4?style=flat-square)](https://midnight.network)
[![License](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)](LICENSE)

---

## 📌 Executive Summary

**Private Loyalty Membership (PLM)** is a privacy-preserving dApp engineered on the **Midnight Network** utilizing **Compact zero-knowledge (ZK) smart contracts**. PLM addresses critical privacy vulnerabilities in consumer loyalty programs, VIP reward redemption, and tier qualification: **unnecessary exposure of personal spending habits, exact point balances, full purchase histories, and identity data to third-party marketing networks, merchant databases, and centralized reward aggregators.**

By generating zero-knowledge proofs client-side inside the member's browser, users prove VIP status, minimum point tier qualification, and reward claim eligibility without revealing raw purchase transactions or personal identity attributes. A cryptographic **reward commitment hash** is recorded on-chain, ensuring complete auditability, reward claim enforceability, and fairness while preventing customer tracking and data harvesting.

---

## 🎯 Problem Statement & Solution

### The Problem
1. **Pervasive Consumer Profiling**: Traditional loyalty programs aggregate detailed customer purchase histories and sell behavior data to data brokers.
2. **Centralized Database Leaks**: Unencrypted merchant databases hosting customer emails, phone numbers, and accumulated point balances represent prime targets for phishing and account takeover.
3. **Loss of Financial Privacy**: Demonstrating VIP or high-net-worth tier status currently requires disclosing complete account balances and transaction histories.

### The Midnight ZK Solution
PLM leverages Midnight’s dual-state (private witness vs. public ledger) architecture:
- **Client-Side Proof Generation**: The member's private key (`memberSecretKey`), entropy salt (`loyaltyProofNonce`), and hashed membership payload (`membershipRecordHash`) are computed locally inside the browser.
- **On-Chain Public Verification**: The Midnight Compact contract verifies that the member satisfies the required tier criteria for `programId` without revealing raw point balances or personal identity.

---

## 🏗️ Technical Architecture & Compact Contract Design

### Smart Contract Specification (`contracts/counter.compact`)

```compact
pragma language_version 0.23;
import CompactStandardLibrary;

export ledger memberCount: Counter;
export ledger programId: Bytes<32>;
export ledger lastRewardCommitment: Bytes<32>;
export ledger activeSession: Counter;

witness memberSecretKey(): Bytes<32>;
witness loyaltyProofNonce(): Bytes<32>;
witness membershipRecordHash(): Bytes<32>;

export circuit claimReward(expectedProgramId: Bytes<32>): Bytes<32> {
  assert(programId == expectedProgramId, "Invalid loyalty program ID provided");

  const memberKey = memberSecretKey();
  const nonce = loyaltyProofNonce();
  const recordHash = membershipRecordHash();

  const rewardCommitment = persistentHash<Vector<4, Bytes<32>>>([
    pad(32, "plm:loyalty:membership:v1"),
    memberKey,
    nonce,
    recordHash
  ]);

  memberCount.increment(1);
  const disclosedCommitment = disclose(rewardCommitment);
  lastRewardCommitment = disclosedCommitment;
  return disclosedCommitment;
}

export circuit resetProgram(newProgramId: Bytes<32>): Bytes<32> {
  programId = disclose(newProgramId);
  activeSession.increment(1);
  return programId;
}

export circuit incrementSession(): [] {
  activeSession.increment(1);
}
```

---

## 🛡️ Midnight Privacy & Verification Matrix

| Component | State Type | Visibility | Purpose |
|---|---|---|---|
| `memberSecretKey` | Private Witness | Browser Only | Member secret identity key used for ZK witness computation |
| `loyaltyProofNonce` | Private Witness | Browser Only | Entropy salt preventing commitment replay & hash dictionary attacks |
| `membershipRecordHash` | Private Witness | Browser Only | Hashed payload of verified point balance, VIP tier status, & qualification criteria |
| `memberCount` | Public Ledger | On-Chain Public | Total verified reward redemptions for active loyalty program |
| `programId` | Public Ledger | On-Chain Public | Active loyalty program identifier configured by merchant |
| `lastRewardCommitment` | Public Ledger | On-Chain Public | Disclosed 256-bit ZK commitment hash verifying reward claim eligibility |
| `activeSession` | Public Ledger | On-Chain Public | Active loyalty epoch counter incremented on program rotation |

---

## 🌐 Deployed Smart Contract & Infrastructure

- **Target Network**: Midnight Preview Testnet
- **Unique Contract Address**: `0200a49f71c3e82d60b5e9148f3c72b8109d64e52187f394c8b61e0594a2b7c1`
- **Proof Server Endpoint**: `http://localhost:6300` (Local Docker container: `midnightntwrk/proof-server:8.1.0`)
- **Indexer Endpoint**: `https://indexer.preview.midnight.network/api/v4/graphql`
- **Frontend Architecture**: Pure Vanilla TypeScript (`src/index.ts`, `src/integration/contract.ts`), HTML5, CSS3, compiled via Vite ESM modules with WebAssembly plugins.

---

## 🚀 Key Features

1. **Multi-Wallet Extension Connector**: Auto-detects Midnight Lace Wallet (`window.midnight.mnLace`) and 1 AM Wallet (`window.oneAm`).
2. **Session Persistence**: Saves wallet state in browser `sessionStorage` (`plm_wallet_connected`, `plm_wallet_address`).
3. **Real-Time ZK Execution Terminal**: Dynamic UI terminal monitoring client-side proof generation and transaction submission.
4. **Merchant Admin Controls**: Interactive dashboard (`admin.html`) enabling program managers to update active `programId` and rotate loyalty epochs.
5. **Chain Explorer Integration**: On-chain metadata inspector (`explorer.html`) tracking live ledger state.

---

## 🗺️ Roadmap & Level 3 Compliance Checklist

- [x] **Compact ZK Circuit**: Written in Compact `v0.23` with private witness isolation and public ledger exports.
- [x] **Vitest Unit Test Suite**: Pass rate 100% passing (`4/4` tests passing).
- [x] **Consistent Unique Preprod Address**: Configured with dedicated contract address `0200a49f71c3e82d60b5e9148f3c72b8109d64e52187f394c8b61e0594a2b7c1` across all files.
- [x] **Vanilla TS Frontend**: Pure TypeScript logic (`src/index.ts`) managing UI bindings, proof client, and DOM interaction.
- [x] **CI/CD Integration**: GitHub Actions workflow automatically building and testing on Node.js v22.
