import React, { useEffect, useState } from "react";
import { api } from "../../server/api";
import { createPortal } from "react-dom";
import TimeSlotSelector from "./TimeSlotSelector";

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
      } catch {}

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
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <button style={styles.closeButton} onClick={onClose}>×</button>

        <h3 style={{ marginTop: 0 }}>Meus Agendamentos</h3>

        {loading ? (
          <p>Carregando...</p>
        ) : agendamentos.length === 0 ? (
          <p>Nenhum agendamento encontrado.</p>
        ) : (
          <div style={{ display: "grid", gap: "1rem" }}>
            {agendamentos.map((ag) => {
              const agora = new Date();
              const dataAgendamento = new Date(ag.proximo_pag);
              const isPast = dataAgendamento < agora;
              const podeEditar = !isPast && ag.status !== 'cancelado';

              return (
                <div key={ag.id} style={{
                  ...styles.card,
                  opacity: ag.status === 'cancelado' ? 0.6 : 1,
                  border: ag.status === 'cancelado' ? '1px solid #ef4444' : '1px solid #000000ff'
                }}>
                  <p><strong>Estabelecimento:</strong> {ag.nome}</p>
                  <p><strong>Plano:</strong> {ag.plano_nome}</p>
                  <p>
                    <strong>Data/Hora:</strong>{" "}
                    {new Date(ag.proximo_pag).toLocaleString("pt-BR")}
                  </p>
                  <p>
                    <strong>Status:</strong>{" "}
                    <span style={{
                      padding: '0.25rem 0.5rem',
                      borderRadius: '4px',
                      fontSize: '0.85rem',
                      fontWeight: '600',
                      backgroundColor: 
                        ag.status === 'ativo' ? '#dcfce7' :
                        ag.status === 'cancelado' ? '#fee2e2' :
                        ag.status === 'atrasado' ? '#fef3c7' :
                        '#f3f4f6',
                      color:
                        ag.status === 'ativo' ? '#166534' :
                        ag.status === 'cancelado' ? '#991b1b' :
                        ag.status === 'atrasado' ? '#854d0e' :
                        '#374151'
                    }}>
                      {ag.status}
                    </span>
                  </p>

                  {podeEditar && (
                    <div style={{ 
                      display: 'flex', 
                      gap: '0.5rem', 
                      marginTop: '0.75rem' 
                    }}>
                      <button
                        onClick={() => abrirReagendamento(ag)}
                        style={{
                          flex: 1,
                          padding: '0.5rem',
                          backgroundColor: 'var(--accent)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontWeight: '600',
                          fontSize: '0.9rem'
                        }}
                      >
                        Reagendar
                      </button>
                      
                      <button
                        onClick={() => handleCancelar(ag.id)}
                        style={{
                          flex: 1,
                          padding: '0.5rem',
                          backgroundColor: '#fee2e2',
                          color: '#b91c1c',
                          border: '1px solid #fecaca',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontWeight: '600',
                          fontSize: '0.9rem'
                        }}
                      >
                        Cancelar
                      </button>
                    </div>
                  )}

                  {isPast && ag.status !== 'cancelado' && (
                    <p style={{ 
                      marginTop: '0.5rem', 
                      fontSize: '0.85rem', 
                      color: '#6b7280' 
                    }}>
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
        <div style={styles.overlay}>
          <div style={styles.modal}>
            <button style={styles.closeButton} onClick={fecharReagendamento}>×</button>
            
            <h3 style={{ marginTop: 0 }}>Reagendar Horário</h3>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '0.5rem',
                fontWeight: '600',
                color: 'var(--text)'
              }}>
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
                style={{
                  width: '100%',
                  padding: '0.6rem',
                  border: '1px solid #e6eef2',
                  borderRadius: '8px',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            {novaData && (
              <div style={{ marginBottom: '1rem' }}>
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

            <div style={{ 
              display: 'flex', 
              gap: '0.5rem', 
              marginTop: '1.5rem' 
            }}>
              <button
                onClick={handleReagendar}
                disabled={!novoHorario}
                style={{
                  flex: 1,
                  padding: '0.6rem',
                  backgroundColor: novoHorario ? 'var(--accent)' : '#d1d5db',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: novoHorario ? 'pointer' : 'not-allowed',
                  fontWeight: '600'
                }}
              >
                Confirmar
              </button>
              
              <button
                onClick={fecharReagendamento}
                style={{
                  flex: 1,
                  padding: '0.6rem',
                  backgroundColor: '#f3f4f6',
                  color: '#374151',
                  border: '1px solid #e6eef2',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: '600'
                }}
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

const styles = {
  overlay: {
    position: "fixed",
    inset: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 9999,
    padding: "20px",
    overflowY: "auto",
  },
  modal: {
    background: "white",
    borderRadius: "12px",
    padding: "20px",
    width: "90%",
    maxWidth: "600px",
    maxHeight: "80vh",
    overflowY: "auto",
    position: "relative",
    boxShadow: "0 4px 20px rgba(0,0,0,0.25)",
  },
  closeButton: {
    position: "absolute",
    top: "10px",
    right: "10px",
    background: "none",
    border: "none",
    fontSize: "22px",
    cursor: "pointer",
    color: "black"
  },
  card: { 
    padding: "1rem", 
    backgroundColor: "#dd11115a", 
    borderRadius: "10px", 
    border: "1px solid #000000ff" 
  }
};