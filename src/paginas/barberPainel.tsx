import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout';
import { useFeedback } from '../components/FeedbackProvider';
import { BarberAppointmentCardSkeletons } from '../components/Skeleton';
import { api } from '../../server/api';
import type { UserAppointment, UserSummary } from '../types/domain';
import './css/PainelCliente.css';
import './css/PainelAdmin.css';

function parseStoredUser(): UserSummary | null {
  const usuarioStr = localStorage.getItem('usuario');
  if (!usuarioStr) return null;
  try {
    return JSON.parse(usuarioStr) as UserSummary;
  } catch {
    return null;
  }
}

export default function BarberPainel() {
  const navigate = useNavigate();
  const feedback = useFeedback();
  const [usuario, setUsuario] = useState<UserSummary | null>(() => parseStoredUser());
  const [agendamentos, setAgendamentos] = useState<UserAppointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!usuario) {
      navigate('/login');
      return;
    }

    if (usuario.userTable !== 'usuarioBarber') {
      navigate('/login');
      return;
    }

    void carregarAgendamentos(usuario.id);
  }, [navigate, usuario]);

  const filteredAgendamentos = agendamentos.filter(a => 
    (a.usuario_nome || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (a.estabelecimento_nome || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  async function carregarAgendamentos(usuarioId: number) {
    setLoading(true);
    setError('');

    try {
      const data = await api.getAgendamentosBarbeiro(usuarioId);
      setAgendamentos(Array.isArray(data) ? data : []);
    } catch (caughtError) {
      console.error(caughtError);
      setError(caughtError instanceof Error ? caughtError.message : 'Erro ao carregar agendamentos');
      setAgendamentos([]);
    } finally {
      setLoading(false);
    }
  }

  async function atualizarStatusAgendamento(
    agendamentoId: number,
    acao: 'cancelar' | 'concluir',
  ) {
    const confirmed = await feedback.confirm({
      title: acao === 'cancelar' ? 'Cancelar agendamento' : 'Concluir agendamento',
      message: acao === 'cancelar' ? 'Deseja realmente cancelar este agendamento?' : 'Deseja marcar este agendamento como concluido?',
      confirmLabel: acao === 'cancelar' ? 'Cancelar agendamento' : 'Concluir',
      cancelLabel: 'Voltar',
      tone: acao === 'cancelar' ? 'danger' : 'default',
    });

    if (!confirmed) return;

    setProcessingId(agendamentoId);

    try {
      if (acao === 'cancelar') {
        await api.cancelarAgendamentoBarbeiro(agendamentoId);
        feedback.success('Agendamento cancelado com sucesso!');
      } else {
        await api.concluirAgendamentoBarbeiro(agendamentoId);
        feedback.success('Agendamento concluido com sucesso!');
      }

      setAgendamentos((current) => current.map((agendamento) => (
        agendamento.id === agendamentoId
          ? { ...agendamento, status: acao === 'cancelar' ? 'cancelado' : 'completo' }
          : agendamento
      )));
    } catch (caughtError) {
      feedback.error(caughtError instanceof Error ? caughtError.message : 'Erro ao atualizar agendamento');
    } finally {
      setProcessingId(null);
    }
  }

  const handleUserUpdate = (updatedUser: UserSummary) => {
    localStorage.setItem('usuario', JSON.stringify(updatedUser));
    setUsuario(updatedUser);
  };

  return (
    <DashboardLayout 
      user={usuario} 
      onUserUpdate={handleUserUpdate}
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
    >
      <main className="painel-main">
        <div style={{ marginBottom: '40px' }}>
          <h1 className="shops-title">Meus Cortes Agendados</h1>
          <p>Visualize os clientes agendados com você.</p>
        </div>

        {error && <div className="loader error">{error}</div>}

        {loading ? (
          <div className="admin-grid">
            <BarberAppointmentCardSkeletons count={4} />
          </div>
        ) : filteredAgendamentos.length === 0 ? (
          <div className="loader">Nenhum corte encontrado para sua busca.</div>
        ) : (
          <div className="admin-grid">
            {filteredAgendamentos.map((agendamento) => {
              const statusFinalizado = agendamento.status === 'cancelado' || agendamento.status === 'completo';
              const isProcessing = processingId === agendamento.id;

              return (
                <article key={agendamento.id} className="shop-card">
                  <div className="shop-info">
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                      <span className="subscription-badge" style={{ background: 'var(--accent-muted)', color: 'var(--accent)' }}>
                        {agendamento.status || 'agendado'}
                      </span>
                      <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                        {agendamento.proximo_pag ? new Date(agendamento.proximo_pag).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '-'}
                      </span>
                    </div>
                    
                    <h3 className="shop-name">{agendamento.usuario_nome || 'Cliente'}</h3>
                    <p className="shop-address">{agendamento.estabelecimento_nome || 'Barbearia'}</p>
                    
                    <div style={{ marginTop: '16px', borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
                      <p className="admin-shop-phone">Data: {agendamento.proximo_pag ? new Date(agendamento.proximo_pag).toLocaleDateString('pt-BR') : '-'}</p>
                      <p className="admin-shop-phone">Valor: R$ {Number(agendamento.valor || 0).toFixed(2)}</p>
                      <p className="admin-shop-phone">Pagamento: {agendamento.pagamento_status || 'pendente'}</p>
                    </div>

                    {!statusFinalizado && (
                      <div className="barber-appointment-actions" style={{ marginTop: '20px' }}>
                        <button
                          type="button"
                          className="btn btn-primary"
                          style={{ padding: '8px 16px', fontSize: '14px', flex: 1 }}
                          disabled={isProcessing}
                          onClick={() => {
                            void atualizarStatusAgendamento(agendamento.id, 'concluir');
                          }}
                        >
                          {isProcessing ? '...' : 'Concluir'}
                        </button>
                        <button
                          type="button"
                          className="btn btn-ghost"
                          style={{ padding: '8px 16px', fontSize: '14px', flex: 1, color: '#ef4444', borderColor: '#ef4444' }}
                          disabled={isProcessing}
                          onClick={() => {
                            void atualizarStatusAgendamento(agendamento.id, 'cancelar');
                          }}
                        >
                          {isProcessing ? '...' : 'Cancelar'}
                        </button>
                      </div>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>
    </DashboardLayout>
  );
}
