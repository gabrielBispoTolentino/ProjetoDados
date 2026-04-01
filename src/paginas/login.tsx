import { useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../server/api';
import type { LoginCredentials } from '../types/domain';
import './css/Login.css';

export default function Login() {
  const navigate = useNavigate();
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [formData, setFormData] = useState<LoginCredentials>({
    usuario: '',
    senha: '',
  });

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const { name, value } = event.target;
    setFormData((currentForm) => ({
      ...currentForm,
      [name]: value,
    } as LoginCredentials));
  }

  async function authenticate(credentials: LoginCredentials) {
    setErro('');
    setCarregando(true);

    try {
      const response = await api.login(credentials);
      const { usuario } = response;

      localStorage.setItem('usuarioId', String(usuario.id));
      localStorage.setItem('usuario', JSON.stringify(usuario));

      if (usuario.role === 'ADM_Estabelecimento') {
        navigate('/painel-admin');
      } else {
        navigate('/painel');
      }
    } catch (caughtError) {
      setErro(caughtError instanceof Error ? caughtError.message : 'Erro ao fazer login. Tente novamente.');
      console.error(caughtError);
    } finally {
      setCarregando(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await authenticate(formData);
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <h2>Entrar</h2>
        {erro && <div className="login-error">{erro}</div>}

        <form onSubmit={handleSubmit} className="login-form">
          <input
            type="text"
            name="usuario"
            placeholder="Email ou CPF"
            value={formData.usuario}
            onChange={handleChange}
            disabled={carregando}
          />
          <input
            type="password"
            name="senha"
            placeholder="Senha"
            value={formData.senha}
            onChange={handleChange}
            disabled={carregando}
          />
          <button type="submit" className="login-btn" disabled={carregando}>
            {carregando ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <div className="login-demo-panel">
          <p className="login-demo-title">Acesso rapido para preview</p>
          <div className="login-demo-actions">
            <button
              type="button"
              className="login-demo-btn"
              onClick={() => {
                void authenticate({ usuario: 'cliente@demo.com', senha: '123456' });
              }}
              disabled={carregando}
            >
              Cliente Demo
            </button>
            <button
              type="button"
              className="login-demo-btn"
              onClick={() => {
                void authenticate({ usuario: 'admin@demo.com', senha: '123456' });
              }}
              disabled={carregando}
            >
              Admin Demo
            </button>
          </div>
          <p className="login-demo-hint">
            Credenciais: `cliente@demo.com` ou `admin@demo.com` com senha `123456`.
          </p>
        </div>

        <button className="login-back-btn" type="button" onClick={() => navigate('/')} disabled={carregando}>
          &larr; Voltar para Home
        </button>
      </div>
    </div>
  );
}
