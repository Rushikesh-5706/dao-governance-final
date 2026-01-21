const hre = require("hardhat");

async function main(){
  const tokenAddr = "0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9";
  const governorProxyAddr = "Proxy:";
  const timelockAddr = "0x5FC8d32690cc91D4c39d9d3abcBD16989F875707";

  const governor = await hre.ethers.getContractAt("DAOGovernor", governorProxyAddr);
  const timelock = await hre.ethers.getContractAt("DAOTimelock", timelockAddr);

  console.log('--- UUPS Governor Proxy ---');
  console.log('Address:           ', governorProxyAddr);
  console.log('Proposal Threshold:', (await governor.proposalThreshold()).toString());
  console.log('Voting Delay:      ', (await governor.votingDelay()).toString());
  console.log('Voting Period:     ', (await governor.votingPeriod()).toString());
  
  const block = await hre.ethers.provider.getBlockNumber();
  console.log('Current Block:     ', block);
  
  // Quorum check (requires at least one block to have passed)
  const quorumValue = await governor.quorum(block - 1);
  console.log('Quorum @ Snapshot: ', hre.ethers.formatUnits(quorumValue, 18), 'GTK');

  console.log('\n--- Timelock roles ---');
  const proposerRole = await timelock.PROPOSER_ROLE();
  const isGovernorProposer = await timelock.hasRole(proposerRole, governorProxyAddr);
  console.log('Governor is Proposer?', isGovernorProposer);
}

main().catch(e=>{console.error(e);process.exit(1)});
