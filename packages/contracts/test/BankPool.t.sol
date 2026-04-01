// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/BankPool.sol";
import "../src/MockUSDT.sol";

contract BankPoolTest is Test {
    BankPool public pool;
    MockUSDT public usdt;
    address public poolOwner;
    address public betEngine;
    address public factory;
    address public user;

    uint256 constant USDT_1 = 1e6;

    function setUp() public {
        poolOwner = makeAddr("poolOwner");
        betEngine = makeAddr("betEngine");
        factory = makeAddr("factory");
        user = makeAddr("user");

        usdt = new MockUSDT();

        pool = new BankPool(
            poolOwner,
            address(usdt),
            factory,
            5000, // 50% max exposure
            1 * USDT_1,
            1000 * USDT_1
        );

        // Setup: owner sets bet engine
        vm.prank(poolOwner);
        pool.setBetEngine(betEngine);

        // Fund pool owner
        usdt.faucetTo(poolOwner, 100_000 * USDT_1);
        vm.prank(poolOwner);
        usdt.approve(address(pool), type(uint256).max);
    }

    function test_Constructor() public view {
        assertEq(pool.owner(), poolOwner);
        assertEq(address(pool.usdt()), address(usdt));
        assertEq(pool.factory(), factory);
        assertEq(pool.maxExposureBps(), 5000);
        assertEq(pool.minBetAmount(), 1 * USDT_1);
        assertEq(pool.maxBetAmount(), 1000 * USDT_1);
        assertTrue(pool.active());
    }

    function test_Deposit() public {
        vm.prank(poolOwner);
        pool.deposit(1000 * USDT_1);

        assertEq(pool.totalDeposited(), 1000 * USDT_1);
        assertEq(usdt.balanceOf(address(pool)), 1000 * USDT_1);
    }

    function test_DepositRevertsNotOwner() public {
        vm.prank(user);
        vm.expectRevert(BankPool.NotOwner.selector);
        pool.deposit(1000 * USDT_1);
    }

    function test_DepositRevertsZeroAmount() public {
        vm.prank(poolOwner);
        vm.expectRevert(BankPool.ZeroAmount.selector);
        pool.deposit(0);
    }

    function test_Withdraw() public {
        vm.startPrank(poolOwner);
        pool.deposit(1000 * USDT_1);

        uint256 balBefore = usdt.balanceOf(poolOwner);
        pool.withdraw(500 * USDT_1);
        uint256 balAfter = usdt.balanceOf(poolOwner);

        assertEq(pool.totalDeposited(), 500 * USDT_1);
        assertEq(balAfter - balBefore, 500 * USDT_1);
        vm.stopPrank();
    }

    function test_WithdrawRevertsInsufficientLiquidity() public {
        vm.startPrank(poolOwner);
        pool.deposit(1000 * USDT_1);
        vm.stopPrank();

        // Lock some funds
        bytes32 eventId = keccak256("event1");
        vm.prank(betEngine);
        pool.lockFunds(eventId, 400 * USDT_1);

        // Try to withdraw more than available (1000 - 400 = 600 available)
        vm.prank(poolOwner);
        vm.expectRevert(BankPool.InsufficientAvailableLiquidity.selector);
        pool.withdraw(700 * USDT_1);
    }

    function test_SetActive() public {
        vm.prank(poolOwner);
        pool.setActive(false);
        assertFalse(pool.active());
    }

    function test_SetMaxExposure() public {
        vm.prank(poolOwner);
        pool.setMaxExposure(8000);
        assertEq(pool.maxExposureBps(), 8000);
    }

    function test_SetBetLimits() public {
        vm.prank(poolOwner);
        pool.setBetLimits(5 * USDT_1, 500 * USDT_1);
        assertEq(pool.minBetAmount(), 5 * USDT_1);
        assertEq(pool.maxBetAmount(), 500 * USDT_1);
    }

    function test_SetBetLimitsRevertsInvalid() public {
        vm.prank(poolOwner);
        vm.expectRevert(BankPool.InvalidBetLimits.selector);
        pool.setBetLimits(500 * USDT_1, 5 * USDT_1);
    }

    function test_LockFunds() public {
        vm.prank(poolOwner);
        pool.deposit(1000 * USDT_1);

        bytes32 eventId = keccak256("event1");
        vm.prank(betEngine);
        pool.lockFunds(eventId, 400 * USDT_1);

        assertEq(pool.totalLockedInBets(), 400 * USDT_1);
        assertEq(pool.getExposure(eventId), 400 * USDT_1);
        assertEq(pool.availableLiquidity(), 600 * USDT_1);
    }

    function test_LockFundsRevertsNotBetEngine() public {
        vm.prank(poolOwner);
        pool.deposit(1000 * USDT_1);

        vm.prank(user);
        vm.expectRevert(BankPool.NotBetEngine.selector);
        pool.lockFunds(keccak256("event1"), 100 * USDT_1);
    }

    function test_LockFundsRevertsWhenInactive() public {
        vm.startPrank(poolOwner);
        pool.deposit(1000 * USDT_1);
        pool.setActive(false);
        vm.stopPrank();

        vm.prank(betEngine);
        vm.expectRevert(BankPool.PoolNotActive.selector);
        pool.lockFunds(keccak256("event1"), 100 * USDT_1);
    }

    function test_LockFundsRevertsExposureLimit() public {
        vm.prank(poolOwner);
        pool.deposit(1000 * USDT_1);

        // Max exposure is 50% = 500 USDT
        vm.prank(betEngine);
        vm.expectRevert(BankPool.ExposureLimitExceeded.selector);
        pool.lockFunds(keccak256("event1"), 600 * USDT_1);
    }

    function test_UnlockFunds() public {
        vm.prank(poolOwner);
        pool.deposit(1000 * USDT_1);

        bytes32 eventId = keccak256("event1");
        vm.startPrank(betEngine);
        pool.lockFunds(eventId, 400 * USDT_1);
        pool.unlockFunds(eventId, 400 * USDT_1);
        vm.stopPrank();

        assertEq(pool.totalLockedInBets(), 0);
        assertEq(pool.getExposure(eventId), 0);
    }

    function test_PayWinner() public {
        vm.prank(poolOwner);
        pool.deposit(1000 * USDT_1);

        bytes32 eventId = keccak256("event1");
        vm.startPrank(betEngine);
        pool.lockFunds(eventId, 400 * USDT_1);
        pool.payWinner(user, eventId, 400 * USDT_1, 400 * USDT_1);
        vm.stopPrank();

        assertEq(pool.totalLockedInBets(), 0);
        assertEq(usdt.balanceOf(user), 400 * USDT_1);
    }

    function test_AvailableLiquidity() public {
        vm.prank(poolOwner);
        pool.deposit(1000 * USDT_1);

        assertEq(pool.availableLiquidity(), 1000 * USDT_1);

        vm.prank(betEngine);
        pool.lockFunds(keccak256("event1"), 300 * USDT_1);

        assertEq(pool.availableLiquidity(), 700 * USDT_1);
    }

    function test_SetBetEngine() public {
        address newEngine = makeAddr("newEngine");
        vm.prank(poolOwner);
        pool.setBetEngine(newEngine);
        assertEq(pool.betEngine(), newEngine);
    }

    function test_WithdrawRevertsNotOwner() public {
        vm.prank(user);
        vm.expectRevert(BankPool.NotOwner.selector);
        pool.withdraw(100 * USDT_1);
    }
}
