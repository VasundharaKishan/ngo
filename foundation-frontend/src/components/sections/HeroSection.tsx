import { Link } from 'react-router-dom';
import '../../pages/Home.css';

interface HeroSectionProps {
  config: {
    title?: string;
    subtitle?: string;
    ctaText?: string;
    ctaLink?: string;
  };
}

export default function HeroSection({ config }: HeroSectionProps) {
  const {
    title = 'Every Act of Kindness Changes Lives',
    subtitle = 'From feeding the hungry to empowering women, from educating children to providing clean water - your generosity creates ripples of hope across communities. Join thousands of donors making a real difference today.',
    ctaText = 'Explore All Campaigns →',
    ctaLink = '/campaigns'
  } = config;

  return (
    <section className="hero" aria-label="Welcome hero section">
      <div className="container">
        <h1 className="animate-fade-in-up">{title}</h1>
        <p className="hero-text animate-fade-in-up animate-delay-200">{subtitle}</p>
        <Link to={ctaLink} className="btn-hero btn-press hover-lift animate-fade-in-up animate-delay-400" aria-label={`${ctaText} - View our campaigns`}>
          {ctaText}
        </Link>
      </div>
    </section>
  );
}
