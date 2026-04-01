// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../src/MockUSDT.sol";
import "../src/Vault.sol";
import "../src/Treasury.sol";
import "../src/BankPoolFactory.sol";
import "../src/BetEngine.sol";
import "../src/BetPass.sol";
import "../src/BetPassStaking.sol";
import "../src/TokenVesting.sol";
import "../src/BetCoin.sol";

contract Deploy is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envOr(
            "PRIVATE_KEY",
            uint256(0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80)
        );
        address deployer = vm.addr(deployerPrivateKey);

        console.log("Deployer:", deployer);

        vm.startBroadcast(deployerPrivateKey);

        // 1. MockUSDT (6 decimals)
        MockUSDT mockUsdt = new MockUSDT();
        console.log("MockUSDT:", address(mockUsdt));

        // 2. Vault
        Vault vault = new Vault(address(mockUsdt), deployer);
        console.log("Vault:", address(vault));

        // 3. Treasury (now uses USDT)
        Treasury treasury = new Treasury(address(mockUsdt), deployer);
        console.log("Treasury:", address(treasury));

        // 4. BankPoolFactory (usdt, treasury, owner, minDeposit, feeBps)
        BankPoolFactory factory = new BankPoolFactory(
            address(mockUsdt),
            address(treasury),
            deployer,
            1000 * 1e6, // 1000 USDT (6 decimals)
            200
        );
        console.log("BankPoolFactory:", address(factory));

        // 5. BetEngine (usdt, treasury, factory, feeBps)
        BetEngine betEngine = new BetEngine(
            address(mockUsdt),
            address(treasury),
            address(factory),
            200
        );
        console.log("BetEngine:", address(betEngine));

        // 6. BetCoin (governance/rewards token - kept as-is)
        BetCoin betCoin = new BetCoin(deployer);
        console.log("BetCoin:", address(betCoin));

        // 7. BetPass
        BetPass betPass = new BetPass(deployer);
        console.log("BetPass:", address(betPass));

        // 8. BetPassStaking (now distributes USDT rewards)
        BetPassStaking staking = new BetPassStaking(
            address(betPass),
            address(mockUsdt),
            deployer
        );
        console.log("BetPassStaking:", address(staking));

        // 9-10. TokenVesting (uses BetPass, unchanged)
        TokenVesting teamVesting = new TokenVesting(address(betPass), deployer);
        TokenVesting advisorVesting = new TokenVesting(address(betPass), deployer);
        console.log("TeamVesting:", address(teamVesting));
        console.log("AdvisorVesting:", address(advisorVesting));

        // Mint 1,000,000 MockUSDT to deployer for testing
        mockUsdt.faucet(1_000_000 * 1e6);
        console.log("Minted 1,000,000 USDT to deployer");

        vm.stopBroadcast();

        console.log("\n=== DEPLOY OK ===");
    }
}
