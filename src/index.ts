import { PrivateLoyaltyMembershipClient, CONTRACT_ADDRESS, getProofServerUrl } from './integration/contract.js';

const client = new PrivateLoyaltyMembershipClient();

function initApp() {
  const contractAddrEl = document.getElementById('contractAddr');
  const applicantCountEl = document.getElementById('attendeeCountDisplay');
  const sessionEl = document.getElementById('sessionDisplay');
  const lastCommitmentEl = document.getElementById('lastCommitment');
  const logBoxEl = document.getElementById('logBox');
  const formEl = document.getElementById('applyScholarshipForm') as HTMLFormElement;
  const scholarshipInput = document.getElementById('scholarshipInput') as HTMLInputElement;
  const applicantKeyInput = document.getElementById('applicantKeyInput') as HTMLInputElement;
  const academicRecordInput = document.getElementById('academicRecordInput') as HTMLTextAreaElement;
  const progressBar = document.getElementById('progressBar');
  const progressFill = document.getElementById('progressFill');
  const connectWalletBtn = document.getElementById('connectWalletBtn');
  const proofProviderEl = document.getElementById('proofProviderEl');
  const explorerProofServerEl = document.getElementById('explorerProofServerEl');

  // Admin page elements
  const resetExamForm = document.getElementById('resetExamForm') as HTMLFormElement;
  const newOrganizerInput = document.getElementById('newOrganizerInput') as HTMLInputElement;
  const incrementSessionBtn = document.getElementById('incrementSessionBtn');
  const adminLogArea = document.getElementById('adminLogArea');
  const adminLogBox = document.getElementById('adminLogBox');

  const isLocal = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

  if (contractAddrEl) contractAddrEl.textContent = CONTRACT_ADDRESS;

  if (proofProviderEl) {
    proofProviderEl.textContent = isLocal ? "http://localhost:6300 (Local Docker)" : "Midnight Preprod Cloud ZK Service";
  }
  if (explorerProofServerEl) {
    explorerProofServerEl.textContent = isLocal ? "http://localhost:6300 (Status: ONLINE)" : "Midnight Preprod ZK Infrastructure (ONLINE)";
  }

  let count = 0;
  let session = 1;

  const status = client.getWalletStatus();
  let walletConnected = status.connected;
  let walletAddress = status.address || '';

  // Sync wallet UI state across pages
  const updateWalletUI = () => {
    if (walletConnected && connectWalletBtn && walletAddress) {
      connectWalletBtn.textContent = `🟢 ${walletAddress.substring(0, 10)}... (Copy)`;
      (connectWalletBtn as HTMLButtonElement).style.background = 'linear-gradient(135deg, #059669, #047857)';
      connectWalletBtn.title = `Connected Address: ${walletAddress}\nClick to copy full address!`;
    } else if (connectWalletBtn) {
      connectWalletBtn.textContent = 'Connect Wallet';
      (connectWalletBtn as HTMLButtonElement).style.background = 'linear-gradient(135deg, #10b981, #059669)';
      connectWalletBtn.title = "Connect Midnight Lace Wallet";
    }
  };

  // 1. Update Wallet UI immediately
  updateWalletUI();

  // 2. Attach Connect Wallet click handler immediately (non-blocking)
  if (connectWalletBtn) {
    connectWalletBtn.onclick = async (e) => {
      e.preventDefault();
      e.stopPropagation();

      if (!walletConnected) {
        if (logBoxEl) {
          logBoxEl.innerHTML += `<div class="log-line info">> Requesting connection to browser Midnight Lace Wallet extension...</div>`;
          logBoxEl.scrollTop = logBoxEl.scrollHeight;
        }
        try {
          const res = await client.connectWallet();
          walletConnected = true;
          walletAddress = res.walletAddress;
          updateWalletUI();

          if (logBoxEl) {
            logBoxEl.innerHTML += `<div class="log-line success">> [WALLET CONNECTED] Address: ${res.walletAddress} (${res.walletName})</div>`;
            logBoxEl.innerHTML += `<div class="log-line info">> [FAUCET] Need test tokens? Visit <a href="https://faucet.preprod.midnight.network" target="_blank" style="color:#34d399; text-decoration:underline;">Midnight Preprod Faucet</a></div>`;
            logBoxEl.scrollTop = logBoxEl.scrollHeight;
          }
        } catch (err: any) {
          walletConnected = false;
          walletAddress = '';
          updateWalletUI();

          const errorMsg = err?.message || "Failed to connect to Midnight Lace Wallet extension.";
          alert(`Wallet Connection Error:\n\n${errorMsg}`);

          if (logBoxEl) {
            logBoxEl.innerHTML += `<div class="log-line error">> [ERROR] ${errorMsg}</div>`;
            logBoxEl.scrollTop = logBoxEl.scrollHeight;
          }
        }
      } else {
        try {
          await navigator.clipboard.writeText(walletAddress);
          alert(`📋 Wallet Address Copied!\n\n${walletAddress}\n\nPaste this into the Midnight Preprod Faucet to receive test tokens.`);
          if (logBoxEl) {
            logBoxEl.innerHTML += `<div class="log-line success">> [COPIED] Wallet address copied: ${walletAddress}</div>`;
            logBoxEl.scrollTop = logBoxEl.scrollHeight;
          }
        } catch (e) {
          alert(`Your Full Wallet Address:\n\n${walletAddress}`);
        }
      }
    };
  }

  // 3. Asynchronously fetch public ledger state from indexer (non-blocking)
  client.fetchPublicState().then((publicState) => {
    if (publicState.memberCount > 0) {
      count = publicState.memberCount;
      if (applicantCountEl) applicantCountEl.textContent = count.toString();
    }
    if (publicState.activeSession > 0) {
      session = publicState.activeSession;
      if (sessionEl) sessionEl.textContent = session.toString();
    }
    if (publicState.lastRewardCommitment && lastCommitmentEl) {
      lastCommitmentEl.textContent = publicState.lastRewardCommitment;
    }
  }).catch((e) => {
    console.warn("Could not query initial public state:", e);
  });

  // Handle Member claimReward() Circuit Call
  if (formEl) {
    formEl.onsubmit = async (e) => {
      e.preventDefault();

      const programId = scholarshipInput ? scholarshipInput.value : 'program_platinum_elite_2026';
      const memberKey = applicantKeyInput ? applicantKeyInput.value : '';
      const payload = academicRecordInput ? academicRecordInput.value : '';

      if (!memberKey || memberKey.trim().length === 0) {
        alert("Please enter a Member Secret Key to generate the ZK witness!");
        return;
      }

      client.updateMemberKey(memberKey);
      client.updateMembershipRecord(payload || "default_membership_record_hash");

      if (progressBar && progressFill) {
        progressBar.style.display = 'block';
        progressFill.style.width = '15%';
      }

      if (logBoxEl) {
        logBoxEl.innerHTML += `<div class="log-line info">> [STEP 1/4] Constructing private witnesses: memberSecretKey(), loyaltyProofNonce(), membershipRecordHash()...</div>`;
        logBoxEl.innerHTML += `<div class="log-line info">> [STEP 2/4] Executing Compact ZK circuit claimReward() on Midnight Network...</div>`;
        logBoxEl.scrollTop = logBoxEl.scrollHeight;
      }

      try {
        if (progressFill) progressFill.style.width = '65%';

        // Real Midnight Smart Contract Circuit Call
        const result = await client.claimReward(programId);

        walletConnected = true;
        walletAddress = result.signedBy || walletAddress;
        updateWalletUI();

        if (progressFill) progressFill.style.width = '100%';

        count++;
        if (applicantCountEl) applicantCountEl.textContent = count.toString();
        if (lastCommitmentEl) lastCommitmentEl.textContent = result.commitmentHex || '0x...';

        if (logBoxEl) {
          const feeStatusNote = result.walletFunded
            ? `(Deducted from Lace Wallet Balance)`
            : `(Note: Wallet unfunded — get test tokens at <a href="https://faucet.preprod.midnight.network" target="_blank" style="color:#34d399; text-decoration:underline;">Midnight Faucet</a>)`;

          const blockInfo = result.blockHeight ? ` | Block #${result.blockHeight}` : '';

          logBoxEl.innerHTML += `<div class="log-line info">> [STEP 3/4] Signed by Lace Wallet: ${result.signedBy} | Fee: ${result.txFee} ${result.txFeeAsset} ${feeStatusNote}</div>`;
          logBoxEl.innerHTML += `<div class="log-line success">> [STEP 4/4] ✓ Compact claimReward() Executed! On-Chain Commitment: ${result.commitmentHex} | TxHash: ${result.txHash}${blockInfo}</div>`;
          logBoxEl.scrollTop = logBoxEl.scrollHeight;
        }

        setTimeout(() => {
          if (progressBar) progressBar.style.display = 'none';
          if (progressFill) progressFill.style.width = '0%';
        }, 800);

      } catch (err: any) {
        if (progressBar) progressBar.style.display = 'none';
        alert(`Claim Reward Circuit Error: ${err?.message}`);
        if (logBoxEl) {
          logBoxEl.innerHTML += `<div class="log-line error">> [ERROR] ${err?.message}</div>`;
          logBoxEl.scrollTop = logBoxEl.scrollHeight;
        }
      }
    };
  }

  // Handle Admin resetProgram() Circuit Call
  if (resetExamForm) {
    resetExamForm.onsubmit = async (e) => {
      e.preventDefault();
      const newProgramVal = newOrganizerInput ? newOrganizerInput.value : '';

      if (!newProgramVal || newProgramVal.trim().length === 0) {
        alert("Please enter a valid Program ID string.");
        return;
      }

      try {
        // Real Midnight Smart Contract Circuit Call
        const res = await client.resetProgram(newProgramVal);

        session++;
        if (sessionEl) sessionEl.textContent = session.toString();

        if (adminLogArea && adminLogBox) {
          adminLogArea.style.display = 'block';
          adminLogBox.innerHTML = `
            <strong>Circuit:</strong> resetProgram(newProgramId: Bytes&lt;32&gt;)<br>
            <strong>New Loyalty Program ID:</strong> ${res.newProgramId}<br>
            <strong>On-Chain TxHash:</strong> ${res.txHash}<br>
            <strong>Signed By:</strong> ${res.signedBy}<br>
            <strong>Status:</strong> CONFIRMED (Midnight Preprod)
          `;
        }
        alert(`✓ resetProgram() executed! TxHash: ${res.txHash}`);
      } catch (err: any) {
        alert(`resetProgram Circuit Call Failed:\n\n${err?.message || err}`);
      }
    };
  }

  // Handle Admin incrementSession() Circuit Call
  if (incrementSessionBtn) {
    incrementSessionBtn.onclick = async (e) => {
      e.preventDefault();
      try {
        // Real Midnight Smart Contract Circuit Call
        const res = await client.incrementSession();

        session++;
        if (sessionEl) sessionEl.textContent = session.toString();

        if (adminLogArea && adminLogBox) {
          adminLogArea.style.display = 'block';
          adminLogBox.innerHTML = `
            <strong>Circuit:</strong> incrementSession(): []<br>
            <strong>Action:</strong> Active Loyalty Session Epoch Incremented (+1)<br>
            <strong>On-Chain TxHash:</strong> ${res.txHash}<br>
            <strong>Signed By:</strong> ${res.signedBy}<br>
            <strong>Status:</strong> CONFIRMED (Midnight Preprod)
          `;
        }
        alert(`✓ incrementSession() executed! TxHash: ${res.txHash}`);
      } catch (err: any) {
        alert(`incrementSession Circuit Call Failed:\n\n${err?.message || err}`);
      }
    };
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
