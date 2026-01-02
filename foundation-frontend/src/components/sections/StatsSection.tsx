import { useEffect, useState } from 'react';
import { cmsApi, type HomepageStat } from '../../cmsApi';
import '../../pages/Home.css';

interface StatsSectionProps {
  config: {
    animated?: boolean;
    title?: string;
  };
}

export default function StatsSection({ config }: StatsSectionProps) {
  const { animated = true, title = 'Our Impact' } = config;
  const [stats, setStats] = useState<HomepageStat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const data = await cmsApi.getStats();
        setStats(data);
        setLoading(false);
      } catch (error) {
        console.error('Error loading stats:', error);
        setLoading(false);
      }
    };

    loadStats();
  }, []);

  if (loading) {
    return null;
  }

  return (
    <section className="impact-stats" aria-label="Impact statistics">
      <div className="container">
        <h2 className="sr-only">{title}</h2>
        <div className="stats-grid">
          {stats.length > 0 ? stats.map(stat => (
            <div key={stat.id} className={`stat-card ${animated ? 'animated' : ''}`}>
              <h3 className="stat-number">{stat.statValue}</h3>
              <p className="stat-label">{stat.statLabel}</p>
            </div>
          )) : (
            <>
              <div className="stat-card">
                <h3 className="stat-number">20+</h3>
                <p className="stat-label">Active Campaigns</p>
              </div>
              <div className="stat-card">
                <h3 className="stat-number">8</h3>
                <p className="stat-label">Causes We Support</p>
              </div>
              <div className="stat-card">
                <h3 className="stat-number">5,000+</h3>
                <p className="stat-label">Lives Impacted</p>
              </div>
              <div className="stat-card">
                <h3 className="stat-number">$750K+</h3>
                <p className="stat-label">Funds Raised</p>
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
