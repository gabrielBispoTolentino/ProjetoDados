import React from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../server/api';

function UserBar() {
  const navigate = useNavigate();
  
  // Recupera os dados do usuário do localStorage
  const usuarioStr = localStorage.getItem('usuario');
  const usuario = usuarioStr ? JSON.parse(usuarioStr) : null;

  const handleLogout = () => {
    if (window.confirm('Deseja realmente sair?')) {
      localStorage.removeItem('usuario');
      navigate('/login');
    }
  };

  if (!usuario) {
    return null;
  }

  // Pega a URL da foto ou usa um avatar padrão
  const fotoUrl = usuario.fotoUrl 
    ? api.getPhotoUrl(usuario.fotoUrl)
    : null;

  return (
    <div className="user-bar">
      <div className="user-bar-content">
        <div className="user-bar-info">
          <div className="user-avatar">
            {fotoUrl ? (
              <img src={fotoUrl} alt={usuario.nome} />
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

        <button 
          className="logout-button" 
          onClick={handleLogout}
          title="Sair da conta"
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
  );
}

export default UserBar;