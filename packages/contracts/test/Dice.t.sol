// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/Dice.sol";
import "../src/BankPool.sol";
import "../src/MockUSDT.sol";

contract DiceTest is Test {
    Dice public dice;
    BankPool public pool;
    MockUSDT public usdt;
    address public owner;
    address public player;
    address public poolOwner;
    address public vrfCoordinator;
    address public factory;

    bytes32 constant KEY_HASH = keccak256("keyHash");
    uint256 constant SUB_ID = 1;
    uint256 constant USDT_1 = 1e6;

    function setUp() public {
        owner = address(this);
        player = makeAddr("player");
        poolOwner = makeAddr("poolOwner");
        vrfCoordinator = makeAddr("vrfCoordinator");
        factory = makeAddr("factory");

        usdt = new MockUSDT();

        dice = new Dice(
            vrfCoordinator,
            KEY_HASH,
            SUB_ID,
            200_000,
            3,
            address(usdt)
        );

        // Create pool
        pool = new BankPool(poolOwner, address(usdt), factory, 8000, 1 * USDT_1, 1000 * USDT_1);

        // Set dice as bet engine on pool
        vm.prank(poolOwner);
        pool.setBetEngine(address(dice));

        // Fund pool
        usdt.faucetTo(poolOwner, 50_000 * USDT_1);
        vm.startPrank(poolOwner);
        usdt.approve(address(pool), type(uint256).max);
        pool.deposit(50_000 * USDT_1);
        vm.stopPrank();

        // Fund player
        usdt.faucetTo(player, 5_000 * USDT_1);
        vm.prank(player);
        usdt.approve(address(dice), type(uint256).max);
    }

    function test_CalculateOddsOver50() public view {
        uint256 odds = dice.calculateOdds(50, true);
        assertEq(odds, 19_600);
    }

    function test_CalculateOddsUnder50() public view {
        uint256 odds = dice.calculateOdds(50, false);
        assertEq(odds, 20_000);
    }

    function test_CalculateOddsOver95() public view {
        uint256 odds = dice.calculateOdds(95, true);
        assertEq(odds, 196_000);
    }

    function test_CalculateOddsUnder5() public view {
        uint256 odds = dice.calculateOdds(5, false);
        assertEq(odds, 245_000);
    }

    function test_PlayRevertsZeroAmount() public {
        vm.prank(player);
        vm.expectRevert(Dice.ZeroAmount.selector);
        dice.play(address(pool), 0, 50, true);
    }

    function test_PlayRevertsInvalidTargetOverTooHigh() public {
        vm.prank(player);
        vm.expectRevert(Dice.InvalidTarget.selector);
        dice.play(address(pool), 100 * USDT_1, 99, true);
    }

    function test_PlayRevertsInvalidTargetUnderTooLow() public {
        vm.prank(player);
        vm.expectRevert(Dice.InvalidTarget.selector);
        dice.play(address(pool), 100 * USDT_1, 1, false);
    }

    function test_PlayOver() public {
        vm.mockCall(
            vrfCoordinator,
            abi.encodeWithSelector(IVRFCoordinatorV2Plus.requestRandomWords.selector),
            abi.encode(uint256(1))
        );

        vm.prank(player);
        uint256 requestId = dice.play(address(pool), 100 * USDT_1, 50, true);
        assertEq(requestId, 1);

        (
            address gamePlayer,
            address gamePool,
            uint256 betAmount,
            uint8 targetNumber,
            bool isOver,
            bool resolved,
            ,
        ) = dice.games(requestId);

        assertEq(gamePlayer, player);
        assertEq(gamePool, address(pool));
        assertEq(betAmount, 100 * USDT_1);
        assertEq(targetNumber, 50);
        assertTrue(isOver);
        assertFalse(resolved);
    }

    function test_PlayUnder() public {
        vm.mockCall(
            vrfCoordinator,
            abi.encodeWithSelector(IVRFCoordinatorV2Plus.requestRandomWords.selector),
            abi.encode(uint256(1))
        );

        vm.prank(player);
        uint256 requestId = dice.play(address(pool), 100 * USDT_1, 50, false);
        assertEq(requestId, 1);

        (, , , , bool isOver, , , ) = dice.games(requestId);
        assertFalse(isOver);
    }

    function test_Constants() public view {
        assertEq(dice.HOUSE_EDGE_BPS(), 200);
    }

    function test_OddsReflectHouseEdge() public view {
        uint256 odds = dice.calculateOdds(50, true);
        assertEq(odds, 19_600);
    }
}
