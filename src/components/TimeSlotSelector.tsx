import { useEffect, useState } from 'react';
import { api } from '../../server/api';
import './css/TimeSlot.css';

type TimeSlotSelectorProps = {
  estabelecimentoId?: number | string | null;
  barbeiroId?: number | string | null;
  selectedDate: string;
  onSelectDateTime: (dateTime: string) => void;
  value?: string | null;
};

const HORARIOS_TRABALHO = [
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30', '18:00',
] as const;

export default function TimeSlotSelector({
  estabelecimentoId,
  barbeiroId,
  selectedDate,
  onSelectDateTime,
  value,
}: TimeSlotSelectorProps) {
  const [horariosOcupados, setHorariosOcupados] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedDate || !estabelecimentoId || !barbeiroId) {
      setHorariosOcupados([]);
      return;
    }

    void loadHorariosOcupados();
  }, [selectedDate, estabelecimentoId, barbeiroId]);

  async function loadHorariosOcupados() {
    if (!selectedDate || !estabelecimentoId || !barbeiroId) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const dataFormatada = selectedDate.split('T')[0];
      const response = await api.getHorariosDisponiveis(estabelecimentoId, dataFormatada, barbeiroId);
      setHorariosOcupados(response.horariosOcupados || []);
    } catch (caughtError) {
      setError('Erro ao carregar horarios disponiveis');
      console.error(caughtError);
    } finally {
      setLoading(false);
    }
  }

  function isHorarioOcupado(horario: string): boolean {
    const [hora, minuto] = horario.split(':');
    const dataCompleta = new Date(selectedDate);
    dataCompleta.setHours(Number.parseInt(hora, 10), Number.parseInt(minuto, 10), 0, 0);

    return horariosOcupados.some((ocupado) => {
      const dataOcupada = new Date(ocupado);
      return dataCompleta.getTime() === dataOcupada.getTime();
    });
  }

  function isHorarioPassado(horario: string): boolean {
    const [hora, minuto] = horario.split(':');
    const dataCompleta = new Date(selectedDate);
    dataCompleta.setHours(Number.parseInt(hora, 10), Number.parseInt(minuto, 10), 0, 0);

    return dataCompleta < new Date();
  }

  function handleSelectHorario(horario: string) {
    const [hora, minuto] = horario.split(':');
    const datePart = selectedDate.split('T')[0];
    const timePart = `${hora.padStart(2, '0')}:${minuto.padStart(2, '0')}`;
    const localDateTime = `${datePart}T${timePart}`;

    onSelectDateTime(localDateTime);
  }

  function getCurrentTimeSlot(): string | null {
    if (!value || !value.includes('T')) {
      return null;
    }

    const timePart = value.split('T')[1];
    return timePart ? timePart.substring(0, 5) : null;
  }

  if (!selectedDate) {
    return <div className="timeslot-no-date">Selecione uma data primeiro</div>;
  }

  if (!barbeiroId) {
    return <div className="timeslot-no-date">Selecione um barbeiro primeiro</div>;
  }

  if (loading) {
    return <div className="timeslot-loading">Carregando horarios disponiveis...</div>;
  }

  if (error) {
    return <div className="timeslot-error">{error}</div>;
  }

  const currentSlot = getCurrentTimeSlot();

  return (
    <div>
      <label className="timeslot-label">Selecione um horario</label>

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
              onClick={() => {
                if (!desabilitado) {
                  handleSelectHorario(horario);
                }
              }}
              disabled={desabilitado}
              className={`timeslot-button ${selecionado ? 'selected' : ''} ${desabilitado ? 'disabled' : ''} ${passado ? 'passed' : ''}`}
            >
              {horario}
              {ocupado && !passado && <span className="timeslot-occupied">Ocupado</span>}
            </button>
          );
        })}
      </div>

      <div className="timeslot-legend">
        <div className="timeslot-legend-item">
          <div className="timeslot-legend-box available" />
          <span>Disponivel</span>
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
