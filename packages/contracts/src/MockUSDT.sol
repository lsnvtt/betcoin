// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/// @title MockUSDT — Test USDT token (6 decimals like real USDT)
contract MockUSDT is ERC20 {
    constructor() ERC20("Test USDT", "USDT") {}

    function decimals() public pure override returns (uint8) { return 6; }

    /// @notice Anyone can mint test tokens
    function faucet(uint256 amount) external {
        _mint(msg.sender, amount);
    }

    /// @notice Mint to a specific address
    function faucetTo(address to, uint256 amount) external {
        _mint(to, amount);
    }
}
