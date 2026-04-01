import { useEffect, useState } from 'react';
import { api } from '../../server/api';
import type { UserAppointment } from '../types/domain';
import './css/BookedModal.css';

type BookedModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export default function BookedModal({ isOpen, onClose }: BookedModalProps) {
  const [agendamentos, setAgendamentos] = useState<UserAppointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : 'auto';
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    void loadAgendamentos();
  }, [isOpen]);

  async function loadAgendamentos() {
    try {
      setLoading(true);
      const usuarioId = localStorage.getItem('usuarioId');
      if (!usuarioId) {
        setAgendamentos([]);
        return;
      }

      const dados = await api.getAgendamentosMinhaBarbearia(usuarioId);
      setAgendamentos(Array.isArray(dados) ? dados : []);
    } catch (caughtError) {
      console.error(caughtError);
      setAgendamentos([]);
    } finally {
      setLoading(false);
    }
  }

  if (!isOpen) {
    return null;
  }

  return (
    <div className="booked-backdrop" onClick={onClose}>
      <div className="booked-modal" onClick={(event) => event.stopPropagation()}>
        <div className="booked-header">
          <h2 className="booked-title">Agendamentos da Barbearia</h2>
          <button className="booked-close-btn" onClick={onClose}>x</button>
        </div>

        {loading && <p>Carregando...</p>}

        {!loading && agendamentos.length === 0 && <p>Nenhum agendamento encontrado.</p>}

        {!loading && agendamentos.map((agendamento) => (
          <div key={agendamento.id} className="booked-item">
            <div className="booked-text">{agendamento.usuario_nome || 'Cliente'}</div>
            <div className="booked-text"><b>Status:</b> {agendamento.status}</div>
            <div className="booked-text"><b>Barbearia:</b> {agendamento.estabelecimento_nome}</div>
            <div className="booked-text">
              <b>Horario:</b>{' '}
              {agendamento.proximo_pag
                ? new Date(agendamento.proximo_pag).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
                : '-'}
            </div>
            <div className="booked-text">
              <b>Data:</b> {agendamento.proximo_pag ? new Date(agendamento.proximo_pag).toLocaleDateString('pt-BR') : '-'}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
