import React, { useEffect, useState } from "react";
import { api } from "../../server/api";
import { createPortal } from "react-dom";
import TimeSlotSelector from "./TimeSlotSelector";
import './css/UserApointment.css';

const PLANOS = {
  '1': 'Corte Simples',
  '2': 'Corte + Barba',
  '3': 'Pacote Premium'
};

const getNomePlano = (planoId) =>
  PLANOS[String(planoId)] || `Plano ${planoId}`;

export default function UserAppointments({ isOpen, onClose }) {
  if (!isOpen) return null;

  const [agendamentos, setAgendamentos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reagendandoId, setReagendandoId] = useState(null);
  const [novaData, setNovaData] = useState('');
  const [novoHorario, setNovoHorario] = useState('');

  useEffect(() => {
    loadAgendamentosDoUsuario();
  }, []);

  async function loadAgendamentosDoUsuario() {
    try {
      const usuarioId = localStorage.getItem("usuarioId") || "1";

      let data;
      try {
        data = await api.getAgendamentos(usuarioId);
      } catch { }

      if (!data) {
        const cached = sessionStorage.getItem("agendamentos");
        if (cached) {
          const parsed = JSON.parse(cached);
          setAgendamentos(
            parsed.map((ag) => ({
              ...ag,
              plano_nome: getNomePlano(ag.plano_id)
            }))
          );
          setLoading(false);
          return;
        }
      }

      if (!data) {
        setAgendamentos([]);
        setLoading(false);
        return;
      }

      const agendamentosComNome = await Promise.all(
        data.map(async (ag) => {
          try {
            const estab = await api.getEstablishmentById(ag.estabelecimento_id);
            return {
              ...ag,
              nome: estab?.nome || estab?.name || "Estabelecimento",
              plano_nome: getNomePlano(ag.plano_id)
            };
          } catch {
            return {
              ...ag,
              nome: "Estabelecimento",
              plano_nome: getNomePlano(ag.plano_id)
            };
          }
        })
      );

      setAgendamentos(agendamentosComNome);
      sessionStorage.setItem("agendamentos", JSON.stringify(agendamentosComNome));
    } catch {
      setAgendamentos([]);
    } finally {
      setLoading(false);
    }
  }

  const handleCancelar = async (id) => {
    if (!window.confirm('Deseja realmente cancelar este agendamento?')) {
      return;
    }

    try {
      await api.cancelarAgendamento(id);
      alert('Agendamento cancelado com sucesso!');
      await loadAgendamentosDoUsuario();
    } catch (err) {
      alert(err.message || 'Erro ao cancelar agendamento');
    }
  };

  const abrirReagendamento = (agendamento) => {
    setReagendandoId(agendamento.id);
    const data = new Date(agendamento.proximo_pag);
    setNovaData(data.toISOString().split('T')[0]);
    setNovoHorario('');
  };

  const fecharReagendamento = () => {
    setReagendandoId(null);
    setNovaData('');
    setNovoHorario('');
  };

  const handleReagendar = async () => {
    if (!novoHorario) {
      alert('Selecione um horário');
      return;
    }

    try {
      await api.reagendarAgendamento(reagendandoId, novoHorario);
      alert('Agendamento reagendado com sucesso!');
      fecharReagendamento();
      await loadAgendamentosDoUsuario();
    } catch (err) {
      alert(err.message || 'Erro ao reagendar');
    }
  };

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isOpen]);

  return createPortal(
    <div className="appointments-overlay">
      <div className="appointments-modal">
        <button className="appointments-close-button" onClick={onClose}>×</button>

        <h3 className="appointments-title">Meus Agendamentos</h3>

        {loading ? (
          <p>Carregando...</p>
        ) : agendamentos.length === 0 ? (
          <p>Nenhum agendamento encontrado.</p>
        ) : (
          <div className="appointments-grid">
            {agendamentos.map((ag) => {
              const agora = new Date();
              const dataAgendamento = new Date(ag.proximo_pag);
              const isPast = dataAgendamento < agora;
              const podeEditar = !isPast && ag.status !== 'cancelado' && ag.pagamento_status !== 'completo';
              const pagamentoPendente = ag.pagamento_status !== 'completo' && ag.status !== 'cancelado';

              return (
                <div
                  key={ag.id}
                  className={`appointment-card ${ag.status === 'cancelado' ? 'canceled' : ''}`}
                >
                  <p><strong>Estabelecimento:</strong> {ag.nome}</p>
                  <p><strong>Plano:</strong> {ag.plano_nome}</p>
                  <p>
                    <strong>Data/Hora:</strong>{" "}
                    {new Date(ag.proximo_pag).toLocaleString("pt-BR")}
                  </p>
                  <p>
                    <strong>Valor:</strong> R$ {Number(ag.valor || 0).toFixed(2)}
                  </p>
                  <p>
                    <strong>Pagamento:</strong>{" "}
                    <span style={{
                      color: ag.pagamento_status === 'completo' ? '#4ade80' : '#fbbf24',
                      fontWeight: 'bold'
                    }}>
                      {ag.pagamento_status === 'completo' ? 'Pago' : 'Pendente'}
                    </span>
                  </p>
                  <p>
                    <strong>Status:</strong>{" "}
                    <span className={`appointment-status ${ag.status === 'ativo' ? 'active' :
                      ag.status === 'cancelado' ? 'canceled' :
                        ag.status === 'atrasado' ? 'late' :
                          'default'
                      }`}>
                      {ag.status}
                    </span>
                  </p>

                  <div className="appointment-actions">
                    {pagamentoPendente && (
                      <button
                        onClick={async () => {
                          try {
                            if (!window.confirm(`Confirma o pagamento de R$ ${Number(ag.valor || 0).toFixed(2)}?`)) return;
                            await api.pagarAgendamento(ag.id);
                            alert('Pagamento confirmado!');
                            await loadAgendamentosDoUsuario();
                          } catch (err) {
                            alert(err.message);
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
                        onClick={() => abrirReagendamento(ag)}
                        className="appointment-btn-reschedule"
                      >
                        Reagendar
                      </button>
                    )}

                    {podeEditar && (
                      <button
                        onClick={() => handleCancelar(ag.id)}
                        className="appointment-btn-cancel"
                      >
                        Cancelar
                      </button>
                    )}
                  </div>

                  {isPast && ag.status !== 'cancelado' && (
                    <p className="appointment-past-notice">
                      Este agendamento já passou
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal de Reagendamento */}
      {reagendandoId && createPortal(
        <div className="appointments-overlay">
          <div className="appointments-modal">
            <button className="appointments-close-button" onClick={fecharReagendamento}>×</button>

            <h3 className="appointments-title">Reagendar Horário</h3>

            <div className="reschedule-form-group">
              <label className="reschedule-label">
                Selecione uma nova data
              </label>
              <input
                type="date"
                value={novaData}
                onChange={(e) => {
                  setNovaData(e.target.value);
                  setNovoHorario('');
                }}
                min={new Date().toISOString().split('T')[0]}
                className="reschedule-input"
              />
            </div>

            {novaData && (
              <div className="reschedule-form-group">
                <TimeSlotSelector
                  estabelecimentoId={
                    agendamentos.find(a => a.id === reagendandoId)?.estabelecimento_id
                  }
                  selectedDate={novaData}
                  value={novoHorario}
                  onSelectDateTime={setNovoHorario}
                />
              </div>
            )}

            <div className="reschedule-actions">
              <button
                onClick={handleReagendar}
                disabled={!novoHorario}
                className={`reschedule-btn-confirm ${!novoHorario ? 'disabled' : ''}`}
              >
                Confirmar
              </button>

              <button
                onClick={fecharReagendamento}
                className="reschedule-btn-cancel"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>,
    document.body
  );
}