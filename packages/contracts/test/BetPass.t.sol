// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/BetPass.sol";

contract BetPassTest is Test {
    BetPass public token;
    address public owner;
    address public publicSale;
    address public teamVesting;
    address public stakingPool;
    address public treasury;
    address public liquidity;
    address public advisors;

    function setUp() public {
        owner = makeAddr("owner");
        publicSale = makeAddr("publicSale");
        teamVesting = makeAddr("teamVesting");
        stakingPool = makeAddr("stakingPool");
        treasury = makeAddr("treasury");
        liquidity = makeAddr("liquidity");
        advisors = makeAddr("advisors");

        vm.prank(owner);
        token = new BetPass(owner);
    }

    function test_InitialState() public view {
        assertEq(token.name(), "BetPass");
        assertEq(token.symbol(), "BETPASS");
        assertEq(token.totalSupply(), 10_000_000 * 1e18);
        assertEq(token.balanceOf(owner), 10_000_000 * 1e18);
        assertFalse(token.distributed());
    }

    function test_Distribute() public {
        vm.prank(owner);
        token.distribute(publicSale, teamVesting, stakingPool, treasury, liquidity, advisors);

        assertTrue(token.distributed());
        assertEq(token.balanceOf(publicSale), 3_000_000 * 1e18);     // 30%
        assertEq(token.balanceOf(teamVesting), 2_000_000 * 1e18);    // 20%
        assertEq(token.balanceOf(stakingPool), 2_000_000 * 1e18);    // 20%
        assertEq(token.balanceOf(treasury), 1_500_000 * 1e18);       // 15%
        assertEq(token.balanceOf(liquidity), 1_000_000 * 1e18);      // 10%
        assertEq(token.balanceOf(advisors), 500_000 * 1e18);         // 5%
        assertEq(token.balanceOf(owner), 0);
    }

    function test_DistributeRevertsAlready() public {
        vm.startPrank(owner);
        token.distribute(publicSale, teamVesting, stakingPool, treasury, liquidity, advisors);
        vm.expectRevert(BetPass.AlreadyDistributed.selector);
        token.distribute(publicSale, teamVesting, stakingPool, treasury, liquidity, advisors);
        vm.stopPrank();
    }

    function test_DistributeRevertsZeroAddress() public {
        vm.prank(owner);
        vm.expectRevert(BetPass.ZeroAddress.selector);
        token.distribute(address(0), teamVesting, stakingPool, treasury, liquidity, advisors);
    }

    function test_DistributeRevertsNotOwner() public {
        vm.prank(publicSale);
        vm.expectRevert();
        token.distribute(publicSale, teamVesting, stakingPool, treasury, liquidity, advisors);
    }

    function test_Transferable() public {
        address alice = makeAddr("alice");
        vm.prank(owner);
        token.transfer(alice, 1000 * 1e18);
        assertEq(token.balanceOf(alice), 1000 * 1e18);
    }

    function test_AllocationBpsSum() public pure {
        uint256 total = 3000 + 2000 + 2000 + 1500 + 1000 + 500;
        assertEq(total, 10000); // 100%
    }

    function test_TotalSupplyFixed() public view {
        assertEq(token.TOTAL_SUPPLY(), 10_000_000 * 1e18);
    }
}
