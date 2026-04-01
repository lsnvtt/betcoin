// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable2Step.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/// @title Treasury
/// @notice Receives platform fees in USDT and manages timelocked withdrawals
/// @dev All withdrawals require a 48-hour timelock for security
contract Treasury is Ownable2Step {
    using SafeERC20 for IERC20;

    /// @notice The USDT ERC20 token
    IERC20 public immutable usdt;

    /// @notice Duration of the withdrawal timelock (48 hours)
    uint256 public constant TIMELOCK_DURATION = 48 hours;

    /// @notice Withdrawal request details
    struct Withdrawal {
        address to;
        uint256 amount;
        uint256 executeAfter;
        bool executed;
        bool cancelled;
    }

    /// @notice All withdrawal requests indexed by ID
    mapping(uint256 => Withdrawal) public withdrawals;

    /// @notice Counter for withdrawal IDs
    uint256 public nextWithdrawalId;

    // --- Events ---

    event WithdrawalQueued(uint256 indexed withdrawalId, address indexed to, uint256 amount, uint256 executeAfter);
    event WithdrawalExecuted(uint256 indexed withdrawalId, address indexed to, uint256 amount);
    event WithdrawalCancelled(uint256 indexed withdrawalId);

    // --- Errors ---

    error ZeroAddress();
    error ZeroAmount();
    error WithdrawalNotFound();
    error WithdrawalAlreadyExecuted();
    error WithdrawalAlreadyCancelled();
    error TimelockNotExpired();
    error InsufficientBalance();

    /// @param _usdt Address of the USDT token
    /// @param _owner Address of the initial owner
    constructor(address _usdt, address _owner) Ownable(_owner) {
        if (_usdt == address(0)) revert ZeroAddress();
        usdt = IERC20(_usdt);
    }

    /// @notice Queue a withdrawal with a 48-hour timelock
    /// @param to Recipient address
    /// @param amount Amount of USDT to withdraw
    /// @return withdrawalId The ID of the queued withdrawal
    function queueWithdrawal(address to, uint256 amount) external onlyOwner returns (uint256 withdrawalId) {
        return _queueWithdrawal(to, amount);
    }

    /// @notice Execute a queued withdrawal after the timelock has expired
    /// @param withdrawalId The ID of the withdrawal to execute
    function executeWithdrawal(uint256 withdrawalId) external onlyOwner {
        Withdrawal storage w = withdrawals[withdrawalId];
        if (w.amount == 0) revert WithdrawalNotFound();
        if (w.executed) revert WithdrawalAlreadyExecuted();
        if (w.cancelled) revert WithdrawalAlreadyCancelled();
        if (block.timestamp < w.executeAfter) revert TimelockNotExpired();
        if (usdt.balanceOf(address(this)) < w.amount) revert InsufficientBalance();

        w.executed = true;
        usdt.safeTransfer(w.to, w.amount);

        emit WithdrawalExecuted(withdrawalId, w.to, w.amount);
    }

    /// @notice Cancel a queued withdrawal
    /// @param withdrawalId The ID of the withdrawal to cancel
    function cancelWithdrawal(uint256 withdrawalId) external onlyOwner {
        Withdrawal storage w = withdrawals[withdrawalId];
        if (w.amount == 0) revert WithdrawalNotFound();
        if (w.executed) revert WithdrawalAlreadyExecuted();
        if (w.cancelled) revert WithdrawalAlreadyCancelled();

        w.cancelled = true;

        emit WithdrawalCancelled(withdrawalId);
    }

    /// @notice Convenience function: queue + execute after timelock
    /// @dev This only queues; execution must happen separately after 48h
    function withdraw(address to, uint256 amount) external onlyOwner returns (uint256 withdrawalId) {
        return _queueWithdrawal(to, amount);
    }

    function _queueWithdrawal(address to, uint256 amount) internal returns (uint256 withdrawalId) {
        if (to == address(0)) revert ZeroAddress();
        if (amount == 0) revert ZeroAmount();

        withdrawalId = nextWithdrawalId++;
        uint256 executeAfter = block.timestamp + TIMELOCK_DURATION;

        withdrawals[withdrawalId] = Withdrawal({
            to: to,
            amount: amount,
            executeAfter: executeAfter,
            executed: false,
            cancelled: false
        });

        emit WithdrawalQueued(withdrawalId, to, amount, executeAfter);
    }
}
