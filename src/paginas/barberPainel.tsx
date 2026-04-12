import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import UserBar from '../components/UserBar';
import type { UserSummary } from '../types/domain';
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

  useEffect(() => {
    const usuario = parseStoredUser();
    if (!usuario) {
      navigate('/parceiros-login');
      return;
    }

    if (usuario.userTable !== 'usuarioBarber') {
      navigate('/login');
    }
  }, [navigate]);

  return (
    <>
      <UserBar />
      <main className="painel-main">
        <div className="painel-header">
          <h1>Barber Painel</h1>
          <p>Painel do barbeiro em construcao.</p>
        </div>
      </main>
    </>
  );
}
