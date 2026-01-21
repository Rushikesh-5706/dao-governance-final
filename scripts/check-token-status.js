const { ethers } = require("hardhat");

async function main() {
  // Replace this with the "Token:" address from your deploy_uups.js output
  const tokenAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
  
  const [deployer] = await ethers.getSigners();
  const token = await ethers.getContractAt("GOVToken", tokenAddress);

  console.log("--- GOVToken Status (Localhost) ---");
  try {
    console.log("Address:     ", tokenAddress);
    console.log("Name:        ", await token.name());
    console.log("Symbol:      ", await token.symbol());
    console.log("Total Supply:", ethers.formatUnits(await token.totalSupply(), 18), "GTK");
    console.log("Deployer Bal:", ethers.formatUnits(await token.balanceOf(deployer.address), 18), "GTK");
    console.log("-----------------------------------");
  } catch (error) {
    console.error("Error: Could not fetch data. Ensure 'npx hardhat node' is running in another terminal!");
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
