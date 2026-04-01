import { useEffect, useState } from 'react';
import { api } from '../../server/api';
import type { MarketplacePlan } from '../types/domain';
import './css/PlanMarketplace.css';

type PlanMarketplaceProps = {
  estabelecimentoId?: number | string | null;
  onClose?: () => void;
};

export default function PlanMarketplace({
  estabelecimentoId,
  onClose,
}: PlanMarketplaceProps) {
  const [planos, setPlanos] = useState<MarketplacePlan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!estabelecimentoId) {
      setPlanos([]);
      setLoading(false);
      return;
    }

    void loadMarketplace();
  }, [estabelecimentoId]);

  async function loadMarketplace() {
    if (!estabelecimentoId) {
      return;
    }

    try {
      setLoading(true);
      const data = await api.getMarketplacePlanos(estabelecimentoId);
      setPlanos(data);
    } catch (caughtError) {
      console.error(caughtError);
      alert('Erro ao carregar marketplace');
    } finally {
      setLoading(false);
    }
  }

  async function handleParticipar(plano: MarketplacePlan) {
    const confirmed = window.confirm(
      `Deseja participar da parceria "${plano.nome}"?\n\nCriado por: ${plano.criador_nome}\nPreco: R$ ${Number(plano.preco).toFixed(2)}`,
    );

    if (!confirmed || !estabelecimentoId) {
      return;
    }

    try {
      await api.participarPlano(plano.id, estabelecimentoId);
      alert('Voce entrou na parceria com sucesso!');
      await loadMarketplace();
      onClose?.();
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : 'Erro ao participar do plano';
      alert(message);
    }
  }

  if (loading) {
    return <div className="marketplace-loading">Carregando planos disponiveis...</div>;
  }

  return (
    <div className="marketplace-container">
      <div className="marketplace-header">
        <h3>Marketplace de Planos</h3>
        <p className="marketplace-subtitle">
          Participe de planos criados por outras barbearias
        </p>
      </div>

      {planos.length === 0 ? (
        <div className="marketplace-empty">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <p>Nenhum plano disponivel no momento</p>
          <span>Todos os planos publicos ja foram adicionados ou nao existem planos disponiveis</span>
        </div>
      ) : (
        <div className="marketplace-grid">
          {planos.map((plano) => (
            <div key={plano.id} className="marketplace-card">
              <div className="marketplace-card-header">
                <h4>{plano.nome}</h4>
                <span className="marketplace-badge">
                  {plano.num_parceiros} {plano.num_parceiros === 1 ? 'parceiro' : 'parceiros'}
                </span>
              </div>

              {plano.description && (
                <p className="marketplace-description">{plano.description}</p>
              )}

              <div className="marketplace-details">
                <div className="marketplace-detail">
                  <span className="detail-label">Criado por:</span>
                  <span className="detail-value">{plano.criador_nome}</span>
                </div>
                {plano.criador_cidade && (
                  <div className="marketplace-detail">
                    <span className="detail-label">Cidade:</span>
                    <span className="detail-value">{plano.criador_cidade}</span>
                  </div>
                )}
                <div className="marketplace-detail">
                  <span className="detail-label">Preco:</span>
                  <span className="detail-value price">R$ {Number(plano.preco).toFixed(2)}</span>
                </div>
                <div className="marketplace-detail">
                  <span className="detail-label">Ciclo:</span>
                  <span className="detail-value">{plano.ciclo_pagamento}</span>
                </div>
                {plano.dias_freetrial > 0 && (
                  <div className="marketplace-detail">
                    <span className="detail-label">Free Trial:</span>
                    <span className="detail-value">{plano.dias_freetrial} dias</span>
                  </div>
                )}
              </div>

              <button
                className="btn-participar"
                onClick={() => {
                  void handleParticipar(plano);
                }}
              >
                Participar da Parceria
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
