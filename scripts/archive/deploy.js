const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deployer:", deployer.address);

  const GOVToken = await ethers.getContractFactory("GOVToken");
  const govToken = await GOVToken.deploy();
  await govToken.waitForDeployment();
  console.log("GOVToken:", await govToken.getAddress());

  const Timelock = await ethers.getContractFactory("DAOTimelock");
  const timelock = await Timelock.deploy(
    60,
    [],
    [],
    deployer.address
  );
  await timelock.waitForDeployment();
  console.log("Timelock:", await timelock.getAddress());

  const Governor = await ethers.getContractFactory("DAOGovernor");
  const governor = await Governor.deploy(
    await govToken.getAddress(),
    await timelock.getAddress()
  );
  await governor.waitForDeployment();
  console.log("Governor:", await governor.getAddress());

  // Accessing constants directly without parentheses
  const proposerRole = await timelock.PROPOSER_ROLE();
  const executorRole = await timelock.EXECUTOR_ROLE();
  const adminRole = await timelock.DEFAULT_ADMIN_ROLE(); 

  console.log("Setting up roles...");
  await timelock.grantRole(proposerRole, await governor.getAddress());
  await timelock.grantRole(executorRole, ethers.ZeroAddress);
  await timelock.revokeRole(adminRole, deployer.address);

  console.log("Timelock roles configured successfully");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
