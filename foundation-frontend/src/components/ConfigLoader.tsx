import { useConfig } from '../contexts/ConfigContext';
import './ConfigLoader.css';

interface ConfigLoaderProps {
  children: React.ReactNode;
}

export default function ConfigLoader({ children }: ConfigLoaderProps) {
  const { loading, error } = useConfig();

  if (loading) {
    return (
      <div className="config-loader">
        <div className="config-loader-spinner"></div>
        <p>Loading site configuration...</p>
      </div>
    );
  }

  if (error) {
    console.warn('Config loading error (using defaults):', error);
    // Continue with defaults even if config fails to load
  }

  return <>{children}</>;
}
