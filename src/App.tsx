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
import ParceirosLogin from './paginas/parceirosLogin';
import PainelCliente from './paginas/painelCliente';
import PainelAdmin from './paginas/PainelAdmin';
import Verify from './paginas/verify';

function Navbar() {
  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <div className="dots">
          <div className="dot dot-red" />
          <div className="dot dot-white" />
          <div className="dot dot-blue" />
        </div>
        <span>Dinamic Cut</span>
      </div>

      <div className="navbar-menu">
        <Link to="/parceiros-login" className="nav-link">Parceiros</Link>
        <Link to="/login" className="nav-link">Log in</Link>
        <Link to="/cadastro" className="nav-link">Registrar</Link>
      </div>
    </nav>
  );
}

function Navigation() {
  const navigate = useNavigate();

  return (
    <main className="hero">
      <Navbar />
      <div className="hero-content">
        <h1 className="hero-title reveal">
          Cortes dinamicos para o seu estilo.
          <br />
          Escolha seu corte hoje.
          <br />
          Defina seu estilo de amanha.
        </h1>

        <button className="hero-cta-button reveal" onClick={() => navigate('/cadastro')}>
          Agende um corte ou se torne um parceiro
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
        <Route path="/parceiros-login" element={<ParceirosLogin />} />
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
