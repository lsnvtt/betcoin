// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/CoinFlip.sol";
import "../src/BankPool.sol";
import "../src/MockUSDT.sol";
import "../src/BetEngine.sol";

contract CoinFlipTest is Test {
    CoinFlip public coinFlip;
    BankPool public pool;
    MockUSDT public usdt;
    BetEngine public betEngine;
    address public owner;
    address public player;
    address public poolOwner;
    address public vrfCoordinator;
    address public treasury;
    address public factory;

    bytes32 constant KEY_HASH = keccak256("keyHash");
    uint256 constant SUB_ID = 1;
    uint256 constant USDT_1 = 1e6;

    function setUp() public {
        owner = address(this);
        player = makeAddr("player");
        poolOwner = makeAddr("poolOwner");
        vrfCoordinator = makeAddr("vrfCoordinator");
        treasury = makeAddr("treasury");
        factory = makeAddr("factory");

        usdt = new MockUSDT();

        betEngine = new BetEngine(address(usdt), treasury, factory, 200);

        coinFlip = new CoinFlip(
            vrfCoordinator,
            KEY_HASH,
            SUB_ID,
            200_000,
            3,
            address(usdt),
            address(betEngine)
        );

        // Create pool
        pool = new BankPool(poolOwner, address(usdt), factory, 5000, 1 * USDT_1, 1000 * USDT_1);

        // Set coinFlip as bet engine on pool
        vm.prank(poolOwner);
        pool.setBetEngine(address(coinFlip));

        // Fund pool
        usdt.faucetTo(poolOwner, 10_000 * USDT_1);
        vm.startPrank(poolOwner);
        usdt.approve(address(pool), type(uint256).max);
        pool.deposit(10_000 * USDT_1);
        vm.stopPrank();

        // Fund player
        usdt.faucetTo(player, 5_000 * USDT_1);
        vm.prank(player);
        usdt.approve(address(coinFlip), type(uint256).max);
    }

    function test_Constants() public view {
        assertEq(coinFlip.PAYOUT_BPS(), 19_600);
    }

    function test_PlayRevertsZeroAmount() public {
        vm.prank(player);
        vm.expectRevert(CoinFlip.ZeroAmount.selector);
        coinFlip.play(address(pool), 0, 0);
    }

    function test_PlayRevertsInvalidSide() public {
        vm.prank(player);
        vm.expectRevert(CoinFlip.InvalidSide.selector);
        coinFlip.play(address(pool), 100 * USDT_1, 2);
    }

    function test_PlayHeads() public {
        // Mock the VRF coordinator to return a requestId
        vm.mockCall(
            vrfCoordinator,
            abi.encodeWithSelector(IVRFCoordinatorV2Plus.requestRandomWords.selector),
            abi.encode(uint256(1))
        );

        vm.prank(player);
        uint256 requestId = coinFlip.play(address(pool), 100 * USDT_1, 0);
        assertEq(requestId, 1);

        // Verify game state
        (
            address gamePlayer,
            address gamePool,
            uint256 betAmount,
            uint8 chosenSide,
            bool resolved,
            ,
        ) = coinFlip.games(requestId);

        assertEq(gamePlayer, player);
        assertEq(gamePool, address(pool));
        assertEq(betAmount, 100 * USDT_1);
        assertEq(chosenSide, 0);
        assertFalse(resolved);
    }

    function test_UsdtAddress() public view {
        assertEq(address(coinFlip.usdt()), address(usdt));
    }
}
