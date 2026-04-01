// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable2Step.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @title Vault — Custodial vault for player USDT deposits
/// @notice Players deposit USDT to play. Backend manages internal balances.
/// @dev Players can withdraw anytime up to their net deposited amount.
contract Vault is Ownable2Step, ReentrancyGuard {
    using SafeERC20 for IERC20;

    /// @notice USDT token
    IERC20 public immutable usdt;

    /// @notice Backend wallet that can process withdrawals
    address public relayer;

    /// @notice Total deposited per player
    mapping(address => uint256) public deposits;

    /// @notice Total withdrawn per player
    mapping(address => uint256) public withdrawals;

    /// @notice Total USDT deposited across all players
    uint256 public totalDeposited;

    // --- Events ---

    event Deposited(address indexed player, uint256 amount);
    event Withdrawn(address indexed player, uint256 amount);
    event RelayerUpdated(address indexed oldRelayer, address indexed newRelayer);

    // --- Errors ---

    error ZeroAmount();
    error ZeroAddress();
    error InsufficientBalance();
    error NotRelayer();

    modifier onlyRelayer() {
        if (msg.sender != relayer) revert NotRelayer();
        _;
    }

    /// @param _usdt USDT token address
    /// @param _owner Contract owner
    constructor(address _usdt, address _owner) Ownable(_owner) {
        if (_usdt == address(0)) revert ZeroAddress();
        usdt = IERC20(_usdt);
    }

    /// @notice Deposit USDT into the vault
    /// @param amount Amount of USDT to deposit
    function deposit(uint256 amount) external nonReentrant {
        if (amount == 0) revert ZeroAmount();

        usdt.safeTransferFrom(msg.sender, address(this), amount);
        deposits[msg.sender] += amount;
        totalDeposited += amount;

        emit Deposited(msg.sender, amount);
    }

    /// @notice Relayer-initiated withdrawal (backend validates balance)
    /// @param player Player address
    /// @param amount Amount to withdraw
    function withdraw(address player, uint256 amount) external onlyRelayer nonReentrant {
        _processWithdrawal(player, amount);
    }

    /// @notice Player-initiated emergency withdrawal
    /// @param amount Amount to withdraw
    function playerWithdraw(uint256 amount) external nonReentrant {
        _processWithdrawal(msg.sender, amount);
    }

    /// @notice Set the relayer address
    /// @param _relayer New relayer address
    function setRelayer(address _relayer) external onlyOwner {
        if (_relayer == address(0)) revert ZeroAddress();
        address old = relayer;
        relayer = _relayer;
        emit RelayerUpdated(old, _relayer);
    }

    /// @notice Get a player's net balance (deposited - withdrawn)
    /// @param player Player address
    /// @return Net balance available
    function getPlayerBalance(address player) external view returns (uint256) {
        if (withdrawals[player] >= deposits[player]) return 0;
        return deposits[player] - withdrawals[player];
    }

    // --- Internal ---

    function _processWithdrawal(address player, uint256 amount) internal {
        if (amount == 0) revert ZeroAmount();
        if (withdrawals[player] + amount > deposits[player]) revert InsufficientBalance();

        withdrawals[player] += amount;
        usdt.safeTransfer(player, amount);

        emit Withdrawn(player, amount);
    }
}
