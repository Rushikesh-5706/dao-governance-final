const hre = require("hardhat");

async function main(){
  // UPDATED ADDRESSES FROM YOUR LATEST SUCCESSFUL DEPLOYMENT
  const tokenAddr = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
  const governorProxyAddr = "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9"; 
  const timelockAddr = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";

  console.log('Connecting to Proxy at:', governorProxyAddr);
  const governor = await hre.ethers.getContractAt("DAOGovernor", governorProxyAddr);
  const timelock = await hre.ethers.getContractAt("DAOTimelock", timelockAddr);

  console.log('\n--- Governor Verification (UUPS Proxy) ---');
  // These will now return correct values (10k, 1, 5)
  console.log('Proposal Threshold:', (await governor.proposalThreshold()).toString());
  console.log('Voting Delay:      ', (await governor.votingDelay()).toString());
  console.log('Voting Period:     ', (await governor.votingPeriod()).toString());

  const block = await hre.ethers.provider.getBlockNumber();
  // block-1 prevents "Snapshot not yet reached" errors
  const quorumValue = await governor.quorum(block - 1);
  console.log('Quorum @ Snapshot: ', hre.ethers.formatUnits(quorumValue, 18), 'GTK');

  console.log('\n--- Timelock Roles ---');
  const proposerRole = await timelock.PROPOSER_ROLE();
  const isGovernorProposer = await timelock.hasRole(proposerRole, governorProxyAddr);
  console.log('Governor is Proposer?', isGovernorProposer);
  
  if (!isGovernorProposer) {
    console.log('\n[FIXING] Granting Proposer Role to Governor...');
    const [deployer] = await hre.ethers.getSigners();
    await timelock.connect(deployer).grantRole(proposerRole, governorProxyAddr);
    console.log('Success: Governor is now a Proposer.');
  }
}

main().catch(e=>{console.error(e);process.exit(1)});
