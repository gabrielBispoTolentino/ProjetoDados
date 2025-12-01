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
      // Validar tipo de arquivo
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        setErro('Por favor, selecione uma imagem válida (JPEG, PNG, GIF ou WebP)');
        return;
      }
      
      // Validar tamanho (5MB)
      if (file.size > 5 * 1024 * 1024) {
        setErro('A imagem deve ter no máximo 5MB');
        return;
      }
      
      setErro('');
      setFoto(file);
      
      // Criar preview
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
    // Limpar input file
    const fileInput = document.getElementById('foto-input');
    if (fileInput) fileInput.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro('');
    setCarregando(true);

    try {
      // Criar FormData para enviar arquivo + dados
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
    <div className="card" style={{ maxWidth: '500px' }}>
      <h2>Página de Cadastro</h2>
      {erro && <p style={{ color: 'red', marginBottom: '10px' }}>{erro}</p>}
      
      <form onSubmit={handleSubmit}>
        {/* Preview da foto */}
        <div style={{ 
          textAlign: 'center', 
          marginBottom: '1rem',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '0.75rem'
        }}>
          <div style={{
            width: '120px',
            height: '120px',
            borderRadius: '50%',
            overflow: 'hidden',
            border: '3px solid #e6eef2',
            backgroundColor: '#f3f4f6',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            {previewUrl ? (
              <img 
                src={previewUrl} 
                alt="Preview" 
                style={{ 
                  width: '100%', 
                  height: '100%', 
                  objectFit: 'cover' 
                }} 
              />
            ) : (
              <svg 
                width="60" 
                height="60" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="#9ca3af" 
                strokeWidth="2"
              >
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            )}
          </div>
          
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <label 
              htmlFor="foto-input" 
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#f3f4f6',
                border: '1px solid #e6eef2',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '0.9rem',
                fontWeight: '500',
                color: '#374151',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#e5e7eb'}
              onMouseLeave={(e) => e.target.style.backgroundColor = '#f3f4f6'}
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
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: '#fee2e2',
                  border: '1px solid #fecaca',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  fontWeight: '500',
                  color: '#b91c1c'
                }}
              >
                Remover
              </button>
            )}
          </div>
          
          <p style={{ 
            fontSize: '0.8rem', 
            color: '#6b7280',
            margin: 0
          }}>
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
          style={{ 
            display: 'block', 
            marginTop: '0.4rem', 
            marginBottom: '0.25rem', 
            color: '#6b7280', 
            fontSize: '0.9rem' 
          }}
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