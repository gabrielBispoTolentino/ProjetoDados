import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../server/api';
import './css/Cadastro.css';

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
  const [foto, setFoto] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    
    if (file) {
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        setErro('Por favor, selecione uma imagem válida (JPEG, PNG, GIF ou WebP)');
        return;
      }
      
      if (file.size > 5 * 1024 * 1024) {
        setErro('A imagem deve ter no máximo 5MB');
        return;
      }
      
      setErro('');
      setFoto(file);
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removePhoto = () => {
    setFoto(null);
    setPreviewUrl(null);
    const fileInput = document.getElementById('foto-input');
    if (fileInput) fileInput.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro('');
    setCarregando(true);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('nome', formData.nome);
      formDataToSend.append('email', formData.email);
      formDataToSend.append('senha', formData.senha);
      formDataToSend.append('cpf', formData.cpf);
      formDataToSend.append('telefone', formData.telefone);
      formDataToSend.append('role', formData.role);
      
      if (foto) {
        formDataToSend.append('foto', foto);
      }

      await api.createUserWithPhoto(formDataToSend);
      alert('Cadastro realizado com sucesso!');
      navigate('/login');
    } catch (error) {
      setErro(error.message || 'Erro ao cadastrar. Tente novamente.');
      console.error(error);
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="card">
      <h2>Página de Cadastro</h2>
      {erro && <p style={{ color: 'red', marginBottom: '10px' }}>{erro}</p>}
      
      <form onSubmit={handleSubmit}>
        <div className="cadastro-photo-preview">
          <div className="cadastro-photo-container">
            {previewUrl ? (
              <img 
                src={previewUrl} 
                alt="Preview" 
                className="cadastro-photo-img"
              />
            ) : (
              <svg 
                width="60" 
                height="60" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="#9ca3af" 
                strokeWidth="2"
                className="cadastro-photo-placeholder"
              >
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            )}
          </div>
          
          <div className="cadastro-photo-actions">
            <label 
              htmlFor="foto-input" 
              className="cadastro-photo-label"
            >
              {previewUrl ? 'Trocar foto' : 'Adicionar foto'}
            </label>
            <input 
              id="foto-input"
              type="file" 
              accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
              onChange={handleFileChange}
              style={{ display: 'none' }}
              disabled={carregando}
            />
            
            {previewUrl && (
              <button
                type="button"
                onClick={removePhoto}
                className="cadastro-photo-remove"
              >
                Remover
              </button>
            )}
          </div>
          
          <p className="cadastro-photo-hint">
            Formatos aceitos: JPEG, PNG, GIF, WebP (máx. 5MB)
          </p>
        </div>

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
          name="cpf"
          placeholder="CPF"
          value={formData.cpf}
          onChange={handleChange}
          disabled={carregando}
          required
        />

        <label 
          htmlFor="role" 
          className="cadastro-role-label"
        >
          Tipo de conta
        </label>
        <select
          id="role"
          name="role"
          value={formData.role}
          onChange={handleChange}
          disabled={carregando}
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
          disabled={carregando}
          required
        />
        
        <button type="submit" disabled={carregando}>
          {carregando ? 'Cadastrando...' : 'Cadastrar'}
        </button>
      </form>
      
      <button 
        type="button" 
        onClick={() => navigate('/')} 
        disabled={carregando}
      >
        Voltar
      </button>
    </div>
  );
}

export default Cadastro;