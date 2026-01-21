const { ethers, upgrades } = require("hardhat");

async function main() {
  const [deployer, pauser1, pauser2] = await ethers.getSigners();

  const GOVToken = await ethers.getContractFactory("GOVToken");
  const token = await GOVToken.deploy();
  await token.waitForDeployment();
  const tokenAddr = await token.getAddress();

  const Timelock = await ethers.getContractFactory("DAOTimelock");
  const timelock = await Timelock.deploy(0, [], [], deployer.address);
  await timelock.waitForDeployment();
  const timelockAddr = await timelock.getAddress();

  const Treasury = await ethers.getContractFactory("Treasury");
  const treasury = await Treasury.deploy(timelockAddr);
  await treasury.waitForDeployment();
  const treasuryAddr = await treasury.getAddress();

  const Governor = await ethers.getContractFactory("DAOGovernor");
  const governorProxy = await upgrades.deployProxy(Governor, [
    tokenAddr,
    timelockAddr,
    [pauser1.address, pauser2.address]
  ], { kind: 'uups' });
  await governorProxy.waitForDeployment();
  const proxyAddr = await governorProxy.getAddress();

  // Set Timelock Roles
  const proposerRole = await timelock.PROPOSER_ROLE();
  const executorRole = await timelock.EXECUTOR_ROLE();
  await timelock.grantRole(proposerRole, proxyAddr);
  await timelock.grantRole(executorRole, ethers.ZeroAddress);

  console.log("\n--- FINAL DEPLOYMENT ADDRESSES ---");
  console.log("TOKEN_ADDRESS=" + tokenAddr);
  console.log("TIMELOCK_ADDRESS=" + timelockAddr);
  console.log("TREASURY_ADDRESS=" + treasuryAddr);
  console.log("PROXY_ADDRESS=" + proxyAddr);
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
