import React, { useState, useEffect } from 'react';
import { api } from '../../server/api';
import PlanMarketplace from './PlanMarketplace';
import PartnerListModal from './PartnerListModal';
import './css/PlanManager.css';

export default function PlanManager({ estabelecimentoId }) {
    const [activeTab, setActiveTab] = useState('meus'); // 'meus', 'parcerias', 'marketplace'
    const [planos, setPlanos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [partnerModalOpen, setPartnerModalOpen] = useState(false);
    const [selectedPlanoForPartners, setSelectedPlanoForPartners] = useState(null);

    const [formData, setFormData] = useState({
        nome: '',
        description: '',
        preco: '',
        ciclo_pagamento: 'mensalmente',
        dias_freetrial: 0,
        active: true,
        is_public: true
    });

    useEffect(() => {
        loadPlanos();
    }, [estabelecimentoId]);

    const loadPlanos = async () => {
        try {
            setLoading(true);
            const data = await api.getMyPlanos(estabelecimentoId);
            setPlanos(data);
        } catch (err) {
            console.error(err);
            alert('Erro ao carregar planos');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const planoData = {
                ...formData,
                criador_estabelecimento_id: estabelecimentoId,
                estabelecimento_id: estabelecimentoId,
                preco: parseFloat(formData.preco)
            };

            if (editingId) {
                await api.updatePlano(editingId, planoData);
                alert('Plano atualizado com sucesso!');
            } else {
                await api.createPlano(planoData);
                alert('Plano criado com sucesso!');
            }

            resetForm();
            loadPlanos();
        } catch (err) {
            alert(err.message);
        }
    };

    const handleEdit = (plano) => {
        setFormData({
            nome: plano.nome,
            description: plano.description || '',
            preco: plano.preco,
            ciclo_pagamento: plano.ciclo_pagamento,
            dias_freetrial: plano.dias_freetrial,
            active: plano.active,
            is_public: plano.is_public !== undefined ? plano.is_public : true
        });
        setEditingId(plano.id);
        setShowForm(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Tem certeza que deseja deletar este plano?')) return;

        try {
            await api.deletePlano(id, estabelecimentoId);
            alert('Plano deletado com sucesso!');
            loadPlanos();
        } catch (err) {
            alert(err.message);
        }
    };

    const handleSairParceria = async (planoId, planoNome) => {
        if (!window.confirm(`Tem certeza que deseja sair da parceria "${planoNome}"?`)) return;

        try {
            await api.sairPlano(planoId, estabelecimentoId);
            alert('Você saiu da parceria com sucesso!');
            loadPlanos();
        } catch (err) {
            alert(err.message);
        }
    };

    const handleVerParceiros = (plano) => {
        setSelectedPlanoForPartners(plano);
        setPartnerModalOpen(true);
    };

    const resetForm = () => {
        setFormData({
            nome: '',
            description: '',
            preco: '',
            ciclo_pagamento: 'mensalmente',
            dias_freetrial: 0,
            active: true,
            is_public: true
        });
        setEditingId(null);
        setShowForm(false);
    };

    const meusPlanos = planos.filter(p => p.tipo === 'criador');
    const parcerias = planos.filter(p => p.tipo === 'parceiro');

    if (loading) return <div className="plan-manager-loading">Carregando planos...</div>;

    return (
        <div className="plan-manager">
            <div className="plan-manager-header">
                <h2>Gerenciar Planos</h2>
                {activeTab === 'meus' && (
                    <button
                        className="btn-new-plan"
                        onClick={() => setShowForm(!showForm)}
                    >
                        {showForm ? 'Cancelar' : '+ Novo Plano'}
                    </button>
                )}
            </div>

            {/* Tabs */}
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

            {/* Tab Content */}
            {activeTab === 'marketplace' ? (
                <PlanMarketplace
                    estabelecimentoId={estabelecimentoId}
                    onClose={() => {
                        loadPlanos();
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
                                        onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Preço (R$) *</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={formData.preco}
                                        onChange={(e) => setFormData({ ...formData, preco: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Descrição</label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    rows="3"
                                />
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Ciclo de Pagamento *</label>
                                    <select
                                        value={formData.ciclo_pagamento}
                                        onChange={(e) => setFormData({ ...formData, ciclo_pagamento: e.target.value })}
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
                                        onChange={(e) => setFormData({ ...formData, dias_freetrial: parseInt(e.target.value) })}
                                    />
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>
                                        <input
                                            type="checkbox"
                                            checked={formData.active}
                                            onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                                        />
                                        Ativo
                                    </label>
                                </div>

                                <div className="form-group">
                                    <label>
                                        <input
                                            type="checkbox"
                                            checked={formData.is_public}
                                            onChange={(e) => setFormData({ ...formData, is_public: e.target.checked })}
                                        />
                                        Público (outras barbearias podem participar)
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
                                    <div key={plano.id} className={`plan-card ${!plano.active ? 'inactive' : ''}`}>
                                        <div className="plan-header">
                                            <h3>{plano.nome}</h3>
                                            <div className="plan-badges">
                                                <span className="plan-badge-criador">Criador</span>
                                                <span className={`plan-status ${plano.active ? 'active' : 'inactive'}`}>
                                                    {plano.active ? 'Ativo' : 'Inativo'}
                                                </span>
                                            </div>
                                        </div>

                                        {plano.description && (
                                            <p className="plan-description">{plano.description}</p>
                                        )}

                                        <div className="plan-details">
                                            <div className="plan-detail">
                                                <strong>Preço:</strong> R$ {parseFloat(plano.preco).toFixed(2)}
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
                                                <strong>Parceiros:</strong> {plano.num_parceiros}
                                            </div>
                                            <div className="plan-detail">
                                                <strong>Visibilidade:</strong> {plano.is_public ? 'Público' : 'Privado'}
                                            </div>
                                        </div>

                                        <div className="plan-actions">
                                            <button
                                                className="btn-secondary"
                                                onClick={() => handleVerParceiros(plano)}
                                            >
                                                Ver Parceiros
                                            </button>
                                            <button
                                                className="btn-edit"
                                                onClick={() => handleEdit(plano)}
                                            >
                                                Editar
                                            </button>
                                            <button
                                                className="btn-delete"
                                                onClick={() => handleDelete(plano.id)}
                                            >
                                                Deletar
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )
                        )}

                        {activeTab === 'parcerias' && (
                            parcerias.length === 0 ? (
                                <p className="no-plans">Você ainda não participa de nenhuma parceria.</p>
                            ) : (
                                parcerias.map((plano) => (
                                    <div key={plano.id} className={`plan-card parceria ${!plano.active ? 'inactive' : ''}`}>
                                        <div className="plan-header">
                                            <h3>{plano.nome}</h3>
                                            <div className="plan-badges">
                                                <span className="plan-badge-parceiro">Parceiro</span>
                                                <span className={`plan-status ${plano.active ? 'active' : 'inactive'}`}>
                                                    {plano.active ? 'Ativo' : 'Inativo'}
                                                </span>
                                            </div>
                                        </div>

                                        {plano.description && (
                                            <p className="plan-description">{plano.description}</p>
                                        )}

                                        <div className="plan-details">
                                            <div className="plan-detail">
                                                <strong>Criado por:</strong> {plano.criador_nome}
                                            </div>
                                            <div className="plan-detail">
                                                <strong>Preço:</strong> R$ {parseFloat(plano.preco).toFixed(2)}
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
                                                <strong>Total de Parceiros:</strong> {plano.num_parceiros}
                                            </div>
                                        </div>

                                        <div className="plan-actions">
                                            <button
                                                className="btn-secondary"
                                                onClick={() => handleVerParceiros(plano)}
                                            >
                                                Ver Parceiros
                                            </button>
                                            <button
                                                className="btn-delete"
                                                onClick={() => handleSairParceria(plano.id, plano.nome)}
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

            {/* Partner List Modal */}
            <PartnerListModal
                planoId={selectedPlanoForPartners?.id}
                planoNome={selectedPlanoForPartners?.nome}
                isOpen={partnerModalOpen}
                onClose={() => {
                    setPartnerModalOpen(false);
                    setSelectedPlanoForPartners(null);
                }}
            />
        </div>
    );
}
