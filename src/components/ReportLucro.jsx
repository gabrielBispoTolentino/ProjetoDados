import React, { useState, useEffect } from 'react';
import './css/ReportLucro.css';

export default function ReportLucro({ estabelecimentoId }) {
  const [loading, setLoading] = useState(false);
  const [relatorios, setRelatorios] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    periodo_comeco: '',
    periodo_final: ''
  });
  const [filtroAno, setFiltroAno] = useState(new Date().getFullYear());
  const [filtroMes, setFiltroMes] = useState('');

  useEffect(() => {
    if (estabelecimentoId) {
      carregarRelatorios();
    }
  }, [estabelecimentoId]);

  const carregarRelatorios = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/report-lucro?estabelecimento_id=${estabelecimentoId}`);
      
      if (!response.ok) {
        throw new Error('Erro ao carregar relatórios');
      }

      const data = await response.json();
      setRelatorios(data);
    } catch (err) {
      setError(err.message);
      console.error('Erro ao carregar relatórios:', err);
    } finally {
      setLoading(false);
    }
  };

  const gerarRelatorioAutomatico = async () => {
    if (!formData.periodo_comeco || !formData.periodo_final) {
      alert('Por favor, preencha as datas de início e fim do período');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/report-lucro/auto', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          estabelecimento_id: estabelecimentoId,
          periodo_comeco: formData.periodo_comeco,
          periodo_final: formData.periodo_final
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.erro || 'Erro ao gerar relatório');
      }

      alert('Relatório gerado com sucesso!');
      setShowForm(false);
      setFormData({ periodo_comeco: '', periodo_final: '' });
      carregarRelatorios();
    } catch (err) {
      setError(err.message);
      console.error('Erro ao gerar relatório:', err);
    } finally {
      setLoading(false);
    }
  };

  const relatoriosFiltrados = relatorios.filter(rel => {
    const dataInicio = new Date(rel.periodo_começo);
    const ano = dataInicio.getFullYear();
    const mes = dataInicio.getMonth() + 1;

    if (filtroAno && ano !== parseInt(filtroAno)) return false;
    if (filtroMes && mes !== parseInt(filtroMes)) return false;

    return true;
  });

  // Calcular totais
  const totalLucro = relatoriosFiltrados.reduce((acc, rel) => 
    acc + parseFloat(rel.lucro_total || 0), 0
  );
  const totalReembolso = relatoriosFiltrados.reduce((acc, rel) => 
    acc + parseFloat(rel.reembolso_total || 0), 0
  );
  const lucroLiquido = totalLucro - totalReembolso;

  // Gerar sugestões de período
  const gerarPeriodoMesAtual = () => {
    const hoje = new Date();
    const ano = hoje.getFullYear();
    const mes = String(hoje.getMonth() + 1).padStart(2, '0');
    setFormData({
      periodo_comeco: `${ano}-${mes}-01`,
      periodo_final: `${ano}-${mes}-${new Date(ano, hoje.getMonth() + 1, 0).getDate()}`
    });
  };

  const gerarPeriodoMesPassado = () => {
    const hoje = new Date();
    const mesPassado = new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1);
    const ano = mesPassado.getFullYear();
    const mes = String(mesPassado.getMonth() + 1).padStart(2, '0');
    const ultimoDia = new Date(ano, mesPassado.getMonth() + 1, 0).getDate();
    
    setFormData({
      periodo_comeco: `${ano}-${mes}-01`,
      periodo_final: `${ano}-${mes}-${ultimoDia}`
    });
  };

  const formatarMoeda = (valor) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  };

  const formatarData = (data) => {
    return new Date(data).toLocaleDateString('pt-BR');
  };

  return (
    <div className="report-lucro">
      <div className="report-header">
        <h2>Relatórios de Lucro</h2>
        <button
          className="btn-new-report"
          onClick={() => setShowForm(!showForm)}
          disabled={loading}
        >
          {showForm ? 'Cancelar' : '+ Novo Relatório'}
        </button>
      </div>

      {error && (
        <div className="report-error">
          {error}
        </div>
      )}

      {/* Formulário de Novo Relatório */}
      {showForm && (
        <div className="report-form">
          <h3>Gerar Relatório Automático</h3>
          
          <div className="quick-periods">
            <button
              type="button"
              className="btn-quick-period"
              onClick={gerarPeriodoMesAtual}
            >
              Mês Atual
            </button>
            <button
              type="button"
              className="btn-quick-period"
              onClick={gerarPeriodoMesPassado}
            >
              Mês Passado
            </button>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Data de Início *</label>
              <input
                type="date"
                value={formData.periodo_comeco}
                onChange={(e) => setFormData({ ...formData, periodo_comeco: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label>Data Final *</label>
              <input
                type="date"
                value={formData.periodo_final}
                onChange={(e) => setFormData({ ...formData, periodo_final: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="form-actions">
            <button
              className="btn-submit"
              onClick={gerarRelatorioAutomatico}
              disabled={loading}
            >
              {loading ? 'Gerando...' : 'Gerar Relatório'}
            </button>
          </div>
        </div>
      )}

      {/* Filtros */}
      <div className="report-filters">
        <div className="filter-group">
          <label>Ano:</label>
          <select
            value={filtroAno}
            onChange={(e) => setFiltroAno(e.target.value)}
          >
            <option value="">Todos</option>
            {[...new Set(relatorios.map(r => new Date(r.periodo_começo).getFullYear()))].map(ano => (
              <option key={ano} value={ano}>{ano}</option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label>Mês:</label>
          <select
            value={filtroMes}
            onChange={(e) => setFiltroMes(e.target.value)}
          >
            <option value="">Todos</option>
            <option value="1">Janeiro</option>
            <option value="2">Fevereiro</option>
            <option value="3">Março</option>
            <option value="4">Abril</option>
            <option value="5">Maio</option>
            <option value="6">Junho</option>
            <option value="7">Julho</option>
            <option value="8">Agosto</option>
            <option value="9">Setembro</option>
            <option value="10">Outubro</option>
            <option value="11">Novembro</option>
            <option value="12">Dezembro</option>
          </select>
        </div>
      </div>

      {/* Cards de Resumo */}
      <div className="report-summary">
        <div className="summary-card lucro">
          <div className="summary-icon">💰</div>
          <div className="summary-info">
            <h4>Lucro Total</h4>
            <p className="summary-value">{formatarMoeda(totalLucro)}</p>
          </div>
        </div>

        <div className="summary-card reembolso">
          <div className="summary-icon">↩️</div>
          <div className="summary-info">
            <h4>Reembolsos</h4>
            <p className="summary-value">{formatarMoeda(totalReembolso)}</p>
          </div>
        </div>

        <div className="summary-card liquido">
          <div className="summary-icon">📊</div>
          <div className="summary-info">
            <h4>Lucro Líquido</h4>
            <p className="summary-value">{formatarMoeda(lucroLiquido)}</p>
          </div>
        </div>
      </div>

      {/* Lista de Relatórios */}
      {loading ? (
        <div className="report-loading">Carregando relatórios...</div>
      ) : relatoriosFiltrados.length === 0 ? (
        <div className="report-empty">
          <p>Nenhum relatório encontrado para os filtros selecionados.</p>
        </div>
      ) : (
        <div className="reports-table">
          <table>
            <thead>
              <tr>
                <th>Período</th>
                <th>Lucro Bruto</th>
                <th>Reembolsos</th>
                <th>Lucro Líquido</th>
                <th>Gerado em</th>
              </tr>
            </thead>
            <tbody>
              {relatoriosFiltrados.map((rel) => {
                const liquido = parseFloat(rel.lucro_total) - parseFloat(rel.reembolso_total);
                
                return (
                  <tr key={rel.id}>
                    <td>
                      {formatarData(rel.periodo_começo)} - {formatarData(rel.periodo_final)}
                    </td>
                    <td className="value-positive">
                      {formatarMoeda(rel.lucro_total)}
                    </td>
                    <td className="value-negative">
                      {formatarMoeda(rel.reembolso_total)}
                    </td>
                    <td className={liquido >= 0 ? 'value-positive' : 'value-negative'}>
                      <strong>{formatarMoeda(liquido)}</strong>
                    </td>
                    <td className="text-muted">
                      {new Date(rel.generado_em).toLocaleString('pt-BR')}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}