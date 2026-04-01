// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/// @title BankPool
/// @notice Individual liquidity pool managed by a bank manager
/// @dev Provides USDT liquidity for bets, tracks exposure per event
contract BankPool {
    using SafeERC20 for IERC20;

    /// @notice Pool owner (bank manager)
    address public immutable owner;

    /// @notice USDT token
    IERC20 public immutable usdt;

    /// @notice Factory that deployed this pool
    address public immutable factory;

    /// @notice Total deposited tokens
    uint256 public totalDeposited;

    /// @notice Total tokens locked in active bets
    uint256 public totalLockedInBets;

    /// @notice Maximum exposure as basis points of total deposits
    uint256 public maxExposureBps;

    /// @notice Minimum bet amount
    uint256 public minBetAmount;

    /// @notice Maximum bet amount
    uint256 public maxBetAmount;

    /// @notice Whether the pool accepts new bets
    bool public active;

    /// @notice Authorized bet engine address
    address public betEngine;

    /// @notice Exposure tracked per event
    mapping(bytes32 => uint256) public exposureByEvent;

    // --- Events ---

    event Deposited(address indexed owner, uint256 amount);
    event Withdrawn(address indexed owner, uint256 amount);
    event ActiveChanged(bool active);
    event MaxExposureChanged(uint256 maxExposureBps);
    event BetLimitsChanged(uint256 minBetAmount, uint256 maxBetAmount);
    event BetEngineSet(address indexed betEngine);
    event FundsLocked(bytes32 indexed eventId, uint256 amount);
    event FundsUnlocked(bytes32 indexed eventId, uint256 amount);
    event WinnerPaid(address indexed winner, uint256 amount);

    // --- Errors ---

    error NotOwner();
    error NotBetEngine();
    error NotFactory();
    error ZeroAmount();
    error InsufficientAvailableLiquidity();
    error PoolNotActive();
    error InvalidBetLimits();
    error ExposureLimitExceeded();
    error InvariantViolation();

    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    modifier onlyBetEngine() {
        if (msg.sender != betEngine) revert NotBetEngine();
        _;
    }

    modifier onlyFactory() {
        if (msg.sender != factory) revert NotFactory();
        _;
    }

    /// @param _owner Pool owner address
    /// @param _usdt USDT token address
    /// @param _factory Factory contract address
    /// @param _maxExposureBps Max exposure in basis points
    /// @param _minBetAmount Minimum bet amount
    /// @param _maxBetAmount Maximum bet amount
    constructor(
        address _owner,
        address _usdt,
        address _factory,
        uint256 _maxExposureBps,
        uint256 _minBetAmount,
        uint256 _maxBetAmount
    ) {
        owner = _owner;
        usdt = IERC20(_usdt);
        factory = _factory;
        maxExposureBps = _maxExposureBps;
        minBetAmount = _minBetAmount;
        maxBetAmount = _maxBetAmount;
        active = true;
    }

    /// @notice Initialize deposit from factory (tokens already transferred)
    /// @param amount Amount that was transferred
    function initDeposit(uint256 amount) external onlyFactory {
        if (amount == 0) revert ZeroAmount();
        totalDeposited += amount;
        emit Deposited(owner, amount);
    }

    /// @notice Deposit USDT into the pool
    /// @param amount Amount to deposit
    function deposit(uint256 amount) external onlyOwner {
        if (amount == 0) revert ZeroAmount();
        usdt.safeTransferFrom(msg.sender, address(this), amount);
        totalDeposited += amount;
        emit Deposited(msg.sender, amount);
    }

    /// @notice Withdraw available (unlocked) USDT from the pool
    /// @param amount Amount to withdraw
    function withdraw(uint256 amount) external onlyOwner {
        if (amount == 0) revert ZeroAmount();
        if (amount > availableLiquidity()) revert InsufficientAvailableLiquidity();
        totalDeposited -= amount;
        usdt.safeTransfer(msg.sender, amount);
        emit Withdrawn(msg.sender, amount);
    }

    /// @notice Set pool active status
    /// @param _active Whether the pool should be active
    function setActive(bool _active) external onlyOwner {
        active = _active;
        emit ActiveChanged(_active);
    }

    /// @notice Set maximum exposure in basis points
    /// @param _maxExposureBps New max exposure
    function setMaxExposure(uint256 _maxExposureBps) external onlyOwner {
        maxExposureBps = _maxExposureBps;
        emit MaxExposureChanged(_maxExposureBps);
    }

    /// @notice Set bet amount limits
    /// @param _minBetAmount New minimum bet amount
    /// @param _maxBetAmount New maximum bet amount
    function setBetLimits(uint256 _minBetAmount, uint256 _maxBetAmount) external onlyOwner {
        if (_minBetAmount > _maxBetAmount) revert InvalidBetLimits();
        minBetAmount = _minBetAmount;
        maxBetAmount = _maxBetAmount;
        emit BetLimitsChanged(_minBetAmount, _maxBetAmount);
    }

    /// @notice Set the authorized bet engine
    /// @param _betEngine Address of the bet engine
    function setBetEngine(address _betEngine) external onlyOwner {
        betEngine = _betEngine;
        emit BetEngineSet(_betEngine);
    }

    /// @notice Lock funds for an active bet
    /// @param eventId The event identifier
    /// @param amount Amount to lock
    function lockFunds(bytes32 eventId, uint256 amount) external onlyBetEngine {
        if (!active) revert PoolNotActive();
        if (amount > availableLiquidity()) revert InsufficientAvailableLiquidity();

        uint256 maxExposure = (totalDeposited * maxExposureBps) / 10_000;
        if (exposureByEvent[eventId] + amount > maxExposure) revert ExposureLimitExceeded();

        totalLockedInBets += amount;
        exposureByEvent[eventId] += amount;

        if (totalLockedInBets > totalDeposited) revert InvariantViolation();

        emit FundsLocked(eventId, amount);
    }

    /// @notice Unlock funds when a bet is settled (bettor lost)
    /// @param eventId The event identifier
    /// @param amount Amount to unlock
    function unlockFunds(bytes32 eventId, uint256 amount) external onlyBetEngine {
        totalLockedInBets -= amount;
        exposureByEvent[eventId] -= amount;
        emit FundsUnlocked(eventId, amount);
    }

    /// @notice Pay a winning bettor from pool funds
    /// @param winner Address of the winner
    /// @param eventId The event identifier
    /// @param lockedAmount Amount that was locked for this bet
    /// @param payoutAmount Total payout to the winner
    function payWinner(
        address winner,
        bytes32 eventId,
        uint256 lockedAmount,
        uint256 payoutAmount
    ) external onlyBetEngine {
        totalLockedInBets -= lockedAmount;
        exposureByEvent[eventId] -= lockedAmount;

        // The payout may exceed the locked amount (profit from pool)
        if (payoutAmount > lockedAmount) {
            uint256 extra = payoutAmount - lockedAmount;
            totalDeposited -= extra;
        }

        usdt.safeTransfer(winner, payoutAmount);
        emit WinnerPaid(winner, payoutAmount);
    }

    /// @notice Get available (unlocked) liquidity
    /// @return Available liquidity amount
    function availableLiquidity() public view returns (uint256) {
        return totalDeposited - totalLockedInBets;
    }

    /// @notice Get exposure for a specific event
    /// @param eventId The event identifier
    /// @return Current exposure amount
    function getExposure(bytes32 eventId) external view returns (uint256) {
        return exposureByEvent[eventId];
    }
}
