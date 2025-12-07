import React, { useState, useEffect } from 'react';
import { api } from '../../server/api';
import './css/BenefitManager.css';

export default function BenefitManager({ planoId, planoNome, onClose }) {
    const [beneficios, setBeneficios] = useState([]);
    const [servicos, setServicos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);

    const [formData, setFormData] = useState({
        tipo_beneficio: 'desconto_percentual',
        servico_id: '',
        condicao_tipo: 'sempre',
        condicao_valor: '',
        desconto_percentual: '',
        desconto_fixo: '',
        ordem: 0
    });

    useEffect(() => {
        if (planoId) {
            loadData();
        }
    }, [planoId]);

    const loadData = async () => {
        try {
            setLoading(true);
            const [beneficiosData, servicosData] = await Promise.all([
                api.getPlanoBeneficios(planoId),
                api.getServicos()
            ]);
            setBeneficios(beneficiosData);
            setServicos(servicosData);
        } catch (err) {
            console.error(err);
            alert('Erro ao carregar dados');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            await api.addPlanoBeneficio(planoId, formData);
            alert('Benefício adicionado com sucesso!');
            resetForm();
            loadData();
        } catch (err) {
            alert(err.message);
        }
    };

    const resetForm = () => {
        setFormData({
            tipo_beneficio: 'desconto_percentual',
            servico_id: '',
            condicao_tipo: 'sempre',
            condicao_valor: '',
            desconto_percentual: '',
            desconto_fixo: '',
            ordem: 0
        });
        setShowForm(false);
    };

    const getBeneficioDescricao = (beneficio) => {
        let desc = [];

        // Tipo de benefício
        if (beneficio.desconto_percentual) {
            desc.push(`${beneficio.desconto_percentual}% de desconto`);
        } else if (beneficio.desconto_fixo) {
            desc.push(`R$ ${parseFloat(beneficio.desconto_fixo).toFixed(2)} de desconto`);
        }

        // Serviço específico
        if (beneficio.servico_nome) {
            desc.push(`em ${beneficio.servico_nome}`);
        } else {
            desc.push('em todos os serviços');
        }

        // Condição
        switch (beneficio.condicao_tipo) {
            case 'sempre':
                desc.push('(sempre)');
                break;
            case 'primeira_vez':
                desc.push('(primeira vez)');
                break;
            case 'apos_x_usos':
                desc.push(`(após ${beneficio.condicao_valor} usos)`);
                break;
            case 'dia_semana':
                const dias = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
                desc.push(`(às ${dias[beneficio.condicao_valor]}s)`);
                break;
        }

        return desc.join(' ');
    };

    if (loading) return <div className="benefit-loading">Carregando...</div>;

    return (
        <div className="benefit-manager">
            <div className="benefit-header">
                <div>
                    <h2>Gerenciar Benefícios</h2>
                    <p className="benefit-subtitle">Plano: {planoNome}</p>
                </div>
                <button className="btn-close-benefit" onClick={onClose}>×</button>
            </div>

            <button
                className="btn-add-benefit"
                onClick={() => setShowForm(!showForm)}
            >
                {showForm ? 'Cancelar' : '+ Adicionar Benefício'}
            </button>

            {showForm && (
                <form className="benefit-form" onSubmit={handleSubmit}>
                    <div className="form-row">
                        <div className="form-group">
                            <label>Tipo de Benefício *</label>
                            <select
                                value={formData.tipo_beneficio}
                                onChange={(e) => setFormData({ ...formData, tipo_beneficio: e.target.value })}
                                required
                            >
                                <option value="desconto_percentual">Desconto Percentual</option>
                                <option value="desconto_fixo">Desconto Fixo (R$)</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label>Serviço Específico</label>
                            <select
                                value={formData.servico_id}
                                onChange={(e) => setFormData({ ...formData, servico_id: e.target.value })}
                            >
                                <option value="">Todos os serviços</option>
                                {servicos.map((s) => (
                                    <option key={s.id} value={s.id}>
                                        {s.nome} - R$ {parseFloat(s.preco_base).toFixed(2)}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Condição *</label>
                            <select
                                value={formData.condicao_tipo}
                                onChange={(e) => setFormData({ ...formData, condicao_tipo: e.target.value })}
                                required
                            >
                                <option value="sempre">Sempre</option>
                                <option value="primeira_vez">Primeira Vez</option>
                                <option value="apos_x_usos">Após X Usos</option>
                                <option value="dia_semana">Dia da Semana</option>
                            </select>
                        </div>

                        {(formData.condicao_tipo === 'apos_x_usos' || formData.condicao_tipo === 'dia_semana') && (
                            <div className="form-group">
                                <label>
                                    {formData.condicao_tipo === 'apos_x_usos' ? 'Número de Usos' : 'Dia (0=Dom, 6=Sáb)'}
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    max={formData.condicao_tipo === 'dia_semana' ? 6 : undefined}
                                    value={formData.condicao_valor}
                                    onChange={(e) => setFormData({ ...formData, condicao_valor: e.target.value })}
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
                                    onChange={(e) => setFormData({ ...formData, desconto_percentual: e.target.value })}
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
                                    onChange={(e) => setFormData({ ...formData, desconto_fixo: e.target.value })}
                                    required
                                />
                            </div>
                        )}

                        <div className="form-group">
                            <label>Ordem de Aplicação</label>
                            <input
                                type="number"
                                min="0"
                                value={formData.ordem}
                                onChange={(e) => setFormData({ ...formData, ordem: e.target.value })}
                            />
                            <small>Benefícios com ordem menor são aplicados primeiro</small>
                        </div>
                    </div>

                    <div className="form-actions">
                        <button type="submit" className="btn-submit">Adicionar Benefício</button>
                        <button type="button" className="btn-cancel" onClick={resetForm}>Cancelar</button>
                    </div>
                </form>
            )}

            <div className="benefits-list">
                <h3>Benefícios Ativos ({beneficios.length})</h3>

                {beneficios.length === 0 ? (
                    <p className="no-benefits">Nenhum benefício configurado ainda.</p>
                ) : (
                    <div className="benefits-grid">
                        {beneficios.map((beneficio) => (
                            <div key={beneficio.id} className="benefit-card">
                                <div className="benefit-card-header">
                                    <span className="benefit-order">#{beneficio.ordem}</span>
                                    <span className={`benefit-type ${beneficio.tipo_beneficio}`}>
                                        {beneficio.tipo_beneficio === 'desconto_percentual' ? 'Percentual' : 'Fixo'}
                                    </span>
                                </div>

                                <p className="benefit-description">
                                    {getBeneficioDescricao(beneficio)}
                                </p>

                                <div className="benefit-details">
                                    {beneficio.servico_nome && (
                                        <div className="benefit-detail">
                                            <strong>Serviço:</strong> {beneficio.servico_nome}
                                        </div>
                                    )}
                                    <div className="benefit-detail">
                                        <strong>Valor:</strong>{' '}
                                        {beneficio.desconto_percentual
                                            ? `${beneficio.desconto_percentual}%`
                                            : `R$ ${parseFloat(beneficio.desconto_fixo).toFixed(2)}`}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="benefit-examples">
                <h4>💡 Exemplos de Benefícios</h4>
                <ul>
                    <li><strong>50% sempre:</strong> Desconto permanente em todos os serviços</li>
                    <li><strong>100% após 3 usos:</strong> Serviço grátis a cada 3 usos</li>
                    <li><strong>R$ 10 em barba:</strong> Desconto fixo em serviço específico</li>
                    <li><strong>70% primeira vez:</strong> Desconto especial para novos assinantes</li>
                </ul>
            </div>
        </div>
    );
}
