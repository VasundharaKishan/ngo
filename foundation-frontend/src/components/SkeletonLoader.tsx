import './SkeletonLoader.css';

interface SkeletonLoaderProps {
  variant?: 'text' | 'card' | 'image' | 'stats' | 'hero';
  lines?: number;
  width?: string;
  height?: string;
  className?: string;
}

export default function SkeletonLoader({
  variant = 'text',
  lines = 3,
  width,
  height,
  className = ''
}: SkeletonLoaderProps) {
  if (variant === 'text') {
    return (
      <div className={`skeleton-text-container ${className}`}>
        {Array.from({ length: lines }).map((_, index) => (
          <div
            key={index}
            className="skeleton skeleton-text"
            style={{
              width: index === lines - 1 ? '60%' : '100%',
              ...(width && index === 0 ? { width } : {})
            }}
          />
        ))}
      </div>
    );
  }

  if (variant === 'card') {
    return (
      <div className={`skeleton-card ${className}`} style={{ width, height }}>
        <div className="skeleton skeleton-image" style={{ height: '200px' }} />
        <div className="skeleton-card-content">
          <div className="skeleton skeleton-text" style={{ width: '70%', height: '24px', marginBottom: '12px' }} />
          <div className="skeleton skeleton-text" style={{ width: '100%', height: '16px', marginBottom: '8px' }} />
          <div className="skeleton skeleton-text" style={{ width: '90%', height: '16px', marginBottom: '16px' }} />
          <div className="skeleton skeleton-progress" style={{ height: '8px', marginBottom: '12px' }} />
          <div className="skeleton-card-footer">
            <div className="skeleton skeleton-text" style={{ width: '40%', height: '14px' }} />
            <div className="skeleton skeleton-text" style={{ width: '30%', height: '14px' }} />
          </div>
        </div>
      </div>
    );
  }

  if (variant === 'image') {
    return (
      <div
        className={`skeleton skeleton-image ${className}`}
        style={{ width: width || '100%', height: height || '300px' }}
      />
    );
  }

  if (variant === 'stats') {
    return (
      <div className={`skeleton-stats ${className}`}>
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="skeleton-stat-item">
            <div className="skeleton skeleton-text" style={{ width: '60px', height: '48px', marginBottom: '8px' }} />
            <div className="skeleton skeleton-text" style={{ width: '80px', height: '16px' }} />
          </div>
        ))}
      </div>
    );
  }

  if (variant === 'hero') {
    return (
      <div className={`skeleton-hero ${className}`} style={{ height: height || '600px' }}>
        <div className="skeleton-hero-content">
          <div className="skeleton skeleton-text" style={{ width: '70%', height: '48px', marginBottom: '24px' }} />
          <div className="skeleton skeleton-text" style={{ width: '90%', height: '20px', marginBottom: '12px' }} />
          <div className="skeleton skeleton-text" style={{ width: '85%', height: '20px', marginBottom: '32px' }} />
          <div className="skeleton skeleton-button" style={{ width: '200px', height: '48px' }} />
        </div>
      </div>
    );
  }

  return (
    <div className={`skeleton ${className}`} style={{ width, height }} />
  );
}
