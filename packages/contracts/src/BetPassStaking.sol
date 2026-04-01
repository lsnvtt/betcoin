// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable2Step.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @title BetPass Staking — Stake BETPASS, earn USDT from platform fees
/// @notice Revenue share: 25% of Treasury fees distributed to stakers
/// @dev Proportional distribution based on staked BETPASS balance
contract BetPassStaking is Ownable2Step, ReentrancyGuard {
    using SafeERC20 for IERC20;

    /// @notice BETPASS token
    IERC20 public immutable betPass;

    /// @notice USDT token (reward)
    IERC20 public immutable usdt;

    /// @notice Cooldown period for unstaking
    uint256 public constant UNSTAKE_COOLDOWN = 7 days;

    /// @notice Revenue share from Treasury (basis points)
    uint256 public revenueShareBps = 2500; // 25%

    /// @notice Accumulated reward per token (scaled by 1e18)
    uint256 public rewardPerTokenStored;

    /// @notice Total BETPASS staked
    uint256 public totalStaked;

    /// @notice Staker info
    struct StakerInfo {
        uint256 stakedAmount;
        uint256 rewardPerTokenPaid;
        uint256 pendingRewards;
        uint256 unstakeRequestedAt;
        uint256 unstakeAmount;
    }

    mapping(address => StakerInfo) public stakers;

    // --- Events ---

    event Staked(address indexed user, uint256 amount);
    event UnstakeRequested(address indexed user, uint256 amount, uint256 availableAt);
    event Unstaked(address indexed user, uint256 amount);
    event RewardsClaimed(address indexed user, uint256 amount);
    event RevenueDeposited(uint256 amount, uint256 rewardPerToken);
    event RevenueShareUpdated(uint256 newBps);

    // --- Errors ---

    error ZeroAmount();
    error InsufficientStake();
    error CooldownNotExpired();
    error NoUnstakeRequest();
    error NoPendingRewards();
    error FeeTooHigh();

    constructor(
        address _betPass,
        address _usdt,
        address _owner
    ) Ownable(_owner) {
        betPass = IERC20(_betPass);
        usdt = IERC20(_usdt);
    }

    // --- Core Functions ---

    /// @notice Stake BETPASS tokens to earn revenue share
    /// @param amount Amount of BETPASS to stake
    function stake(uint256 amount) external nonReentrant {
        if (amount == 0) revert ZeroAmount();

        _updateRewards(msg.sender);

        betPass.safeTransferFrom(msg.sender, address(this), amount);
        stakers[msg.sender].stakedAmount += amount;
        totalStaked += amount;

        emit Staked(msg.sender, amount);
    }

    /// @notice Request unstake (starts 7-day cooldown)
    /// @param amount Amount to unstake
    function requestUnstake(uint256 amount) external nonReentrant {
        if (amount == 0) revert ZeroAmount();
        StakerInfo storage info = stakers[msg.sender];
        if (amount > info.stakedAmount) revert InsufficientStake();

        _updateRewards(msg.sender);

        info.unstakeRequestedAt = block.timestamp;
        info.unstakeAmount = amount;

        emit UnstakeRequested(msg.sender, amount, block.timestamp + UNSTAKE_COOLDOWN);
    }

    /// @notice Execute unstake after cooldown
    function unstake() external nonReentrant {
        StakerInfo storage info = stakers[msg.sender];
        if (info.unstakeAmount == 0) revert NoUnstakeRequest();
        if (block.timestamp < info.unstakeRequestedAt + UNSTAKE_COOLDOWN) revert CooldownNotExpired();

        _updateRewards(msg.sender);

        uint256 amount = info.unstakeAmount;
        info.stakedAmount -= amount;
        totalStaked -= amount;
        info.unstakeAmount = 0;
        info.unstakeRequestedAt = 0;

        betPass.safeTransfer(msg.sender, amount);

        emit Unstaked(msg.sender, amount);
    }

    /// @notice Claim accumulated USDT rewards
    function claimRewards() external nonReentrant {
        _updateRewards(msg.sender);

        StakerInfo storage info = stakers[msg.sender];
        uint256 rewards = info.pendingRewards;
        if (rewards == 0) revert NoPendingRewards();

        info.pendingRewards = 0;
        usdt.safeTransfer(msg.sender, rewards);

        emit RewardsClaimed(msg.sender, rewards);
    }

    /// @notice Deposit revenue (called by Treasury or admin)
    /// @dev Distributes USDT proportionally to all stakers
    /// @param amount Amount of USDT to distribute
    function depositRevenue(uint256 amount) external {
        if (amount == 0) revert ZeroAmount();
        if (totalStaked == 0) {
            // No stakers, send to owner
            usdt.safeTransferFrom(msg.sender, owner(), amount);
            return;
        }

        usdt.safeTransferFrom(msg.sender, address(this), amount);
        rewardPerTokenStored += (amount * 1e18) / totalStaked;

        emit RevenueDeposited(amount, rewardPerTokenStored);
    }

    // --- Views ---

    /// @notice Get pending rewards for a staker
    function pendingRewards(address user) external view returns (uint256) {
        StakerInfo storage info = stakers[user];
        uint256 pending = info.pendingRewards;
        if (info.stakedAmount > 0) {
            pending += (info.stakedAmount * (rewardPerTokenStored - info.rewardPerTokenPaid)) / 1e18;
        }
        return pending;
    }

    /// @notice Get staker details
    function getStakerInfo(address user) external view returns (
        uint256 stakedAmount,
        uint256 pending,
        uint256 unstakeAvailableAt,
        uint256 unstakeAmount
    ) {
        StakerInfo storage info = stakers[user];
        stakedAmount = info.stakedAmount;
        pending = info.pendingRewards;
        if (info.stakedAmount > 0) {
            pending += (info.stakedAmount * (rewardPerTokenStored - info.rewardPerTokenPaid)) / 1e18;
        }
        unstakeAvailableAt = info.unstakeRequestedAt == 0 ? 0 : info.unstakeRequestedAt + UNSTAKE_COOLDOWN;
        unstakeAmount = info.unstakeAmount;
    }

    /// @notice APR estimate based on last deposit and total staked
    function estimatedAPR(uint256 lastDepositAmount, uint256 depositFrequencyDays) external view returns (uint256) {
        if (totalStaked == 0 || lastDepositAmount == 0 || depositFrequencyDays == 0) return 0;
        uint256 annualRevenue = (lastDepositAmount * 365) / depositFrequencyDays;
        return (annualRevenue * 10000) / totalStaked; // basis points
    }

    // --- Admin ---

    /// @notice Update revenue share percentage
    function setRevenueShareBps(uint256 _bps) external onlyOwner {
        if (_bps > 5000) revert FeeTooHigh(); // max 50%
        revenueShareBps = _bps;
        emit RevenueShareUpdated(_bps);
    }

    // --- Internal ---

    function _updateRewards(address user) internal {
        StakerInfo storage info = stakers[user];
        if (info.stakedAmount > 0) {
            info.pendingRewards += (info.stakedAmount * (rewardPerTokenStored - info.rewardPerTokenPaid)) / 1e18;
        }
        info.rewardPerTokenPaid = rewardPerTokenStored;
    }
}
