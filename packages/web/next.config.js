/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@betcoin/shared', '@betcoin/config'],
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      'react-native': false,
      '@react-native-async-storage/async-storage': false,
    };
    config.externals.push('pino-pretty', 'lokijs', 'encoding');

    // Privy has optional Solana/Farcaster deps we don't need
    config.resolve.alias = {
      ...config.resolve.alias,
      '@solana/kit': false,
      '@solana-program/system': false,
      '@solana-program/token': false,
      '@farcaster/mini-app-solana': false,
    };

    return config;
  },
};

module.exports = nextConfig;
