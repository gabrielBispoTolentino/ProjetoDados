import { useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../server/api';
import type { PartnerLoginCredentials } from '../types/domain';
import './css/Login.css';

export default function ParceirosLogin() {
  const navigate = useNavigate();
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [formData, setFormData] = useState<PartnerLoginCredentials>({
    email: '',
    senha: '',
    verifycode: '',
  });

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const { name, value } = event.target;
    setFormData((currentForm) => ({
      ...currentForm,
      [name]: value,
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErro('');
    setCarregando(true);

    try {
      const response = await api.partnerLogin({
        email: formData.email.trim(),
        senha: formData.senha,
        verifycode: formData.verifycode.trim(),
      });
      const { usuario } = response;

      localStorage.setItem('usuarioId', String(usuario.id));
      localStorage.setItem('usuario', JSON.stringify(usuario));

      navigate('/barber-painel');
    } catch (caughtError) {
      setErro(caughtError instanceof Error ? caughtError.message : 'Erro ao fazer login de parceiro.');
      console.error(caughtError);
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <h2>Entrar como Parceiro</h2>
        {erro && <div className="login-error">{erro}</div>}

        <form onSubmit={handleSubmit} className="login-form">
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleChange}
            disabled={carregando}
            required
          />
          <input
            type="password"
            name="senha"
            placeholder="Senha"
            value={formData.senha}
            onChange={handleChange}
            disabled={carregando}
            required
          />
          <input
            type="text"
            name="verifycode"
            placeholder="Codigo de verificacao"
            value={formData.verifycode}
            onChange={handleChange}
            disabled={carregando}
            required
          />
          <button type="submit" className="login-btn" disabled={carregando}>
            {carregando ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <button className="login-back-btn" type="button" onClick={() => navigate('/')} disabled={carregando}>
          &larr; Voltar para Home
        </button>
      </div>
    </div>
  );
}
