'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import {
  Coins, Lock, TrendingUp, Dices, ChartLine, Trophy,
  Sparkles, Shield, Code2, Link2, Zap, CircleDot,
} from 'lucide-react';
import HeroStats from '@/components/landing/hero-stats';
import TokenomicsChart from '@/components/landing/tokenomics-chart';
import RevenueCalculator from '@/components/landing/revenue-calculator';
import CountdownTimer from '@/components/landing/countdown-timer';
import LiveWinners, { WinnerToast } from '@/components/landing/live-winners';

/* ─── Reusable scroll-animated section wrapper ─── */
function Section({ children, className = '', id }: { children: React.ReactNode; className?: string; id?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });
  return (
    <motion.section
      ref={ref}
      id={id}
      initial={{ opacity: 0, y: 50 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7 }}
      className={`relative py-20 md:py-28 px-4 md:px-8 ${className}`}
    >
      {children}
    </motion.section>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="text-3xl md:text-4xl font-bold text-center mb-16 gradient-text">{children}</h2>;
}

/* ─── Badge component ─── */
function Badge({ text, variant }: { text: string; variant: 'green' | 'orange' | 'gray' }) {
  const colors = {
    green: 'bg-green-500/20 text-green-400 border-green-500/30',
    orange: 'bg-betcoin-primary/20 text-betcoin-primary border-betcoin-primary/30',
    gray: 'bg-white/10 text-gray-300 border-white/20',
  };
  return (
    <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full border ${colors[variant]}`}>
      {text}
    </span>
  );
}

/* ─── Floating decorative elements ─── */
function FloatingElements() {
  const items = [
    { x: '10%', y: '20%', size: 6, delay: 0 },
    { x: '85%', y: '15%', size: 4, delay: 1 },
    { x: '75%', y: '70%', size: 8, delay: 0.5 },
    { x: '15%', y: '75%', size: 5, delay: 1.5 },
    { x: '50%', y: '10%', size: 3, delay: 2 },
  ];
  return (
    <>
      {items.map((item, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full bg-betcoin-primary/20 blur-sm"
          style={{ left: item.x, top: item.y, width: item.size, height: item.size }}
          animate={{ y: [0, -15, 0], opacity: [0.3, 0.7, 0.3] }}
          transition={{ duration: 4, delay: item.delay, repeat: Infinity, ease: 'easeInOut' }}
        />
      ))}
    </>
  );
}

/* ═══════════════════════════════════════════════ */
/*                   PAGE                          */
/* ═══════════════════════════════════════════════ */

export default function Home() {
  const steps = [
    { icon: Coins, title: 'Compre BETPASS', desc: 'Adquira tokens BETPASS no lançamento por $1 cada' },
    { icon: Lock, title: 'Faça Stake', desc: 'Trave seus tokens no pool de staking e comece a ganhar' },
    { icon: TrendingUp, title: 'Receba Receita', desc: '25% de todas as taxas da plataforma são distribuídas para stakers' },
  ];

  const games = [
    { icon: CircleDot, name: 'CoinFlip', desc: 'Cara ou Coroa', detail: 'Payout 1.96x', available: true },
    { icon: Dices, name: 'Dice', desc: 'Dados 1-100', detail: 'Odds dinâmicas até 98x', available: true },
    { icon: ChartLine, name: 'Crash', desc: 'Crash Game', detail: 'Cash out antes do crash', available: true },
    { icon: Trophy, name: 'Esportivas', desc: 'Apostas Esportivas', detail: 'Futebol, NBA, UFC', available: false },
    { icon: Sparkles, name: 'Predictions', desc: 'Mercados Preditivos', detail: 'Previsões descentralizadas', available: false },
  ];

  const security = [
    { icon: Shield, title: 'Sem Login, Sem Cadastro', desc: 'Conecte apenas sua carteira. Sem email, sem senha, sem KYC. Privacidade total.' },
    { icon: Code2, title: 'Código Open Source', desc: 'Contratos auditados e verificados na blockchain. Código aberto no GitHub.' },
    { icon: Link2, title: 'Chainlink VRF', desc: 'Resultados gerados por oráculo descentralizado. Impossível manipular.' },
    { icon: Zap, title: 'Polygon Blockchain', desc: 'Transações em segundos, taxas de centavos. Sem intermediários.' },
  ];

  const roadmap = [
    { quarter: 'Q1 2026', title: 'Token Launch + CoinFlip + Dice', status: 'done' as const },
    { quarter: 'Q2 2026', title: 'Crash Game + Apostas Esportivas', status: 'progress' as const },
    { quarter: 'Q3 2026', title: 'PIX Onramp + Prediction Markets', status: 'upcoming' as const },
    { quarter: 'Q4 2026', title: 'Mainnet Launch + Auditoria', status: 'upcoming' as const },
  ];

  return (
    <main className="scroll-smooth overflow-x-hidden">
      <WinnerToast />

      {/* ───── HERO ───── */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-4 bg-grid">
        <FloatingElements />
        {/* Gradient orbs */}
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-betcoin-primary/5 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-purple-500/5 rounded-full blur-[120px] pointer-events-none" />

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="relative z-10 text-center max-w-4xl"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="inline-block mb-6 px-4 py-1.5 rounded-full glass-card text-sm text-gray-300"
          >
            Sem Login &bull; Apenas Wallet &bull; 100% Anonimo &bull; Revenue Share
          </motion.div>

          <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold leading-tight mb-6">
            <span className="gradient-text">A Plataforma de Apostas</span>
            <br />
            <span className="text-white">do Futuro</span>
          </h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="text-lg md:text-xl text-gray-400 mb-4 max-w-2xl mx-auto"
          >
            Invista em BETPASS e receba 25% de todas as taxas da plataforma
          </motion.p>

          {/* Urgency trigger */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="flex items-center justify-center gap-2 mb-10"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
            </span>
            <span className="text-sm text-red-400 font-medium">
              Apenas <span className="font-bold font-mono">2.847.500</span> tokens restantes de 3.000.000
            </span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <a
              href="#token-sale"
              className="px-8 py-4 rounded-xl font-bold text-lg text-white bg-gradient-to-r from-betcoin-primary to-betcoin-primary-light shadow-glow-orange hover:shadow-[0_0_40px_rgba(247,147,26,0.5)] transition-all duration-300 hover:scale-105"
            >
              Comprar BETPASS
            </a>
            <a
              href="/coinflip"
              className="px-8 py-4 rounded-xl font-bold text-lg text-white border border-white/20 hover:border-white/40 hover:bg-white/5 transition-all duration-300"
            >
              Acessar Plataforma
            </a>
          </motion.div>
        </motion.div>

        <HeroStats />
      </section>

      {/* ───── DIFERENCIAIS ───── */}
      <Section>
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { emoji: '🔒', title: 'Sem Login', desc: 'Conecte sua carteira e jogue. Sem email, sem senha, sem KYC.' },
              { emoji: '👤', title: '100% Anônimo', desc: 'Nenhuma identificação pessoal. Apenas sua wallet.' },
              { emoji: '⏰', title: 'Investimento Limitado', desc: 'Pré-venda por tempo limitado. Quando acabar, acabou.' },
              { emoji: '📊', title: 'Auditoria Independente', desc: 'Contratos auditados por empresa terceira antes do lançamento.' },
            ].map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                className="glass-card p-5 text-center"
              >
                <div className="text-3xl mb-3">{item.emoji}</div>
                <h3 className="text-white font-bold mb-1">{item.title}</h3>
                <p className="text-gray-400 text-xs">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </Section>

      {/* ───── COMO FUNCIONA ───── */}
      <Section>
        <div className="max-w-5xl mx-auto">
          <SectionTitle>Como Funciona</SectionTitle>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {steps.map((step, i) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.15 }}
                className="glass-card p-8 text-center hover:border-betcoin-primary/30 transition-colors"
              >
                <div className="w-14 h-14 rounded-2xl bg-betcoin-primary/10 flex items-center justify-center mx-auto mb-5">
                  <step.icon className="w-7 h-7 text-betcoin-primary" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">{step.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </Section>

      {/* ───── TOKENOMICS ───── */}
      <Section>
        <div className="max-w-5xl mx-auto">
          <SectionTitle>Tokenomics</SectionTitle>
          <TokenomicsChart />
        </div>
      </Section>

      {/* ───── REVENUE CALCULATOR ───── */}
      <Section>
        <div className="max-w-5xl mx-auto">
          <SectionTitle>Calcule Seu Retorno</SectionTitle>
          <RevenueCalculator />
        </div>
      </Section>

      {/* ───── JOGOS ───── */}
      <Section>
        <div className="max-w-5xl mx-auto">
          <SectionTitle>Jogos da Plataforma</SectionTitle>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {games.map((game, i) => (
              <motion.div
                key={game.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="glass-card p-6 hover:border-betcoin-primary/30 transition-all duration-300 group"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-betcoin-primary/10 flex items-center justify-center group-hover:bg-betcoin-primary/20 transition-colors">
                    <game.icon className="w-6 h-6 text-betcoin-primary" />
                  </div>
                  {game.available ? (
                    <Badge text="Disponível" variant="green" />
                  ) : (
                    <Badge text="Em Breve" variant="orange" />
                  )}
                </div>
                <h3 className="text-lg font-bold text-white mb-1">{game.desc}</h3>
                <p className="text-gray-400 text-sm">{game.detail}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </Section>

      {/* ───── SECURITY ───── */}
      <Section>
        <div className="max-w-5xl mx-auto">
          <SectionTitle>Segurança e Transparência</SectionTitle>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {security.map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="glass-card p-6 text-center hover:border-betcoin-primary/30 transition-colors"
              >
                <div className="w-12 h-12 rounded-xl bg-betcoin-primary/10 flex items-center justify-center mx-auto mb-4">
                  <item.icon className="w-6 h-6 text-betcoin-primary" />
                </div>
                <h3 className="text-sm font-bold text-white mb-2">{item.title}</h3>
                <p className="text-gray-400 text-xs leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </Section>

      {/* ───── ROADMAP ───── */}
      <Section>
        <div className="max-w-3xl mx-auto">
          <SectionTitle>Roadmap</SectionTitle>
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-4 md:left-8 top-0 bottom-0 w-px bg-white/10" />
            <div className="space-y-8">
              {roadmap.map((item, i) => (
                <motion.div
                  key={item.quarter}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.15 }}
                  className="relative pl-12 md:pl-20"
                >
                  {/* Dot */}
                  <div className={`absolute left-2.5 md:left-6.5 top-4 w-3 h-3 rounded-full border-2 ${
                    item.status === 'done' ? 'bg-green-400 border-green-400' :
                    item.status === 'progress' ? 'bg-betcoin-primary border-betcoin-primary animate-pulse' :
                    'bg-transparent border-white/30'
                  }`} />
                  <div className="glass-card p-6">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="font-mono text-betcoin-primary font-bold text-sm">{item.quarter}</span>
                      {item.status === 'done' && <Badge text="Concluído" variant="green" />}
                      {item.status === 'progress' && <Badge text="Em Progresso" variant="orange" />}
                    </div>
                    <p className="text-white font-medium">{item.title}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </Section>

      {/* ───── CTA FINAL ───── */}
      <section id="token-sale" className="relative min-h-screen flex flex-col items-center justify-center px-4 bg-grid">
        <div className="absolute inset-0 bg-gradient-to-t from-betcoin-primary/5 to-transparent pointer-events-none" />
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="relative z-10 text-center max-w-3xl"
        >
          <h2 className="text-3xl md:text-5xl font-bold mb-4">
            <span className="gradient-text">Investimento por Tempo Limitado</span>
          </h2>
          <p className="text-gray-400 text-lg mb-4">
            Conecte sua wallet e garanta seus BETPASS. Sem login, sem cadastro, sem KYC.
          </p>

          {/* Scarcity + Social proof triggers */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10 text-sm">
            <div className="glass-card px-4 py-2 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-gray-300"><span className="text-white font-bold font-mono">1.247</span> investidores ja compraram</span>
            </div>
            <div className="glass-card px-4 py-2 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-gray-300">Pre-sale encerra em breve</span>
            </div>
          </div>

          <div className="mb-10">
            <CountdownTimer />
          </div>

          <motion.a
            href="#"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.97 }}
            className="inline-block px-10 py-5 rounded-xl font-bold text-xl text-white bg-gradient-to-r from-betcoin-primary to-betcoin-primary-light shadow-glow-orange animate-glow-pulse hover:shadow-[0_0_50px_rgba(247,147,26,0.6)] transition-all duration-300"
          >
            Comprar BETPASS Agora
          </motion.a>

          <p className="mt-8 text-gray-500 text-sm">
            Já tem conta?{' '}
            <a href="/coinflip" className="text-betcoin-primary hover:underline">
              Acessar plataforma &rarr;
            </a>
          </p>
        </motion.div>
      </section>

      {/* ───── DISCLAIMER ───── */}
      <Section>
        <div className="max-w-3xl mx-auto">
          <div className="glass-card p-8 border-yellow-500/20">
            <h3 className="text-yellow-400 font-bold text-lg mb-4 flex items-center gap-2">
              <span className="text-2xl">⚠️</span> Aviso Legal — Leia Antes de Investir
            </h3>
            <div className="space-y-3 text-gray-400 text-sm leading-relaxed">
              <p>
                <strong className="text-white">Investimento em criptoativos nao e garantia de retorno futuro.</strong> O valor dos tokens BETPASS pode variar significativamente e voce pode perder parte ou todo o capital investido. Apostas sao feitas em USDT.
              </p>
              <p>
                Rentabilidades passadas nao sao indicativas de resultados futuros. O revenue share depende do volume de apostas na plataforma, que pode variar.
              </p>
              <p>
                Os valores, projecoes e estimativas apresentados neste site sao meramente ilustrativos e nao constituem promessa ou garantia de rendimento.
              </p>
              <p>
                Antes de investir, avalie cuidadosamente sua situacao financeira e tolerancia a risco. Invista apenas o que voce pode se dar ao luxo de perder.
              </p>
              <p className="text-gray-500 text-xs pt-2 border-t border-white/5">
                BETPASS e um utility token que da direito a participacao nas receitas da plataforma via staking. Nao constitui valor mobiliario, acao ou titulo de divida. A plataforma BetCoin opera na blockchain Polygon e esta sujeita aos riscos inerentes de contratos inteligentes e protocolos descentralizados.
              </p>
            </div>
          </div>
        </div>
      </Section>

      {/* ───── FOOTER ───── */}
      <footer className="border-t border-white/5 py-12 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="text-2xl font-bold gradient-text">BetCoin</div>
            <div className="flex gap-6 text-sm text-gray-400">
              <a href="#" className="hover:text-white transition-colors">Whitepaper</a>
              <a href="#" className="hover:text-white transition-colors">GitHub</a>
              <a href="#" className="hover:text-white transition-colors">Discord</a>
              <a href="#" className="hover:text-white transition-colors">Twitter</a>
            </div>
          </div>
          <div className="mt-8 text-center text-xs text-gray-600">
            <p>&copy; 2026 BetCoin. Todos os direitos reservados.</p>
            <p className="mt-2">Investimento em criptoativos envolve riscos significativos. Rentabilidade passada não é garantia de retorno futuro. Faça sua própria pesquisa (DYOR) antes de investir.</p>
          </div>
        </div>
      </footer>
    </main>
  );
}
