import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import UserBar from '../components/UserBar';
import { api } from '../../server/api';
import type { UserAppointment, UserSummary } from '../types/domain';
import './css/PainelCliente.css';

function parseStoredUser(): UserSummary | null {
  const usuarioStr = localStorage.getItem('usuario');
  if (!usuarioStr) {
    return null;
  }

  try {
    return JSON.parse(usuarioStr) as UserSummary;
  } catch {
    return null;
  }
}

export default function BarberPainel() {
  const navigate = useNavigate();
  const [agendamentos, setAgendamentos] = useState<UserAppointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const usuario = parseStoredUser();
    if (!usuario) {
      navigate('/parceiros-login');
      return;
    }

    if (usuario.userTable !== 'usuarioBarber') {
      navigate('/login');
      return;
    }

    void carregarAgendamentos(usuario.id);
  }, [navigate]);

  async function carregarAgendamentos(usuarioId: number) {
    setLoading(true);
    setError('');

    try {
      const data = await api.getAgendamentosBarbeiro(usuarioId);
      setAgendamentos(Array.isArray(data) ? data : []);
    } catch (caughtError) {
      console.error(caughtError);
      setError(caughtError instanceof Error ? caughtError.message : 'Erro ao carregar agendamentos');
      setAgendamentos([]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <UserBar />
      <main className="painel-main">
        <div className="painel-header">
          <h1>Meus Cortes Agendados</h1>
          <p>Visualize os clientes agendados com voce.</p>
        </div>

        {error && <div className="loader error">{error}</div>}

        {loading ? (
          <div className="loader">Carregando agendamentos...</div>
        ) : agendamentos.length === 0 ? (
          <div className="loader">Nenhum corte agendado com voce no momento.</div>
        ) : (
          <div className="admin-grid">
            {agendamentos.map((agendamento) => (
              <article key={agendamento.id} className="shop-card admin-shop-card">
                <div className="shop-info">
                  <h4 className="shop-name">{agendamento.usuario_nome || 'Cliente'}</h4>
                  <p className="shop-address">{agendamento.estabelecimento_nome || 'Barbearia'}</p>
                  <p className="admin-shop-phone">
                    Data: {agendamento.proximo_pag ? new Date(agendamento.proximo_pag).toLocaleDateString('pt-BR') : '-'}
                  </p>
                  <p className="admin-shop-phone">
                    Horario: {agendamento.proximo_pag ? new Date(agendamento.proximo_pag).toLocaleTimeString('pt-BR', {
                      hour: '2-digit',
                      minute: '2-digit',
                    }) : '-'}
                  </p>
                  <p className="admin-shop-phone">Status: {agendamento.status || '-'}</p>
                  <p className="admin-shop-phone">Pagamento: {agendamento.pagamento_status || 'pendente'}</p>
                  <p className="admin-shop-phone">Valor: R$ {Number(agendamento.valor || 0).toFixed(2)}</p>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>
    </>
  );
}
