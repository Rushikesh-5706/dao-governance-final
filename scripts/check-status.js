const { ethers } = require("hardhat");

async function main() {
  // These addresses usually stay the same on a fresh 'npx hardhat node' run
  const tokenAddr = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
  
  try {
    const t = await ethers.getContractAt("GOVToken", tokenAddr);
    console.log("--- Token Status ---");
    console.log("Name:        ", await t.name());
    console.log("Symbol:      ", await t.symbol());
    console.log("Total Supply:", ethers.formatUnits(await t.totalSupply(), 18), "GTK");
  } catch (e) {
    console.log("Error: Contract not found at that address. Check your deployment logs!");
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
