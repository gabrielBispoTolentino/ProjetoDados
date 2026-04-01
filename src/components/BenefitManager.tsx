import { useEffect, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { api } from '../../server/api';
import type { PlanBenefit, PlanBenefitPayload, Service } from '../types/domain';
import './css/BenefitManager.css';

type BenefitManagerProps = {
  planoId?: number | null;
  planoNome?: string;
  onClose: () => void;
};

type BenefitFormData = {
  tipo_beneficio: string;
  servico_id: string;
  condicao_tipo: string;
  condicao_valor: string;
  desconto_percentual: string;
  desconto_fixo: string;
  ordem: string;
};

const INITIAL_FORM_DATA: BenefitFormData = {
  tipo_beneficio: 'desconto_percentual',
  servico_id: '',
  condicao_tipo: 'sempre',
  condicao_valor: '',
  desconto_percentual: '',
  desconto_fixo: '',
  ordem: '0',
};

export default function BenefitManager({
  planoId,
  planoNome,
  onClose,
}: BenefitManagerProps) {
  const [beneficios, setBeneficios] = useState<PlanBenefit[]>([]);
  const [servicos, setServicos] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<BenefitFormData>(INITIAL_FORM_DATA);

  useEffect(() => {
    if (!planoId) {
      return;
    }

    void loadData();
  }, [planoId]);

  async function loadData() {
    if (!planoId) {
      return;
    }

    try {
      setLoading(true);
      const [beneficiosData, servicosData] = await Promise.all([
        api.getPlanoBeneficios(planoId),
        api.getServicos(),
      ]);
      setBeneficios(beneficiosData);
      setServicos(servicosData);
    } catch (caughtError) {
      console.error(caughtError);
      alert('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  }

  function updateFormField<Key extends keyof BenefitFormData>(
    key: Key,
    value: BenefitFormData[Key],
  ) {
    setFormData((currentForm) => ({
      ...currentForm,
      [key]: value,
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!planoId) {
      return;
    }

    const payload: PlanBenefitPayload = {
      ...formData,
      ordem: formData.ordem || '0',
    };

    try {
      await api.addPlanoBeneficio(planoId, payload);
      alert('Beneficio adicionado com sucesso!');
      resetForm();
      await loadData();
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : 'Erro ao adicionar beneficio';
      alert(message);
    }
  }

  function resetForm() {
    setFormData(INITIAL_FORM_DATA);
    setShowForm(false);
  }

  function getBeneficioDescricao(beneficio: PlanBenefit): string {
    const descriptionParts: string[] = [];

    if (beneficio.desconto_percentual) {
      descriptionParts.push(`${beneficio.desconto_percentual}% de desconto`);
    } else if (beneficio.desconto_fixo) {
      descriptionParts.push(`R$ ${Number(beneficio.desconto_fixo).toFixed(2)} de desconto`);
    }

    if (beneficio.servico_nome) {
      descriptionParts.push(`em ${beneficio.servico_nome}`);
    } else {
      descriptionParts.push('em todos os servicos');
    }

    switch (beneficio.condicao_tipo) {
      case 'sempre':
        descriptionParts.push('(sempre)');
        break;
      case 'primeira_vez':
        descriptionParts.push('(primeira vez)');
        break;
      case 'apos_x_usos':
        descriptionParts.push(`(apos ${beneficio.condicao_valor} usos)`);
        break;
      case 'dia_semana': {
        const dias = ['Domingo', 'Segunda', 'Terca', 'Quarta', 'Quinta', 'Sexta', 'Sabado'];
        const diaIndex = Number(beneficio.condicao_valor ?? 0);
        descriptionParts.push(`(as ${dias[diaIndex] || 'datas selecionadas'}s)`);
        break;
      }
      default:
        break;
    }

    return descriptionParts.join(' ');
  }

  if (loading) {
    return <div className="benefit-loading">Carregando...</div>;
  }

  return (
    <div className="benefit-manager">
      <div className="benefit-header">
        <div>
          <h2>Gerenciar Beneficios</h2>
          <p className="benefit-subtitle">Plano: {planoNome}</p>
        </div>
        <button className="btn-close-benefit" onClick={onClose}>x</button>
      </div>

      <button
        className="btn-add-benefit"
        onClick={() => setShowForm((currentValue) => !currentValue)}
      >
        {showForm ? 'Cancelar' : '+ Adicionar Beneficio'}
      </button>

      {showForm && (
        <form className="benefit-form" onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label>Tipo de Beneficio *</label>
              <select
                value={formData.tipo_beneficio}
                onChange={(event: ChangeEvent<HTMLSelectElement>) => updateFormField('tipo_beneficio', event.target.value)}
                required
              >
                <option value="desconto_percentual">Desconto Percentual</option>
                <option value="desconto_fixo">Desconto Fixo (R$)</option>
              </select>
            </div>

            <div className="form-group">
              <label>Servico Especifico</label>
              <select
                value={formData.servico_id}
                onChange={(event: ChangeEvent<HTMLSelectElement>) => updateFormField('servico_id', event.target.value)}
              >
                <option value="">Todos os servicos</option>
                {servicos.map((servico) => (
                  <option key={servico.id} value={servico.id}>
                    {servico.nome} - R$ {Number(servico.preco_base).toFixed(2)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Condicao *</label>
              <select
                value={formData.condicao_tipo}
                onChange={(event: ChangeEvent<HTMLSelectElement>) => updateFormField('condicao_tipo', event.target.value)}
                required
              >
                <option value="sempre">Sempre</option>
                <option value="primeira_vez">Primeira Vez</option>
                <option value="apos_x_usos">Apos X Usos</option>
                <option value="dia_semana">Dia da Semana</option>
              </select>
            </div>

            {(formData.condicao_tipo === 'apos_x_usos' || formData.condicao_tipo === 'dia_semana') && (
              <div className="form-group">
                <label>
                  {formData.condicao_tipo === 'apos_x_usos' ? 'Numero de Usos' : 'Dia (0=Dom, 6=Sab)'}
                </label>
                <input
                  type="number"
                  min="0"
                  max={formData.condicao_tipo === 'dia_semana' ? 6 : undefined}
                  value={formData.condicao_valor}
                  onChange={(event: ChangeEvent<HTMLInputElement>) => updateFormField('condicao_valor', event.target.value)}
                  required
                />
              </div>
            )}
          </div>

          <div className="form-row">
            {formData.tipo_beneficio === 'desconto_percentual' && (
              <div className="form-group">
                <label>Desconto (%) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={formData.desconto_percentual}
                  onChange={(event: ChangeEvent<HTMLInputElement>) => updateFormField('desconto_percentual', event.target.value)}
                  required
                />
              </div>
            )}

            {formData.tipo_beneficio === 'desconto_fixo' && (
              <div className="form-group">
                <label>Desconto (R$) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.desconto_fixo}
                  onChange={(event: ChangeEvent<HTMLInputElement>) => updateFormField('desconto_fixo', event.target.value)}
                  required
                />
              </div>
            )}

            <div className="form-group">
              <label>Ordem de Aplicacao</label>
              <input
                type="number"
                min="0"
                value={formData.ordem}
                onChange={(event: ChangeEvent<HTMLInputElement>) => updateFormField('ordem', event.target.value)}
              />
              <small>Beneficios com ordem menor sao aplicados primeiro</small>
            </div>
          </div>

          <div className="form-actions">
            <button type="submit" className="btn-submit">Adicionar Beneficio</button>
            <button type="button" className="btn-cancel" onClick={resetForm}>Cancelar</button>
          </div>
        </form>
      )}

      <div className="benefits-list">
        <h3>Beneficios Ativos ({beneficios.length})</h3>

        {beneficios.length === 0 ? (
          <p className="no-benefits">Nenhum beneficio configurado ainda.</p>
        ) : (
          <div className="benefits-grid">
            {beneficios.map((beneficio) => (
              <div key={beneficio.id} className="benefit-card">
                <div className="benefit-card-header">
                  <span className="benefit-order">#{Number(beneficio.ordem ?? 0)}</span>
                  <span className={`benefit-type ${beneficio.tipo_beneficio}`}>
                    {beneficio.tipo_beneficio === 'desconto_percentual' ? 'Percentual' : 'Fixo'}
                  </span>
                </div>

                <p className="benefit-description">{getBeneficioDescricao(beneficio)}</p>

                <div className="benefit-details">
                  {beneficio.servico_nome && (
                    <div className="benefit-detail">
                      <strong>Servico:</strong> {beneficio.servico_nome}
                    </div>
                  )}
                  <div className="benefit-detail">
                    <strong>Valor:</strong>{' '}
                    {beneficio.desconto_percentual
                      ? `${beneficio.desconto_percentual}%`
                      : `R$ ${Number(beneficio.desconto_fixo || 0).toFixed(2)}`}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="benefit-examples">
        <h4>Exemplos de Beneficios</h4>
        <ul>
          <li><strong>50% sempre:</strong> Desconto permanente em todos os servicos</li>
          <li><strong>100% apos 3 usos:</strong> Servico gratis a cada 3 usos</li>
          <li><strong>R$ 10 em barba:</strong> Desconto fixo em servico especifico</li>
          <li><strong>70% primeira vez:</strong> Desconto especial para novos assinantes</li>
        </ul>
      </div>
    </div>
  );
}
