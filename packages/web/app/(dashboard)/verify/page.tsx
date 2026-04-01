'use client';

import { useState } from 'react';
import { Shield, Search, CheckCircle, XCircle } from 'lucide-react';
import { verifyGame } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface VerifyResult {
  serverSeed: string;
  clientSeed: string;
  nonce: number;
  result: unknown;
  hash: string;
}

export default function VerifyPage() {
  const [sessionId, setSessionId] = useState('');
  const [gameType, setGameType] = useState('coinflip');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<VerifyResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleVerify = async () => {
    if (!sessionId.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const data = await verifyGame(sessionId.trim(), gameType);
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao verificar resultado');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-3xl mx-auto"
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-betcoin-accent/30 blur-lg" />
            <Shield className="relative h-8 w-8 text-betcoin-accent" />
          </div>
          <span className="bg-gradient-to-r from-betcoin-accent to-betcoin-accent-light bg-clip-text text-transparent">
            Verificar Resultado
          </span>
        </h1>
        <p className="text-gray-400 mt-2">
          Todos os jogos sao provably fair. Verifique qualquer resultado.
        </p>
      </motion.div>

      <Card>
        <CardContent>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-gray-400 font-medium mb-2 block">
                Tipo de Jogo
              </label>
              <select
                value={gameType}
                onChange={(e) => setGameType(e.target.value)}
                className="flex h-12 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-betcoin-primary/50"
              >
                <option value="coinflip" className="bg-betcoin-dark">CoinFlip</option>
                <option value="dice" className="bg-betcoin-dark">Dice</option>
                <option value="slots" className="bg-betcoin-dark">Slots</option>
                <option value="crash" className="bg-betcoin-dark">Crash</option>
                <option value="mines" className="bg-betcoin-dark">Mines</option>
                <option value="roulette" className="bg-betcoin-dark">Roleta</option>
                <option value="plinko" className="bg-betcoin-dark">Plinko</option>
              </select>
            </div>

            <div>
              <label className="text-sm text-gray-400 font-medium mb-2 block">
                ID da Sessao
              </label>
              <Input
                value={sessionId}
                onChange={(e) => setSessionId(e.target.value)}
                placeholder="Cole o ID da sessao aqui..."
                className="font-mono"
              />
            </div>

            <Button
              onClick={handleVerify}
              disabled={loading || !sessionId.trim()}
              loading={loading}
              size="xl"
              className="w-full text-lg font-bold"
            >
              <Search className="h-5 w-5 mr-2" />
              {loading ? 'Verificando...' : 'Verificar'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 p-4 rounded-xl bg-betcoin-red/10 border border-betcoin-red/20 flex items-center gap-3"
        >
          <XCircle className="h-5 w-5 text-betcoin-red-light flex-shrink-0" />
          <p className="text-betcoin-red-light text-sm">{error}</p>
        </motion.div>
      )}

      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-6 space-y-4"
          >
            <div className="flex items-center gap-2 text-betcoin-accent">
              <CheckCircle className="h-5 w-5" />
              <span className="font-bold">Resultado verificado com sucesso</span>
            </div>

            <Card>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
                      Server Seed
                    </p>
                    <p className="text-sm font-mono text-white break-all bg-white/5 rounded-lg p-3 border border-white/10">
                      {result.serverSeed}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
                      Client Seed
                    </p>
                    <p className="text-sm font-mono text-white break-all bg-white/5 rounded-lg p-3 border border-white/10">
                      {result.clientSeed}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
                        Nonce
                      </p>
                      <p className="text-sm font-mono text-white bg-white/5 rounded-lg p-3 border border-white/10">
                        {result.nonce}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
                        Resultado
                      </p>
                      <p className="text-sm font-mono text-betcoin-primary bg-white/5 rounded-lg p-3 border border-white/10">
                        {JSON.stringify(result.result)}
                      </p>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
                      Hash (SHA-256)
                    </p>
                    <p className="text-sm font-mono text-betcoin-accent break-all bg-white/5 rounded-lg p-3 border border-white/10">
                      {result.hash}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <p className="text-xs text-gray-400 leading-relaxed">
                Para verificar: calcule SHA-256(serverSeed + clientSeed + nonce).
                O hash resultante deve ser igual ao hash exibido acima.
                O resultado do jogo e derivado deste hash de forma deterministica.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
