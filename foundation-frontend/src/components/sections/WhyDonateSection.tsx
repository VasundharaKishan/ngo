import { useEffect, useState } from 'react';
import { cmsApi } from '../../cmsApi';
import '../../pages/Home.css';

interface WhyDonateSectionProps {
  config: {
    showIcon?: boolean;
    title?: string;
  };
}

export default function WhyDonateSection({ config }: WhyDonateSectionProps) {
  const {
    title: configTitle
  } = config;

  const [content, setContent] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadContent = async () => {
      try {
        const data = await cmsApi.getContent('why_donate');
        setContent(data);
        setLoading(false);
      } catch (error) {
        console.error('Error loading why donate content:', error);
        setLoading(false);
      }
    };

    loadContent();
  }, []);

  if (loading) {
    return null;
  }

  const title = configTitle || content.title || 'Why Your Donation Matters';

  return (
    <section className="why-donate">
      <div className="container">
        <h2 className="section-title">{title}</h2>
        <div className="why-grid">
          <div className="why-card">
            <h3>{content.card2_title || '🌍 Global Reach'}</h3>
            <p>{content.card2_text || 'We are starting with focused initiatives in India and Ireland, with a long-term vision to expand our reach responsibly.'}</p>
          </div>
          <div className="why-card">
            <h3>{content.card3_title || '✅ Proven Results'}</h3>
            <p>{content.card3_text || 'Our approach is guided by research, community needs, and measurable goals as we build our impact step by step.'}</p>
          </div>
          <div className="why-card">
            <h3>{content.card4_title || '🤝 Local Partners'}</h3>
            <p>{content.card4_text || 'We collaborate closely with local individuals and community groups to understand real needs and deliver meaningful support.'}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
