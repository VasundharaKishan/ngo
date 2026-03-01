import { useEffect, useState, useRef } from 'react';
import { cmsApi, type HomepageStat } from '../../cmsApi';
import logger from '../../utils/logger';
import '../../pages/Home.css';

interface StatsSectionProps {
  config: {
    animated?: boolean;
    title?: string;
  };
}

/** Parse a stat string like "50,000+" or "$2.5M" into { prefix, value, suffix } */
function parseStatValue(raw: string): { prefix: string; value: number; suffix: string } {
  const str = raw.trim();
  const prefixMatch = str.match(/^([^0-9]*)/);
  const prefix = prefixMatch ? prefixMatch[1] : '';
  const rest = str.slice(prefix.length);
  const numMatch = rest.match(/^[\d,]+\.?\d*/);
  if (!numMatch) return { prefix, value: 0, suffix: rest };
  const numStr = numMatch[0].replace(/,/g, '');
  const value = parseFloat(numStr);
  const suffix = rest.slice(numMatch[0].length);
  return { prefix, value, suffix };
}

function formatCount(value: number, hasDecimal: boolean): string {
  if (hasDecimal) return value.toFixed(1);
  return Math.round(value).toLocaleString('en-US');
}

function easeOut(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

interface AnimatedStatProps {
  stat: { id?: string | number; statValue: string; statLabel: string };
  animate: boolean;
}

function AnimatedStat({ stat, animate }: AnimatedStatProps) {
  const { prefix, value, suffix } = parseStatValue(stat.statValue);
  const hasDecimal = stat.statValue.includes('.');
  const [displayed, setDisplayed] = useState(0);
  const rafRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const DURATION = 1500;

  useEffect(() => {
    if (!animate) return;
    startTimeRef.current = null;

    const tick = (now: number) => {
      if (startTimeRef.current === null) startTimeRef.current = now;
      const elapsed = now - startTimeRef.current;
      const progress = Math.min(elapsed / DURATION, 1);
      setDisplayed(value * easeOut(progress));
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick);
      }
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [animate, value]);

  const display = animate
    ? `${prefix}${formatCount(displayed, hasDecimal)}${suffix}`
    : stat.statValue;

  return (
    <div className="stat-card">
      <h3 className="stat-number">{display}</h3>
      <p className="stat-label">{stat.statLabel}</p>
    </div>
  );
}

const DEFAULT_STATS = [
  { id: 'd1', statValue: '20+', statLabel: 'Active Campaigns' },
  { id: 'd2', statValue: '8', statLabel: 'Causes We Support' },
  { id: 'd3', statValue: '5,000+', statLabel: 'Lives Impacted' },
  { id: 'd4', statValue: '$750K+', statLabel: 'Funds Raised' },
];

export default function StatsSection({ config }: StatsSectionProps) {
  const { animated = true, title = 'Our Impact' } = config;
  const [stats, setStats] = useState<HomepageStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasAnimated, setHasAnimated] = useState(false);
  const sectionRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const data = await cmsApi.getStats();
        setStats(data);
      } catch (error) {
        logger.error('StatsSection', 'Error loading stats:', error);
      } finally {
        setLoading(false);
      }
    };
    loadStats();
  }, []);

  useEffect(() => {
    if (!animated || hasAnimated) return;
    const el = sectionRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setHasAnimated(true);
          observer.disconnect();
        }
      },
      { threshold: 0.25 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [animated, hasAnimated, loading]);

  if (loading) return null;

  const displayStats: Array<{ id: string | number; statValue: string; statLabel: string }> =
    stats.length > 0 ? stats : DEFAULT_STATS;

  return (
    <section className="impact-stats" aria-label="Impact statistics" ref={sectionRef}>
      <div className="container">
        <h2 className="sr-only">{title}</h2>
        <div className="stats-grid">
          {displayStats.map((stat) => (
            <AnimatedStat
              key={stat.id}
              stat={stat}
              animate={animated && hasAnimated}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
