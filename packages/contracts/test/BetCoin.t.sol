// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/BetCoin.sol";

contract BetCoinTest is Test {
    BetCoin public token;
    address public owner;
    address public minter;
    address public user;

    function setUp() public {
        owner = makeAddr("owner");
        minter = makeAddr("minter");
        user = makeAddr("user");

        vm.prank(owner);
        token = new BetCoin(owner);
    }

    function test_InitialSupply() public view {
        assertEq(token.totalSupply(), token.MAX_SUPPLY());
        assertEq(token.balanceOf(owner), token.MAX_SUPPLY());
    }

    function test_Name() public view {
        assertEq(token.name(), "BetCoin");
        assertEq(token.symbol(), "BETCOIN");
    }

    function test_AddMinter() public {
        vm.prank(owner);
        token.addMinter(minter);
        assertTrue(token.minters(minter));
    }

    function test_RemoveMinter() public {
        vm.startPrank(owner);
        token.addMinter(minter);
        token.removeMinter(minter);
        vm.stopPrank();
        assertFalse(token.minters(minter));
    }

    function test_OnlyOwnerCanAddMinter() public {
        vm.prank(user);
        vm.expectRevert();
        token.addMinter(minter);
    }

    function test_BurnFromBet() public {
        vm.prank(owner);
        token.addMinter(minter);

        vm.prank(owner);
        token.transfer(user, 10_000 ether);

        vm.prank(minter);
        token.burnFromBet(user, 1_000 ether);

        // 0.5% of 1000 = 5 tokens burned
        assertEq(token.balanceOf(user), 9_995 ether);
    }

    function test_Pause() public {
        vm.prank(owner);
        token.addMinter(minter);

        vm.prank(owner);
        token.pause();

        vm.prank(minter);
        vm.expectRevert();
        token.mint(user, 100 ether);
    }

    function test_MintRevertsWhenNotMinter() public {
        vm.prank(user);
        vm.expectRevert(BetCoin.NotMinter.selector);
        token.mint(user, 100 ether);
    }
}
