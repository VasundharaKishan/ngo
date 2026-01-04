import './Spinner.css';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: 'primary' | 'secondary' | 'white';
  centered?: boolean;
  text?: string;
  className?: string;
}

export default function Spinner({
  size = 'md',
  color = 'primary',
  centered = false,
  text,
  className = ''
}: SpinnerProps) {
  const spinnerClasses = `spinner spinner-${size} spinner-${color} ${className}`;
  const containerClasses = `spinner-container ${centered ? 'spinner-centered' : ''}`;

  return (
    <div className={containerClasses}>
      <div className={spinnerClasses} role="status" aria-live="polite">
        <span className="sr-only">Loading...</span>
      </div>
      {text && <p className="spinner-text">{text}</p>}
    </div>
  );
}
