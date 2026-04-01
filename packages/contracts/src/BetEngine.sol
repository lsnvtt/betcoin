// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable2Step.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./BankPool.sol";

/// @title BetEngine
/// @notice Central betting engine for placing and settling bets
/// @dev Coordinates between bettors, BankPools, and Treasury. Uses USDT for all betting.
contract BetEngine is Ownable2Step {
    using SafeERC20 for IERC20;

    /// @notice Odds precision (10000 = 1x)
    uint256 public constant ODDS_PRECISION = 10_000;

    /// @notice Bet status enum
    enum BetStatus {
        Pending,
        Won,
        Lost,
        Cancelled,
        Refunded
    }

    /// @notice Bet struct
    struct Bet {
        address bettor;
        address pool;
        bytes32 eventId;
        bytes32 outcome;
        uint256 amount;
        uint256 odds;
        uint256 potentialPayout;
        BetStatus status;
        uint256 timestamp;
    }

    /// @notice USDT token
    IERC20 public immutable usdt;

    /// @notice Treasury address for platform fees
    address public immutable treasury;

    /// @notice BankPoolFactory for pool validation
    address public immutable factory;

    /// @notice Platform fee in basis points
    uint256 public platformFeeBps;

    /// @notice All bets indexed by ID
    mapping(uint256 => Bet) public bets;

    /// @notice Next bet ID
    uint256 public nextBetId;

    /// @notice Bets per event
    mapping(bytes32 => uint256[]) public eventBets;

    /// @notice Whether an event has been settled
    mapping(bytes32 => bool) public eventSettled;

    /// @notice Authorized oracle address
    address public oracle;

    // --- Events ---

    event BetPlaced(
        uint256 indexed betId,
        address indexed bettor,
        address indexed pool,
        bytes32 eventId,
        bytes32 outcome,
        uint256 amount,
        uint256 odds,
        uint256 potentialPayout
    );
    event BetSettled(uint256 indexed betId, BetStatus status, uint256 payout);
    event EventSettled(bytes32 indexed eventId, bytes32 winningOutcome);
    event EventCancelled(bytes32 indexed eventId);
    event OracleSet(address indexed oracle);
    event PlatformFeeBpsChanged(uint256 newFeeBps);

    // --- Errors ---

    error ZeroAmount();
    error InvalidPool();
    error EventAlreadySettled();
    error NotOracle();
    error FeeTooHigh();
    error ZeroAddress();
    error BetNotPending();
    error InvalidOdds();

    modifier onlyOracle() {
        if (msg.sender != oracle) revert NotOracle();
        _;
    }

    /// @param _usdt USDT token address
    /// @param _treasury Treasury address
    /// @param _factory BankPoolFactory address
    /// @param _platformFeeBps Platform fee in basis points
    constructor(
        address _usdt,
        address _treasury,
        address _factory,
        uint256 _platformFeeBps
    ) Ownable(msg.sender) {
        if (_usdt == address(0) || _treasury == address(0) || _factory == address(0)) {
            revert ZeroAddress();
        }
        usdt = IERC20(_usdt);
        treasury = _treasury;
        factory = _factory;
        platformFeeBps = _platformFeeBps;
    }

    /// @notice Set the oracle address
    /// @param _oracle New oracle address
    function setOracle(address _oracle) external onlyOwner {
        if (_oracle == address(0)) revert ZeroAddress();
        oracle = _oracle;
        emit OracleSet(_oracle);
    }

    /// @notice Set platform fee
    /// @param _platformFeeBps New fee in basis points
    function setPlatformFeeBps(uint256 _platformFeeBps) external onlyOwner {
        if (_platformFeeBps > 1000) revert FeeTooHigh();
        platformFeeBps = _platformFeeBps;
        emit PlatformFeeBpsChanged(_platformFeeBps);
    }

    /// @notice Place a bet
    /// @param pool BankPool address
    /// @param eventId Event identifier
    /// @param outcome Chosen outcome
    /// @param amount Bet amount in USDT
    /// @param odds Odds in ODDS_PRECISION units
    /// @return betId The placed bet ID
    function placeBet(
        address pool,
        bytes32 eventId,
        bytes32 outcome,
        uint256 amount,
        uint256 odds
    ) external returns (uint256 betId) {
        if (amount == 0) revert ZeroAmount();
        if (odds <= ODDS_PRECISION) revert InvalidOdds();
        if (eventSettled[eventId]) revert EventAlreadySettled();

        uint256 potentialPayout = (amount * odds) / ODDS_PRECISION;

        // Transfer USDT bet amount from bettor to this contract
        usdt.safeTransferFrom(msg.sender, address(this), amount);

        // Lock potential payout in the pool
        uint256 poolLiability = potentialPayout - amount;
        BankPool(pool).lockFunds(eventId, poolLiability);

        betId = nextBetId++;
        bets[betId] = Bet({
            bettor: msg.sender,
            pool: pool,
            eventId: eventId,
            outcome: outcome,
            amount: amount,
            odds: odds,
            potentialPayout: potentialPayout,
            status: BetStatus.Pending,
            timestamp: block.timestamp
        });

        eventBets[eventId].push(betId);

        emit BetPlaced(betId, msg.sender, pool, eventId, outcome, amount, odds, potentialPayout);
    }

    /// @notice Settle an event with a winning outcome
    /// @param eventId Event identifier
    /// @param winningOutcome The winning outcome
    function settleEvent(bytes32 eventId, bytes32 winningOutcome) external onlyOracle {
        if (eventSettled[eventId]) revert EventAlreadySettled();
        eventSettled[eventId] = true;

        uint256[] storage betIds = eventBets[eventId];
        for (uint256 i = 0; i < betIds.length; i++) {
            _settleBet(betIds[i], winningOutcome);
        }

        emit EventSettled(eventId, winningOutcome);
    }

    /// @notice Cancel an event and refund all bettors
    /// @param eventId Event identifier
    function cancelEvent(bytes32 eventId) external onlyOwner {
        if (eventSettled[eventId]) revert EventAlreadySettled();
        eventSettled[eventId] = true;

        uint256[] storage betIds = eventBets[eventId];
        for (uint256 i = 0; i < betIds.length; i++) {
            _refundBet(betIds[i]);
        }

        emit EventCancelled(eventId);
    }

    /// @notice Get bet details
    /// @param betId Bet identifier
    function getBet(uint256 betId) external view returns (Bet memory) {
        return bets[betId];
    }

    /// @notice Get all bet IDs for an event
    /// @param eventId Event identifier
    function getEventBets(bytes32 eventId) external view returns (uint256[] memory) {
        return eventBets[eventId];
    }

    // --- Internal ---

    function _settleBet(uint256 betId, bytes32 winningOutcome) internal {
        Bet storage bet = bets[betId];
        if (bet.status != BetStatus.Pending) return;

        uint256 poolLiability = bet.potentialPayout - bet.amount;

        if (bet.outcome == winningOutcome) {
            bet.status = BetStatus.Won;

            // Calculate fee
            uint256 fee = (bet.potentialPayout * platformFeeBps) / 10_000;
            uint256 payout = bet.potentialPayout - fee;

            // Send fee to treasury in USDT
            if (fee > 0) {
                usdt.safeTransfer(treasury, fee);
            }

            // Pay winner: pool pays its liability
            BankPool(bet.pool).payWinner(bet.bettor, bet.eventId, poolLiability, poolLiability);
            // Transfer the bettor's stake portion back (minus fee already taken)
            usdt.safeTransfer(bet.bettor, payout - poolLiability);

            emit BetSettled(betId, BetStatus.Won, payout);
        } else {
            bet.status = BetStatus.Lost;

            // Unlock funds in pool (bettor lost, pool keeps the liability)
            BankPool(bet.pool).unlockFunds(bet.eventId, poolLiability);

            // Transfer the bet amount to the pool
            usdt.safeTransfer(bet.pool, bet.amount);

            emit BetSettled(betId, BetStatus.Lost, 0);
        }
    }

    function _refundBet(uint256 betId) internal {
        Bet storage bet = bets[betId];
        if (bet.status != BetStatus.Pending) return;

        bet.status = BetStatus.Refunded;
        uint256 poolLiability = bet.potentialPayout - bet.amount;

        // Unlock pool funds
        BankPool(bet.pool).unlockFunds(bet.eventId, poolLiability);

        // Refund bettor in USDT
        usdt.safeTransfer(bet.bettor, bet.amount);

        emit BetSettled(betId, BetStatus.Refunded, bet.amount);
    }
}
