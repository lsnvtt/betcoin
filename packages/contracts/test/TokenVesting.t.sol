// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/BetPass.sol";
import "../src/TokenVesting.sol";

contract TokenVestingTest is Test {
    BetPass public token;
    TokenVesting public vesting;
    address public owner;
    address public alice;
    address public bob;

    uint256 constant CLIFF = 180 days;    // 6 months
    uint256 constant DURATION = 730 days; // 24 months
    uint256 constant AMOUNT = 1_000_000 * 1e18;

    function setUp() public {
        owner = makeAddr("owner");
        alice = makeAddr("alice");
        bob = makeAddr("bob");

        vm.startPrank(owner);
        token = new BetPass(owner);
        vesting = new TokenVesting(address(token), owner);
        token.approve(address(vesting), type(uint256).max);
        vm.stopPrank();
    }

    function test_CreateSchedule() public {
        vm.prank(owner);
        vesting.createSchedule(alice, AMOUNT, CLIFF, DURATION);

        (uint256 total, uint256 released,,, uint256 vestDuration, bool revoked) = vesting.schedules(alice);
        assertEq(total, AMOUNT);
        assertEq(released, 0);
        assertEq(vestDuration, DURATION);
        assertFalse(revoked);
    }

    function test_NothingBeforeCliff() public {
        vm.prank(owner);
        vesting.createSchedule(alice, AMOUNT, CLIFF, DURATION);

        // At cliff - 1 day
        vm.warp(block.timestamp + CLIFF - 1 days);
        assertEq(vesting.releasable(alice), 0);
        assertEq(vesting.vested(alice), 0);
    }

    function test_PartialVestingAfterCliff() public {
        vm.prank(owner);
        vesting.createSchedule(alice, AMOUNT, CLIFF, DURATION);

        // At exactly cliff (6 months = ~25% of 24 months)
        vm.warp(block.timestamp + CLIFF);
        uint256 vestedAmt = vesting.vested(alice);
        // ~246,575 tokens (180/730 * 1M)
        assertGt(vestedAmt, 0);
        assertLt(vestedAmt, AMOUNT);
    }

    function test_FullVestingAtEnd() public {
        vm.prank(owner);
        vesting.createSchedule(alice, AMOUNT, CLIFF, DURATION);

        vm.warp(block.timestamp + DURATION);
        assertEq(vesting.vested(alice), AMOUNT);
        assertEq(vesting.releasable(alice), AMOUNT);
    }

    function test_ReleaseTokens() public {
        vm.prank(owner);
        vesting.createSchedule(alice, AMOUNT, CLIFF, DURATION);

        // Warp to 12 months (50% vested)
        vm.warp(block.timestamp + 365 days);

        uint256 releasable = vesting.releasable(alice);
        assertGt(releasable, 0);

        vm.prank(alice);
        vesting.release();

        assertEq(token.balanceOf(alice), releasable);
    }

    function test_MultipleReleases() public {
        vm.prank(owner);
        vesting.createSchedule(alice, AMOUNT, CLIFF, DURATION);

        // First release at 12 months
        vm.warp(block.timestamp + 365 days);
        vm.prank(alice);
        vesting.release();
        uint256 firstRelease = token.balanceOf(alice);

        // Second release at 18 months
        vm.warp(block.timestamp + 180 days);
        vm.prank(alice);
        vesting.release();
        uint256 totalReleased = token.balanceOf(alice);

        assertGt(totalReleased, firstRelease);
    }

    function test_ReleaseRevertsNothingToRelease() public {
        vm.prank(owner);
        vesting.createSchedule(alice, AMOUNT, CLIFF, DURATION);

        // Before cliff
        vm.prank(alice);
        vm.expectRevert(TokenVesting.NothingToRelease.selector);
        vesting.release();
    }

    function test_ReleaseRevertsNoSchedule() public {
        vm.prank(bob);
        vm.expectRevert(TokenVesting.NoSchedule.selector);
        vesting.release();
    }

    function test_Revoke() public {
        vm.prank(owner);
        vesting.createSchedule(alice, AMOUNT, CLIFF, DURATION);

        // Revoke at 12 months (~50% vested)
        vm.warp(block.timestamp + 365 days);

        uint256 vestedBefore = vesting.vested(alice);
        uint256 ownerBefore = token.balanceOf(owner);

        vm.prank(owner);
        vesting.revoke(alice);

        // Alice gets vested amount
        assertEq(token.balanceOf(alice), vestedBefore);
        // Owner gets unvested back
        uint256 refund = AMOUNT - vestedBefore;
        assertEq(token.balanceOf(owner), ownerBefore + refund);
    }

    function test_RevokeRevertsNotOwner() public {
        vm.prank(owner);
        vesting.createSchedule(alice, AMOUNT, CLIFF, DURATION);

        vm.prank(alice);
        vm.expectRevert(TokenVesting.NotOwner.selector);
        vesting.revoke(alice);
    }

    function test_RevokeRevertsAlreadyRevoked() public {
        vm.prank(owner);
        vesting.createSchedule(alice, AMOUNT, CLIFF, DURATION);

        vm.warp(block.timestamp + 365 days);

        vm.startPrank(owner);
        vesting.revoke(alice);
        vm.expectRevert(TokenVesting.AlreadyRevoked.selector);
        vesting.revoke(alice);
        vm.stopPrank();
    }

    function test_DuplicateScheduleReverts() public {
        vm.startPrank(owner);
        vesting.createSchedule(alice, AMOUNT, CLIFF, DURATION);
        vm.expectRevert(TokenVesting.AlreadyHasSchedule.selector);
        vesting.createSchedule(alice, AMOUNT, CLIFF, DURATION);
        vm.stopPrank();
    }

    function test_GetBeneficiaries() public {
        vm.startPrank(owner);
        vesting.createSchedule(alice, AMOUNT, CLIFF, DURATION);
        vesting.createSchedule(bob, 500_000 * 1e18, CLIFF, DURATION);
        vm.stopPrank();

        address[] memory beneficiaries = vesting.getBeneficiaries();
        assertEq(beneficiaries.length, 2);
        assertEq(beneficiaries[0], alice);
        assertEq(beneficiaries[1], bob);
    }
}
