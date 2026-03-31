'use client';

import { useState } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import {
  Trophy,
  Search,
  Clock,
  Swords,
  CircleDot,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { formatBetCoin, cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

const sports = [
  { name: 'Todos', icon: Trophy },
  { name: 'Futebol', icon: CircleDot },
  { name: 'Basquete', icon: CircleDot },
  { name: 'Tenis', icon: CircleDot },
  { name: 'MMA', icon: Swords },
];

const mockEvents = [
  {
    id: '1',
    sport: 'Futebol',
    league: 'Brasileirao',
    homeTeam: 'Flamengo',
    awayTeam: 'Palmeiras',
    startTime: '2026-04-01T20:00:00Z',
    status: 'upcoming' as const,
    outcomes: [
      { name: 'Flamengo', odds: 2.1 },
      { name: 'Empate', odds: 3.2 },
      { name: 'Palmeiras', odds: 2.8 },
    ],
  },
  {
    id: '2',
    sport: 'Futebol',
    league: 'Champions League',
    homeTeam: 'Real Madrid',
    awayTeam: 'Manchester City',
    startTime: '2026-04-02T18:00:00Z',
    status: 'live' as const,
    outcomes: [
      { name: 'Real Madrid', odds: 1.85 },
      { name: 'Empate', odds: 3.5 },
      { name: 'Man City', odds: 3.1 },
    ],
  },
  {
    id: '3',
    sport: 'Basquete',
    league: 'NBA',
    homeTeam: 'Lakers',
    awayTeam: 'Celtics',
    startTime: '2026-04-01T22:00:00Z',
    status: 'upcoming' as const,
    outcomes: [
      { name: 'Lakers', odds: 1.75 },
      { name: 'Celtics', odds: 2.05 },
    ],
  },
  {
    id: '4',
    sport: 'Tenis',
    league: 'ATP Masters',
    homeTeam: 'Djokovic',
    awayTeam: 'Alcaraz',
    startTime: '2026-04-03T14:00:00Z',
    status: 'upcoming' as const,
    outcomes: [
      { name: 'Djokovic', odds: 2.3 },
      { name: 'Alcaraz', odds: 1.65 },
    ],
  },
  {
    id: '5',
    sport: 'MMA',
    league: 'UFC',
    homeTeam: 'Fighter A',
    awayTeam: 'Fighter B',
    startTime: '2026-04-05T23:00:00Z',
    status: 'upcoming' as const,
    outcomes: [
      { name: 'Fighter A', odds: 1.45 },
      { name: 'Fighter B', odds: 2.7 },
    ],
  },
];

export default function EventsPage() {
  const { authenticated, login } = usePrivy();
  const [selectedSport, setSelectedSport] = useState('Todos');
  const [search, setSearch] = useState('');
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);
  const [selectedOutcome, setSelectedOutcome] = useState<number | null>(null);
  const [betAmount, setBetAmount] = useState('10');

  const filtered = mockEvents.filter((e) => {
    const matchSport = selectedSport === 'Todos' || e.sport === selectedSport;
    const matchSearch =
      !search ||
      e.homeTeam.toLowerCase().includes(search.toLowerCase()) ||
      e.awayTeam.toLowerCase().includes(search.toLowerCase()) ||
      e.league.toLowerCase().includes(search.toLowerCase());
    return matchSport && matchSearch;
  });

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handlePlaceBet = () => {
    if (!authenticated) {
      login();
      return;
    }
    alert(`Aposta de ${betAmount} BETC no resultado ${selectedOutcome} do evento ${selectedEvent}`);
    setSelectedEvent(null);
    setSelectedOutcome(null);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6 max-w-5xl mx-auto"
    >
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-betcoin-accent/30 blur-lg" />
            <Trophy className="relative h-8 w-8 text-betcoin-accent" />
          </div>
          <span className="bg-gradient-to-r from-betcoin-accent to-betcoin-accent-light bg-clip-text text-transparent">
            Apostas Esportivas
          </span>
        </h1>
        <p className="text-gray-400 mt-2">
          Explore eventos e faca suas apostas.
        </p>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex flex-col sm:flex-row gap-4"
      >
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
          <Input
            placeholder="Buscar evento..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {sports.map((sport) => (
            <Button
              key={sport.name}
              variant={selectedSport === sport.name ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedSport(sport.name)}
              className="shrink-0"
            >
              <sport.icon className="h-3.5 w-3.5" />
              {sport.name}
            </Button>
          ))}
        </div>
      </motion.div>

      {/* Events list */}
      <div className="space-y-4">
        {filtered.map((event, idx) => (
          <motion.div
            key={event.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 + idx * 0.05 }}
          >
            <Card
              className={cn(
                'transition-all',
                selectedEvent === event.id && 'border-betcoin-primary/50 shadow-glow-orange'
              )}
            >
              <CardContent>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Badge variant={event.status === 'live' ? 'live' : 'outline'}>
                      {event.status === 'live' ? 'AO VIVO' : event.sport}
                    </Badge>
                    <span className="text-sm text-gray-500">{event.league}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-gray-500">
                    <Clock className="h-3 w-3" />
                    {formatDate(event.startTime)}
                  </div>
                </div>

                <div className="text-center mb-5">
                  <p className="text-xl font-bold text-white">
                    {event.homeTeam}
                    <span className="text-gray-600 mx-3 text-sm font-normal">vs</span>
                    {event.awayTeam}
                  </p>
                </div>

                {/* Odds buttons */}
                <div className={cn(
                  'grid gap-3',
                  event.outcomes.length === 3 ? 'grid-cols-3' : 'grid-cols-2'
                )}>
                  {event.outcomes.map((outcome, oidx) => (
                    <motion.button
                      key={oidx}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => {
                        setSelectedEvent(event.id);
                        setSelectedOutcome(oidx);
                      }}
                      className={cn(
                        'rounded-xl p-4 text-center transition-all border',
                        selectedEvent === event.id && selectedOutcome === oidx
                          ? 'border-betcoin-primary bg-betcoin-primary/10 shadow-glow-orange'
                          : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/[0.07]'
                      )}
                    >
                      <p className="text-xs text-gray-400 mb-1">{outcome.name}</p>
                      <p className="text-xl font-bold font-mono text-betcoin-primary">
                        {outcome.odds.toFixed(2)}
                      </p>
                    </motion.button>
                  ))}
                </div>

                {/* Bet form */}
                <AnimatePresence>
                  {selectedEvent === event.id && selectedOutcome !== null && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="mt-5 pt-5 border-t border-white/5 flex flex-col sm:flex-row gap-3 items-end">
                        <div className="flex-1 w-full">
                          <label className="text-xs text-gray-400 mb-1 block">Valor</label>
                          <Input
                            type="number"
                            value={betAmount}
                            onChange={(e) => setBetAmount(e.target.value)}
                            placeholder="Valor"
                            min="1"
                            className="font-mono"
                          />
                        </div>
                        <div className="text-sm text-gray-400 whitespace-nowrap pb-3">
                          Pagamento:{' '}
                          <span className="font-mono font-bold text-white">
                            {formatBetCoin(
                              parseFloat(betAmount || '0') * event.outcomes[selectedOutcome].odds
                            )}
                          </span>
                        </div>
                        <Button onClick={handlePlaceBet} size="lg" className="shrink-0">
                          Apostar
                        </Button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </CardContent>
            </Card>
          </motion.div>
        ))}

        {filtered.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/5 border border-white/10 mb-4">
              <Trophy className="h-8 w-8 text-gray-600" />
            </div>
            <p className="text-gray-500">Nenhum evento encontrado.</p>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
