// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import "@openzeppelin/contracts/access/Ownable2Step.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/// @title BetPass — Satellite Revenue Share Token
/// @notice Holders stake BETPASS to earn 25% of BetCoin platform fees
/// @dev Fixed supply 10M, no minting. Valuation: $10M at $1/token
contract BetPass is ERC20, ERC20Permit, Ownable2Step, Pausable {
    uint256 public constant TOTAL_SUPPLY = 10_000_000 * 1e18;

    /// @notice Allocation (total = 10000 bps = 100%)
    uint256 public constant PUBLIC_SALE_BPS = 3000;    // 30% — public sale ($3M raise)
    uint256 public constant TEAM_BPS = 2000;           // 20% — founder+team (vesting)
    uint256 public constant STAKING_REWARDS_BPS = 2000;// 20% — staking rewards (3 anos)
    uint256 public constant TREASURY_BPS = 1500;       // 15% — treasury/reserve
    uint256 public constant LIQUIDITY_BPS = 1000;      // 10% — DEX liquidity pool
    uint256 public constant ADVISORS_BPS = 500;        // 5%  — advisors/partners (vesting)

    bool public distributed;

    error AlreadyDistributed();
    error ZeroAddress();

    constructor(address initialOwner)
        ERC20("BetPass", "BETPASS")
        ERC20Permit("BetPass")
        Ownable(initialOwner)
    {
        _mint(initialOwner, TOTAL_SUPPLY);
    }

    /// @notice One-time distribution to allocation wallets
    /// @param publicSale   30% — IDO/launchpad sale
    /// @param teamVesting  20% — founder+team (should be a vesting contract)
    /// @param stakingPool  20% — BetPassStaking rewards pool
    /// @param treasury     15% — operational reserve
    /// @param liquidity    10% — DEX liquidity (BETPASS/USDT)
    /// @param advisors      5% — advisors (should be a vesting contract)
    function distribute(
        address publicSale,
        address teamVesting,
        address stakingPool,
        address treasury,
        address liquidity,
        address advisors
    ) external onlyOwner {
        if (distributed) revert AlreadyDistributed();
        if (publicSale == address(0) || teamVesting == address(0)) revert ZeroAddress();
        if (stakingPool == address(0) || treasury == address(0)) revert ZeroAddress();
        if (liquidity == address(0) || advisors == address(0)) revert ZeroAddress();

        distributed = true;

        _transfer(msg.sender, publicSale, (TOTAL_SUPPLY * PUBLIC_SALE_BPS) / 10000);
        _transfer(msg.sender, teamVesting, (TOTAL_SUPPLY * TEAM_BPS) / 10000);
        _transfer(msg.sender, stakingPool, (TOTAL_SUPPLY * STAKING_REWARDS_BPS) / 10000);
        _transfer(msg.sender, treasury, (TOTAL_SUPPLY * TREASURY_BPS) / 10000);
        _transfer(msg.sender, liquidity, (TOTAL_SUPPLY * LIQUIDITY_BPS) / 10000);
        _transfer(msg.sender, advisors, (TOTAL_SUPPLY * ADVISORS_BPS) / 10000);
    }

    function pause() external onlyOwner { _pause(); }
    function unpause() external onlyOwner { _unpause(); }
}
