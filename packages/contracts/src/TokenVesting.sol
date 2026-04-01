// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/// @title TokenVesting — Linear vesting with cliff
/// @notice Locks tokens and releases linearly after cliff period
/// @dev Used for team and advisor BETPASS allocations
contract TokenVesting {
    using SafeERC20 for IERC20;

    struct VestingSchedule {
        uint256 totalAmount;
        uint256 released;
        uint256 startTime;
        uint256 cliffDuration;
        uint256 vestingDuration;
        bool revoked;
    }

    IERC20 public immutable token;
    address public immutable owner;

    mapping(address => VestingSchedule) public schedules;
    address[] public beneficiaries;

    event VestingCreated(address indexed beneficiary, uint256 amount, uint256 cliff, uint256 duration);
    event TokensReleased(address indexed beneficiary, uint256 amount);
    event VestingRevoked(address indexed beneficiary, uint256 returned);

    error NotOwner();
    error ZeroAddress();
    error ZeroAmount();
    error AlreadyHasSchedule();
    error NoSchedule();
    error NothingToRelease();
    error AlreadyRevoked();

    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    constructor(address _token, address _owner) {
        if (_token == address(0) || _owner == address(0)) revert ZeroAddress();
        token = IERC20(_token);
        owner = _owner;
    }

    /// @notice Create a vesting schedule for a beneficiary
    /// @param beneficiary Address that will receive vested tokens
    /// @param amount Total tokens to vest
    /// @param cliffDuration Time before any tokens are claimable (e.g. 6 months)
    /// @param vestingDuration Total vesting period (e.g. 24 months)
    function createSchedule(
        address beneficiary,
        uint256 amount,
        uint256 cliffDuration,
        uint256 vestingDuration
    ) external onlyOwner {
        if (beneficiary == address(0)) revert ZeroAddress();
        if (amount == 0) revert ZeroAmount();
        if (schedules[beneficiary].totalAmount > 0) revert AlreadyHasSchedule();

        token.safeTransferFrom(msg.sender, address(this), amount);

        schedules[beneficiary] = VestingSchedule({
            totalAmount: amount,
            released: 0,
            startTime: block.timestamp,
            cliffDuration: cliffDuration,
            vestingDuration: vestingDuration,
            revoked: false
        });

        beneficiaries.push(beneficiary);

        emit VestingCreated(beneficiary, amount, cliffDuration, vestingDuration);
    }

    /// @notice Release vested tokens to the beneficiary
    function release() external {
        VestingSchedule storage schedule = schedules[msg.sender];
        if (schedule.totalAmount == 0) revert NoSchedule();

        uint256 releasable = _releasableAmount(schedule);
        if (releasable == 0) revert NothingToRelease();

        schedule.released += releasable;
        token.safeTransfer(msg.sender, releasable);

        emit TokensReleased(msg.sender, releasable);
    }

    /// @notice Revoke vesting (owner only) — returns unvested tokens to owner
    function revoke(address beneficiary) external onlyOwner {
        VestingSchedule storage schedule = schedules[beneficiary];
        if (schedule.totalAmount == 0) revert NoSchedule();
        if (schedule.revoked) revert AlreadyRevoked();

        uint256 vested = _vestedAmount(schedule);
        uint256 unreleased = vested - schedule.released;
        uint256 refund = schedule.totalAmount - vested;

        schedule.revoked = true;

        // Send vested but unclaimed to beneficiary
        if (unreleased > 0) {
            schedule.released += unreleased;
            token.safeTransfer(beneficiary, unreleased);
        }

        // Return unvested to owner
        if (refund > 0) {
            token.safeTransfer(owner, refund);
        }

        emit VestingRevoked(beneficiary, refund);
    }

    // --- Views ---

    /// @notice Get releasable amount for an address
    function releasable(address beneficiary) external view returns (uint256) {
        return _releasableAmount(schedules[beneficiary]);
    }

    /// @notice Get total vested amount for an address
    function vested(address beneficiary) external view returns (uint256) {
        return _vestedAmount(schedules[beneficiary]);
    }

    /// @notice Get all beneficiaries
    function getBeneficiaries() external view returns (address[] memory) {
        return beneficiaries;
    }

    // --- Internal ---

    function _releasableAmount(VestingSchedule storage schedule) internal view returns (uint256) {
        if (schedule.revoked) return 0;
        return _vestedAmount(schedule) - schedule.released;
    }

    function _vestedAmount(VestingSchedule storage schedule) internal view returns (uint256) {
        if (block.timestamp < schedule.startTime + schedule.cliffDuration) {
            return 0; // Still in cliff
        }

        uint256 elapsed = block.timestamp - schedule.startTime;
        if (elapsed >= schedule.vestingDuration) {
            return schedule.totalAmount; // Fully vested
        }

        return (schedule.totalAmount * elapsed) / schedule.vestingDuration;
    }
}
