import { type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import './Layout.css';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="layout">
      <header className="header">
        <div className="container">
          <Link to="/" className="logo">
            <h1>🏫 Foundation for Education</h1>
          </Link>
          <nav className="nav">
            <Link to="/">Home</Link>
            <Link to="/campaigns">Campaigns</Link>
            <Link to="/campaigns" className="btn-primary">Donate Now</Link>
          </nav>
        </div>
      </header>

      <main className="main">
        {children}
      </main>

      <footer className="footer">
        <div className="container">
          <p>© 2025 Foundation for Education. Building schools, changing lives.</p>
          <p>Registered Charity | Email: contact@myfoundation.com</p>
        </div>
      </footer>
    </div>
  );
}
