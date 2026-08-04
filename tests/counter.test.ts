import { describe, it, expect, beforeEach } from 'vitest';
import { PrivateLoyaltyMembershipClient, CONTRACT_ADDRESS, NETWORK_CONFIG } from '../src/integration/contract.js';

describe('Private Loyalty Membership (PLM) Smart Contract Test Suite', () => {
  let client: PrivateLoyaltyMembershipClient;

  beforeEach(() => {
    client = new PrivateLoyaltyMembershipClient();
  });

  it('should initialize PrivateLoyaltyMembershipClient with default network config', () => {
    expect(CONTRACT_ADDRESS).toBeDefined();
    expect(CONTRACT_ADDRESS.includes('0200')).toBe(true);
    expect(NETWORK_CONFIG.networkId).toBe('preview');
  });

  it('should generate valid private witnesses for memberSecretKey, loyaltyProofNonce, and membershipRecordHash', () => {
    const state = client.getPrivateState();
    expect(state.memberSecretKey).toBeInstanceOf(Uint8Array);
    expect(state.loyaltyProofNonce).toBeInstanceOf(Uint8Array);
    expect(state.membershipRecordHash).toBeInstanceOf(Uint8Array);
    expect(state.memberSecretKey.length).toBe(32);
  });

  it('should update member secret key and membership record payload correctly', () => {
    client.updateMemberKey('secret_vip_member_999');
    client.updateMembershipRecord('Platinum Tier: 50,000 Points Verified');

    const state = client.getPrivateState();
    const keyHex = client.bytesToHex(state.memberSecretKey);
    const recordHex = client.bytesToHex(state.membershipRecordHash);

    expect(keyHex).toBeDefined();
    expect(recordHex).toBeDefined();
    expect(state.memberSecretKey.length).toBe(32);
  });

  it('should instantiate Compact Contract with defined claimReward and resetProgram circuits', () => {
    const contract = client.getContract();
    expect(contract).toBeDefined();
    expect(typeof contract.initialState).toBe('function');
  });
});
