'use client';

import { useState } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { Trophy, Search, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { formatBetCoin, cn } from '@/lib/utils';

const sports = ['Todos', 'Futebol', 'Basquete', 'Tenis', 'MMA'];

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
    const matchSport =
      selectedSport === 'Todos' || e.sport === selectedSport;
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
    // API call would go here
    alert(
      `Aposta de ${betAmount} BTC no resultado ${selectedOutcome} do evento ${selectedEvent}`
    );
    setSelectedEvent(null);
    setSelectedOutcome(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Trophy className="h-7 w-7 text-green-400" />
          Apostas Esportivas
        </h1>
        <p className="text-gray-400 mt-1">
          Explore eventos e faca suas apostas.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
          <Input
            placeholder="Buscar evento..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {sports.map((sport) => (
            <Button
              key={sport}
              variant={selectedSport === sport ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedSport(sport)}
            >
              {sport}
            </Button>
          ))}
        </div>
      </div>

      {/* Events list */}
      <div className="space-y-4">
        {filtered.map((event) => (
          <Card
            key={event.id}
            className={cn(
              'transition-colors',
              selectedEvent === event.id && 'border-betcoin-primary'
            )}
          >
            <CardContent>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Badge
                    variant={event.status === 'live' ? 'live' : 'outline'}
                  >
                    {event.status === 'live' ? 'AO VIVO' : event.sport}
                  </Badge>
                  <span className="text-sm text-gray-500">{event.league}</span>
                </div>
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <Clock className="h-3 w-3" />
                  {formatDate(event.startTime)}
                </div>
              </div>

              <div className="text-center mb-4">
                <p className="text-lg font-bold text-white">
                  {event.homeTeam}{' '}
                  <span className="text-gray-500 mx-2">vs</span>{' '}
                  {event.awayTeam}
                </p>
              </div>

              {/* Odds buttons */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {event.outcomes.map((outcome, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setSelectedEvent(event.id);
                      setSelectedOutcome(idx);
                    }}
                    className={cn(
                      'rounded-lg p-3 text-center transition-all border',
                      selectedEvent === event.id && selectedOutcome === idx
                        ? 'border-betcoin-primary bg-betcoin-primary/10'
                        : 'border-gray-700 bg-betcoin-dark hover:border-gray-600'
                    )}
                  >
                    <p className="text-xs text-gray-400">{outcome.name}</p>
                    <p className="text-lg font-bold text-betcoin-primary">
                      {outcome.odds.toFixed(2)}
                    </p>
                  </button>
                ))}
              </div>

              {/* Bet form (shown when event+outcome selected) */}
              {selectedEvent === event.id && selectedOutcome !== null && (
                <div className="mt-4 pt-4 border-t border-gray-800 flex flex-col sm:flex-row gap-3">
                  <Input
                    type="number"
                    value={betAmount}
                    onChange={(e) => setBetAmount(e.target.value)}
                    placeholder="Valor"
                    min="1"
                    className="sm:w-40"
                  />
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <span>
                      Pagamento:{' '}
                      {formatBetCoin(
                        parseFloat(betAmount || '0') *
                          event.outcomes[selectedOutcome].odds
                      )}
                    </span>
                  </div>
                  <Button onClick={handlePlaceBet} className="sm:ml-auto">
                    Apostar
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}

        {filtered.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <Trophy className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>Nenhum evento encontrado.</p>
          </div>
        )}
      </div>
    </div>
  );
}
