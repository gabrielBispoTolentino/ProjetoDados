import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../server/api';
import type { UserSummary } from '../types/domain';
import UserAppointments from './UserApointment';
import BookedModal from './BookedModal';
import ProfileEditorModal from './ProfileEditorModal';
import UserSubscriptions from './UserSubscriptions';
import './css/UserBar.css';

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

function persistStoredUser(usuario: UserSummary) {
  localStorage.setItem('usuarioId', String(usuario.id));
  localStorage.setItem('usuario', JSON.stringify(usuario));
}

export default function UserBar() {
  const navigate = useNavigate();
  const [aberto, setAberto] = useState(false);
  const [subscriptionsOpen, setSubscriptionsOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [avatarLoadFailed, setAvatarLoadFailed] = useState(false);
  const [usuario, setUsuario] = useState<UserSummary | null>(() => parseStoredUser());
  const isBarber = usuario?.userTable === 'usuarioBarber';
  const isClient = usuario?.role === 'Cliente' && !isBarber;
  const isAdmin = usuario?.role === 'ADM_Estabelecimento';

  useEffect(() => {
    setAvatarLoadFailed(false);
  }, [usuario?.fotoUrl, usuario?.foto_url, usuario?.imagem_url]);

  if (!usuario) {
    return null;
  }

  const fotoUrl = api.getPhotoUrl(usuario.fotoUrl || usuario.foto_url || usuario.imagem_url) || null;

  return (
    <>
      <div className="user-bar">
        <div className="user-bar-content">
          <div className="user-bar-info">
            <div className="user-avatar">
              {fotoUrl && !avatarLoadFailed ? (
                <img
                  src={fotoUrl}
                  alt={usuario.nome}
                  onError={() => setAvatarLoadFailed(true)}
                />
              ) : (
                <svg
                  width="32"
                  height="32"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              )}
            </div>

            <div className="user-details">
              <span className="user-name">{usuario.nome}</span>
              <span className="user-email">{usuario.email}</span>
            </div>
          </div>

          <div className="user-bar-actions">
            {isClient && (
              <>
                <button className="edit-profile-button" onClick={() => setAberto(true)}>
                  Meus Agendamentos
                </button>
                <button onClick={() => setSubscriptionsOpen(true)}>
                  Minhas Assinaturas
                </button>
                <UserAppointments isOpen={aberto} onClose={() => setAberto(false)} />
                <UserSubscriptions isOpen={subscriptionsOpen} onClose={() => setSubscriptionsOpen(false)} />
              </>
            )}

            {isAdmin && (
              <>
                <button type="button" onClick={() => setProfileModalOpen(true)}>
                  Editar Perfil
                </button>
                <button onClick={() => setAberto(true)}>Listar Agendamentos</button>
                <BookedModal isOpen={aberto} onClose={() => setAberto(false)} />
              </>
            )}

            {isBarber && (
              <>
                <button type="button" onClick={() => setProfileModalOpen(true)}>
                  Editar Perfil
                </button>
                <span className="user-email">Parceiro barbeiro</span>
              </>
            )}

            {isClient && (
              <button type="button" onClick={() => setProfileModalOpen(true)}>
                Editar Perfil
              </button>
            )}

            <button
              onClick={() => navigate('/login')}
              className="logout-button"
              title="Sair da conta"
              type="button"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              <span>Sair</span>
            </button>
          </div>
        </div>
      </div>

      {profileModalOpen && (
        <ProfileEditorModal
          user={usuario}
          isOpen={profileModalOpen}
          onClose={() => setProfileModalOpen(false)}
          onSaved={(usuarioAtualizado) => {
            persistStoredUser(usuarioAtualizado);
            setUsuario(usuarioAtualizado);
          }}
        />
      )}
    </>
  );
}
