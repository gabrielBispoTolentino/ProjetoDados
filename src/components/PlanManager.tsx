import { useEffect, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { api } from '../../server/api';
import { useFeedback } from './FeedbackProvider';
import { PlanCardSkeletons } from './Skeleton';
import PlanMarketplace from './PlanMarketplace';
import PartnerListModal from './PartnerListModal';
import BenefitManager from './BenefitManager';
import type { AvailablePlan, CreatePlanPayload, UpdatePlanPayload } from '../types/domain';
import './css/PlanManager.css';

type PlanManagerProps = {
  estabelecimentoId: number | string;
};

type PlanManagerTab = 'meus' | 'parcerias' | 'marketplace';

type PlanFormData = {
  nome: string;
  description: string;
  preco: string;
  ciclo_pagamento: string;
  dias_freetrial: string;
  active: boolean;
  is_public: boolean;
};

const INITIAL_FORM_DATA: PlanFormData = {
  nome: '',
  description: '',
  preco: '',
  ciclo_pagamento: 'mensalmente',
  dias_freetrial: '0',
  active: true,
  is_public: true,
};

function isActiveFlag(value: boolean | number | undefined): boolean {
  return typeof value === 'boolean' ? value : value === 1;
}

export default function PlanManager({ estabelecimentoId }: PlanManagerProps) {
  const feedback = useFeedback();
  const [activeTab, setActiveTab] = useState<PlanManagerTab>('meus');
  const [planos, setPlanos] = useState<AvailablePlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [partnerModalOpen, setPartnerModalOpen] = useState(false);
  const [selectedPlanoForPartners, setSelectedPlanoForPartners] = useState<AvailablePlan | null>(null);
  const [benefitModalOpen, setBenefitModalOpen] = useState(false);
  const [selectedPlanoForBenefits, setSelectedPlanoForBenefits] = useState<AvailablePlan | null>(null);
  const [formData, setFormData] = useState<PlanFormData>(INITIAL_FORM_DATA);

  useEffect(() => {
    void loadPlanos();
  }, [estabelecimentoId]);

  async function loadPlanos() {
    try {
      setLoading(true);
      const data = await api.getMyPlanos(estabelecimentoId);
      setPlanos(data);
    } catch (caughtError) {
      console.error(caughtError);
      feedback.error('Erro ao carregar planos');
    } finally {
      setLoading(false);
    }
  }

  function updateFormField<Key extends keyof PlanFormData>(key: Key, value: PlanFormData[Key]) {
    setFormData((currentForm) => ({
      ...currentForm,
      [key]: value,
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const payload: CreatePlanPayload | UpdatePlanPayload = {
      ...formData,
      criador_estabelecimento_id: Number(estabelecimentoId),
      estabelecimento_id: Number(estabelecimentoId),
      preco: Number(formData.preco),
      dias_freetrial: Number.parseInt(formData.dias_freetrial || '0', 10),
    };

    try {
      if (editingId) {
        await api.updatePlano(editingId, payload);
        feedback.success('Plano atualizado com sucesso!');
      } else {
        await api.createPlano(payload as CreatePlanPayload);
        feedback.success('Plano criado com sucesso!');
      }

      resetForm();
      await loadPlanos();
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : 'Erro ao salvar plano';
      feedback.error(message);
    }
  }

  function handleEdit(plano: AvailablePlan) {
    setFormData({
      nome: plano.nome,
      description: plano.description || '',
      preco: String(plano.preco),
      ciclo_pagamento: plano.ciclo_pagamento,
      dias_freetrial: String(plano.dias_freetrial ?? 0),
      active: isActiveFlag(plano.active),
      is_public: plano.is_public === undefined ? true : isActiveFlag(plano.is_public),
    });
    setEditingId(plano.id);
    setShowForm(true);
  }

  async function handleDelete(id: number) {
    const confirmed = await feedback.confirm({
      title: 'Deletar plano',
      message: 'Tem certeza que deseja deletar este plano?',
      confirmLabel: 'Deletar',
      cancelLabel: 'Cancelar',
      tone: 'danger',
    });

    if (!confirmed) {
      return;
    }

    try {
      await api.deletePlano(id, estabelecimentoId);
      feedback.success('Plano deletado com sucesso!');
      await loadPlanos();
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : 'Erro ao deletar plano';
      feedback.error(message);
    }
  }

  async function handleSairParceria(planoId: number, planoNome: string) {
    const confirmed = await feedback.confirm({
      title: 'Sair da parceria',
      message: `Tem certeza que deseja sair da parceria "${planoNome}"?`,
      confirmLabel: 'Sair da parceria',
      cancelLabel: 'Cancelar',
      tone: 'danger',
    });

    if (!confirmed) {
      return;
    }

    try {
      await api.sairPlano(planoId, estabelecimentoId);
      feedback.success('Voce saiu da parceria com sucesso!');
      await loadPlanos();
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : 'Erro ao sair da parceria';
      feedback.error(message);
    }
  }

  function resetForm() {
    setFormData(INITIAL_FORM_DATA);
    setEditingId(null);
    setShowForm(false);
  }

  const meusPlanos = planos.filter((plano) => plano.tipo === 'criador');
  const parcerias = planos.filter((plano) => plano.tipo === 'parceiro');

  if (loading) {
    return (
      <div className="plan-manager">
        <div className="plan-manager-header">
          <h2>Gerenciar Planos</h2>
        </div>
        <div className="plan-tabs">
          <button className="plan-tab active" type="button">Meus Planos</button>
          <button className="plan-tab" type="button">Parcerias</button>
          <button className="plan-tab" type="button">Marketplace</button>
        </div>
        <div className="plans-list">
          <PlanCardSkeletons count={3} />
        </div>
      </div>
    );
  }

  return (
    <div className="plan-manager">
      <div className="plan-manager-header">
        <h2>Gerenciar Planos</h2>
        {activeTab === 'meus' && (
          <button
            className="btn-new-plan"
            onClick={() => setShowForm((currentValue) => !currentValue)}
          >
            {showForm ? 'Cancelar' : '+ Novo Plano'}
          </button>
        )}
      </div>

      <div className="plan-tabs">
        <button
          className={`plan-tab ${activeTab === 'meus' ? 'active' : ''}`}
          onClick={() => setActiveTab('meus')}
        >
          Meus Planos
          {meusPlanos.length > 0 && <span className="tab-count">{meusPlanos.length}</span>}
        </button>
        <button
          className={`plan-tab ${activeTab === 'parcerias' ? 'active' : ''}`}
          onClick={() => setActiveTab('parcerias')}
        >
          Parcerias
          {parcerias.length > 0 && <span className="tab-count">{parcerias.length}</span>}
        </button>
        <button
          className={`plan-tab ${activeTab === 'marketplace' ? 'active' : ''}`}
          onClick={() => setActiveTab('marketplace')}
        >
          Marketplace
        </button>
      </div>

      {activeTab === 'marketplace' ? (
        <PlanMarketplace
          estabelecimentoId={estabelecimentoId}
          onClose={() => {
            void loadPlanos();
            setActiveTab('parcerias');
          }}
        />
      ) : (
        <>
          {showForm && activeTab === 'meus' && (
            <form className="plan-form" onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label>Nome do Plano *</label>
                  <input
                    type="text"
                    value={formData.nome}
                    onChange={(event: ChangeEvent<HTMLInputElement>) => updateFormField('nome', event.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Preco (R$) *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.preco}
                    onChange={(event: ChangeEvent<HTMLInputElement>) => updateFormField('preco', event.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Descricao</label>
                <textarea
                  value={formData.description}
                  onChange={(event: ChangeEvent<HTMLTextAreaElement>) => updateFormField('description', event.target.value)}
                  rows={3}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Ciclo de Pagamento *</label>
                  <select
                    value={formData.ciclo_pagamento}
                    onChange={(event: ChangeEvent<HTMLSelectElement>) => updateFormField('ciclo_pagamento', event.target.value)}
                  >
                    <option value="mensalmente">Mensalmente</option>
                    <option value="quartenamente">Trimestralmente</option>
                    <option value="anual">Anual</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Dias Free Trial</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.dias_freetrial}
                    onChange={(event: ChangeEvent<HTMLInputElement>) => updateFormField('dias_freetrial', event.target.value)}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>
                    <input
                      type="checkbox"
                      checked={formData.active}
                      onChange={(event: ChangeEvent<HTMLInputElement>) => updateFormField('active', event.target.checked)}
                    />
                    Ativo
                  </label>
                </div>

                <div className="form-group">
                  <label>
                    <input
                      type="checkbox"
                      checked={formData.is_public}
                      onChange={(event: ChangeEvent<HTMLInputElement>) => updateFormField('is_public', event.target.checked)}
                    />
                    Publico (outras barbearias podem participar)
                  </label>
                </div>
              </div>

              <div className="form-actions">
                <button type="submit" className="btn-submit">
                  {editingId ? 'Atualizar' : 'Criar'} Plano
                </button>
                <button type="button" className="btn-cancel" onClick={resetForm}>
                  Cancelar
                </button>
              </div>
            </form>
          )}

          <div className="plans-list">
            {activeTab === 'meus' && (
              meusPlanos.length === 0 ? (
                <p className="no-plans">Nenhum plano criado ainda.</p>
              ) : (
                meusPlanos.map((plano) => (
                  <div key={plano.id} className={`plan-card ${!isActiveFlag(plano.active) ? 'inactive' : ''}`}>
                    <div className="plan-header">
                      <h3>{plano.nome}</h3>
                      <div className="plan-badges">
                        <span className="plan-badge-criador">Criador</span>
                        <span className={`plan-status ${isActiveFlag(plano.active) ? 'active' : 'inactive'}`}>
                          {isActiveFlag(plano.active) ? 'Ativo' : 'Inativo'}
                        </span>
                      </div>
                    </div>

                    {plano.description && <p className="plan-description">{plano.description}</p>}

                    <div className="plan-details">
                      <div className="plan-detail">
                        <strong>Preco:</strong> R$ {Number(plano.preco).toFixed(2)}
                      </div>
                      <div className="plan-detail">
                        <strong>Ciclo:</strong> {plano.ciclo_pagamento}
                      </div>
                      {plano.dias_freetrial > 0 && (
                        <div className="plan-detail">
                          <strong>Free Trial:</strong> {plano.dias_freetrial} dias
                        </div>
                      )}
                      <div className="plan-detail">
                        <strong>Parceiros:</strong> {plano.num_parceiros ?? 0}
                      </div>
                      <div className="plan-detail">
                        <strong>Visibilidade:</strong> {isActiveFlag(plano.is_public) ? 'Publico' : 'Privado'}
                      </div>
                    </div>

                    <div className="plan-actions">
                      <button
                        className="btn-secondary"
                        onClick={() => {
                          setSelectedPlanoForPartners(plano);
                          setPartnerModalOpen(true);
                        }}
                      >
                        Ver Parceiros
                      </button>
                      <button
                        className="btn-secondary"
                        onClick={() => {
                          setSelectedPlanoForBenefits(plano);
                          setBenefitModalOpen(true);
                        }}
                      >
                        Gerenciar Beneficios
                      </button>
                      <button className="btn-edit" onClick={() => handleEdit(plano)}>
                        Editar
                      </button>
                      <button className="btn-delete" onClick={() => void handleDelete(plano.id)}>
                        Deletar
                      </button>
                    </div>
                  </div>
                ))
              )
            )}

            {activeTab === 'parcerias' && (
              parcerias.length === 0 ? (
                <p className="no-plans">Voce ainda nao participa de nenhuma parceria.</p>
              ) : (
                parcerias.map((plano) => (
                  <div key={plano.id} className={`plan-card parceria ${!isActiveFlag(plano.active) ? 'inactive' : ''}`}>
                    <div className="plan-header">
                      <h3>{plano.nome}</h3>
                      <div className="plan-badges">
                        <span className="plan-badge-parceiro">Parceiro</span>
                        <span className={`plan-status ${isActiveFlag(plano.active) ? 'active' : 'inactive'}`}>
                          {isActiveFlag(plano.active) ? 'Ativo' : 'Inativo'}
                        </span>
                      </div>
                    </div>

                    {plano.description && <p className="plan-description">{plano.description}</p>}

                    <div className="plan-details">
                      <div className="plan-detail">
                        <strong>Criado por:</strong> {plano.criador_nome}
                      </div>
                      <div className="plan-detail">
                        <strong>Preco:</strong> R$ {Number(plano.preco).toFixed(2)}
                      </div>
                      <div className="plan-detail">
                        <strong>Ciclo:</strong> {plano.ciclo_pagamento}
                      </div>
                      {plano.dias_freetrial > 0 && (
                        <div className="plan-detail">
                          <strong>Free Trial:</strong> {plano.dias_freetrial} dias
                        </div>
                      )}
                      <div className="plan-detail">
                        <strong>Total de Parceiros:</strong> {plano.num_parceiros ?? 0}
                      </div>
                    </div>

                    <div className="plan-actions">
                      <button
                        className="btn-secondary"
                        onClick={() => {
                          setSelectedPlanoForPartners(plano);
                          setPartnerModalOpen(true);
                        }}
                      >
                        Ver Parceiros
                      </button>
                      <button
                        className="btn-delete"
                        onClick={() => void handleSairParceria(plano.id, plano.nome)}
                      >
                        Sair da Parceria
                      </button>
                    </div>
                  </div>
                ))
              )
            )}
          </div>
        </>
      )}

      <PartnerListModal
        planoId={selectedPlanoForPartners?.id}
        planoNome={selectedPlanoForPartners?.nome}
        isOpen={partnerModalOpen}
        onClose={() => {
          setPartnerModalOpen(false);
          setSelectedPlanoForPartners(null);
        }}
      />

      {benefitModalOpen && (
        <div className="modal-overlay" onClick={() => setBenefitModalOpen(false)}>
          <div className="modal-content-large" onClick={(event) => event.stopPropagation()}>
            <BenefitManager
              planoId={selectedPlanoForBenefits?.id}
              planoNome={selectedPlanoForBenefits?.nome}
              onClose={() => {
                setBenefitModalOpen(false);
                setSelectedPlanoForBenefits(null);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
