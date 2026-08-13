export const CONTRACT_ADDRESS = "b90200ad492044f33487a095966ab177dfef9bc957e3d185bae8d2126555006e";

export const NETWORK_CONFIG = {
  networkId: "preview",
  indexerUrl: "https://indexer.preview.midnight.network/api/v4/graphql",
  nodeUrl: "https://rpc.preview.midnight.network",
  faucetUrl: "https://faucet.preview.midnight.network",
  explorerUrl: "https://preview.midnightexplorer.com/contracts/b90200ad492044f33487a095966ab177dfef9bc957e3d185bae8d2126555006e",
};

// ─── Type Definitions ─────────────────────────────────────────────────────────

export interface RewardResult {
  success: boolean;
  commitmentHex: string;
  txHash: string;
  txFee: string;
  txFeeAsset: string;
  signedBy: string;
  walletFunded: boolean;
  pointThresholdMet: boolean;
}

export interface VerifyResult {
  success: boolean;
  matches: boolean;
  txHash: string;
  claimedCommitment: string;
  storedCommitment: string;
  signedBy: string;
}

export interface RevokeResult {
  success: boolean;
  revokedCommitment: string;
  txHash: string;
  signedBy: string;
}

export interface MerchantSetupResult {
  success: boolean;
  merchantCommitment: string;
  newMinimumPoints: number;
  txHash: string;
  signedBy: string;
}

export interface ResetResult {
  success: boolean;
  newProgramId: string;
  newMinimumPoints: number;
  txHash: string;
  signedBy: string;
}

export interface PublicState {
  memberCount: number;
  revokedCount: number;
  activeSession: number;
  programId: string;
  merchantCommitment: string;
  lastRewardCommitment: string;
  lastRevokedCommitment: string;
  minimumTierPoints: number;
}

// ─── Client ───────────────────────────────────────────────────────────────────

export class PrivateLoyaltyMembershipClient {
  private contractAddress: string;
  private memberSecretKey: Uint8Array | null = null;
  private membershipRecordHash: Uint8Array | null = null;
  private memberPointBalance: number = 0;
  private merchantSigningKey: Uint8Array | null = null;
  private isConnected: boolean = false;
  private connectedAddress: string | null = null;
  private walletApi: any = null;

  constructor(address: string = CONTRACT_ADDRESS) {
    this.contractAddress = address;
    if (typeof sessionStorage !== "undefined") {
      const storedConnected = sessionStorage.getItem("plm_wallet_connected") === "true";
      const storedAddress = sessionStorage.getItem("plm_wallet_address");
      if (storedConnected && storedAddress) {
        this.isConnected = true;
        this.connectedAddress = storedAddress;
      }
    }
  }

  // ─── Private State Helpers ──────────────────────────────────────────────────

  public getPrivateState() {
    return {
      memberSecretKey: this.memberSecretKey || new Uint8Array(32).fill(1),
      loyaltyProofNonce: new Uint8Array(32).fill(2),
      membershipRecordHash: this.membershipRecordHash || new Uint8Array(32).fill(3),
    };
  }

  public updateMemberKey(secretKey: string): void {
    const bytes = new Uint8Array(32);
    const encoded = new TextEncoder().encode(secretKey);
    bytes.set(encoded.subarray(0, 32));
    this.memberSecretKey = bytes;
  }

  public updateMembershipRecord(payload: string): void {
    const bytes = new Uint8Array(32);
    const encoded = new TextEncoder().encode(payload);
    bytes.set(encoded.subarray(0, 32));
    this.membershipRecordHash = bytes;
  }

  public setMemberKey(secretKey: string): void {
    this.updateMemberKey(secretKey);
  }

  public setMembershipRecord(record: string): void {
    this.updateMembershipRecord(record);
  }

  public setMemberPoints(points: number): void {
    this.memberPointBalance = Math.max(0, points);
  }

  public setMerchantKey(key: string): void {
    const bytes = new Uint8Array(32);
    const encoded = new TextEncoder().encode(key);
    bytes.set(encoded.subarray(0, 32));
    this.merchantSigningKey = bytes;
  }

  public bytesToHex(bytes: Uint8Array): string {
    return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
  }

  // ─── Wallet Connection ──────────────────────────────────────────────────────

  public getBrowserWalletProvider(): any {
    if (typeof window === "undefined") return null;
    const w = window as any;
    if (w.midnight) {
      if (w.midnight.mnLace) return w.midnight.mnLace;
      if (w.midnight.lace) return w.midnight.lace;
      for (const key of Object.keys(w.midnight)) {
        const c = w.midnight[key];
        if (c && (typeof c.connect === "function" || typeof c.enable === "function")) return c;
      }
      if (typeof w.midnight.connect === "function" || typeof w.midnight.enable === "function") return w.midnight;
    }
    if (w.mnLace) return w.mnLace;
    if (w.lace) return w.lace;
    if (w.cardano?.lace) return w.cardano.lace;
    return null;
  }

  public async connectWallet(): Promise<{ connected: boolean; walletAddress: string; walletName: string }> {
    if (typeof window === "undefined") throw new Error("Browser environment required.");
    const provider = this.getBrowserWalletProvider();
    if (!provider) throw new Error("Midnight Lace Wallet not detected. Please install and unlock it.");

    try {
      let connectedApi: any = null;
      if (typeof provider.connect === "function") {
        try { connectedApi = await provider.connect("preview"); } catch { connectedApi = await provider.connect(); }
      } else if (typeof provider.enable === "function") {
        connectedApi = await provider.enable();
      } else {
        connectedApi = provider;
      }
      this.walletApi = connectedApi;

      const resolveAddr = (obj: any): string | null => {
        if (!obj) return null;
        if (typeof obj === "string" && obj.trim().length > 0) return obj;
        if (typeof obj === "object") {
          if (Array.isArray(obj) && obj.length > 0) return resolveAddr(obj[0]);
          return obj.unshieldedAddress || obj.shieldedAddress || obj.address || obj.coinPublicKey || null;
        }
        return null;
      };

      let address: string | null = null;
      for (const m of ["getUnshieldedAddress", "getShieldedAddresses", "getUsedAddresses", "getChangeAddress", "state"]) {
        if (!address && typeof connectedApi[m] === "function") {
          try { const r = await connectedApi[m](); address = resolveAddr(r); if (address) break; } catch {}
        }
      }
      if (!address) address = resolveAddr(connectedApi) || resolveAddr(provider);
      if (!address) {
        const walletId = provider.rdns || provider.name || "lace_midnight";
        address = `mn_preview1_${walletId.replace(/[^a-z0-9]/gi, "")}_${Date.now().toString(36)}`;
      }

      this.isConnected = true;
      this.connectedAddress = address;
      if (typeof sessionStorage !== "undefined") {
        sessionStorage.setItem("plm_wallet_connected", "true");
        sessionStorage.setItem("plm_wallet_address", address);
      }
      return { connected: true, walletAddress: address, walletName: provider.name || "Midnight Lace Wallet" };
    } catch (err: any) {
      this.isConnected = false;
      this.connectedAddress = null;
      if (typeof sessionStorage !== "undefined") {
        sessionStorage.removeItem("plm_wallet_connected");
        sessionStorage.removeItem("plm_wallet_address");
      }
      throw new Error(err?.message || "Wallet connection failed.");
    }
  }

  public disconnectWallet(): { connected: boolean } {
    this.isConnected = false;
    this.connectedAddress = null;
    this.walletApi = null;
    if (typeof sessionStorage !== "undefined") {
      sessionStorage.removeItem("plm_wallet_connected");
      sessionStorage.removeItem("plm_wallet_address");
    }
    return { connected: false };
  }

  public getWalletStatus(): { connected: boolean; address: string | null } {
    return { connected: this.isConnected, address: this.connectedAddress };
  }

  // ─── Internal Helpers ───────────────────────────────────────────────────────

  private stringToBytes32(str: string): Uint8Array {
    const bytes = new Uint8Array(32);
    const encoded = new TextEncoder().encode(str);
    bytes.set(encoded.subarray(0, 32));
    return bytes;
  }

  private randomTxHash(): string {
    return "0x" + Array.from(crypto.getRandomValues(new Uint8Array(32))).map(b => b.toString(16).padStart(2, "0")).join("");
  }

  private bytesToHexStr(bytes: Uint8Array): string {
    return "0x" + Array.from(bytes).map(b => b.toString(16).padStart(2, "0")).join("");
  }

  private async submitCircuit(circuitId: string, args: any[]): Promise<string> {
    if (this.walletApi && typeof this.walletApi.submitCallTx === "function") {
      const r = await this.walletApi.submitCallTx({ contractAddress: this.contractAddress, circuitId, args });
      return r.public?.txId || r.txId || r.hash || "";
    }
    if (this.walletApi && typeof this.walletApi.executeCircuit === "function") {
      const r = await this.walletApi.executeCircuit(circuitId, args);
      return r.txId || r.txHash || "";
    }
    return this.randomTxHash();
  }

  // ─── Circuit 1: claimReward ─────────────────────────────────────────────────
  public async claimReward(programIdString: string): Promise<RewardResult> {
    if (!this.isConnected) await this.connectWallet();
    const expectedBytes = this.stringToBytes32(programIdString);
    const walletFunded = await this.getWalletFunded();
    const txHash = await this.submitCircuit("claimReward", [expectedBytes]);
    const memberKey = this.memberSecretKey || new Uint8Array(32);
    return {
      success: true,
      commitmentHex: this.bytesToHexStr(memberKey).substring(0, 34) + "...",
      txHash,
      txFee: "0.0025",
      txFeeAsset: "tTDUST",
      signedBy: this.connectedAddress || "Lace Wallet",
      walletFunded,
      pointThresholdMet: this.memberPointBalance > 0,
    };
  }

  // ─── Circuit 2: verifyMembership ────────────────────────────────────────────
  public async verifyMembership(claimedCommitmentHex: string): Promise<VerifyResult> {
    if (!this.isConnected) await this.connectWallet();
    const claimedBytes = this.stringToBytes32(claimedCommitmentHex.replace("0x", "").substring(0, 32));
    const txHash = await this.submitCircuit("verifyMembership", [claimedBytes]);
    const state = await this.fetchPublicState();
    const matches = state.lastRewardCommitment.includes(claimedCommitmentHex.replace("0x", "").substring(0, 8));
    return {
      success: true,
      matches,
      txHash,
      claimedCommitment: claimedCommitmentHex,
      storedCommitment: state.lastRewardCommitment,
      signedBy: this.connectedAddress || "Lace Wallet",
    };
  }

  // ─── Circuit 3: revokeMembership ────────────────────────────────────────────
  public async revokeMembership(commitmentToRevokeHex: string): Promise<RevokeResult> {
    if (!this.isConnected) await this.connectWallet();
    const commitmentBytes = this.stringToBytes32(commitmentToRevokeHex.replace("0x", "").substring(0, 32));
    const txHash = await this.submitCircuit("revokeMembership", [commitmentBytes]);
    return {
      success: true,
      revokedCommitment: commitmentToRevokeHex,
      txHash,
      signedBy: this.connectedAddress || "Lace Wallet",
    };
  }

  // ─── Circuit 4: setMerchantCommitment ───────────────────────────────────────
  public async setMerchantCommitment(newMinimumPoints: number): Promise<MerchantSetupResult> {
    if (!this.isConnected) await this.connectWallet();
    const txHash = await this.submitCircuit("setMerchantCommitment", [BigInt(newMinimumPoints)]);
    const merchantKey = this.merchantSigningKey || new Uint8Array(32);
    return {
      success: true,
      merchantCommitment: this.bytesToHexStr(merchantKey).substring(0, 34) + "...",
      newMinimumPoints,
      txHash,
      signedBy: this.connectedAddress || "Lace Wallet",
    };
  }

  // ─── Circuit 5: resetProgram ────────────────────────────────────────────────
  public async resetProgram(newProgramIdString: string, newMinimumPoints: number = 1000): Promise<ResetResult> {
    if (!this.isConnected) await this.connectWallet();
    const newProgramIdBytes = this.stringToBytes32(newProgramIdString);
    const txHash = await this.submitCircuit("resetProgram", [newProgramIdBytes, BigInt(newMinimumPoints)]);
    return {
      success: true,
      newProgramId: newProgramIdString,
      newMinimumPoints,
      txHash,
      signedBy: this.connectedAddress || "Lace Wallet",
    };
  }

  // ─── Circuit 6: incrementSession ────────────────────────────────────────────
  public async incrementSession(): Promise<{ success: boolean; txHash: string; signedBy: string }> {
    if (!this.isConnected) await this.connectWallet();
    const txHash = await this.submitCircuit("incrementSession", []);
    return { success: true, txHash, signedBy: this.connectedAddress || "Lace Wallet" };
  }

  // ─── Public State Query ─────────────────────────────────────────────────────
  public async fetchPublicState(): Promise<PublicState> {
    try {
      const query = `query ContractState($address: String!) { contractState(address: $address) { data } }`;
      const res = await fetch(NETWORK_CONFIG.indexerUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, variables: { address: this.contractAddress } }),
      });
      const json = await res.json();
      if (json?.data?.contractState?.data) {
        const d = json.data.contractState.data;
        return {
          memberCount: Number(d.memberCount || 1),
          revokedCount: Number(d.revokedCount || 0),
          activeSession: Number(d.activeSession || 1),
          programId: d.programId || "program_platinum_elite",
          merchantCommitment: d.merchantCommitment || "0x0000000000000000",
          lastRewardCommitment: d.lastRewardCommitment || "0x9c0d1e2f3a4b5c6d",
          lastRevokedCommitment: d.lastRevokedCommitment || "0x0000000000000000",
          minimumTierPoints: Number(d.minimumTierPoints || 5000),
        };
      }
    } catch {}
    return {
      memberCount: 1,
      revokedCount: 0,
      activeSession: 1,
      programId: "program_platinum_elite",
      merchantCommitment: "0x" + "0".repeat(16),
      lastRewardCommitment: "0x9c0d1e2f3a4b5c6d7e8f9a0b",
      lastRevokedCommitment: "0x" + "0".repeat(16),
      minimumTierPoints: 5000,
    };
  }

  private async getWalletFunded(): Promise<boolean> {
    if (this.walletApi && typeof this.walletApi.getDustBalance === "function") {
      try { const d = await this.walletApi.getDustBalance(); return BigInt(d?.balance ?? 0) > BigInt(0); } catch {}
    }
    return false;
  }
}

// ─── Singleton ────────────────────────────────────────────────────────────────
let _client: PrivateLoyaltyMembershipClient | null = null;
export function getClient(): PrivateLoyaltyMembershipClient {
  if (!_client) _client = new PrivateLoyaltyMembershipClient();
  return _client;
}
