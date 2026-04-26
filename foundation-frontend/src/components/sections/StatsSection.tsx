/**
 * Impact statistics section — matches mockup "Our work so far" section.
 *
 * Left-aligned eyebrow + Fraunces heading + description,
 * 4-column stat cards with count-up animation and trust-blue Fraunces numbers.
 */
import { useEffect, useState, useRef } from 'react';
import { cmsApi, type HomepageStat } from '../../cmsApi';
import logger from '../../utils/logger';
import './StatsSection.css';

interface StatsSectionProps {
  config: {
    animated?: boolean;
    title?: string;
    eyebrow?: string;
    subtitle?: string;
  };
}

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
  return Math.round(value).toLocaleString('en-IN');
}

function easeOut(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

function AnimatedStat({
  stat,
  animate,
}: {
  stat: { id?: string | number; statValue: string; statLabel: string };
  animate: boolean;
}) {
  const { prefix, value, suffix } = parseStatValue(stat.statValue);
  const hasDecimal = stat.statValue.includes('.');
  const [displayed, setDisplayed] = useState(0);
  const rafRef = useRef<number | null>(null);
  const startRef = useRef<number | null>(null);
  const DURATION = 1400;

  useEffect(() => {
    if (!animate) return;
    startRef.current = null;

    const tick = (now: number) => {
      if (startRef.current === null) startRef.current = now;
      const p = Math.min((now - startRef.current) / DURATION, 1);
      setDisplayed(value * easeOut(p));
      if (p < 1) rafRef.current = requestAnimationFrame(tick);
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
    <div className="stats-card">
      <div className="stats-card-number font-display">{display}</div>
      <div className="stats-card-label">{stat.statLabel}</div>
    </div>
  );
}

const DEFAULT_STATS = [
  { id: 'd1', statValue: '5,432', statLabel: 'Children reached' },
  { id: 'd2', statValue: '47', statLabel: 'Villages served' },
  { id: 'd3', statValue: '312', statLabel: 'Monthly donors' },
  { id: 'd4', statValue: '92%', statLabel: 'To programmes' },
];

export default function StatsSection({ config }: StatsSectionProps) {
  const {
    animated = true,
    title = 'Small gifts. Specific lives. Real numbers.',
    eyebrow = 'Our work so far',
    subtitle = 'Figures below are maintained by our volunteers and cross-checked against school registers. Spending reports are published quarterly.',
  } = config;

  const [stats, setStats] = useState<HomepageStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasAnimated, setHasAnimated] = useState(false);
  const sectionRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await cmsApi.getStats();
        setStats(data);
      } catch (error) {
        logger.error('StatsSection', 'Error loading stats:', error);
      } finally {
        setLoading(false);
      }
    };
    load();
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
      { threshold: 0.4 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [animated, hasAnimated, loading]);

  if (loading) return null;

  const displayStats = stats.length > 0 ? stats : DEFAULT_STATS;

  return (
    <section
      id="impact"
      className="stats-section"
      aria-labelledby="stats-section-title"
      ref={sectionRef}
    >
      <div className="stats-container">
        {/* Left-aligned header */}
        <div className="stats-header">
          <div className="stats-eyebrow">{eyebrow}</div>
          <h2 id="stats-section-title" className="stats-title font-display">{title}</h2>
          <p className="stats-subtitle">{subtitle}</p>
        </div>

        {/* Stat cards */}
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
