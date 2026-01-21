
const hre = require("hardhat");



async function main() {

  // PASTE THE PROXY_ADDRESS FROM THE STEP ABOVE HERE

  const proxyAddr = "0x8A791620dd6260079BF849Dc5567aDC3F2FdC318"; 



  const governor = await hre.ethers.getContractAt("DAOGovernor", proxyAddr);



  console.log("--- Verifying Proxy Storage ---");

  console.log("Proxy Address:     ", proxyAddr);

  

  try {

    const threshold = await governor.proposalThreshold();

    const delay = await governor.votingDelay();

    const period = await governor.votingPeriod();

    

    console.log("Proposal Threshold:", threshold.toString());

    console.log("Voting Delay:      ", delay.toString());

    console.log("Voting Period:     ", period.toString());

    

    if (threshold.toString() === "0") {

      console.log("CRITICAL: Storage is still 0. Initialize failed.");

    } else {

      console.log("SUCCESS: Proxy storage is correctly initialized.");

    }

  } catch (e) {

    console.log("ERROR: Function reverted. You are likely pointing to the implementation, not the proxy.");

  }

}



main().catch(e => { console.error(e); process.exit(1); });

