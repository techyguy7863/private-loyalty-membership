import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Midnight Explorer | Private Loyalty Membership',
  description: 'View live on-chain state of the Private Loyalty Membership contract on Midnight Preview.',
};

const CONTRACT_ADDRESS = "b90200ad492044f33487a095966ab177dfef9bc957e3d185bae8d2126555006e";

export default function ExplorerPage() {
  return (
    <div style={{ maxWidth: 860, margin: "0 auto", padding: "2rem 1.5rem 4rem" }}>
      <div style={{ marginBottom: "2rem" }}>
        <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.5rem" }}>
          <span className="badge badge-cyan">Midnight Explorer</span>
          <span className="badge badge-green">Preview Network</span>
        </div>
        <h1 className="section-title">Contract Explorer</h1>
        <p className="section-desc">Live on-chain state of the Private Loyalty Membership ZK contract on Midnight Preview.</p>
      </div>

      <div className="glass-card" style={{ padding: "1.5rem", marginBottom: "1.5rem" }}>
        <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "#64748b", marginBottom: "1rem", textTransform: "uppercase", letterSpacing: "0.08em" }}>Contract Address</div>
        <code style={{ fontSize: "0.82rem", color: "#06b6d4", wordBreak: "break-all" }}>{CONTRACT_ADDRESS}</code>
        <div style={{ marginTop: "1rem" }}>
          <a href={`https://preview.midnightexplorer.com/contracts/${CONTRACT_ADDRESS}`}
            target="_blank" rel="noopener noreferrer" className="btn-primary" style={{ display: "inline-flex" }}>
            🔍 View on Midnight Explorer →
          </a>
        </div>
      </div>

      <div className="glass-card" style={{ padding: "1.5rem", marginBottom: "1.5rem" }}>
        <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "#64748b", marginBottom: "1rem", textTransform: "uppercase", letterSpacing: "0.08em" }}>Public Ledger Fields (8)</div>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {[
            { field: "memberCount: Counter", desc: "Total reward claims made", color: "#8b5cf6" },
            { field: "revokedCount: Counter", desc: "Total revoked memberships", color: "#ef4444" },
            { field: "activeSession: Counter", desc: "Epoch nonce (replay protection)", color: "#06b6d4" },
            { field: "programId: Bytes<32>", desc: "Active loyalty program identifier", color: "#10b981" },
            { field: "merchantCommitment: Bytes<32>", desc: "Merchant public authority anchor", color: "#f59e0b" },
            { field: "lastRewardCommitment: Bytes<32>", desc: "Most recent member ZK reward hash", color: "#8b5cf6" },
            { field: "lastRevokedCommitment: Bytes<32>", desc: "Most recent revoked commitment", color: "#ef4444" },
            { field: "minimumTierPoints: Uint<32>", desc: "Minimum qualifying point threshold", color: "#06b6d4" },
          ].map(f => (
            <div key={f.field} style={{ display: "flex", gap: "1rem", padding: "0.6rem 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
              <code style={{ fontSize: "0.78rem", color: f.color, minWidth: "240px" }}>{f.field}</code>
              <span style={{ fontSize: "0.78rem", color: "#64748b" }}>{f.desc}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
        <Link href="/" className="btn-secondary">Back to Dashboard</Link>
        <Link href="/claim" className="btn-primary">Claim Reward →</Link>
      </div>
    </div>
  );
}
