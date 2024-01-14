// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract BridgeContract {
    FathomUSD public token;

    event TokensBridgeRequestSent(address indexed sender, uint256 amount);

    constructor(address _tokenAddress) {
        token = FathomUSD(_tokenAddress);
    }

    function bridgeTokens(uint256 amount) public {
        require(token.allowance(msg.sender, address(this)) >= amount, "BridgeContract: insufficient allowance");
        bool sent = token.transferFrom(msg.sender, address(this), amount);
        require(sent, "BridgeContract: Failed to transfer tokens from user to bridge");

        token.burn(amount);

        emit TokensBridgeRequestSent(msg.sender, amount);
    }
}