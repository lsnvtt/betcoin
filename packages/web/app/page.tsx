'use client';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 bg-betcoin-dark">
      <h1 className="text-5xl font-bold text-betcoin-primary mb-4">
        BetCoin
      </h1>
      <p className="text-lg text-gray-400 mb-8">
        Plataforma de apostas on-chain na Polygon
      </p>
      <a
        href="/coinflip"
        className="bg-betcoin-primary text-white px-8 py-3 rounded-lg font-semibold hover:opacity-90 transition"
      >
        Entrar
      </a>
    </main>
  );
}
