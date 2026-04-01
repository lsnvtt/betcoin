// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/Treasury.sol";
import "../src/MockUSDT.sol";

contract TreasuryTest is Test {
    Treasury public treasury;
    MockUSDT public usdt;
    address public owner;
    address public recipient;

    uint256 constant USDT_1 = 1e6;

    function setUp() public {
        owner = makeAddr("owner");
        recipient = makeAddr("recipient");

        usdt = new MockUSDT();

        vm.startPrank(owner);
        treasury = new Treasury(address(usdt), owner);
        vm.stopPrank();

        // Fund treasury
        usdt.faucetTo(address(treasury), 10_000 * USDT_1);
    }

    function test_Constructor() public view {
        assertEq(address(treasury.usdt()), address(usdt));
        assertEq(treasury.owner(), owner);
    }

    function test_ConstructorRevertsZeroAddress() public {
        vm.prank(owner);
        vm.expectRevert(Treasury.ZeroAddress.selector);
        new Treasury(address(0), owner);
    }

    function test_QueueWithdrawal() public {
        vm.prank(owner);
        uint256 id = treasury.queueWithdrawal(recipient, 100 * USDT_1);

        assertEq(id, 0);
        (address to, uint256 amount, uint256 executeAfter, bool executed, bool cancelled) = treasury.withdrawals(id);
        assertEq(to, recipient);
        assertEq(amount, 100 * USDT_1);
        assertEq(executeAfter, block.timestamp + 48 hours);
        assertFalse(executed);
        assertFalse(cancelled);
    }

    function test_QueueWithdrawalRevertsZeroAddress() public {
        vm.prank(owner);
        vm.expectRevert(Treasury.ZeroAddress.selector);
        treasury.queueWithdrawal(address(0), 100 * USDT_1);
    }

    function test_QueueWithdrawalRevertsZeroAmount() public {
        vm.prank(owner);
        vm.expectRevert(Treasury.ZeroAmount.selector);
        treasury.queueWithdrawal(recipient, 0);
    }

    function test_ExecuteWithdrawal() public {
        vm.prank(owner);
        uint256 id = treasury.queueWithdrawal(recipient, 100 * USDT_1);

        // Warp past timelock
        vm.warp(block.timestamp + 48 hours + 1);

        vm.prank(owner);
        treasury.executeWithdrawal(id);

        (, , , bool executed, ) = treasury.withdrawals(id);
        assertTrue(executed);
        assertEq(usdt.balanceOf(recipient), 100 * USDT_1);
    }

    function test_ExecuteWithdrawalRevertsBeforeTimelock() public {
        vm.prank(owner);
        uint256 id = treasury.queueWithdrawal(recipient, 100 * USDT_1);

        vm.prank(owner);
        vm.expectRevert(Treasury.TimelockNotExpired.selector);
        treasury.executeWithdrawal(id);
    }

    function test_ExecuteWithdrawalRevertsAlreadyExecuted() public {
        vm.prank(owner);
        uint256 id = treasury.queueWithdrawal(recipient, 100 * USDT_1);

        vm.warp(block.timestamp + 48 hours + 1);

        vm.startPrank(owner);
        treasury.executeWithdrawal(id);

        vm.expectRevert(Treasury.WithdrawalAlreadyExecuted.selector);
        treasury.executeWithdrawal(id);
        vm.stopPrank();
    }

    function test_CancelWithdrawal() public {
        vm.prank(owner);
        uint256 id = treasury.queueWithdrawal(recipient, 100 * USDT_1);

        vm.prank(owner);
        treasury.cancelWithdrawal(id);

        (, , , , bool cancelled) = treasury.withdrawals(id);
        assertTrue(cancelled);
    }

    function test_CancelWithdrawalRevertsAlreadyCancelled() public {
        vm.prank(owner);
        uint256 id = treasury.queueWithdrawal(recipient, 100 * USDT_1);

        vm.startPrank(owner);
        treasury.cancelWithdrawal(id);

        vm.expectRevert(Treasury.WithdrawalAlreadyCancelled.selector);
        treasury.cancelWithdrawal(id);
        vm.stopPrank();
    }

    function test_ExecuteRevertsIfCancelled() public {
        vm.prank(owner);
        uint256 id = treasury.queueWithdrawal(recipient, 100 * USDT_1);

        vm.startPrank(owner);
        treasury.cancelWithdrawal(id);

        vm.warp(block.timestamp + 48 hours + 1);
        vm.expectRevert(Treasury.WithdrawalAlreadyCancelled.selector);
        treasury.executeWithdrawal(id);
        vm.stopPrank();
    }

    function test_WithdrawQueuesWithdrawal() public {
        vm.prank(owner);
        uint256 id = treasury.withdraw(recipient, 100 * USDT_1);
        assertEq(id, 0);
    }

    function test_OnlyOwnerCanQueue() public {
        vm.prank(recipient);
        vm.expectRevert();
        treasury.queueWithdrawal(recipient, 100 * USDT_1);
    }

    function test_OnlyOwnerCanExecute() public {
        vm.prank(owner);
        uint256 id = treasury.queueWithdrawal(recipient, 100 * USDT_1);

        vm.warp(block.timestamp + 48 hours + 1);

        vm.prank(recipient);
        vm.expectRevert();
        treasury.executeWithdrawal(id);
    }

    function test_OnlyOwnerCanCancel() public {
        vm.prank(owner);
        uint256 id = treasury.queueWithdrawal(recipient, 100 * USDT_1);

        vm.prank(recipient);
        vm.expectRevert();
        treasury.cancelWithdrawal(id);
    }

    function test_ExecuteRevertsInsufficientBalance() public {
        vm.prank(owner);
        uint256 id = treasury.queueWithdrawal(recipient, 20_000 * USDT_1);

        vm.warp(block.timestamp + 48 hours + 1);

        vm.prank(owner);
        vm.expectRevert(Treasury.InsufficientBalance.selector);
        treasury.executeWithdrawal(id);
    }

    function test_MultipleWithdrawals() public {
        vm.startPrank(owner);
        uint256 id0 = treasury.queueWithdrawal(recipient, 100 * USDT_1);
        uint256 id1 = treasury.queueWithdrawal(recipient, 200 * USDT_1);
        vm.stopPrank();

        assertEq(id0, 0);
        assertEq(id1, 1);
        assertEq(treasury.nextWithdrawalId(), 2);
    }
}
