import React from 'react';
import { useNavigate } from 'react-router-dom';

function Login() {
  const navigate = useNavigate();

  return (
    <div>
      <h2>Página de Login</h2>
      <form>
        <input type="text" placeholder="Usuário" /><br />
        <input type="password" placeholder="Senha" /><br />
        <button onClick={()=> navigate('/painel')}type="submit">Entrar</button>
      </form>
     <button onClick={() => navigate('/')}>Voltar</button>
    </div>
  );
}

export default Login;
