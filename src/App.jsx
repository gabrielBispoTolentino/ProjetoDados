import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import './App.css'
import Cadastro from './paginas/cadastro'
import Login from './paginas/login'
import PainelCliente from './paginas/painelCliente'

function Navigation() {
  const navigate = useNavigate();

  return (
    <div>
      <h2 className="reveal">Bem vindo ao nosso sistema de barbearias</h2>
      <button className="reveal" data-revealdelay="120ms" onClick={() => navigate('/login')}>Login</button><br />
      <button className="reveal" data-revealdelay="240ms" onClick={() => navigate('/cadastro')}>Cadastrar</button>
    </div>
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
      </Routes>
    </Router>
  );
}


export default App
