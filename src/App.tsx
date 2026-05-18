import { useEffect } from 'react';
import {
  BrowserRouter as Router,
  Link,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from 'react-router-dom';
import './App.css';
import BarberPainel from './paginas/barberPainel';
import Cadastro from './paginas/cadastro';
import Login from './paginas/login';
import NotFound from './paginas/NotFound';
import BarberSignup from './paginas/barberSignup';
import PainelCliente from './paginas/painelCliente';
import PainelAdmin from './paginas/PainelAdmin';
import Verify from './paginas/verify';

const IconScissor = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/>
    <line x1="20" y1="4" x2="8.12" y2="15.88"/><line x1="14.47" y1="14.48" x2="20" y2="20"/>
    <line x1="8.12" y1="8.12" x2="12" y2="12"/>
  </svg>
);

function Navbar() {
  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <div className="logo-icon"><IconScissor /></div>
        <span>Dinamic Cut</span>
      </div>

      <div className="navbar-menu">
        <Link to="/login" className="nav-link">Log in</Link>
        <Link to="/cadastro" className="btn btn-primary" style={{ padding: '8px 20px', fontSize: '14px' }}>Registrar</Link>
      </div>
    </nav>
  );
}

function Navigation() {
  const navigate = useNavigate();

  return (
    <main className="hero">
      <Navbar />
      <div className="hero-content fade-in">
        <h1 className="hero-title reveal">
          Cortes dinâmicos para o seu estilo.
          <br />
          Escolha seu corte hoje.
          <br />
          Defina seu estilo de amanhã.
        </h1>

        <p style={{ color: 'var(--text-muted)', marginBottom: '32px', fontSize: '18px' }} className="reveal" data-revealdelay="100ms">
          Agende serviços premium nas melhores barbearias da região.
        </p>

        <button className="btn btn-primary reveal" style={{ padding: '16px 32px', fontSize: '16px' }} onClick={() => navigate('/cadastro')} data-revealdelay="200ms">
          Agende um corte ou torne-se parceiro
        </button>
      </div>
    </main>
  );
}

function RevealObserver() {
  const location = useLocation();

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        const element = entry.target as HTMLElement;
        if (entry.isIntersecting) {
          const delay = element.getAttribute('data-revealdelay') || '0ms';
          element.style.transitionDelay = delay;
          element.classList.add('reveal--visible');
          observer.unobserve(element);
        }
      }
    }, {
      threshold: 0.08,
    });

    const observeAll = () => {
      document
        .querySelectorAll<HTMLElement>('.reveal:not(.reveal--visible)')
        .forEach((element) => observer.observe(element));
    };

    observeAll();
    const timeoutId = window.setTimeout(observeAll, 60);

    return () => {
      window.clearTimeout(timeoutId);
      observer.disconnect();
    };
  }, [location]);

  return null;
}

export default function App() {
  return (
    <Router>
      <RevealObserver />
      <Routes>
        <Route path="/" element={<Navigation />} />
        <Route path="/login" element={<Login />} />
        <Route path="/barber-signup" element={<BarberSignup />} />
        <Route path="/cadastro" element={<Cadastro />} />
        <Route path="/painel" element={<PainelCliente />} />
        <Route path="/painel-admin" element={<PainelAdmin />} />
        <Route path="/barber-painel" element={<BarberPainel />} />
        <Route path="*" element={<NotFound />} />
        <Route path="/verify" element={<Verify />} />  
      </Routes>
    </Router>
  );
}
