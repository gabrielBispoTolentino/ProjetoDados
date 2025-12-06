import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../server/api';

function Login() {
  const navigate = useNavigate();
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [formData, setFormData] = useState({
    usuario: '',
    senha: ''
  }); 
  
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
      const response = await api.login(formData);
      
      // Salva os dados do usuário no localStorage
     const { usuario } = response;

      localStorage.setItem('usuarioId', usuario.id);
      localStorage.setItem('usuario', JSON.stringify(usuario));
 
      alert('Login realizado com sucesso!');
      
      // Redireciona baseado no role do usuário
      if (response.usuario.role === 'ADM_Estabelecimento') {
        navigate('/painel-admin');
      } else {
        navigate('/painel');
      }
    } catch (error) {
      setErro(error.message || 'Erro ao fazer login. Tente novamente.');
      console.error(error);
    } finally {
      setCarregando(false);
    }
  };
  
  return (
    <div className="card">
      <h2>Página de Login</h2>
      {erro && <div style={{ color: 'red', marginBottom: '10px' }}>{erro}</div>}
      
      <form onSubmit={handleSubmit}>
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
        <button type="submit" disabled={carregando}>
          {carregando ? 'Entrando...' : 'Entrar'}
        </button>
      </form>
      
      <button type="button" onClick={() => navigate('/')} disabled={carregando}>
        Voltar
      </button>
    </div>
  );
}

export default Login;