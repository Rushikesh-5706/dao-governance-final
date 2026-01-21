const hre = require("hardhat");

async function main(){
  // MANUALLY UPDATE THESE THREE ADDRESSES FROM YOUR DEPLOYMENT LOG
  const tokenAddr = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
  const proxyAddr = "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0"; 
  const timelockAddr = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";

  console.log("Connecting to Proxy at:", proxyAddr);
  const governor = await hre.ethers.getContractAt("DAOGovernor", proxyAddr);
  const timelock = await hre.ethers.getContractAt("DAOTimelock", timelockAddr);

  console.log('\n--- UUPS Governor Proxy ---');
  console.log('Proposal Threshold:', (await governor.proposalThreshold()).toString());
  console.log('Voting Delay:      ', (await governor.votingDelay()).toString());
  console.log('Voting Period:     ', (await governor.votingPeriod()).toString());
  
  const block = await hre.ethers.provider.getBlockNumber();
  const quorumValue = await governor.quorum(block - 1);
  console.log('Current Quorum:    ', hre.ethers.formatUnits(quorumValue, 18), 'GTK');

  console.log('\n--- Timelock roles ---');
  const isProposer = await timelock.hasRole(await timelock.PROPOSER_ROLE(), proxyAddr);
  console.log('Governor is Proposer?', isProposer);
}

main().catch(e=>{console.error(e);process.exit(1)});
