import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation, Link } from 'react-router-dom'
import './App.css'
import Cadastro from './paginas/cadastro'
import Login from './paginas/login'
import PainelCliente from './paginas/painelCliente'
import PainelAdmin from './paginas/PainelAdmin'

function Navbar() {
  const navigate = useNavigate();
  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <div className="dots">
          <div className="dot dot-red"></div>
          <div className="dot dot-white"></div>
          <div className="dot dot-blue"></div>
        </div>
        <span>Dinamic Cut</span>
      </div>

      <div className="navbar-menu">
        <Link to="/login" className="nav-link">Log in</Link>
        <Link to="/cadastro" className="nav-link">Registrar</Link>
        <div className="search-wrapper">
          <input type="text" placeholder="Find a style..." className="search-bar" />
        </div>
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
          Cortes dinamicos para o seu estilo.<br />
          Escolha seu corte hoje.<br />
          Defina seu estilo de amanhã.
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
        const el = entry.target;
        if (entry.isIntersecting) {
          const delay = el.getAttribute('data-revealdelay') || '0ms';
          el.style.transitionDelay = delay;
          el.classList.add('reveal--visible');
          observer.unobserve(el);
        }
      }
    }, {
      threshold: 0.08,
    });
    const observeAll = () => {
      document.querySelectorAll('.reveal:not(.reveal--visible)').forEach((el) => observer.observe(el));
    };
    observeAll();
    const t = setTimeout(observeAll, 60);

    return () => {
      clearTimeout(t);
      observer.disconnect();
    };
  }, [location]);

  return null;
}

function App() {
  return (
    <Router>
      <RevealObserver />
      <Routes>
        <Route path="/" element={<Navigation />} />
        <Route path="/login" element={<Login />} />
        <Route path="/cadastro" element={<Cadastro />} />
        <Route path="/painel" element={<PainelCliente />} />
        <Route path="/painel-admin" element={<PainelAdmin />} />
      </Routes>
    </Router>
  );
}

export default App