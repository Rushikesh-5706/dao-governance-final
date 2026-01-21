// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;
import "@openzeppelin/contracts/access/Ownable.sol";

contract Treasury is Ownable {
    constructor(address initialOwner) Ownable(initialOwner) {}

    receive() external payable {}

    function withdrawFunds(address payable recipient, uint256 amount) public onlyOwner {
        require(address(this).balance >= amount, "Insufficient balance");
        (bool success, ) = recipient.call{value: amount}("");
        require(success, "Transfer failed");
    }
}
