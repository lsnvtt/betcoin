// Admin wallet addresses (lowercase for comparison)
const ADMIN_WALLETS = [
  '0x2432d0232d3bc1477d5679a3a33156f52fabaf77',
];

export function isAdmin(walletAddress: string | undefined | null): boolean {
  if (!walletAddress) return false;
  return ADMIN_WALLETS.includes(walletAddress.toLowerCase());
}

export function isGestor(walletAddress: string | undefined | null): boolean {
  // For now, admin is also gestor. Later check DB role.
  return isAdmin(walletAddress);
}
