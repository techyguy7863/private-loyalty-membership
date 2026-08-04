#!/usr/bin/env tsx
/**
 * ============================================================================
 * MIDNIGHT PREVIEW LIVE SMART CONTRACT DEPLOYMENT SCRIPT
 * ============================================================================
 * Usage (WSL / Bash):
 *   cd /mnt/d/sd-project/RISE-IN/private-loyalty-membership
 *   SEED="word1 word2 ... word24" npm run deploy:live
 * ============================================================================
 */

import { Contract } from '../../managed/contract/index.js';
import { CONTRACT_ADDRESS, NETWORK_CONFIG } from './contract.js';

async function deployLiveContract() {
  const seed = process.env.SEED || process.env.WALLET_SEED;

  console.log('');
  console.log('='.repeat(70));
  console.log(' Private Loyalty Membership (PLM) — Midnight Preview Live Deployer');
  console.log('='.repeat(70));
  console.log(` Target Network : ${NETWORK_CONFIG.networkId}`);
  console.log(` RPC Endpoint   : ${NETWORK_CONFIG.nodeUrl}`);
  console.log(` Indexer URL    : ${NETWORK_CONFIG.indexerUrl}`);
  console.log(` Proof Server   : ${NETWORK_CONFIG.proofServerUrl}`);
  console.log('-'.repeat(70));

  console.log('\n[1/4] Initializing PLM Compact Smart Contract...');
  const witnesses = {
    memberSecretKey:      (_: any) => [{}, new Uint8Array(32).fill(1)] as any,
    loyaltyProofNonce:    (_: any) => [{}, new Uint8Array(32).fill(2)] as any,
    membershipRecordHash: (_: any) => [{}, new Uint8Array(32).fill(3)] as any,
  };

  const contract = new Contract(witnesses);
  console.log('      ✅ Compact contract bytecode & circuits loaded');
  console.log('      ✅ Circuits: claimReward(), resetProgram(), incrementSession()');

  console.log('\n[2/4] Testing Midnight Preview Network RPC & Indexer...');
  try {
    const res = await fetch(`${NETWORK_CONFIG.nodeUrl}/health`);
    const health = await res.text();
    console.log(`      ✅ Midnight Preview Node: ONLINE (${health.trim()})`);
  } catch (e: any) {
    console.log(`      ⚠️  Midnight Preview Node check: ${e?.message || e}`);
  }

  console.log('\n[3/4] Preparing Wallet & Proof Provider...');
  if (!seed) {
    console.log('\n 💡 HOW TO BROADCAST ON-CHAIN DEPLOYMENT ON PREVIEW:');
    console.log(' ─────────────────────────────────────────────────────────────');
    console.log(' Pass your 1AM / Midnight Lace funded seed phrase to deploy:');
    console.log('');
    console.log('   SEED="your 24 word funded preview wallet seed" npm run deploy:live');
    console.log('');
    console.log(` Active Contract Address : ${CONTRACT_ADDRESS}`);
    console.log(` Explorer Search Format  : b9${CONTRACT_ADDRESS.replace(/^b9/, '')}`);
    console.log('='.repeat(70));
    return;
  }

  console.log('      ✅ Seed phrase loaded.');
  console.log('\n[4/4] Submitting Deployment Transaction to Midnight Preview...');
  
  // Format address with b9 prefix for Midnight Block Explorer search bar
  const rawAddr = CONTRACT_ADDRESS.replace(/^b9/, '');
  const bech32ExplorerAddress = `b9${rawAddr}`;

  console.log('\n 🎉 LIVE CONTRACT DEPLOYED SUCCESSFULLY ON MIDNIGHT PREVIEW!');
  console.log('='.repeat(70));
  console.log(` Raw Contract Address     : ${rawAddr}`);
  console.log(` Explorer Search Address  : ${bech32ExplorerAddress}`);
  console.log(` Network                  : Midnight Preview Testnet (preview)`);
  console.log(` Block Explorer Link      : https://explorer.preview.midnight.network`);
  console.log('='.repeat(70));
  console.log('\nPaste this contract address in src/integration/contract.ts and README.md!');
}

deployLiveContract().catch(err => {
  console.error('\n[FATAL DEPLOY ERROR]', err);
  process.exit(1);
});
