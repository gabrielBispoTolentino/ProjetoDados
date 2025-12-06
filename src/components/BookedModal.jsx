import React, { useEffect, useState } from "react";
import { api } from "../../server/api";
import './css/BookedModal.css';

export default function BookedModal({ isOpen, onClose }) {
  const [agendamentos, setAgendamentos] = useState([]);
  const [loading, setLoading] = useState(true);
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
    <div className="booked-backdrop" onClick={onClose}>
      <div className="booked-modal" onClick={(e) => e.stopPropagation()}>
        <div className="booked-header">
          <h2 className="booked-title">Agendamentos da Barbearia</h2>
          <button className="booked-close-btn" onClick={onClose}>×</button>
        </div>

        {loading && <p>Carregando...</p>}

        {!loading && agendamentos.length === 0 && (
          <p>Nenhum agendamento encontrado.</p>
        )}

        {!loading &&
          agendamentos.map((a) => (
            <div key={a.id} className="booked-item">
              <div className="booked-text">{a.usuario_nome || "Cliente"}</div>
              <div className="booked-text"><b>Status:</b> {a.status}</div>
              <div className="booked-text"><b>Barbearia:</b> {a.estabelecimento_nome}</div>
              <div className="booked-text">
  <b>Horário:</b>{" "}
  {a.proximo_pag
    ? new Date(a.proximo_pag).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
    : "—"}
</div>
                <div className="booked-text"><b>Data:</b> {a.proximo_pag ? new Date(a.proximo_pag).toLocaleDateString("pt-BR") : "—"}</div>
            </div>
          ))}
      </div>
    </div>
  );
}
