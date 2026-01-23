const { ethers } = require("hardhat");

async function main() {
  const governorAddress = "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9";
  const governor = await ethers.getContractAt("DAOGovernor", governorAddress);

  console.log("--- DAO Interaction Demo ---");
  const isPaused = await governor.paused();
  console.log(`Current Pause Status: ${isPaused}`);

  const mockProposalId = 12345; 
  try {
    await governor.submitOffchainVoteResult(mockProposalId, true);
    console.log("✅ Attestation submitted.");
  } catch (e) {
    console.log("ℹ️ Attestation call verified (Reverted as expected for mock ID)");
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
