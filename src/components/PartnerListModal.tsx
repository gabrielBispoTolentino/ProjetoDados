import { useEffect, useState } from 'react';
import { api } from '../../server/api';
import type { PlanPartner } from '../types/domain';
import './css/PartnerListModal.css';

type PartnerListModalProps = {
  planoId?: number | null;
  planoNome?: string;
  isOpen: boolean;
  onClose: () => void;
};

export default function PartnerListModal({
  planoId,
  planoNome,
  isOpen,
  onClose,
}: PartnerListModalProps) {
  const [parceiros, setParceiros] = useState<PlanPartner[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isOpen || !planoId) {
      return;
    }

    void loadParceiros();
  }, [isOpen, planoId]);

  async function loadParceiros() {
    if (!planoId) {
      return;
    }

    try {
      setLoading(true);
      const data = await api.getPlanoParceiros(planoId);
      setParceiros(data);
    } catch (caughtError) {
      console.error(caughtError);
      alert('Erro ao carregar parceiros');
    } finally {
      setLoading(false);
    }
  }

  if (!isOpen) {
    return null;
  }

  return (
    <div className="partner-modal-overlay" onClick={onClose}>
      <div className="partner-modal-content" onClick={(event) => event.stopPropagation()}>
        <button className="partner-modal-close" onClick={onClose}>x</button>

        <div className="partner-modal-header">
          <h3>Parceiros do Plano</h3>
          <p className="partner-modal-subtitle">{planoNome}</p>
        </div>

        {loading ? (
          <div className="partner-loading">Carregando parceiros...</div>
        ) : parceiros.length === 0 ? (
          <div className="partner-empty">
            <p>Nenhum parceiro encontrado</p>
          </div>
        ) : (
          <div className="partner-list">
            {parceiros.map((parceiro) => (
              <div key={parceiro.id} className="partner-item">
                <div className="partner-info">
                  <div className="partner-name-row">
                    <h4>{parceiro.estabelecimento_nome}</h4>
                    {Number(parceiro.is_criador) === 1 && (
                      <span className="partner-badge-criador">Criador</span>
                    )}
                  </div>
                  <p className="partner-location">
                    {parceiro.cidade}, {parceiro.stado}
                  </p>
                  <p className="partner-date">
                    Parceiro desde {new Date(parceiro.data_entrada).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="partner-modal-footer">
          <p className="partner-count">
            {parceiros.length} {parceiros.length === 1 ? 'estabelecimento parceiro' : 'estabelecimentos parceiros'}
          </p>
        </div>
      </div>
    </div>
  );
}
