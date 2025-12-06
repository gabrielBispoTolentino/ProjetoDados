import React, { useEffect, useState } from "react";
import { api } from "../../server/api";
import { createPortal } from "react-dom";
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
  useEffect(() => {
  if (isOpen) {
    document.body.style.overflow = "hidden";     // impede scroll e impede o layout de mexer
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
          {agendamentos.map((ag) => (
            <div key={ag.id} style={styles.card}>
              <p><strong>Estabelecimento:</strong> {ag.nome}</p>
              <p><strong>Plano:</strong> {ag.plano_nome}</p>
              <p>
                <strong>Data/Hora:</strong>{" "}
                {new Date(ag.proximo_pag).toLocaleString("pt-BR")}
              </p>
              <p><strong>Status:</strong> {ag.status}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  </div>,
  document.body
);}
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
  overflowY: "auto",   // <- ESSENCIAL!!
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
  card: { padding: "1rem", backgroundColor: "#dd11115a", borderRadius: "10px", border: "1px solid #000000ff" }
};
