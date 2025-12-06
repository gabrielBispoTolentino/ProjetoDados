import React, { useEffect, useState } from "react";
import { api } from "../../server/api";

export default function BookedModal({ isOpen, onClose }) {
  const [agendamentos, setAgendamentos] = useState([]);
  const [loading, setLoading] = useState(true);

  const styles = {
    backdrop: {
      position: "fixed",
      inset: 0,
      background: "rgba(0, 0, 0, 0.7)",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      zIndex: 9999,
      padding: "20px",
    },
    modal: {
      background: "white",
      width: "100%",
      maxWidth: "600px",
      borderRadius: "12px",
      padding: "20px",
      maxHeight: "80vh",
      overflowY: "auto",
      boxShadow: "0 4px 20px rgba(0,0,0,0.4)",
    },
    header: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: "10px",
    },
    closeBtn: {
      background: "transparent",
      border: "none",
      fontSize: "22px",
      cursor: "pointer",
      color : "black"
    },
    item: {
      padding: "12px",
      marginBottom: "12px",
      background: "#f5f5f5",
      borderRadius: "8px",
    },
    title: {
      fontSize: "18px",
      fontWeight: "bold",
    },
    text: {
      fontSize: "14px",
      marginTop: "4px",
    }
  };

  // Bloqueia scroll
  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "auto";
  }, [isOpen]);
 useEffect(() => {
  if (!isOpen) return;

  (async () => {
    try {
      setLoading(true);
      const usuarioId = localStorage.getItem('usuarioId');
      const dados = await api.getAgendamentosMinhaBarbearia(usuarioId);
      console.log('agendamentos minha barbearia', dados);
      setAgendamentos(Array.isArray(dados) ? dados : []);
    } catch (err) {
      console.error(err);
      setAgendamentos([]);
    } finally {
      setLoading(false);
    }
  })();
}, [isOpen]);
  if (!isOpen) return null;

  return (
    <div style={styles.backdrop} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <h2>Agendamentos da Barbearia</h2>
          <button style={styles.closeBtn} onClick={onClose}>×</button>
        </div>

        {loading && <p>Carregando...</p>}

        {!loading && agendamentos.length === 0 && (
          <p>Nenhum agendamento encontrado.</p>
        )}

        {!loading &&
          agendamentos.map((a) => (
            <div key={a.id} style={styles.item}>
              <div style={styles.title}>{a.usuario_nome || "Cliente"}</div>
              <div style={styles.text}><b>Status:</b> {a.status}</div>
              <div style={styles.text}><b>Barbearia:</b> {a.estabelecimento_nome}</div>
              <div style={styles.text}>
  <b>Horário:</b>{" "}
  {a.proximo_pag
    ? new Date(a.proximo_pag).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
    : "—"}
</div>
                <div style={styles.text}><b>Data:</b> {a.proximo_pag ? new Date(a.proximo_pag).toLocaleDateString("pt-BR") : "—"}</div>
            </div>
          ))}
      </div>
    </div>
  );
}
