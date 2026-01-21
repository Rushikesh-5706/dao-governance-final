const { ethers, upgrades } = require("hardhat");

async function main() {
  const [deployer, pauser1, pauser2] = await ethers.getSigners();

  const GOVToken = await ethers.getContractFactory("GOVToken");
  const token = await GOVToken.deploy();
  await token.waitForDeployment();
  console.log("Token:", await token.getAddress());

  const Timelock = await ethers.getContractFactory("DAOTimelock");
  const timelock = await Timelock.deploy(0, [], [], deployer.address);
  await timelock.waitForDeployment();
  console.log("Timelock:", await timelock.getAddress());

  const Governor = await ethers.getContractFactory("DAOGovernor");
  const governor = await upgrades.deployProxy(Governor, [
    await token.getAddress(),
    await timelock.getAddress(),
    [pauser1.address, pauser2.address]
  ], { kind: 'uups' });
  await governor.waitForDeployment();
  console.log("Governor Proxy:", await governor.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
