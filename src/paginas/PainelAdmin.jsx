import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import UserBar from '../components/UserBar';
import { api } from '../../server/api';
import './css/PainelAdmin.css';

function PainelAdmin() {
  const navigate = useNavigate();
  const [barbearias, setBarbearias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');
  const [modalAberto, setModalAberto] = useState(false);
  const [modoEdicao, setModoEdicao] = useState(false);
  const [barbeariaAtual, setBarbeariaAtual] = useState(null);
  const [foto, setFoto] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  
  useEffect(() => {
    const usuarioStr = localStorage.getItem('usuario');
    if (!usuarioStr) {
      navigate('/login');
      return;
    }
    
    const usuario = JSON.parse(usuarioStr);
    if (usuario.role !== 'ADM_Estabelecimento') {
      alert('Acesso negado! Apenas administradores podem acessar esta página.');
      navigate('/painel');
      return;
    }
    
    carregarBarbearias(usuario.id);
  }, [navigate]);
  
  const carregarBarbearias = async (donoId) => {
    setLoading(true);
    setErro('');
    
    try {
      const todas = await api.getEstablishments(1, 100);
      const minhas = todas.filter(b => b.dono_id === donoId);
      setBarbearias(minhas);
    } catch (error) {
      console.error('Erro ao carregar barbearias:', error);
      setErro('Erro ao carregar suas barbearias');
    } finally {
      setLoading(false);
    }
  };
  
  const abrirModalNovo = () => {
    setBarbeariaAtual({
      nome: '',
      description: '',
      rua: '',
      cidade: '',
      stado: '',
      pais: 'Brasil',
      cep: '',
      phone: '',
      mei: ''
    });
    setFoto(null);
    setPreviewUrl(null);
    setModoEdicao(false);
    setModalAberto(true);
  };
  
  const abrirModalEdicao = (barbearia) => {
    setBarbeariaAtual({
      id: barbearia.id,
      nome: barbearia.name || barbearia.nome || '',
      description: barbearia.description || '',
      rua: barbearia.fullAddress?.rua || barbearia.rua || '',
      cidade: barbearia.fullAddress?.cidade || barbearia.cidade || '',
      stado: barbearia.fullAddress?.estado || barbearia.stado || '',
      pais: barbearia.fullAddress?.pais || barbearia.pais || 'Brasil',
      cep: barbearia.fullAddress?.cep || barbearia.cep || '',
      phone: barbearia.phone || '',
      mei: barbearia.mei || '',
      imagemUrl: barbearia.imagem_url || null
    });
    setFoto(null);
    setPreviewUrl(barbearia.imagem_url ? api.getPhotoUrl(barbearia.imagem_url) : null);
    setModoEdicao(true);
    setModalAberto(true);
  };
  
  const fecharModal = () => {
    setModalAberto(false);
    setBarbeariaAtual(null);
    setModoEdicao(false);
    setFoto(null);
    setPreviewUrl(null);
  };
  
  const handleChange = (e) => {
    setBarbeariaAtual({
      ...barbeariaAtual,
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
    setPreviewUrl(modoEdicao && barbeariaAtual.imagemUrl ? api.getPhotoUrl(barbeariaAtual.imagemUrl) : null);
    const fileInput = document.getElementById('foto-establishment-input');
    if (fileInput) fileInput.value = '';
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro('');
    
    try {
      const usuarioStr = localStorage.getItem('usuario');
      const usuario = JSON.parse(usuarioStr);
      
      const formDataToSend = new FormData();
      formDataToSend.append('nome', barbeariaAtual.nome);
      formDataToSend.append('description', barbeariaAtual.description || '');
      formDataToSend.append('rua', barbeariaAtual.rua);
      formDataToSend.append('cidade', barbeariaAtual.cidade);
      formDataToSend.append('stado', barbeariaAtual.stado);
      formDataToSend.append('pais', barbeariaAtual.pais || 'Brasil');
      formDataToSend.append('cep', barbeariaAtual.cep);
      formDataToSend.append('phone', barbeariaAtual.phone || '');
      formDataToSend.append('mei', barbeariaAtual.mei || '');
      
      if (!modoEdicao) {
        formDataToSend.append('dono_id', usuario.id);
      }
      
      if (foto) {
        formDataToSend.append('foto', foto);
      }
      
      if (modoEdicao) {
        await api.updateEstablishmentWithPhoto(barbeariaAtual.id, formDataToSend);
        alert('Barbearia atualizada com sucesso!');
      } else {
        await api.createEstablishmentWithPhoto(formDataToSend);
        alert('Barbearia criada com sucesso!');
      }
      
      fecharModal();
      carregarBarbearias(usuario.id);
    } catch (error) {
      console.error('Erro ao salvar barbearia:', error);
      setErro(error.message || 'Erro ao salvar barbearia');
    }
  };
  
  const handleExcluir = async (id) => {
    if (!window.confirm('Tem certeza que deseja excluir esta barbearia?')) {
      return;
    }
    
    try {
      await api.deleteEstablishment(id);
      alert('Barbearia excluída com sucesso!');
      
      const usuarioStr = localStorage.getItem('usuario');
      const usuario = JSON.parse(usuarioStr);
      carregarBarbearias(usuario.id);
    } catch (error) {
      console.error('Erro ao excluir barbearia:', error);
      alert('Erro ao excluir barbearia: ' + error.message);
    }
  };

  return (
    <>
      <UserBar />
      <main className="admin-main">
        <div className="admin-header">
          <h2 className="admin-title">
            Minhas Barbearias
          </h2>
          <button 
            className="btn btn-primary"
            onClick={abrirModalNovo}
          >
            + Nova Barbearia
          </button>
        </div>

        {erro && !modalAberto && (
          <div className="admin-error">
            {erro}
          </div>
        )}

        {loading ? (
          <div className="loader">Carregando suas barbearias...</div>
        ) : barbearias.length === 0 ? (
          <div className="admin-empty-state">
            <p className="admin-empty-text">
              Você ainda não cadastrou nenhuma barbearia.
            </p>
            <button 
              className="btn btn-primary"
              onClick={abrirModalNovo}
            >
              Cadastrar primeira barbearia
            </button>
          </div>
        ) : (
          <div className="admin-grid">
            {barbearias.map((barbearia) => (
              <div 
                key={barbearia.id}
                className="shop-card admin-shop-card"
              >
                <div className="shop-image admin-shop-image">
                  {barbearia.imagem_url ? (
                    <img 
                      src={api.getPhotoUrl(barbearia.imagem_url)} 
                      alt={barbearia.name || barbearia.nome}
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextElementSibling.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <div className="shop-image-placeholder" style={{ 
                    display: barbearia.imagem_url ? 'none' : 'flex' 
                  }}>
                    <svg 
                      width="60" 
                      height="60" 
                      viewBox="0 0 24 24" 
                      fill="none" 
                      stroke="currentColor" 
                      strokeWidth="2"
                    >
                      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                      <polyline points="9 22 9 12 15 12 15 22" />
                    </svg>
                  </div>
                </div>

                <div className="shop-info">
                  <h4 className="shop-name">
                    {barbearia.name || barbearia.nome}
                  </h4>
                  <p className="shop-address">
                    {barbearia.address || barbearia.cidade}
                  </p>
                  {barbearia.phone && (
                    <p className="admin-shop-phone">
                      📞 {barbearia.phone}
                    </p>
                  )}
                </div>
                
                <div className="admin-shop-actions">
                  <button 
                    className="btn btn-primary admin-btn-edit"
                    onClick={() => abrirModalEdicao(barbearia)}
                  >
                    Editar
                  </button>
                  <button 
                    className="btn admin-btn-delete"
                    onClick={() => handleExcluir(barbearia.id)}
                  >
                    Excluir
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal */}
        {modalAberto && (
          <div className="admin-modal-backdrop">
            <div className="card admin-modal-container">
              <h2>{modoEdicao ? 'Editar Barbearia' : 'Nova Barbearia'}</h2>
              
              {erro && (
                <div className="admin-error">
                  {erro}
                </div>
              )}
              
              <form onSubmit={handleSubmit}>
                <div className="admin-form-photo-preview">
                  <div className="admin-form-photo-container">
                    {previewUrl ? (
                      <img 
                        src={previewUrl} 
                        alt="Preview" 
                        className="admin-form-photo-img"
                      />
                    ) : (
                      <svg 
                        width="80" 
                        height="80" 
                        viewBox="0 0 24 24" 
                        fill="none" 
                        stroke="#9ca3af" 
                        strokeWidth="2"
                        className="admin-form-photo-placeholder"
                      >
                        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                        <polyline points="9 22 9 12 15 12 15 22" />
                      </svg>
                    )}
                  </div>
                  
                  <div className="admin-form-photo-actions">
                    <label 
                      htmlFor="foto-establishment-input" 
                      className="admin-form-photo-label"
                    >
                      {previewUrl ? 'Trocar foto' : 'Adicionar foto'}
                    </label>
                    <input 
                      id="foto-establishment-input"
                      type="file" 
                      accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                      onChange={handleFileChange}
                      style={{ display: 'none' }}
                    />
                    
                    {foto && (
                      <button
                        type="button"
                        onClick={removePhoto}
                        className="admin-form-photo-remove"
                      >
                        Remover
                      </button>
                    )}
                  </div>
                  
                  <p className="admin-form-photo-hint">
                    Formatos aceitos: JPEG, PNG, GIF, WebP (máx. 5MB)
                  </p>
                </div>

                <label>Nome da Barbearia *</label>
                <input 
                  type="text"
                  name="nome"
                  value={barbeariaAtual?.nome || ''}
                  onChange={handleChange}
                  required
                  placeholder="Ex: Barbearia Central"
                />

                <label>Descrição</label>
                <textarea 
                  name="description"
                  value={barbeariaAtual?.description || ''}
                  onChange={handleChange}
                  rows="3"
                  placeholder="Descreva sua barbearia..."
                  className="admin-form-textarea"
                />

                <label>Rua/Avenida *</label>
                <input 
                  type="text"
                  name="rua"
                  value={barbeariaAtual?.rua || ''}
                  onChange={handleChange}
                  required
                  placeholder="Ex: Rua das Flores, 123"
                />

                <label>Cidade *</label>
                <input 
                  type="text"
                  name="cidade"
                  value={barbeariaAtual?.cidade || ''}
                  onChange={handleChange}
                  required
                  placeholder="Ex: São Paulo"
                />

                <label>Estado *</label>
                <input 
                  type="text"
                  name="stado"
                  value={barbeariaAtual?.stado || ''}
                  onChange={handleChange}
                  required
                  placeholder="Ex: SP"
                  maxLength="2"
                />

                <label>CEP *</label>
                <input 
                  type="text"
                  name="cep"
                  value={barbeariaAtual?.cep || ''}
                  onChange={handleChange}
                  required
                  placeholder="Ex: 12345-678"
                />

                <label>Telefone</label>
                <input 
                  type="tel"
                  name="phone"
                  value={barbeariaAtual?.phone || ''}
                  onChange={handleChange}
                  placeholder="Ex: (11) 98765-4321"
                />

                <label>MEI (CNPJ)</label>
                <input 
                  type="text"
                  name="mei"
                  value={barbeariaAtual?.mei || ''}
                  onChange={handleChange}
                  placeholder="Ex: 12.345.678/0001-90"
                />

                <div className="admin-form-actions">
                  <button 
                    type="submit"
                    className="btn btn-primary admin-form-btn-submit"
                  >
                    {modoEdicao ? 'Salvar Alterações' : 'Criar Barbearia'}
                  </button>
                  <button 
                    type="button"
                    className="btn btn-outline admin-form-btn-cancel"
                    onClick={fecharModal}
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </>
  );
}

export default PainelAdmin;