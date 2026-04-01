import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { api } from '../../server/api';
import TimeSlotSelector from './TimeSlotSelector';
import type { UserAppointment } from '../types/domain';
import './css/UserApointment.css';

type UserAppointmentsProps = {
  isOpen: boolean;
  onClose: () => void;
};

type AppointmentViewModel = UserAppointment & {
  nome: string;
  plano_nome: string;
};

const PLANOS: Record<string, string> = {
  '1': 'Corte Simples',
  '2': 'Corte + Barba',
  '3': 'Pacote Premium',
};

function getNomePlano(planoId: number | string | undefined): string {
  if (planoId === undefined) {
    return 'Plano';
  }

  return PLANOS[String(planoId)] || `Plano ${planoId}`;
}

function toAppointmentViewModel(agendamento: UserAppointment): AppointmentViewModel {
  return {
    ...agendamento,
    nome: agendamento.estabelecimento_nome || 'Estabelecimento',
    plano_nome: getNomePlano(agendamento.plano_id),
  };
}

export default function UserAppointments({
  isOpen,
  onClose,
}: UserAppointmentsProps) {
  const [agendamentos, setAgendamentos] = useState<AppointmentViewModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [reagendandoId, setReagendandoId] = useState<number | null>(null);
  const [novaData, setNovaData] = useState('');
  const [novoHorario, setNovoHorario] = useState('');

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    void loadAgendamentosDoUsuario();
  }, [isOpen]);

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : 'auto';
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen]);

  async function loadAgendamentosDoUsuario() {
    try {
      const usuarioId = localStorage.getItem('usuarioId') || '1';
      let data: UserAppointment[] | undefined;

      try {
        data = await api.getAgendamentos(usuarioId);
      } catch {
        data = undefined;
      }

      if (!data) {
        const cached = sessionStorage.getItem('agendamentos');
        if (cached) {
          const parsed = JSON.parse(cached) as UserAppointment[];
          setAgendamentos(parsed.map(toAppointmentViewModel));
          setLoading(false);
          return;
        }
      }

      if (!data) {
        setAgendamentos([]);
        setLoading(false);
        return;
      }

      const agendamentosComNome = data.map(toAppointmentViewModel);
      setAgendamentos(agendamentosComNome);
      sessionStorage.setItem('agendamentos', JSON.stringify(agendamentosComNome));
    } catch {
      setAgendamentos([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleCancelar(id: number) {
    if (!window.confirm('Deseja realmente cancelar este agendamento?')) {
      return;
    }

    try {
      await api.cancelarAgendamento(id);
      alert('Agendamento cancelado com sucesso!');
      await loadAgendamentosDoUsuario();
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : 'Erro ao cancelar agendamento';
      alert(message);
    }
  }

  function abrirReagendamento(agendamento: AppointmentViewModel) {
    setReagendandoId(agendamento.id);
    const data = new Date(agendamento.proximo_pag || '');
    setNovaData(data.toISOString().split('T')[0]);
    setNovoHorario('');
  }

  function fecharReagendamento() {
    setReagendandoId(null);
    setNovaData('');
    setNovoHorario('');
  }

  async function handleReagendar() {
    if (!reagendandoId || !novoHorario) {
      alert('Selecione um horario');
      return;
    }

    try {
      await api.reagendarAgendamento(reagendandoId, novoHorario);
      alert('Agendamento reagendado com sucesso!');
      fecharReagendamento();
      await loadAgendamentosDoUsuario();
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : 'Erro ao reagendar';
      alert(message);
    }
  }

  if (!isOpen) {
    return null;
  }

  const reagendamentoAtual = agendamentos.find((agendamento) => agendamento.id === reagendandoId) || null;

  return createPortal(
    <div className="appointments-overlay">
      <div className="appointments-modal">
        <button className="appointments-close-button" onClick={onClose}>x</button>

        <h3 className="appointments-title">Meus Agendamentos</h3>

        {loading ? (
          <p>Carregando...</p>
        ) : agendamentos.length === 0 ? (
          <p>Nenhum agendamento encontrado.</p>
        ) : (
          <div className="appointments-grid">
            {agendamentos.map((agendamento) => {
              const agora = new Date();
              const dataAgendamento = new Date(agendamento.proximo_pag || '');
              const isPast = dataAgendamento < agora;
              const podeEditar = !isPast && agendamento.status !== 'cancelado' && agendamento.pagamento_status !== 'completo';
              const pagamentoPendente = agendamento.pagamento_status !== 'completo' && agendamento.status !== 'cancelado';

              return (
                <div
                  key={agendamento.id}
                  className={`appointment-card ${agendamento.status === 'cancelado' ? 'canceled' : ''}`}
                >
                  <p><strong>Estabelecimento:</strong> {agendamento.nome}</p>
                  <p><strong>Plano:</strong> {agendamento.plano_nome}</p>
                  <p>
                    <strong>Data/Hora:</strong>{' '}
                    {agendamento.proximo_pag ? new Date(agendamento.proximo_pag).toLocaleString('pt-BR') : '-'}
                  </p>
                  <p>
                    <strong>Valor:</strong> R$ {Number(agendamento.valor || 0).toFixed(2)}
                  </p>
                  <p>
                    <strong>Pagamento:</strong>{' '}
                    <span
                      style={{
                        color: agendamento.pagamento_status === 'completo' ? '#4ade80' : '#fbbf24',
                        fontWeight: 'bold',
                      }}
                    >
                      {agendamento.pagamento_status === 'completo' ? 'Pago' : 'Pendente'}
                    </span>
                  </p>
                  <p>
                    <strong>Status:</strong>{' '}
                    <span
                      className={`appointment-status ${agendamento.status === 'ativo'
                        ? 'active'
                        : agendamento.status === 'cancelado'
                          ? 'canceled'
                          : agendamento.status === 'atrasado'
                            ? 'late'
                            : 'default'}`}
                    >
                      {agendamento.status}
                    </span>
                  </p>

                  <div className="appointment-actions">
                    {pagamentoPendente && (
                      <button
                        onClick={async () => {
                          try {
                            if (!window.confirm(`Confirma o pagamento de R$ ${Number(agendamento.valor || 0).toFixed(2)}?`)) {
                              return;
                            }
                            await api.pagarAgendamento(agendamento.id);
                            alert('Pagamento confirmado!');
                            await loadAgendamentosDoUsuario();
                          } catch (caughtError) {
                            const message = caughtError instanceof Error ? caughtError.message : 'Erro ao pagar agendamento';
                            alert(message);
                          }
                        }}
                        className="appointment-btn-pay"
                        style={{ backgroundColor: '#22c55e', color: 'white', marginRight: '0.5rem' }}
                      >
                        Pagar
                      </button>
                    )}

                    {podeEditar && (
                      <button
                        onClick={() => abrirReagendamento(agendamento)}
                        className="appointment-btn-reschedule"
                      >
                        Reagendar
                      </button>
                    )}

                    {podeEditar && (
                      <button
                        onClick={() => {
                          void handleCancelar(agendamento.id);
                        }}
                        className="appointment-btn-cancel"
                      >
                        Cancelar
                      </button>
                    )}
                  </div>

                  {isPast && agendamento.status !== 'cancelado' && (
                    <p className="appointment-past-notice">Este agendamento ja passou</p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {reagendandoId && createPortal(
        <div className="appointments-overlay">
          <div className="appointments-modal">
            <button className="appointments-close-button" onClick={fecharReagendamento}>x</button>

            <h3 className="appointments-title">Reagendar Horario</h3>

            <div className="reschedule-form-group">
              <label className="reschedule-label">Selecione uma nova data</label>
              <input
                type="date"
                value={novaData}
                onChange={(event) => {
                  setNovaData(event.target.value);
                  setNovoHorario('');
                }}
                min={new Date().toISOString().split('T')[0]}
                className="reschedule-input"
              />
            </div>

            {novaData && (
              <div className="reschedule-form-group">
                <TimeSlotSelector
                  estabelecimentoId={reagendamentoAtual?.estabelecimento_id}
                  selectedDate={novaData}
                  value={novoHorario}
                  onSelectDateTime={setNovoHorario}
                />
              </div>
            )}

            <div className="reschedule-actions">
              <button
                onClick={() => {
                  void handleReagendar();
                }}
                disabled={!novoHorario}
                className={`reschedule-btn-confirm ${!novoHorario ? 'disabled' : ''}`}
              >
                Confirmar
              </button>

              <button onClick={fecharReagendamento} className="reschedule-btn-cancel">
                Cancelar
              </button>
            </div>
          </div>
        </div>,
        document.body,
      )}
    </div>,
    document.body,
  );
}
