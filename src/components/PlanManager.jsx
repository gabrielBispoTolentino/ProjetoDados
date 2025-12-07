import React, { useState, useEffect } from 'react';
import { api } from '../../server/api';
import './css/PlanManager.css';

export default function PlanManager({ estabelecimentoId }) {
    const [planos, setPlanos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState(null);
    const [showForm, setShowForm] = useState(false);

    const [formData, setFormData] = useState({
        nome: '',
        description: '',
        preco: '',
        ciclo_pagamento: 'mensalmente',
        dias_freetrial: 0,
        active: true
    });

    useEffect(() => {
        loadPlanos();
    }, [estabelecimentoId]);

    const loadPlanos = async () => {
        try {
            setLoading(true);
            const data = await api.getPlanosByEstabelecimento(estabelecimentoId);
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
            active: plano.active
        });
        setEditingId(plano.id);
        setShowForm(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Tem certeza que deseja deletar este plano?')) return;

        try {
            await api.deletePlano(id);
            alert('Plano deletado com sucesso!');
            loadPlanos();
        } catch (err) {
            alert(err.message);
        }
    };

    const resetForm = () => {
        setFormData({
            nome: '',
            description: '',
            preco: '',
            ciclo_pagamento: 'mensalmente',
            dias_freetrial: 0,
            active: true
        });
        setEditingId(null);
        setShowForm(false);
    };

    if (loading) return <div className="plan-manager-loading">Carregando planos...</div>;

    return (
        <div className="plan-manager">
            <div className="plan-manager-header">
                <h2>Gerenciar Planos</h2>
                <button
                    className="btn-new-plan"
                    onClick={() => setShowForm(!showForm)}
                >
                    {showForm ? 'Cancelar' : '+ Novo Plano'}
                </button>
            </div>

            {showForm && (
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
                {planos.length === 0 ? (
                    <p className="no-plans">Nenhum plano cadastrado ainda.</p>
                ) : (
                    planos.map((plano) => (
                        <div key={plano.id} className={`plan-card ${!plano.active ? 'inactive' : ''}`}>
                            <div className="plan-header">
                                <h3>{plano.nome}</h3>
                                <span className={`plan-status ${plano.active ? 'active' : 'inactive'}`}>
                                    {plano.active ? 'Ativo' : 'Inativo'}
                                </span>
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
                            </div>

                            <div className="plan-actions">
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
                )}
            </div>
        </div>
    );
}
