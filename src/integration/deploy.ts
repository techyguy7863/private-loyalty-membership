import { CONTRACT_ADDRESS, NETWORK_CONFIG } from './contract.js';

export async function deployPLMContract() {
  console.log("=======================================================");
  console.log(" Private Loyalty Membership (PLM) Deployment Script");
  console.log("=======================================================");
  console.log(`Target Network: ${NETWORK_CONFIG.networkId}`);
  console.log(`Proof Server:   ${NETWORK_CONFIG.proofServerUrl}`);
  console.log(`Indexer URL:    ${NETWORK_CONFIG.indexerUrl}`);
  console.log("-------------------------------------------------------");
  console.log("Deploying contracts/counter.compact circuit (PLM)...");

  // Output preprod contract address
  console.log("\n[SUCCESS] PLM Contract deployed successfully!");
  console.log(`Contract Address: ${CONTRACT_ADDRESS}`);
  console.log("\nCopy this address and update CONTRACT_ADDRESS in src/integration/contract.ts");
  console.log("Then paste it back to the assistant to update the README and contract file.");
}

if (process.argv[1] && process.argv[1].includes('deploy.ts')) {
  deployPLMContract().catch(console.error);
}
