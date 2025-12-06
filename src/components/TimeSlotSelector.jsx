import React, { useState, useEffect } from 'react';
import { api } from '../../server/api';

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
    const dataCompleta = new Date(selectedDate);
    dataCompleta.setHours(parseInt(hora), parseInt(minuto), 0, 0);
    
    const isoString = dataCompleta.toISOString().slice(0, 16);
    onSelectDateTime(isoString);
  };

  const getCurrentTimeSlot = () => {
    if (!value) return null;
    const date = new Date(value);
    const hora = String(date.getHours()).padStart(2, '0');
    const minuto = String(date.getMinutes()).padStart(2, '0');
    return `${hora}:${minuto}`;
  };

  if (!selectedDate) {
    return (
      <div style={{
        padding: '1rem',
        backgroundColor: '#f3f4f6',
        borderRadius: '8px',
        textAlign: 'center',
        color: '#6b7280'
      }}>
        Selecione uma data primeiro
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{
        padding: '1rem',
        textAlign: 'center',
        color: '#6b7280'
      }}>
        Carregando horários disponíveis...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        padding: '1rem',
        backgroundColor: '#fee2e2',
        color: '#b91c1c',
        borderRadius: '8px',
        textAlign: 'center'
      }}>
        {error}
      </div>
    );
  }

  const currentSlot = getCurrentTimeSlot();

  return (
    <div>
      <label style={{
        display: 'block',
        marginBottom: '0.75rem',
        fontWeight: '600',
        color: 'var(--text)'
      }}>
        Selecione um horário
      </label>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))',
        gap: '0.5rem',
        maxHeight: '300px',
        overflowY: 'auto',
        padding: '0.5rem',
        backgroundColor: '#f9fafb',
        borderRadius: '8px',
        border: '1px solid #e6eef2'
      }}>
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
              style={{
                padding: '0.6rem',
                borderRadius: '8px',
                border: selecionado ? '2px solid var(--accent)' : '1px solid #e6eef2',
                backgroundColor: desabilitado 
                  ? '#f3f4f6' 
                  : selecionado 
                    ? 'var(--accent)' 
                    : 'white',
                color: desabilitado 
                  ? '#9ca3af' 
                  : selecionado 
                    ? 'white' 
                    : 'var(--text)',
                cursor: desabilitado ? 'not-allowed' : 'pointer',
                fontSize: '0.9rem',
                fontWeight: selecionado ? '600' : '500',
                transition: 'all 0.2s',
                opacity: desabilitado ? 0.5 : 1,
                textDecoration: passado ? 'line-through' : 'none'
              }}
            >
              {horario}
              {ocupado && !passado && (
                <span style={{ 
                  display: 'block', 
                  fontSize: '0.7rem',
                  marginTop: '0.1rem' 
                }}>
                  Ocupado
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div style={{
        marginTop: '0.75rem',
        display: 'flex',
        gap: '1rem',
        flexWrap: 'wrap',
        fontSize: '0.85rem',
        color: '#6b7280'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
          <div style={{
            width: '12px',
            height: '12px',
            borderRadius: '4px',
            backgroundColor: 'white',
            border: '1px solid #e6eef2'
          }} />
          <span>Disponível</span>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
          <div style={{
            width: '12px',
            height: '12px',
            borderRadius: '4px',
            backgroundColor: 'var(--accent)'
          }} />
          <span>Selecionado</span>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
          <div style={{
            width: '12px',
            height: '12px',
            borderRadius: '4px',
            backgroundColor: '#f3f4f6'
          }} />
          <span>Ocupado</span>
        </div>
      </div>
    </div>
  );
}