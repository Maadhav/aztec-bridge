// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract FathomUSD is ERC20 {
    constructor() ERC20("Fathom USD", "FXD") {
        _mint(msg.sender, 1000*10**18);
    }

	function mint(address to, uint256 amount) public {
        _mint(to, amount);
    }

	function burn(uint256 amount) public {
        _burn(msg.sender, amount);
    }
}

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