import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../server/api';

function Cadastro() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    senha: '',
    cpf: '',
    telefone: '',
    role: 'cliente' 
  });
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro('');
    setCarregando(true);

    try {
      await api.createUser(formData);
      alert('Cadastro realizado com sucesso!');
      navigate('/login');
    } catch (error) {
      setErro('Erro ao cadastrar. Tente novamente.');
      console.error(error);
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="card">
      <h2>Página de Cadastro</h2>
      {erro && <p style={{ color: 'red' }}>{erro}</p>}
      <form onSubmit={handleSubmit}>
        <input 
          type="text" 
          name="nome"
          placeholder="Nome Completo"
          value={formData.nome}
          onChange={handleChange}
          required
        />
        <input 
          type="email" 
          name="email"
          placeholder="Email"
          value={formData.email}
          onChange={handleChange}
          required
        />
        <input 
          type="password" 
          name="senha"
          placeholder="Senha"
          value={formData.senha}
          onChange={handleChange}
          required
        />
        <input 
          type="text" 
          name="cpf"
          placeholder="CPF"
          value={formData.cpf}
          onChange={handleChange}
          required
        />

        <label htmlFor="role" style={{ display: 'block', marginTop: '0.4rem', marginBottom: '0.25rem', color: '#6b7280', fontSize: '0.9rem' }}>Tipo de conta</label>
        <select
          id="role"
          name="role"
          value={formData.role}
          onChange={handleChange}
          required
        >
          <option value="cliente">Cliente</option>
          <option value="ADM_Estabelecimento">Administrador da Barbearia</option>
        </select>

        <input 
          type="tel" 
          name="telefone"
          placeholder="Número de telefone"
          value={formData.telefone}
          onChange={handleChange}
          required
        />
        <button type="submit" disabled={carregando}>
          {carregando ? 'Cadastrando...' : 'Cadastrar'}
        </button>
      </form>
      <button type="button" onClick={() => navigate('/')}>Voltar</button>
    </div>
  );
}

export default Cadastro;