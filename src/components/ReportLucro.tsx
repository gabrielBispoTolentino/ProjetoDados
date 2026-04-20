import { useEffect, useState } from 'react';
import type { ChangeEvent } from 'react';
import { api } from '../../server/api';
import { useFeedback } from './FeedbackProvider';
import type { ReportLucroEntry } from '../types/domain';
import './css/ReportLucro.css';

type ReportLucroProps = {
  estabelecimentoId: number | string;
};

type ReportFormData = {
  periodo_comeco: string;
  periodo_final: string;
};

const INITIAL_FORM_DATA: ReportFormData = {
  periodo_comeco: '',
  periodo_final: '',
};

export default function ReportLucro({ estabelecimentoId }: ReportLucroProps) {
  const feedback = useFeedback();
  const [loading, setLoading] = useState(false);
  const [relatorios, setRelatorios] = useState<ReportLucroEntry[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<ReportFormData>(INITIAL_FORM_DATA);
  const [filtroAno, setFiltroAno] = useState(String(new Date().getFullYear()));
  const [filtroMes, setFiltroMes] = useState('');

  useEffect(() => {
    if (!estabelecimentoId) {
      return;
    }

    void carregarRelatorios();
  }, [estabelecimentoId]);

  async function carregarRelatorios() {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getReportLucro(estabelecimentoId);
      setRelatorios(data);
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : 'Erro ao carregar relatorios';
      setError(message);
      console.error('Erro ao carregar relatorios:', caughtError);
    } finally {
      setLoading(false);
    }
  }

  async function gerarRelatorioAutomatico() {
    if (!formData.periodo_comeco || !formData.periodo_final) {
      feedback.info('Por favor, preencha as datas de inicio e fim do periodo');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      await api.generateReportLucro({
        estabelecimento_id: Number(estabelecimentoId),
        periodo_comeco: formData.periodo_comeco,
        periodo_final: formData.periodo_final,
      });

      feedback.success('Relatorio gerado com sucesso!');
      setShowForm(false);
      setFormData(INITIAL_FORM_DATA);
      await carregarRelatorios();
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : 'Erro ao gerar relatorio';
      setError(message);
      console.error('Erro ao gerar relatorio:', caughtError);
    } finally {
      setLoading(false);
    }
  }

  const relatoriosFiltrados = relatorios.filter((relatorio) => {
    const dataInicio = new Date(relatorio.periodo_comeco);
    const ano = dataInicio.getFullYear();
    const mes = dataInicio.getMonth() + 1;

    if (filtroAno && ano !== Number.parseInt(filtroAno, 10)) {
      return false;
    }

    if (filtroMes && mes !== Number.parseInt(filtroMes, 10)) {
      return false;
    }

    return true;
  });

  const totalLucro = relatoriosFiltrados.reduce(
    (acumulado, relatorio) => acumulado + Number(relatorio.lucro_total || 0),
    0,
  );
  const totalReembolso = relatoriosFiltrados.reduce(
    (acumulado, relatorio) => acumulado + Number(relatorio.reembolso_total || 0),
    0,
  );
  const lucroLiquido = totalLucro - totalReembolso;

  function gerarPeriodoMesAtual() {
    const hoje = new Date();
    const ano = hoje.getFullYear();
    const mes = String(hoje.getMonth() + 1).padStart(2, '0');
    const ultimoDiaDoMes = new Date(ano, hoje.getMonth() + 1, 0).getDate();

    setFormData({
      periodo_comeco: `${ano}-${mes}-01`,
      periodo_final: `${ano}-${mes}-${String(ultimoDiaDoMes).padStart(2, '0')}`,
    });
  }

  function gerarPeriodoMesPassado() {
    const hoje = new Date();
    const mesPassado = new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1);
    const ano = mesPassado.getFullYear();
    const mes = String(mesPassado.getMonth() + 1).padStart(2, '0');
    const ultimoDia = new Date(ano, mesPassado.getMonth() + 1, 0).getDate();

    setFormData({
      periodo_comeco: `${ano}-${mes}-01`,
      periodo_final: `${ano}-${mes}-${String(ultimoDia).padStart(2, '0')}`,
    });
  }

  function formatarMoeda(valor: number | string): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(Number(valor || 0));
  }

  function formatarData(data: string): string {
    return new Date(data).toLocaleDateString('pt-BR');
  }

  const anosDisponiveis = [...new Set(relatorios.map((relatorio) => new Date(relatorio.periodo_comeco).getFullYear()))];

  return (
    <div className="report-lucro">
      <div className="report-header">
        <h2>Relatorios de Lucro</h2>
        <button
          className="btn-new-report"
          onClick={() => setShowForm((currentValue) => !currentValue)}
          disabled={loading}
        >
          {showForm ? 'Cancelar' : '+ Novo Relatorio'}
        </button>
      </div>

      {error && <div className="report-error">{error}</div>}

      {showForm && (
        <div className="report-form">
          <h3>Gerar Relatorio Automatico</h3>

          <div className="quick-periods">
            <button type="button" className="btn-quick-period" onClick={gerarPeriodoMesAtual}>
              Mes Atual
            </button>
            <button type="button" className="btn-quick-period" onClick={gerarPeriodoMesPassado}>
              Mes Passado
            </button>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Data de Inicio *</label>
              <input
                type="date"
                value={formData.periodo_comeco}
                onChange={(event: ChangeEvent<HTMLInputElement>) => setFormData((currentForm) => ({
                  ...currentForm,
                  periodo_comeco: event.target.value,
                }))}
                required
              />
            </div>

            <div className="form-group">
              <label>Data Final *</label>
              <input
                type="date"
                value={formData.periodo_final}
                onChange={(event: ChangeEvent<HTMLInputElement>) => setFormData((currentForm) => ({
                  ...currentForm,
                  periodo_final: event.target.value,
                }))}
                required
              />
            </div>
          </div>

          <div className="form-actions">
            <button className="btn-submit" onClick={() => void gerarRelatorioAutomatico()} disabled={loading}>
              {loading ? 'Gerando...' : 'Gerar Relatorio'}
            </button>
          </div>
        </div>
      )}

      <div className="report-filters">
        <div className="filter-group">
          <label>Ano:</label>
          <select
            value={filtroAno}
            onChange={(event: ChangeEvent<HTMLSelectElement>) => setFiltroAno(event.target.value)}
          >
            <option value="">Todos</option>
            {anosDisponiveis.map((ano) => (
              <option key={ano} value={ano}>{ano}</option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label>Mes:</label>
          <select
            value={filtroMes}
            onChange={(event: ChangeEvent<HTMLSelectElement>) => setFiltroMes(event.target.value)}
          >
            <option value="">Todos</option>
            <option value="1">Janeiro</option>
            <option value="2">Fevereiro</option>
            <option value="3">Marco</option>
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

      <div className="report-summary">
        <div className="summary-card lucro">
          <div className="summary-icon">$</div>
          <div className="summary-info">
            <h4>Lucro Total</h4>
            <p className="summary-value">{formatarMoeda(totalLucro)}</p>
          </div>
        </div>

        <div className="summary-card reembolso">
          <div className="summary-icon">-</div>
          <div className="summary-info">
            <h4>Reembolsos</h4>
            <p className="summary-value">{formatarMoeda(totalReembolso)}</p>
          </div>
        </div>

        <div className="summary-card liquido">
          <div className="summary-icon">=</div>
          <div className="summary-info">
            <h4>Lucro Liquido</h4>
            <p className="summary-value">{formatarMoeda(lucroLiquido)}</p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="report-loading">Carregando relatorios...</div>
      ) : relatoriosFiltrados.length === 0 ? (
        <div className="report-empty">
          <p>Nenhum relatorio encontrado para os filtros selecionados.</p>
        </div>
      ) : (
        <div className="reports-table">
          <table>
            <thead>
              <tr>
                <th>Periodo</th>
                <th>Lucro Bruto</th>
                <th>Reembolsos</th>
                <th>Lucro Liquido</th>
                <th>Gerado em</th>
              </tr>
            </thead>
            <tbody>
              {relatoriosFiltrados.map((relatorio) => {
                const liquido = Number(relatorio.lucro_total) - Number(relatorio.reembolso_total);

                return (
                  <tr key={relatorio.id}>
                    <td>
                      {formatarData(relatorio.periodo_comeco)} - {formatarData(relatorio.periodo_final)}
                    </td>
                    <td className="value-positive">{formatarMoeda(relatorio.lucro_total)}</td>
                    <td className="value-negative">{formatarMoeda(relatorio.reembolso_total)}</td>
                    <td className={liquido >= 0 ? 'value-positive' : 'value-negative'}>
                      <strong>{formatarMoeda(liquido)}</strong>
                    </td>
                    <td className="text-muted">
                      {new Date(relatorio.generado_em).toLocaleString('pt-BR')}
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
