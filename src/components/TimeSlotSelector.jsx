import React, { useState, useEffect } from 'react';
import { api } from '../../server/api';
import './css/TimeSlot.css';

const HORARIOS_TRABALHO = [
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30', '18:00'
];

export default function TimeSlotSelector({
  estabelecimentoId,
  selectedDate,
  onSelectDateTime,
  value
}) {
  const [horariosOcupados, setHorariosOcupados] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (selectedDate && estabelecimentoId) {
      loadHorariosOcupados();
    }
  }, [selectedDate, estabelecimentoId]);

  const loadHorariosOcupados = async () => {
    setLoading(true);
    setError(null);

    try {
      const dataFormatada = selectedDate.split('T')[0];
      const response = await api.getHorariosDisponiveis(estabelecimentoId, dataFormatada);
      setHorariosOcupados(response.horariosOcupados || []);
    } catch (err) {
      setError('Erro ao carregar horários disponíveis');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const isHorarioOcupado = (horario) => {
    const [hora, minuto] = horario.split(':');
    const dataCompleta = new Date(selectedDate);
    dataCompleta.setHours(parseInt(hora), parseInt(minuto), 0, 0);

    return horariosOcupados.some(ocupado => {
      const dataOcupada = new Date(ocupado);
      return dataCompleta.getTime() === dataOcupada.getTime();
    });
  };

  const isHorarioPassado = (horario) => {
    const [hora, minuto] = horario.split(':');
    const dataCompleta = new Date(selectedDate);
    dataCompleta.setHours(parseInt(hora), parseInt(minuto), 0, 0);

    return dataCompleta < new Date();
  };

  const handleSelectHorario = (horario) => {
    const [hora, minuto] = horario.split(':');

    // Create datetime string in local time format (YYYY-MM-DDTHH:MM)
    const datePart = selectedDate.split('T')[0]; // Get YYYY-MM-DD
    const timePart = `${hora.padStart(2, '0')}:${minuto.padStart(2, '0')}`;
    const localDateTime = `${datePart}T${timePart}`;

    onSelectDateTime(localDateTime);
  };

  const getCurrentTimeSlot = () => {
    if (!value) return null;

    // Extrair tempo de  datetime string (YYYY-MM-DDTHH:MM format)
    if (typeof value === 'string' && value.includes('T')) {
      const timePart = value.split('T')[1];
      if (timePart) {
        return timePart.substring(0, 5); // Get HH:MM
      }
    }

    return null;
  };

  if (!selectedDate) {
    return (
      <div className="timeslot-no-date">
        Selecione uma data primeiro
      </div>
    );
  }

  if (loading) {
    return (
      <div className="timeslot-loading">
        Carregando horários disponíveis...
      </div>
    );
  }

  if (error) {
    return (
      <div className="timeslot-error">
        {error}
      </div>
    );
  }

  const currentSlot = getCurrentTimeSlot();

  return (
    <div>
      <label className="timeslot-label">
        Selecione um horário
      </label>

      <div className="timeslot-grid">
        {HORARIOS_TRABALHO.map((horario) => {
          const ocupado = isHorarioOcupado(horario);
          const passado = isHorarioPassado(horario);
          const selecionado = horario === currentSlot;
          const desabilitado = ocupado || passado;

          return (
            <button
              key={horario}
              type="button"
              onClick={() => !desabilitado && handleSelectHorario(horario)}
              disabled={desabilitado}
              className={`timeslot-button ${selecionado ? 'selected' : ''} ${desabilitado ? 'disabled' : ''} ${passado ? 'passed' : ''}`}
            >
              {horario}
              {ocupado && !passado && (
                <span className="timeslot-occupied">
                  Ocupado
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="timeslot-legend">
        <div className="timeslot-legend-item">
          <div className="timeslot-legend-box available" />
          <span>Disponível</span>
        </div>

        <div className="timeslot-legend-item">
          <div className="timeslot-legend-box selected" />
          <span>Selecionado</span>
        </div>

        <div className="timeslot-legend-item">
          <div className="timeslot-legend-box occupied" />
          <span>Ocupado</span>
        </div>
      </div>
    </div>
  );
}