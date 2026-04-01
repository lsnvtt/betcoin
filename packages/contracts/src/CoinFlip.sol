// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./VRFConsumer.sol";
import "./BankPool.sol";
import "./BetEngine.sol";

/// @title CoinFlip
/// @notice Coin flip game using Chainlink VRF for randomness
/// @dev Players choose heads (0) or tails (1), VRF determines result. Uses USDT.
contract CoinFlip is VRFConsumer {
    using SafeERC20 for IERC20;

    /// @notice Payout multiplier in basis points (1.96x = 19600 bps on 10000 base)
    uint256 public constant PAYOUT_BPS = 19_600;

    /// @notice USDT token
    IERC20 public immutable usdt;

    /// @notice BetEngine for placing bets
    BetEngine public immutable betEngine;

    /// @notice Game data per VRF request
    struct Game {
        address player;
        address pool;
        uint256 betAmount;
        uint8 chosenSide; // 0 = heads, 1 = tails
        bool resolved;
        uint8 result;
        uint256 betId;
    }

    /// @notice Games indexed by VRF requestId
    mapping(uint256 => Game) public games;

    // --- Events ---

    event GameStarted(uint256 indexed requestId, address indexed player, address pool, uint256 amount, uint8 chosenSide);
    event GameResolved(uint256 indexed requestId, address indexed player, uint8 result, bool won, uint256 payout);

    // --- Errors ---

    error InvalidSide();
    error GameNotFound();
    error GameAlreadyResolved();
    error ZeroAmount();

    /// @param _vrfCoordinator VRF Coordinator address
    /// @param _keyHash VRF key hash
    /// @param _subscriptionId VRF subscription ID
    /// @param _callbackGasLimit Callback gas limit
    /// @param _requestConfirmations Request confirmations
    /// @param _usdt USDT token address
    /// @param _betEngine BetEngine address
    constructor(
        address _vrfCoordinator,
        bytes32 _keyHash,
        uint256 _subscriptionId,
        uint32 _callbackGasLimit,
        uint16 _requestConfirmations,
        address _usdt,
        address _betEngine
    )
        VRFConsumer(
            _vrfCoordinator,
            _keyHash,
            _subscriptionId,
            _callbackGasLimit,
            _requestConfirmations
        )
    {
        usdt = IERC20(_usdt);
        betEngine = BetEngine(_betEngine);
    }

    /// @notice Start a coin flip game
    /// @param pool BankPool to use for liquidity
    /// @param betAmount Amount to bet in USDT
    /// @param chosenSide 0 for heads, 1 for tails
    /// @return requestId VRF request ID
    function play(address pool, uint256 betAmount, uint8 chosenSide) external returns (uint256 requestId) {
        if (betAmount == 0) revert ZeroAmount();
        if (chosenSide > 1) revert InvalidSide();

        // Transfer USDT bet from player to this contract
        usdt.safeTransferFrom(msg.sender, address(this), betAmount);

        // Calculate potential payout and lock in pool
        uint256 potentialPayout = (betAmount * PAYOUT_BPS) / 10_000;
        uint256 poolLiability = potentialPayout - betAmount;

        // Lock funds in pool
        bytes32 eventId = keccak256(abi.encodePacked("coinflip", block.timestamp, msg.sender, betAmount));
        BankPool(pool).lockFunds(eventId, poolLiability);

        // Request VRF
        requestId = _requestRandomness(1);

        games[requestId] = Game({
            player: msg.sender,
            pool: pool,
            betAmount: betAmount,
            chosenSide: chosenSide,
            resolved: false,
            result: 0,
            betId: 0
        });

        emit GameStarted(requestId, msg.sender, pool, betAmount, chosenSide);
    }

    /// @notice VRF callback to resolve the game
    /// @param requestId VRF request ID
    /// @param randomWords Random values from VRF
    function fulfillRandomWords(uint256 requestId, uint256[] calldata randomWords) internal override {
        Game storage game = games[requestId];
        if (game.player == address(0)) revert GameNotFound();
        if (game.resolved) revert GameAlreadyResolved();

        game.resolved = true;
        game.result = uint8(randomWords[0] % 2);

        bytes32 eventId = keccak256(abi.encodePacked("coinflip", block.timestamp, game.player, game.betAmount));
        uint256 potentialPayout = (game.betAmount * PAYOUT_BPS) / 10_000;
        uint256 poolLiability = potentialPayout - game.betAmount;

        if (game.result == game.chosenSide) {
            // Player wins
            BankPool(game.pool).payWinner(game.player, eventId, poolLiability, poolLiability);
            usdt.safeTransfer(game.player, game.betAmount);
            emit GameResolved(requestId, game.player, game.result, true, potentialPayout);
        } else {
            // Player loses
            BankPool(game.pool).unlockFunds(eventId, poolLiability);
            usdt.safeTransfer(game.pool, game.betAmount);
            emit GameResolved(requestId, game.player, game.result, false, 0);
        }
    }
}
