import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import UserBar from '../components/UserBar';
import { useFeedback } from '../components/FeedbackProvider';
import { BarberAppointmentCardSkeletons } from '../components/Skeleton';
import { api } from '../../server/api';
import type { UserAppointment, UserSummary } from '../types/domain';
import './css/PainelCliente.css';
import './css/PainelAdmin.css';

function parseStoredUser(): UserSummary | null {
  const usuarioStr = localStorage.getItem('usuario');
  if (!usuarioStr) {
    return null;
  }

  try {
    return JSON.parse(usuarioStr) as UserSummary;
  } catch {
    return null;
  }
}

export default function BarberPainel() {
  const navigate = useNavigate();
  const feedback = useFeedback();
  const [usuario] = useState<UserSummary | null>(() => parseStoredUser());
  const [agendamentos, setAgendamentos] = useState<UserAppointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [processingId, setProcessingId] = useState<number | null>(null);

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
    const mensagens = {
      cancelar: 'Deseja realmente cancelar este agendamento?',
      concluir: 'Deseja marcar este agendamento como concluido?',
    } as const;

    const confirmed = await feedback.confirm({
      title: acao === 'cancelar' ? 'Cancelar agendamento' : 'Concluir agendamento',
      message: mensagens[acao],
      confirmLabel: acao === 'cancelar' ? 'Cancelar agendamento' : 'Concluir',
      cancelLabel: 'Voltar',
      tone: acao === 'cancelar' ? 'danger' : 'default',
    });

    if (!confirmed) {
      return;
    }

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
      const message = caughtError instanceof Error ? caughtError.message : 'Erro ao atualizar agendamento';
      feedback.error(message);
    } finally {
      setProcessingId(null);
    }
  }

  return (
    <>
      <UserBar />
      <main className="painel-main">
        <div className="painel-header">
          <h1>Meus Cortes Agendados</h1>
          <p>Visualize os clientes agendados com voce.</p>
        </div>

        {error && <div className="loader error">{error}</div>}

        {loading ? (
          <div className="admin-grid">
            <BarberAppointmentCardSkeletons count={4} />
          </div>
        ) : agendamentos.length === 0 ? (
          <div className="loader">Nenhum corte agendado com voce no momento.</div>
        ) : (
          <div className="admin-grid">
            {agendamentos.map((agendamento) => {
              const statusFinalizado = agendamento.status === 'cancelado' || agendamento.status === 'completo';
              const isProcessing = processingId === agendamento.id;

              return (
                <article key={agendamento.id} className="shop-card admin-shop-card">
                  <div className="shop-info">
                    <h4 className="shop-name">{agendamento.usuario_nome || 'Cliente'}</h4>
                    <p className="shop-address">{agendamento.estabelecimento_nome || 'Barbearia'}</p>
                    <p className="admin-shop-phone">
                      Data: {agendamento.proximo_pag ? new Date(agendamento.proximo_pag).toLocaleDateString('pt-BR') : '-'}
                    </p>
                    <p className="admin-shop-phone">
                      Horario: {agendamento.proximo_pag ? new Date(agendamento.proximo_pag).toLocaleTimeString('pt-BR', {
                        hour: '2-digit',
                        minute: '2-digit',
                      }) : '-'}
                    </p>
                    <p className="admin-shop-phone">Status: {agendamento.status || '-'}</p>
                    <p className="admin-shop-phone">Pagamento: {agendamento.pagamento_status || 'pendente'}</p>
                    <p className="admin-shop-phone">Valor: R$ {Number(agendamento.valor || 0).toFixed(2)}</p>

                    {!statusFinalizado && (
                      <div className="barber-appointment-actions">
                        <button
                          type="button"
                          className="barber-appointment-btn barber-appointment-btn-complete"
                          disabled={isProcessing}
                          onClick={() => {
                            void atualizarStatusAgendamento(agendamento.id, 'concluir');
                          }}
                        >
                          {isProcessing ? 'Processando...' : 'Concluir'}
                        </button>
                        <button
                          type="button"
                          className="barber-appointment-btn barber-appointment-btn-cancel"
                          disabled={isProcessing}
                          onClick={() => {
                            void atualizarStatusAgendamento(agendamento.id, 'cancelar');
                          }}
                        >
                          {isProcessing ? 'Processando...' : 'Cancelar'}
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
    </>
  );
}
