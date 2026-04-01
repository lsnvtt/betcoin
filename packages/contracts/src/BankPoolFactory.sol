// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable2Step.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./BankPool.sol";

/// @title BankPoolFactory
/// @notice Factory for deploying and registering BankPool instances
/// @dev Uses CREATE2 for deterministic pool addresses. Pools use USDT.
contract BankPoolFactory is Ownable2Step {
    using SafeERC20 for IERC20;

    /// @notice USDT token address
    address public immutable usdt;

    /// @notice Treasury contract address
    address public immutable treasury;

    /// @notice All deployed pools
    address[] public allPools;

    /// @notice Pools owned by a specific address
    mapping(address => address[]) public poolsByOwner;

    /// @notice Whether an address is a valid pool
    mapping(address => bool) public isPool;

    /// @notice Minimum initial deposit required to create a pool
    uint256 public minInitialDeposit;

    /// @notice Platform fee in basis points
    uint256 public platformFeeBps;

    // --- Events ---

    event PoolCreated(address indexed pool, address indexed poolOwner, uint256 initialDeposit);
    event MinInitialDepositChanged(uint256 newMinInitialDeposit);
    event PlatformFeeBpsChanged(uint256 newPlatformFeeBps);

    // --- Errors ---

    error ZeroAddress();
    error DepositBelowMinimum();
    error FeeTooHigh();

    /// @param _usdt USDT token address
    /// @param _treasury Treasury contract address
    /// @param _owner Factory owner address
    /// @param _minInitialDeposit Minimum initial deposit for pool creation
    /// @param _platformFeeBps Platform fee in basis points
    constructor(
        address _usdt,
        address _treasury,
        address _owner,
        uint256 _minInitialDeposit,
        uint256 _platformFeeBps
    ) Ownable(_owner) {
        if (_usdt == address(0) || _treasury == address(0)) revert ZeroAddress();
        usdt = _usdt;
        treasury = _treasury;
        minInitialDeposit = _minInitialDeposit;
        platformFeeBps = _platformFeeBps;
    }

    /// @notice Create a new BankPool
    /// @param initialDeposit Initial USDT deposit
    /// @param maxExposureBps Maximum exposure in basis points
    /// @param minBetAmount Minimum bet amount
    /// @param maxBetAmount Maximum bet amount
    /// @return pool Address of the new BankPool
    function createPool(
        uint256 initialDeposit,
        uint256 maxExposureBps,
        uint256 minBetAmount,
        uint256 maxBetAmount
    ) external returns (address pool) {
        if (initialDeposit < minInitialDeposit) revert DepositBelowMinimum();

        // Deploy via CREATE2 with sender + nonce as salt
        bytes32 salt = keccak256(abi.encodePacked(msg.sender, allPools.length));
        BankPool newPool = new BankPool{salt: salt}(
            msg.sender,
            usdt,
            address(this),
            maxExposureBps,
            minBetAmount,
            maxBetAmount
        );

        pool = address(newPool);
        allPools.push(pool);
        poolsByOwner[msg.sender].push(pool);
        isPool[pool] = true;

        // Transfer initial deposit from caller to pool and initialize
        IERC20(usdt).safeTransferFrom(msg.sender, pool, initialDeposit);
        newPool.initDeposit(initialDeposit);

        emit PoolCreated(pool, msg.sender, initialDeposit);
    }

    /// @notice Set minimum initial deposit
    /// @param _minInitialDeposit New minimum
    function setMinInitialDeposit(uint256 _minInitialDeposit) external onlyOwner {
        minInitialDeposit = _minInitialDeposit;
        emit MinInitialDepositChanged(_minInitialDeposit);
    }

    /// @notice Set platform fee basis points
    /// @param _platformFeeBps New fee (max 1000 = 10%)
    function setPlatformFeeBps(uint256 _platformFeeBps) external onlyOwner {
        if (_platformFeeBps > 1000) revert FeeTooHigh();
        platformFeeBps = _platformFeeBps;
        emit PlatformFeeBpsChanged(_platformFeeBps);
    }

    /// @notice Get all deployed pools
    /// @return Array of pool addresses
    function getAllPools() external view returns (address[] memory) {
        return allPools;
    }

    /// @notice Get pools by owner
    /// @param poolOwner Owner address
    /// @return Array of pool addresses
    function getPoolsByOwner(address poolOwner) external view returns (address[] memory) {
        return poolsByOwner[poolOwner];
    }

    /// @notice Get total number of pools
    /// @return Number of pools
    function totalPools() external view returns (uint256) {
        return allPools.length;
    }
}
