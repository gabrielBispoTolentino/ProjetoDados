import { useEffect, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { api } from '../../server/api';
import type { BarberSummary, Establishment } from '../types/domain';
import './css/BarbersModal.css';

export type BarberFormData = {
  nome: string;
  email: string;
  senha: string;
  cpf: string;
  telefone: string;
};

type Props = {
  isOpen: boolean;
  barbershop: (Establishment & { nome?: string; name?: string }) | null;
  barbers: BarberSummary[];
  barberForm: BarberFormData;
  loading: boolean;
  saving: boolean;
  deletingBarberId: number | null;
  error: string;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void | Promise<void>;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onDelete: (barber: BarberSummary) => void | Promise<void>;
};

export default function BarbersModal({
  isOpen,
  barbershop,
  barbers,
  barberForm,
  loading,
  saving,
  deletingBarberId,
  error,
  onClose,
  onSubmit,
  onChange,
  onDelete,
}: Props) {
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsCreateOpen(false);
    }
  }, [isOpen, barbershop?.id]);

  if (!isOpen || !barbershop) {
    return null;
  }

  return (
    <div className="admin-modal-backdrop" onClick={onClose}>
      <div
        className="card admin-modal-container admin-barber-modal"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          className="admin-modal-close"
          onClick={onClose}
        >
          x
        </button>
        <h2>Barbeiros</h2>
        <p className="admin-barber-subtitle">
          {barbershop.name || barbershop.nome}
        </p>

        {error && <div className="admin-error">{error}</div>}

        <div className="admin-barber-grid">
          <section className="admin-barber-panel admin-barber-list-panel">
            <div className="admin-barber-panel-header">
              <h3>Equipe atual</h3>
              <button
                type="button"
                className="admin-barber-toggle"
                onClick={() => setIsCreateOpen((currentState) => !currentState)}
                aria-expanded={isCreateOpen}
                aria-label={isCreateOpen ? 'Fechar novo barbeiro' : 'Abrir novo barbeiro'}
              >
                {isCreateOpen ? 'x' : '+'}
              </button>
            </div>
            {loading ? (
              <div className="loader">Carregando barbeiros...</div>
            ) : barbers.length === 0 ? (
              <p className="admin-barber-empty">Nenhum barbeiro cadastrado ainda.</p>
            ) : (
              <div className="admin-barber-list">
                {barbers.map((barber) => (
                  <article key={barber.id} className="admin-barber-card">
                    <div className="admin-barber-avatar">
                      {barber.imagem_url || barber.fotoUrl || barber.foto_url ? (
                        <img
                          src={api.getPhotoUrl(barber.imagem_url || barber.fotoUrl || barber.foto_url) || undefined}
                          alt={barber.nome}
                        />
                      ) : (
                        <span>{barber.nome.slice(0, 1).toUpperCase()}</span>
                      )}
                    </div>
                    <div className="admin-barber-meta">
                      <strong>{barber.nome}</strong>
                      <span>{barber.email}</span>
                      <span>{barber.telefone || 'Sem telefone'}</span>
                      <span>Codigo: {barber.verifycode || 'Nao gerado'}</span>
                      <span>Status: {barber.verified ? 'Verificado' : 'Nao verificado'}</span>
                    </div>
                    <button
                      type="button"
                      className="admin-barber-delete"
                      onClick={() => void onDelete(barber)}
                      disabled={deletingBarberId === barber.id}
                    >
                      {deletingBarberId === barber.id ? '...' : 'x'}
                    </button>
                  </article>
                ))}
              </div>
            )}
          </section>

          {isCreateOpen && (
            <section className="admin-barber-panel admin-barber-create-panel">
              <h3>Novo barbeiro</h3>
              <form onSubmit={onSubmit} className="admin-barber-form">
                <label htmlFor="barber-nome">Nome *</label>
                <input
                  id="barber-nome"
                  type="text"
                  name="nome"
                  value={barberForm.nome}
                  onChange={onChange}
                  required
                  disabled={saving}
                  placeholder="Ex: Joao Silva"
                />

                <label htmlFor="barber-email">Email *</label>
                <input
                  id="barber-email"
                  type="email"
                  name="email"
                  value={barberForm.email}
                  onChange={onChange}
                  required
                  disabled={saving}
                  placeholder="Ex: barbeiro@barbearia.com"
                />

                <label htmlFor="barber-senha">Senha *</label>
                <input
                  id="barber-senha"
                  type="password"
                  name="senha"
                  value={barberForm.senha}
                  onChange={onChange}
                  required
                  disabled={saving}
                  placeholder="Crie uma senha"
                />

                <label htmlFor="barber-cpf">CPF *</label>
                <input
                  id="barber-cpf"
                  type="text"
                  name="cpf"
                  value={barberForm.cpf}
                  onChange={onChange}
                  required
                  disabled={saving}
                  placeholder="Ex: 123.456.789-10"
                />

                <label htmlFor="barber-telefone">Telefone *</label>
                <input
                  id="barber-telefone"
                  type="tel"
                  name="telefone"
                  value={barberForm.telefone}
                  onChange={onChange}
                  required
                  disabled={saving}
                  placeholder="Ex: (11) 98765-4321"
                />

                <div className="admin-form-actions">
                  <button type="submit" className="btn btn-primary admin-form-btn-submit" disabled={saving}>
                    {saving ? 'Criando...' : 'Criar barbeiro'}
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline admin-form-btn-cancel"
                    onClick={() => setIsCreateOpen(false)}
                    disabled={saving}
                  >
                    Fechar
                  </button>
                </div>
              </form>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
