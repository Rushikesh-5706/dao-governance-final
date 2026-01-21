const { expect } = require("chai");
const { ethers, upgrades, network } = require("hardhat");

describe("DAO Governance Flow", function () {
  let token, timelock, governor, treasury;
  let deployer, voter1, voter2, pauser1, pauser2;

  async function moveBlocks(amount) {
    for (let i = 0; i < amount; i++) {
      await network.provider.send("evm_mine", []);
    }
  }

  beforeEach(async function () {
    [deployer, voter1, voter2, pauser1, pauser2] = await ethers.getSigners();

    const GOVToken = await ethers.getContractFactory("GOVToken");
    token = await GOVToken.deploy();
    
    const Timelock = await ethers.getContractFactory("DAOTimelock");
    timelock = await Timelock.deploy(0, [], [], deployer.address);
    
    const Treasury = await ethers.getContractFactory("Treasury");
    // Hardening: Treasury is owned by Timelock
    treasury = await Treasury.deploy(await timelock.getAddress());

    const GovernorFactory = await ethers.getContractFactory("DAOGovernor");
    governor = await upgrades.deployProxy(GovernorFactory, [
      await token.getAddress(),
      await timelock.getAddress(),
      [pauser1.address, pauser2.address]
    ], { kind: 'uups' });

    const proposerRole = await timelock.PROPOSER_ROLE();
    const executorRole = await timelock.EXECUTOR_ROLE();
    await timelock.grantRole(proposerRole, await governor.getAddress());
    await timelock.grantRole(executorRole, ethers.ZeroAddress);

    await token.transfer(voter1.address, ethers.parseUnits("100000", 18));
    await token.connect(voter1).delegate(voter1.address);
    await moveBlocks(1);

    await deployer.sendTransaction({ to: await treasury.getAddress(), value: ethers.parseUnits("1", 18) });
  });

  it("Full Lifecycle: Propose, Vote, Attest, and Execute", async function () {
    const amountToWithdraw = ethers.parseUnits("1", 18);
    // FIXED: Now passing 2 arguments to match Treasury.withdrawFunds(address, uint256)
    const calldata = treasury.interface.encodeFunctionData("withdrawFunds", [voter2.address, amountToWithdraw]);
    const description = "Withdraw 1 ETH from Treasury";
    const descHash = ethers.id(description);

    const tx = await governor.connect(voter1).propose([await treasury.getAddress()], [0], [calldata], description);
    const receipt = await tx.wait();
    const event = receipt.logs.find(x => x.fragment && x.fragment.name === 'ProposalCreated');
    const proposalId = event.args.proposalId;

    await moveBlocks(2); 
    await governor.connect(voter1).castVote(proposalId, 1);
    await moveBlocks(10); 

    expect(await governor.state(proposalId)).to.equal(4);
    await governor.attestAndQueue([await treasury.getAddress()], [0], [calldata], descHash);

    await network.provider.send("evm_increaseTime", [3600]);
    await moveBlocks(1);

    const balBefore = await ethers.provider.getBalance(voter2.address);
    await governor.execute([await treasury.getAddress()], [0], [calldata], descHash);
    expect(await ethers.provider.getBalance(voter2.address)).to.be.gt(balBefore);
  });

  it("Multisig Pause and Edge Cases", async function () {
    await governor.connect(pauser1).votePause();
    await expect(governor.connect(pauser1).votePause()).to.be.revertedWith("Already voted");
    await governor.connect(pauser2).votePause();
    expect(await governor.paused()).to.equal(true);
    await expect(governor.connect(voter1).propose([],[],[],"")).to.be.reverted;
    await governor.connect(deployer).unpause();
    expect(await governor.paused()).to.equal(false);
  });

  it("Getter and Conflict Resolution Coverage", async function () {
    expect(await governor.votingDelay()).to.equal(1);
    expect(await governor.votingPeriod()).to.equal(5);
    expect(await governor.proposalThreshold()).to.equal(ethers.parseUnits("10000", 18));
    const block = await ethers.provider.getBlockNumber();
    expect(await governor.quorum(block - 1)).to.be.gt(0);
    expect(await governor.supportsInterface("0x01ffc9a7")).to.equal(true);
  });

  it("Edge Case: Attest and Queue reverts correctly", async function () {
    const descHash = ethers.id("test");
    await expect(governor.attestAndQueue([deployer.address], [0], ["0x"], descHash)).to.be.reverted;
  });
});
