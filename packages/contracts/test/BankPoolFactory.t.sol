// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/BankPoolFactory.sol";
import "../src/BankPool.sol";
import "../src/MockUSDT.sol";

contract BankPoolFactoryTest is Test {
    BankPoolFactory public factory;
    MockUSDT public usdt;
    address public owner;
    address public treasury;
    address public poolCreator;

    uint256 constant USDT_1 = 1e6;

    function setUp() public {
        owner = makeAddr("owner");
        treasury = makeAddr("treasury");
        poolCreator = makeAddr("poolCreator");

        usdt = new MockUSDT();

        vm.prank(owner);
        factory = new BankPoolFactory(
            address(usdt),
            treasury,
            owner,
            100 * USDT_1, // min initial deposit
            200 // 2% fee
        );

        // Fund pool creator
        usdt.faucetTo(poolCreator, 50_000 * USDT_1);
    }

    function test_Constructor() public view {
        assertEq(factory.usdt(), address(usdt));
        assertEq(factory.treasury(), treasury);
        assertEq(factory.minInitialDeposit(), 100 * USDT_1);
        assertEq(factory.platformFeeBps(), 200);
    }

    function test_ConstructorRevertsZeroAddress() public {
        vm.prank(owner);
        vm.expectRevert(BankPoolFactory.ZeroAddress.selector);
        new BankPoolFactory(address(0), treasury, owner, 100 * USDT_1, 200);
    }

    function test_CreatePool() public {
        vm.startPrank(poolCreator);
        usdt.approve(address(factory), type(uint256).max);
        address pool = factory.createPool(500 * USDT_1, 5000, 1 * USDT_1, 1000 * USDT_1);
        vm.stopPrank();

        assertTrue(factory.isPool(pool));
        assertEq(factory.totalPools(), 1);
        assertEq(factory.allPools(0), pool);

        address[] memory pools = factory.getPoolsByOwner(poolCreator);
        assertEq(pools.length, 1);
        assertEq(pools[0], pool);

        // Verify pool state
        BankPool bp = BankPool(pool);
        assertEq(bp.owner(), poolCreator);
        assertEq(bp.maxExposureBps(), 5000);
        assertEq(bp.totalDeposited(), 500 * USDT_1);
    }

    function test_CreatePoolRevertsDepositBelowMinimum() public {
        vm.startPrank(poolCreator);
        usdt.approve(address(factory), type(uint256).max);

        vm.expectRevert(BankPoolFactory.DepositBelowMinimum.selector);
        factory.createPool(50 * USDT_1, 5000, 1 * USDT_1, 1000 * USDT_1);
        vm.stopPrank();
    }

    function test_CreateMultiplePools() public {
        vm.startPrank(poolCreator);
        usdt.approve(address(factory), type(uint256).max);
        factory.createPool(500 * USDT_1, 5000, 1 * USDT_1, 1000 * USDT_1);
        factory.createPool(1000 * USDT_1, 3000, 5 * USDT_1, 500 * USDT_1);
        vm.stopPrank();

        assertEq(factory.totalPools(), 2);
        address[] memory pools = factory.getPoolsByOwner(poolCreator);
        assertEq(pools.length, 2);
    }

    function test_SetMinInitialDeposit() public {
        vm.prank(owner);
        factory.setMinInitialDeposit(500 * USDT_1);
        assertEq(factory.minInitialDeposit(), 500 * USDT_1);
    }

    function test_SetMinInitialDepositOnlyOwner() public {
        vm.prank(poolCreator);
        vm.expectRevert();
        factory.setMinInitialDeposit(500 * USDT_1);
    }

    function test_SetPlatformFeeBps() public {
        vm.prank(owner);
        factory.setPlatformFeeBps(500);
        assertEq(factory.platformFeeBps(), 500);
    }

    function test_SetPlatformFeeBpsRevertsTooHigh() public {
        vm.prank(owner);
        vm.expectRevert(BankPoolFactory.FeeTooHigh.selector);
        factory.setPlatformFeeBps(1001);
    }

    function test_GetAllPools() public {
        vm.startPrank(poolCreator);
        usdt.approve(address(factory), type(uint256).max);
        factory.createPool(500 * USDT_1, 5000, 1 * USDT_1, 1000 * USDT_1);
        vm.stopPrank();

        address[] memory pools = factory.getAllPools();
        assertEq(pools.length, 1);
    }
}
