// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import "@openzeppelin/contracts/access/Ownable2Step.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/// @title BetCoin Token
/// @notice Token ERC-20 nativo da plataforma BetCoin
/// @dev Meio de troca para todas as apostas, bancas e payouts
contract BetCoin is ERC20, ERC20Burnable, ERC20Permit, Ownable2Step, Pausable {
    uint256 public constant MAX_SUPPLY = 100_000_000 * 1e18;
    uint256 public constant BURN_RATE_BPS = 50; // 0.5%

    mapping(address => bool) public minters;

    event MinterAdded(address indexed minter);
    event MinterRemoved(address indexed minter);
    event BetBurn(address indexed from, uint256 amount, uint256 burnAmount);

    error NotMinter();
    error ExceedsMaxSupply();
    error ZeroAddress();

    modifier onlyMinter() {
        if (!minters[msg.sender]) revert NotMinter();
        _;
    }

    constructor(address initialOwner)
        ERC20("BetCoin", "BETCOIN")
        ERC20Permit("BetCoin")
        Ownable(initialOwner)
    {
        _mint(initialOwner, MAX_SUPPLY);
    }

    /// @notice Mint novos tokens (apenas por minters autorizados)
    function mint(address to, uint256 amount) external onlyMinter whenNotPaused {
        if (totalSupply() + amount > MAX_SUPPLY) revert ExceedsMaxSupply();
        _mint(to, amount);
    }

    /// @notice Adiciona um minter autorizado
    function addMinter(address minter) external onlyOwner {
        if (minter == address(0)) revert ZeroAddress();
        minters[minter] = true;
        emit MinterAdded(minter);
    }

    /// @notice Remove um minter autorizado
    function removeMinter(address minter) external onlyOwner {
        minters[minter] = false;
        emit MinterRemoved(minter);
    }

    /// @notice Queima tokens de uma aposta (burn rate aplicado)
    function burnFromBet(address from, uint256 amount) external onlyMinter whenNotPaused {
        uint256 burnAmount = (amount * BURN_RATE_BPS) / 10_000;
        _burn(from, burnAmount);
        emit BetBurn(from, amount, burnAmount);
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }
}
