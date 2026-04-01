// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./VRFConsumer.sol";
import "./BankPool.sol";

/// @title Dice
/// @notice Dice game using Chainlink VRF for randomness
/// @dev Players bet over/under a target number (1-100). Uses USDT.
contract Dice is VRFConsumer {
    using SafeERC20 for IERC20;

    /// @notice House edge in basis points (2% = 200)
    uint256 public constant HOUSE_EDGE_BPS = 200;

    /// @notice USDT token
    IERC20 public immutable usdt;

    /// @notice Game data per VRF request
    struct Game {
        address player;
        address pool;
        uint256 betAmount;
        uint8 targetNumber;
        bool isOver;
        bool resolved;
        uint8 result;
        uint256 odds;
    }

    /// @notice Games indexed by VRF requestId
    mapping(uint256 => Game) public games;

    // --- Events ---

    event GameStarted(
        uint256 indexed requestId,
        address indexed player,
        address pool,
        uint256 amount,
        uint8 targetNumber,
        bool isOver,
        uint256 odds
    );
    event GameResolved(
        uint256 indexed requestId,
        address indexed player,
        uint8 result,
        bool won,
        uint256 payout
    );

    // --- Errors ---

    error InvalidTarget();
    error ZeroAmount();
    error GameNotFound();
    error GameAlreadyResolved();

    /// @param _vrfCoordinator VRF Coordinator address
    /// @param _keyHash VRF key hash
    /// @param _subscriptionId VRF subscription ID
    /// @param _callbackGasLimit Callback gas limit
    /// @param _requestConfirmations Request confirmations
    /// @param _usdt USDT token address
    constructor(
        address _vrfCoordinator,
        bytes32 _keyHash,
        uint256 _subscriptionId,
        uint32 _callbackGasLimit,
        uint16 _requestConfirmations,
        address _usdt
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
    }

    /// @notice Calculate odds for a given target and direction
    /// @param targetNumber Target number (1-99)
    /// @param isOver True = over, false = under
    /// @return odds Odds in 10000-based precision
    function calculateOdds(uint8 targetNumber, bool isOver) public pure returns (uint256 odds) {
        uint256 probability;
        if (isOver) {
            // Wins if result > targetNumber, result is 1-100
            probability = 100 - targetNumber;
        } else {
            // Wins if result < targetNumber, result is 1-100
            probability = targetNumber - 1;
        }
        // odds = (100 - houseEdge%) / probability * PRECISION
        // houseEdge = 2%, so multiplier = 98
        odds = (98 * 10_000) / probability;
    }

    /// @notice Start a dice game
    /// @param pool BankPool for liquidity
    /// @param betAmount Bet amount in USDT
    /// @param targetNumber Target number (2-99 for over, 2-99 for under)
    /// @param isOver True to bet over, false to bet under
    /// @return requestId VRF request ID
    function play(
        address pool,
        uint256 betAmount,
        uint8 targetNumber,
        bool isOver
    ) external returns (uint256 requestId) {
        if (betAmount == 0) revert ZeroAmount();
        // For over: target must be 1-98 (so probability 2-99)
        // For under: target must be 2-99 (so probability 1-98)
        if (isOver && (targetNumber < 1 || targetNumber > 98)) revert InvalidTarget();
        if (!isOver && (targetNumber < 2 || targetNumber > 99)) revert InvalidTarget();

        uint256 odds = calculateOdds(targetNumber, isOver);
        uint256 potentialPayout = (betAmount * odds) / 10_000;
        uint256 poolLiability = potentialPayout - betAmount;

        // Transfer USDT bet from player
        usdt.safeTransferFrom(msg.sender, address(this), betAmount);

        // Lock funds in pool
        bytes32 eventId = keccak256(abi.encodePacked("dice", block.timestamp, msg.sender, betAmount, targetNumber, isOver));
        BankPool(pool).lockFunds(eventId, poolLiability);

        // Request VRF
        requestId = _requestRandomness(1);

        games[requestId] = Game({
            player: msg.sender,
            pool: pool,
            betAmount: betAmount,
            targetNumber: targetNumber,
            isOver: isOver,
            resolved: false,
            result: 0,
            odds: odds
        });

        emit GameStarted(requestId, msg.sender, pool, betAmount, targetNumber, isOver, odds);
    }

    /// @notice VRF callback to resolve the game
    /// @param requestId VRF request ID
    /// @param randomWords Random values from VRF
    function fulfillRandomWords(uint256 requestId, uint256[] calldata randomWords) internal override {
        Game storage game = games[requestId];
        if (game.player == address(0)) revert GameNotFound();
        if (game.resolved) revert GameAlreadyResolved();

        game.resolved = true;
        // Result is 1-100
        game.result = uint8((randomWords[0] % 100) + 1);

        bool won;
        if (game.isOver) {
            won = game.result > game.targetNumber;
        } else {
            won = game.result < game.targetNumber;
        }

        bytes32 eventId = keccak256(abi.encodePacked("dice", block.timestamp, game.player, game.betAmount, game.targetNumber, game.isOver));
        uint256 potentialPayout = (game.betAmount * game.odds) / 10_000;
        uint256 poolLiability = potentialPayout - game.betAmount;

        if (won) {
            BankPool(game.pool).payWinner(game.player, eventId, poolLiability, poolLiability);
            usdt.safeTransfer(game.player, game.betAmount);
            emit GameResolved(requestId, game.player, game.result, true, potentialPayout);
        } else {
            BankPool(game.pool).unlockFunds(eventId, poolLiability);
            usdt.safeTransfer(game.pool, game.betAmount);
            emit GameResolved(requestId, game.player, game.result, false, 0);
        }
    }
}
