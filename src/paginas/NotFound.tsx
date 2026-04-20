import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <main className="not-found-page">
      <section className="not-found-card">
        <span className="not-found-code">404</span>
        <h1 className="not-found-title">Pagina nao encontrada</h1>
        <p className="not-found-text">
          A rota que voce tentou acessar nao existe ou foi movida. Volte para a pagina inicial
          ou entre na sua area.
        </p>

        <div className="not-found-actions">
          <Link to="/" className="not-found-primary">
            Voltar ao inicio
          </Link>
          <Link to="/login" className="not-found-secondary">
            Ir para login
          </Link>
        </div>
      </section>
    </main>
  );
}
