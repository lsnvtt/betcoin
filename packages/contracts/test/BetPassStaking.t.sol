// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/BetPass.sol";
import "../src/MockUSDT.sol";
import "../src/BetPassStaking.sol";

contract BetPassStakingTest is Test {
    BetPass public betPass;
    MockUSDT public usdt;
    BetPassStaking public staking;

    address public owner;
    address public alice;
    address public bob;
    address public revenueSource;

    uint256 constant USDT_1 = 1e6;

    function setUp() public {
        owner = makeAddr("owner");
        alice = makeAddr("alice");
        bob = makeAddr("bob");
        revenueSource = makeAddr("revenueSource");

        usdt = new MockUSDT();

        vm.startPrank(owner);
        betPass = new BetPass(owner);
        staking = new BetPassStaking(address(betPass), address(usdt), owner);

        // Give alice and bob some BETPASS
        betPass.transfer(alice, 3000 * 1e18);
        betPass.transfer(bob, 2000 * 1e18);
        vm.stopPrank();

        // Give revenue source some USDT for rewards
        usdt.faucetTo(revenueSource, 100_000 * USDT_1);
    }

    function test_Stake() public {
        vm.startPrank(alice);
        betPass.approve(address(staking), 1000 * 1e18);
        staking.stake(1000 * 1e18);
        vm.stopPrank();

        assertEq(staking.totalStaked(), 1000 * 1e18);
        (uint256 stakedAmount,,,) = staking.getStakerInfo(alice);
        assertEq(stakedAmount, 1000 * 1e18);
    }

    function test_StakeRevertsZero() public {
        vm.prank(alice);
        vm.expectRevert(BetPassStaking.ZeroAmount.selector);
        staking.stake(0);
    }

    function test_DepositRevenueAndClaim() public {
        // Alice stakes 1000 BETPASS
        vm.startPrank(alice);
        betPass.approve(address(staking), 1000 * 1e18);
        staking.stake(1000 * 1e18);
        vm.stopPrank();

        // Deposit 100 USDT as revenue
        vm.startPrank(revenueSource);
        usdt.approve(address(staking), 100 * USDT_1);
        staking.depositRevenue(100 * USDT_1);
        vm.stopPrank();

        // Alice should have 100 USDT pending (she's only staker)
        uint256 pending = staking.pendingRewards(alice);
        assertEq(pending, 100 * USDT_1);

        // Claim
        vm.prank(alice);
        staking.claimRewards();
        assertEq(usdt.balanceOf(alice), 100 * USDT_1);
    }

    function test_ProportionalDistribution() public {
        // Alice stakes 3000, Bob stakes 2000 (60/40 split)
        vm.startPrank(alice);
        betPass.approve(address(staking), 3000 * 1e18);
        staking.stake(3000 * 1e18);
        vm.stopPrank();

        vm.startPrank(bob);
        betPass.approve(address(staking), 2000 * 1e18);
        staking.stake(2000 * 1e18);
        vm.stopPrank();

        // Deposit 1000 USDT
        vm.startPrank(revenueSource);
        usdt.approve(address(staking), 1000 * USDT_1);
        staking.depositRevenue(1000 * USDT_1);
        vm.stopPrank();

        // Alice: 60% = 600, Bob: 40% = 400
        assertEq(staking.pendingRewards(alice), 600 * USDT_1);
        assertEq(staking.pendingRewards(bob), 400 * USDT_1);
    }

    function test_RequestUnstake() public {
        vm.startPrank(alice);
        betPass.approve(address(staking), 1000 * 1e18);
        staking.stake(1000 * 1e18);

        staking.requestUnstake(500 * 1e18);
        vm.stopPrank();

        (,, uint256 unstakeAvailableAt, uint256 unstakeAmount) = staking.getStakerInfo(alice);
        assertEq(unstakeAmount, 500 * 1e18);
        assertEq(unstakeAvailableAt, block.timestamp + 7 days);
    }

    function test_UnstakeAfterCooldown() public {
        vm.startPrank(alice);
        betPass.approve(address(staking), 1000 * 1e18);
        staking.stake(1000 * 1e18);
        staking.requestUnstake(500 * 1e18);
        vm.stopPrank();

        vm.warp(block.timestamp + 7 days + 1);

        vm.prank(alice);
        staking.unstake();

        assertEq(staking.totalStaked(), 500 * 1e18);
        assertEq(betPass.balanceOf(alice), 2500 * 1e18); // 3000 - 1000 + 500
    }

    function test_UnstakeRevertsBeforeCooldown() public {
        vm.startPrank(alice);
        betPass.approve(address(staking), 1000 * 1e18);
        staking.stake(1000 * 1e18);
        staking.requestUnstake(500 * 1e18);

        vm.expectRevert(BetPassStaking.CooldownNotExpired.selector);
        staking.unstake();
        vm.stopPrank();
    }

    function test_UnstakeRevertsNoRequest() public {
        vm.startPrank(alice);
        betPass.approve(address(staking), 1000 * 1e18);
        staking.stake(1000 * 1e18);

        vm.expectRevert(BetPassStaking.NoUnstakeRequest.selector);
        staking.unstake();
        vm.stopPrank();
    }

    function test_ClaimRevertsNoPending() public {
        vm.startPrank(alice);
        betPass.approve(address(staking), 1000 * 1e18);
        staking.stake(1000 * 1e18);

        vm.expectRevert(BetPassStaking.NoPendingRewards.selector);
        staking.claimRewards();
        vm.stopPrank();
    }

    function test_MultipleRevenueDeposits() public {
        vm.startPrank(alice);
        betPass.approve(address(staking), 1000 * 1e18);
        staking.stake(1000 * 1e18);
        vm.stopPrank();

        // Two deposits
        vm.startPrank(revenueSource);
        usdt.approve(address(staking), 200 * USDT_1);
        staking.depositRevenue(100 * USDT_1);
        staking.depositRevenue(100 * USDT_1);
        vm.stopPrank();

        assertEq(staking.pendingRewards(alice), 200 * USDT_1);
    }

    function test_SetRevenueShareBps() public {
        vm.prank(owner);
        staking.setRevenueShareBps(3000); // 30%
        assertEq(staking.revenueShareBps(), 3000);
    }

    function test_SetRevenueShareRevertsHigh() public {
        vm.prank(owner);
        vm.expectRevert(BetPassStaking.FeeTooHigh.selector);
        staking.setRevenueShareBps(5001);
    }

    function test_RevenueToOwnerWhenNoStakers() public {
        uint256 ownerBefore = usdt.balanceOf(owner);

        vm.startPrank(revenueSource);
        usdt.approve(address(staking), 100 * USDT_1);
        staking.depositRevenue(100 * USDT_1);
        vm.stopPrank();

        assertEq(usdt.balanceOf(owner), ownerBefore + 100 * USDT_1);
    }

    function test_StakeAndEarnAcrossMultipleDeposits() public {
        // Alice stakes
        vm.startPrank(alice);
        betPass.approve(address(staking), 1000 * 1e18);
        staking.stake(1000 * 1e18);
        vm.stopPrank();

        // First revenue
        vm.startPrank(revenueSource);
        usdt.approve(address(staking), 500 * USDT_1);
        staking.depositRevenue(200 * USDT_1);
        vm.stopPrank();

        // Bob stakes
        vm.startPrank(bob);
        betPass.approve(address(staking), 1000 * 1e18);
        staking.stake(1000 * 1e18);
        vm.stopPrank();

        // Second revenue
        vm.startPrank(revenueSource);
        staking.depositRevenue(200 * USDT_1);
        vm.stopPrank();

        // Alice: 200 USDT (solo) + 100 USDT (50% of 200) = 300 USDT
        // Bob: 100 USDT (50% of 200)
        assertEq(staking.pendingRewards(alice), 300 * USDT_1);
        assertEq(staking.pendingRewards(bob), 100 * USDT_1);
    }
}
