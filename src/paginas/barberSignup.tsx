import { useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../../server/api';
import type { BarberSignupPayload } from '../types/domain';
import './css/Login.css';

export default function BarberSignup() {
  const navigate = useNavigate();
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);
  const [establishmentName, setEstablishmentName] = useState('');
  const [barbercode, setBarbercode] = useState('');

  const [searchParams] = useSearchParams();
  const urlEmail = searchParams.get('email') || '';

  const [formData, setFormData] = useState<Omit<BarberSignupPayload, 'barbercode'>>({
    nome: '',
    email: urlEmail,
    senha: '',
    cpf: '',
    telefone: '',
  });

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const { name, value } = event.target;
    if (name === 'barbercode') {
      setBarbercode(value.toUpperCase());
    } else {
      setFormData((currentForm) => ({
        ...currentForm,
        [name]: value,
      }));
    }
  }

  async function handleValidateCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErro('');
    setCarregando(true);

    try {
      const response = await api.validateBarbercode(barbercode);
      if (response.valid) {
        setEstablishmentName(response.establishment.nome);
        setStep(2);
      }
    } catch (caughtError) {
      setErro(caughtError instanceof Error ? caughtError.message : 'Erro ao validar codigo.');
      console.error(caughtError);
    } finally {
      setCarregando(false);
    }
  }

  async function handleSignup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErro('');
    setCarregando(true);

    try {
      const response = await api.barberSignup({
        barbercode,
        ...formData,
      });

      if (response.usuario) {
        localStorage.setItem('usuarioId', String(response.usuario.id));
        localStorage.setItem('usuario', JSON.stringify(response.usuario));
      }

      navigate('/verify');
    } catch (caughtError) {
      setErro(caughtError instanceof Error ? caughtError.message : 'Erro ao criar conta.');
      console.error(caughtError);
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <h2>{step === 1 ? 'Convite de Barbeiro' : 'Cadastro de Barbeiro'}</h2>
        {step === 2 && <p className="barber-signup-subtitle">Barbearia: {establishmentName}</p>}
        {erro && <div className="login-error">{erro}</div>}

        {step === 1 ? (
          <form onSubmit={handleValidateCode} className="login-form">
            <input
              type="text"
              name="barbercode"
              placeholder="Codigo da Barbearia"
              value={barbercode}
              onChange={handleChange}
              disabled={carregando}
              required
            />
            <button type="submit" className="login-btn" disabled={carregando}>
              {carregando ? 'Validando...' : 'Continuar'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleSignup} className="login-form">
            <input
              type="text"
              name="nome"
              placeholder="Nome Completo"
              value={formData.nome}
              onChange={handleChange}
              disabled={carregando}
              required
            />
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={formData.email}
              onChange={handleChange}
              disabled={carregando || !!urlEmail}
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
              name="cpf"
              placeholder="CPF"
              value={formData.cpf}
              onChange={handleChange}
              disabled={carregando}
              required
            />
            <input
              type="tel"
              name="telefone"
              placeholder="Telefone"
              value={formData.telefone}
              onChange={handleChange}
              disabled={carregando}
              required
            />
            <button type="submit" className="login-btn" disabled={carregando}>
              {carregando ? 'Criando conta...' : 'Criar Conta'}
            </button>
          </form>
        )}

        <button
          className="login-back-btn"
          type="button"
          onClick={() => step === 2 ? setStep(1) : navigate('/')}
          disabled={carregando}
        >
          &larr; {step === 2 ? 'Voltar' : 'Voltar para Home'}
        </button>
      </div>
    </div>
  );
}
