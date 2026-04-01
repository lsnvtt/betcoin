// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/BetEngine.sol";
import "../src/BankPool.sol";
import "../src/MockUSDT.sol";

contract BetEngineTest is Test {
    BetEngine public engine;
    BankPool public pool;
    MockUSDT public usdt;
    address public owner;
    address public oracle;
    address public bettor;
    address public poolOwner;
    address public treasury;
    address public factory;

    uint256 constant USDT_1 = 1e6; // 1 USDT = 1e6 (6 decimals)

    function setUp() public {
        owner = address(this);
        oracle = makeAddr("oracle");
        bettor = makeAddr("bettor");
        poolOwner = makeAddr("poolOwner");
        treasury = makeAddr("treasury");
        factory = makeAddr("factory");

        usdt = new MockUSDT();

        engine = new BetEngine(
            address(usdt),
            treasury,
            factory,
            200 // 2% fee
        );

        engine.setOracle(oracle);

        // Create pool
        pool = new BankPool(
            poolOwner,
            address(usdt),
            factory,
            5000, // 50% max exposure
            1 * USDT_1,
            1000 * USDT_1
        );

        // Set engine as bet engine on pool
        vm.prank(poolOwner);
        pool.setBetEngine(address(engine));

        // Fund pool
        usdt.faucetTo(poolOwner, 10_000 * USDT_1);
        vm.startPrank(poolOwner);
        usdt.approve(address(pool), type(uint256).max);
        pool.deposit(10_000 * USDT_1);
        vm.stopPrank();

        // Fund bettor
        usdt.faucetTo(bettor, 5_000 * USDT_1);
        vm.prank(bettor);
        usdt.approve(address(engine), type(uint256).max);
    }

    function test_PlaceBet() public {
        bytes32 eventId = keccak256("match1");
        bytes32 outcome = keccak256("teamA");

        vm.prank(bettor);
        uint256 betId = engine.placeBet(address(pool), eventId, outcome, 100 * USDT_1, 20_000);

        assertEq(betId, 0);
        BetEngine.Bet memory bet = engine.getBet(betId);
        assertEq(bet.bettor, bettor);
        assertEq(bet.pool, address(pool));
        assertEq(bet.eventId, eventId);
        assertEq(bet.outcome, outcome);
        assertEq(bet.amount, 100 * USDT_1);
        assertEq(bet.odds, 20_000);
        assertEq(bet.potentialPayout, 200 * USDT_1);
        assertEq(uint8(bet.status), uint8(BetEngine.BetStatus.Pending));
    }

    function test_PlaceBetRevertsZeroAmount() public {
        vm.prank(bettor);
        vm.expectRevert(BetEngine.ZeroAmount.selector);
        engine.placeBet(address(pool), keccak256("e"), keccak256("o"), 0, 20_000);
    }

    function test_PlaceBetRevertsInvalidOdds() public {
        vm.prank(bettor);
        vm.expectRevert(BetEngine.InvalidOdds.selector);
        engine.placeBet(address(pool), keccak256("e"), keccak256("o"), 100 * USDT_1, 10_000);
    }

    function test_SettleEventWin() public {
        bytes32 eventId = keccak256("match1");
        bytes32 outcome = keccak256("teamA");

        vm.prank(bettor);
        engine.placeBet(address(pool), eventId, outcome, 100 * USDT_1, 20_000);

        vm.prank(oracle);
        engine.settleEvent(eventId, outcome);

        BetEngine.Bet memory bet = engine.getBet(0);
        assertEq(uint8(bet.status), uint8(BetEngine.BetStatus.Won));
        assertTrue(engine.eventSettled(eventId));
    }

    function test_SettleEventLose() public {
        bytes32 eventId = keccak256("match1");
        bytes32 outcomeA = keccak256("teamA");
        bytes32 outcomeB = keccak256("teamB");

        vm.prank(bettor);
        engine.placeBet(address(pool), eventId, outcomeA, 100 * USDT_1, 20_000);

        vm.prank(oracle);
        engine.settleEvent(eventId, outcomeB);

        BetEngine.Bet memory bet = engine.getBet(0);
        assertEq(uint8(bet.status), uint8(BetEngine.BetStatus.Lost));
    }

    function test_SettleEventRevertsNotOracle() public {
        bytes32 eventId = keccak256("match1");
        vm.prank(bettor);
        vm.expectRevert(BetEngine.NotOracle.selector);
        engine.settleEvent(eventId, keccak256("teamA"));
    }

    function test_SettleEventRevertsAlreadySettled() public {
        bytes32 eventId = keccak256("match1");

        vm.prank(bettor);
        engine.placeBet(address(pool), eventId, keccak256("teamA"), 100 * USDT_1, 20_000);

        vm.prank(oracle);
        engine.settleEvent(eventId, keccak256("teamA"));

        vm.prank(oracle);
        vm.expectRevert(BetEngine.EventAlreadySettled.selector);
        engine.settleEvent(eventId, keccak256("teamA"));
    }

    function test_CancelEvent() public {
        bytes32 eventId = keccak256("match1");

        vm.prank(bettor);
        engine.placeBet(address(pool), eventId, keccak256("teamA"), 100 * USDT_1, 20_000);

        uint256 bettorBalBefore = usdt.balanceOf(bettor);

        engine.cancelEvent(eventId);

        BetEngine.Bet memory bet = engine.getBet(0);
        assertEq(uint8(bet.status), uint8(BetEngine.BetStatus.Refunded));
        assertEq(usdt.balanceOf(bettor) - bettorBalBefore, 100 * USDT_1);
    }

    function test_CancelEventRevertsAlreadySettled() public {
        bytes32 eventId = keccak256("match1");

        vm.prank(bettor);
        engine.placeBet(address(pool), eventId, keccak256("teamA"), 100 * USDT_1, 20_000);

        vm.prank(oracle);
        engine.settleEvent(eventId, keccak256("teamA"));

        vm.expectRevert(BetEngine.EventAlreadySettled.selector);
        engine.cancelEvent(eventId);
    }

    function test_SetOracle() public {
        address newOracle = makeAddr("newOracle");
        engine.setOracle(newOracle);
        assertEq(engine.oracle(), newOracle);
    }

    function test_SetOracleRevertsZeroAddress() public {
        vm.expectRevert(BetEngine.ZeroAddress.selector);
        engine.setOracle(address(0));
    }

    function test_SetPlatformFeeBps() public {
        engine.setPlatformFeeBps(500);
        assertEq(engine.platformFeeBps(), 500);
    }

    function test_SetPlatformFeeBpsRevertsTooHigh() public {
        vm.expectRevert(BetEngine.FeeTooHigh.selector);
        engine.setPlatformFeeBps(1001);
    }

    function test_GetEventBets() public {
        bytes32 eventId = keccak256("match1");

        vm.startPrank(bettor);
        engine.placeBet(address(pool), eventId, keccak256("teamA"), 100 * USDT_1, 20_000);
        engine.placeBet(address(pool), eventId, keccak256("teamB"), 50 * USDT_1, 30_000);
        vm.stopPrank();

        uint256[] memory betIds = engine.getEventBets(eventId);
        assertEq(betIds.length, 2);
    }
}
