// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts-upgradeable/governance/GovernorUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/governance/extensions/GovernorSettingsUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/governance/extensions/GovernorCountingSimpleUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/governance/extensions/GovernorVotesUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/governance/extensions/GovernorVotesQuorumFractionUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/governance/extensions/GovernorTimelockControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";

contract DAOGovernor is
    UUPSUpgradeable,
    GovernorUpgradeable,
    GovernorSettingsUpgradeable,
    GovernorCountingSimpleUpgradeable,
    GovernorVotesUpgradeable,
    GovernorVotesQuorumFractionUpgradeable,
    GovernorTimelockControlUpgradeable,
    AccessControlUpgradeable,
    PausableUpgradeable,
    ReentrancyGuardUpgradeable
{
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    uint256 public pauseVotes;
    mapping(address => bool) public pauseVoters;

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(IVotes _token, TimelockControllerUpgradeable _timelock, address[] memory pausers)
        public
        initializer
    {
        __Governor_init("DAOGovernor");
        __GovernorSettings_init(1, 5, 10000e18); 
        __GovernorCountingSimple_init();
        __GovernorVotes_init(_token);
        __GovernorVotesQuorumFraction_init(4);
        __GovernorTimelockControl_init(_timelock);
        __UUPSUpgradeable_init();
        __AccessControl_init();
        __Pausable_init();
        __ReentrancyGuard_init();

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        for (uint256 i = 0; i < pausers.length; i++) {
            _grantRole(PAUSER_ROLE, pausers[i]);
        }
    }

    function votePause() public onlyRole(PAUSER_ROLE) {
        require(!pauseVoters[msg.sender], "Already voted");
        pauseVoters[msg.sender] = true;
        pauseVotes++;
        if (pauseVotes >= 2) { _pause(); }
    }

    function unpause() public onlyRole(DEFAULT_ADMIN_ROLE) {
        pauseVotes = 0;
        _unpause();
    }

    function attestAndQueue(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 descriptionHash
    ) public onlyRole(DEFAULT_ADMIN_ROLE) nonReentrant returns (uint256) {
        uint256 proposalId = hashProposal(targets, values, calldatas, descriptionHash);
        require(state(proposalId) == ProposalState.Succeeded, "Proposal must have succeeded");
        return _queueOperations(proposalId, targets, values, calldatas, descriptionHash);
    }

    // --- Overrides ---

    function propose(address[] memory targets, uint256[] memory values, bytes[] memory calldatas, string memory description)
        public override(GovernorUpgradeable) whenNotPaused nonReentrant returns (uint256)
    {
        return super.propose(targets, values, calldatas, description);
    }

    function execute(address[] memory targets, uint256[] memory values, bytes[] memory calldatas, bytes32 descriptionHash)
        public payable override(GovernorUpgradeable) nonReentrant returns (uint256)
    {
        return super.execute(targets, values, calldatas, descriptionHash);
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyRole(DEFAULT_ADMIN_ROLE) {}

    function supportsInterface(bytes4 interfaceId) public view override(GovernorUpgradeable, AccessControlUpgradeable) returns (bool) {
        return super.supportsInterface(interfaceId);
    }

    function votingDelay() public view override(GovernorUpgradeable, GovernorSettingsUpgradeable) returns (uint256) { return super.votingDelay(); }
    function votingPeriod() public view override(GovernorUpgradeable, GovernorSettingsUpgradeable) returns (uint256) { return super.votingPeriod(); }
    function quorum(uint256 blockNumber) public view override(GovernorUpgradeable, GovernorVotesQuorumFractionUpgradeable) returns (uint256) { return super.quorum(blockNumber); }
    function state(uint256 proposalId) public view override(GovernorUpgradeable, GovernorTimelockControlUpgradeable) returns (ProposalState) { return super.state(proposalId); }
    function proposalNeedsQueuing(uint256 proposalId) public view override(GovernorUpgradeable, GovernorTimelockControlUpgradeable) returns (bool) { return super.proposalNeedsQueuing(proposalId); }
    function proposalThreshold() public view override(GovernorUpgradeable, GovernorSettingsUpgradeable) returns (uint256) { return super.proposalThreshold(); }
    function _queueOperations(uint256 proposalId, address[] memory targets, uint256[] memory values, bytes[] memory calldatas, bytes32 descriptionHash) internal override(GovernorUpgradeable, GovernorTimelockControlUpgradeable) returns (uint48) { return super._queueOperations(proposalId, targets, values, calldatas, descriptionHash); }
    function _executeOperations(uint256 proposalId, address[] memory targets, uint256[] memory values, bytes[] memory calldatas, bytes32 descriptionHash) internal override(GovernorUpgradeable, GovernorTimelockControlUpgradeable) { super._executeOperations(proposalId, targets, values, calldatas, descriptionHash); }
    function _cancel(address[] memory targets, uint256[] memory values, bytes[] memory calldatas, bytes32 descriptionHash) internal override(GovernorUpgradeable, GovernorTimelockControlUpgradeable) returns (uint256) { return super._cancel(targets, values, calldatas, descriptionHash); }
    function _executor() internal view override(GovernorUpgradeable, GovernorTimelockControlUpgradeable) returns (address) { return super._executor(); }
}
