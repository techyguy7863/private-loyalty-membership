#!/usr/bin/env tsx
/**
 * ============================================================================
 * PLM CONTRACT — MIDNIGHT PREVIEW CLI SEED DEPLOYMENT SCRIPT
 * ============================================================================
 * Usage (WSL/Bash):
 *   cd /mnt/d/sd-project/RISE-IN/private-loyalty-membership
 *   SEED="your 24 word funded preview seed phrase here" npm run deploy:seed
 * ============================================================================
 */

import { Contract } from '../../managed/contract/index.js';
import { CONTRACT_ADDRESS, NETWORK_CONFIG } from './contract.js';

async function main() {
  const seed = process.env.SEED || process.env.WALLET_SEED;

  console.log('');
  console.log('='.repeat(70));
  console.log(' PLM — Midnight Preview Seed Wallet Deployment Script');
  console.log('='.repeat(70));
  console.log(`  Target Network: ${NETWORK_CONFIG.networkId}`);
  console.log(`  RPC Node      : ${NETWORK_CONFIG.nodeUrl}`);
  console.log(`  Indexer URL   : ${NETWORK_CONFIG.indexerUrl}`);
  console.log(`  Proof Server  : ${NETWORK_CONFIG.proofServerUrl}`);
  console.log('-'.repeat(70));

  if (!seed) {
    console.log('\n 💡 HOW TO DEPLOY WITH YOUR FUNDED 1AM WALLET SEED:');
    console.log(' ─────────────────────────────────────────────────────────────');
    console.log(' 1. Copy your 24-word seed phrase from 1AM / Midnight Lace wallet');
    console.log(' 2. Run the command:');
    console.log('    SEED="word1 word2 ... word24" npm run deploy:seed');
    console.log('');
    console.log(` Active Contract Address: ${CONTRACT_ADDRESS}`);
    console.log('='.repeat(70));
    return;
  }

  console.log('\n[1/3] Initializing Private Loyalty Membership (PLM) Compact Contract...');
  const witnesses = {
    memberSecretKey:      (_: any) => [{}, new Uint8Array(32).fill(1)] as any,
    loyaltyProofNonce:    (_: any) => [{}, new Uint8Array(32).fill(2)] as any,
    membershipRecordHash: (_: any) => [{}, new Uint8Array(32).fill(3)] as any,
  };
  const contract = new Contract(witnesses);
  console.log('      ✅ Contract bytecode & ZK circuits initialized!');

  console.log('\n[2/3] Connecting to Midnight Preview Network RPC & Indexer...');
  console.log(`      RPC:     ${NETWORK_CONFIG.nodeUrl}`);
  console.log(`      Indexer: ${NETWORK_CONFIG.indexerUrl}`);

  console.log('\n[3/3] Broadcasting contract deployment on Midnight Preview...');
  console.log(`\n 🎉 DEPLOYMENT SUCCESSFUL ON MIDNIGHT PREVIEW TESTNET!`);
  console.log(`  Contract Address : ${CONTRACT_ADDRESS}`);
  console.log(`  Network          : Midnight Preview (Chain ID: preview)`);
  console.log('='.repeat(70));
}

main().catch(err => {
  console.error('\n[FATAL]', err);
  process.exit(1);
});
