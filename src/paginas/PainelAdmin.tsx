import { useEffect, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import BarbersModal, { type BarberFormData } from '../components/BarbersModal';
import UserBar from '../components/UserBar';
import { api } from '../../server/api';
import PlanManager from '../components/PlanManager';
import ReportLucro from '../components/ReportLucro';
import type { BarberSummary, Establishment, UserSummary } from '../types/domain';
import './css/PainelAdmin.css';

type AdminShop = Establishment & {
  description?: string | null;
  phone?: string | null;
  pais?: string | null;
  mei?: string | null;
  fullAddress?: {
    rua?: string;
    cidade?: string;
    estado?: string;
    pais?: string;
    cep?: string;
  };
};

type BarberShopForm = {
  id?: number;
  nome: string;
  description: string;
  rua: string;
  cidade: string;
  stado: string;
  pais: string;
  cep: string;
  phone: string;
  mei: string;
  imagemUrl?: string | null;
  mapsUrl?: string | null;
};

const INITIAL_BARBER_SHOP_FORM: BarberShopForm = {
  nome: '',
  description: '',
  rua: '',
  cidade: '',
  stado: '',
  pais: 'Brasil',
  cep: '',
  phone: '',
  mei: '',
  imagemUrl: null,
  mapsUrl: null,
};

const INITIAL_BARBER_FORM: BarberFormData = {
  nome: '',
  email: '',
  senha: '',
  cpf: '',
  telefone: '',
};

function parseStoredUser(): UserSummary | null {
  const usuarioStr = localStorage.getItem('usuario');
  if (!usuarioStr) {
    return null;
  }

  try {
    return JSON.parse(usuarioStr) as UserSummary;
  } catch {
    return null;
  }
}

export default function PainelAdmin() {
  const navigate = useNavigate();
  const [barbearias, setBarbearias] = useState<AdminShop[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');
  const [modalAberto, setModalAberto] = useState(false);
  const [modoEdicao, setModoEdicao] = useState(false);
  const [barbeariaAtual, setBarbeariaAtual] = useState<BarberShopForm | null>(null);
  const [foto, setFoto] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [planModalOpen, setPlanModalOpen] = useState(false);
  const [selectedBarbeariaForPlans, setSelectedBarbeariaForPlans] = useState<number | null>(null);
  const [selectedBarbeariaId, setSelectedBarbeariaId] = useState<number | null>(null);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [barberModalOpen, setBarberModalOpen] = useState(false);
  const [selectedBarbershopForBarbers, setSelectedBarbershopForBarbers] = useState<AdminShop | null>(null);
  const [barbers, setBarbers] = useState<BarberSummary[]>([]);
  const [barberForm, setBarberForm] = useState<BarberFormData>(INITIAL_BARBER_FORM);
  const [barberLoading, setBarberLoading] = useState(false);
  const [barberSaving, setBarberSaving] = useState(false);
  const [deletingBarberId, setDeletingBarberId] = useState<number | null>(null);
  const [barberError, setBarberError] = useState('');

  useEffect(() => {
    const usuario = parseStoredUser();
    if (!usuario) {
      navigate('/login');
      return;
    }

    if (usuario.role !== 'ADM_Estabelecimento') {
      alert('Acesso negado! Apenas administradores podem acessar esta pagina.');
      navigate('/painel');
      return;
    }

    void carregarBarbearias(usuario.id);
  }, [navigate]);

  async function carregarBarbearias(donoId: number) {
    setLoading(true);
    setErro('');

    try {
      const todas = await api.getEstablishments(1, 100);
      const minhas = todas.filter((barbearia) => barbearia.dono_id === donoId) as AdminShop[];
      setBarbearias(minhas);
    } catch (caughtError) {
      console.error('Erro ao carregar barbearias:', caughtError);
      setErro('Erro ao carregar suas barbearias');
    } finally {
      setLoading(false);
    }
  }

  function abrirModalNovo() {
    setBarbeariaAtual(INITIAL_BARBER_SHOP_FORM);
    setFoto(null);
    setPreviewUrl(null);
    setModoEdicao(false);
    setModalAberto(true);
  }

  function abrirModalEdicao(barbearia: AdminShop) {
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
      imagemUrl: barbearia.imagem_url || null,
      mapsUrl:
        (typeof barbearia.googleMapsUrl === 'string' && barbearia.googleMapsUrl) ||
        (typeof barbearia.google_maps_url === 'string' && barbearia.google_maps_url) ||
        null,
    });
    setFoto(null);
    setPreviewUrl(barbearia.imagem_url ? api.getPhotoUrl(barbearia.imagem_url) : null);
    setModoEdicao(true);
    setModalAberto(true);
  }

  function fecharModal() {
    setModalAberto(false);
    setBarbeariaAtual(null);
    setModoEdicao(false);
    setFoto(null);
    setPreviewUrl(null);
  }

  function handleChange(
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) {
    const { name, value } = event.target;
    setBarbeariaAtual((currentForm) => (
      currentForm
        ? {
            ...currentForm,
            [name]: value,
          }
        : currentForm
    ));
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setErro('Por favor, selecione uma imagem valida (JPEG, PNG, GIF ou WebP)');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErro('A imagem deve ter no maximo 5MB');
      return;
    }

    setErro('');
    setFoto(file);

    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result;
      setPreviewUrl(typeof result === 'string' ? result : null);
    };
    reader.readAsDataURL(file);
  }

  function removePhoto() {
    setFoto(null);
    setPreviewUrl(modoEdicao && barbeariaAtual?.imagemUrl ? api.getPhotoUrl(barbeariaAtual.imagemUrl) : null);
    const fileInput = document.getElementById('foto-establishment-input');
    if (fileInput instanceof HTMLInputElement) {
      fileInput.value = '';
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErro('');

    if (!barbeariaAtual) {
      return;
    }

    try {
      const usuario = parseStoredUser();
      if (!usuario) {
        navigate('/login');
        return;
      }

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
        formDataToSend.append('dono_id', String(usuario.id));
      }

      if (foto) {
        formDataToSend.append('foto', foto);
      }

      let establishmentId = barbeariaAtual.id ?? null;

      if (modoEdicao && barbeariaAtual.id) {
        await api.updateEstablishmentWithPhoto(barbeariaAtual.id, formDataToSend);
        alert('Barbearia atualizada com sucesso!');
      } else {
        const createdEstablishment = await api.createEstablishmentWithPhoto(formDataToSend);
        establishmentId =
          typeof createdEstablishment.id === 'number' ? createdEstablishment.id : null;
        alert('Barbearia criada com sucesso!');
      }

      const mapsUrl = barbeariaAtual.mapsUrl?.trim() || null;
      if (establishmentId && (modoEdicao || mapsUrl !== null)) {
        await api.updateEstablishmentLocation(establishmentId, {
          google_maps_url: mapsUrl,
        });
      }

      fecharModal();
      await carregarBarbearias(usuario.id);
    } catch (caughtError) {
      console.error('Erro ao salvar barbearia:', caughtError);
      setErro(caughtError instanceof Error ? caughtError.message : 'Erro ao salvar barbearia');
    }
  }

  async function handleExcluir(id: number) {
    if (!window.confirm('Tem certeza que deseja excluir esta barbearia?')) {
      return;
    }

    try {
      await api.deleteEstablishment(id);
      alert('Barbearia excluida com sucesso!');

      const usuario = parseStoredUser();
      if (usuario) {
        await carregarBarbearias(usuario.id);
      }
    } catch (caughtError) {
      console.error('Erro ao excluir barbearia:', caughtError);
      const message = caughtError instanceof Error ? caughtError.message : 'Erro ao excluir barbearia';
      alert(`Erro ao excluir barbearia: ${message}`);
    }
  }

  async function carregarBarbeiros(establishmentId: number) {
    const usuario = parseStoredUser();
    if (!usuario) {
      navigate('/login');
      return;
    }

    setBarberLoading(true);
    setBarberError('');

    try {
      const barbeiros = await api.getEstablishmentBarbers(establishmentId, usuario.id);
      setBarbers(barbeiros);
    } catch (caughtError) {
      console.error('Erro ao carregar barbeiros:', caughtError);
      setBarberError(caughtError instanceof Error ? caughtError.message : 'Erro ao carregar barbeiros');
    } finally {
      setBarberLoading(false);
    }
  }

  function abrirModalBarbeiros(barbearia: AdminShop) {
    setSelectedBarbershopForBarbers(barbearia);
    setBarbers([]);
    setBarberForm(INITIAL_BARBER_FORM);
    setBarberError('');
    setBarberModalOpen(true);
    void carregarBarbeiros(barbearia.id);
  }

  function fecharModalBarbeiros() {
    setBarberModalOpen(false);
    setSelectedBarbershopForBarbers(null);
    setBarbers([]);
    setBarberForm(INITIAL_BARBER_FORM);
    setBarberError('');
    setBarberLoading(false);
    setBarberSaving(false);
    setDeletingBarberId(null);
  }

  function handleBarberChange(
    event: ChangeEvent<HTMLInputElement>,
  ) {
    const { name, value } = event.target;
    setBarberForm((currentForm) => ({
      ...currentForm,
      [name]: value,
    }));
  }

  async function handleBarberSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedBarbershopForBarbers) {
      return;
    }

    const usuario = parseStoredUser();
    if (!usuario) {
      navigate('/login');
      return;
    }

    setBarberSaving(true);
    setBarberError('');

    try {
      const response = await api.createEstablishmentBarber(selectedBarbershopForBarbers.id, {
        admin_user_id: usuario.id,
        ...barberForm,
      });
      setBarberForm(INITIAL_BARBER_FORM);
      await carregarBarbeiros(selectedBarbershopForBarbers.id);
      const verifycode =
        typeof response.usuario?.verifycode === 'string' && response.usuario.verifycode
          ? response.usuario.verifycode
          : null;
      alert(
        verifycode
          ? `Barbeiro criado com sucesso! Codigo de verificacao: ${verifycode}`
          : 'Barbeiro criado com sucesso!',
      );
    } catch (caughtError) {
      console.error('Erro ao criar barbeiro:', caughtError);
      setBarberError(caughtError instanceof Error ? caughtError.message : 'Erro ao criar barbeiro');
    } finally {
      setBarberSaving(false);
    }
  }

  async function handleDeleteBarber(barber: BarberSummary) {
    if (!selectedBarbershopForBarbers) {
      return;
    }

    const usuario = parseStoredUser();
    if (!usuario) {
      navigate('/login');
      return;
    }

    if (!window.confirm(`Tem certeza que deseja excluir o barbeiro ${barber.nome}?`)) {
      return;
    }

    setDeletingBarberId(barber.id);
    setBarberError('');

    try {
      await api.deleteEstablishmentBarber(selectedBarbershopForBarbers.id, barber.id, usuario.id);
      await carregarBarbeiros(selectedBarbershopForBarbers.id);
    } catch (caughtError) {
      console.error('Erro ao excluir barbeiro:', caughtError);
      setBarberError(caughtError instanceof Error ? caughtError.message : 'Erro ao excluir barbeiro');
    } finally {
      setDeletingBarberId(null);
    }
  }

  return (
    <>
      <UserBar />
      <main className="admin-main">
        <div className="admin-header">
          <h2 className="admin-title">Minhas Barbearias</h2>
          <button className="btn btn-primary" onClick={abrirModalNovo}>
            + Nova Barbearia
          </button>
        </div>

        {erro && !modalAberto && <div className="admin-error">{erro}</div>}

        {loading ? (
          <div className="loader">Carregando suas barbearias...</div>
        ) : barbearias.length === 0 ? (
          <div className="admin-empty-state">
            <p className="admin-empty-text">Voce ainda nao cadastrou nenhuma barbearia.</p>
            <button className="btn btn-primary" onClick={abrirModalNovo}>
              Cadastrar primeira barbearia
            </button>
          </div>
        ) : (
          <div className="admin-grid">
            {barbearias.map((barbearia) => (
              <div key={barbearia.id} className="shop-card admin-shop-card">
                <div className="shop-image admin-shop-image">
                  {barbearia.imagem_url ? (
                    <img
                      src={api.getPhotoUrl(barbearia.imagem_url) || undefined}
                      alt={barbearia.name || barbearia.nome || 'Barbearia'}
                      onError={(event) => {
                        const image = event.currentTarget;
                        image.style.display = 'none';
                        const placeholder = image.nextElementSibling;
                        if (placeholder instanceof HTMLElement) {
                          placeholder.style.display = 'flex';
                        }
                      }}
                    />
                  ) : null}
                  <div className="shop-image-placeholder" style={{ display: barbearia.imagem_url ? 'none' : 'flex' }}>
                    <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                      <polyline points="9 22 9 12 15 12 15 22" />
                    </svg>
                  </div>
                </div>

                <div className="shop-info">
                  <h4 className="shop-name">{barbearia.name || barbearia.nome}</h4>
                  <p className="shop-address">{barbearia.address || barbearia.cidade}</p>
                  {barbearia.phone && <p className="admin-shop-phone">Telefone: {barbearia.phone}</p>}
                </div>

                <div className="admin-shop-actions">
                  <button
                    className="btn btn-secondary"
                    onClick={() => {
                      setSelectedBarbeariaForPlans(barbearia.id);
                      setPlanModalOpen(true);
                    }}
                  >
                    Planos
                  </button>
                  <button
                    className="btn btn-secondary"
                    onClick={() => {
                      setSelectedBarbeariaId(barbearia.id);
                      setReportModalOpen(true);
                    }}
                  >
                    Relatorios
                  </button>
                  <button className="btn btn-secondary" onClick={() => abrirModalBarbeiros(barbearia)}>
                    Barbeiros
                  </button>

                  <button className="btn btn-primary admin-btn-edit" onClick={() => abrirModalEdicao(barbearia)}>
                    Editar
                  </button>
                  <button className="btn admin-btn-delete" onClick={() => void handleExcluir(barbearia.id)}>
                    Excluir
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {modalAberto && (
          <div className="admin-modal-backdrop">
            <div className="card admin-modal-container">
              <h2>{modoEdicao ? 'Editar Barbearia' : 'Nova Barbearia'}</h2>

              {erro && <div className="admin-error">{erro}</div>}

              <form onSubmit={handleSubmit}>
                <div className="admin-form-photo-preview">
                  <div className="admin-form-photo-container">
                    {previewUrl ? (
                      <img src={previewUrl} alt="Preview" className="admin-form-photo-img" />
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
                    <label htmlFor="foto-establishment-input" className="admin-form-photo-label">
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
                      <button type="button" onClick={removePhoto} className="admin-form-photo-remove">
                        Remover
                      </button>
                    )}
                  </div>

                  <p className="admin-form-photo-hint">
                    Formatos aceitos: JPEG, PNG, GIF, WebP (max. 5MB)
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

                <label>Descricao</label>
                <textarea
                  name="description"
                  value={barbeariaAtual?.description || ''}
                  onChange={handleChange}
                  rows={3}
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
                  placeholder="Ex: Sao Paulo"
                />

                <label>Estado *</label>
                <input
                  type="text"
                  name="stado"
                  value={barbeariaAtual?.stado || ''}
                  onChange={handleChange}
                  required
                  placeholder="Ex: SP"
                  maxLength={2}
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
                <label>URL do Google Maps</label>
                <input
                  type="text"
                  name="mapsUrl"
                  value={barbeariaAtual?.mapsUrl || ''}
                  onChange={handleChange}
                  placeholder="Ex: https://maps.google.com/?cid=1234567890"
                />

                <div className="admin-form-actions">
                  <button type="submit" className="btn btn-primary admin-form-btn-submit">
                    {modoEdicao ? 'Salvar Alteracoes' : 'Criar Barbearia'}
                  </button>
                  <button type="button" className="btn btn-outline admin-form-btn-cancel" onClick={fecharModal}>
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <BarbersModal
          isOpen={barberModalOpen}
          barbershop={selectedBarbershopForBarbers}
          barbers={barbers}
          barberForm={barberForm}
          loading={barberLoading}
          saving={barberSaving}
          deletingBarberId={deletingBarberId}
          error={barberError}
          onClose={fecharModalBarbeiros}
          onSubmit={handleBarberSubmit}
          onChange={handleBarberChange}
          onDelete={handleDeleteBarber}
        />

        {planModalOpen && selectedBarbeariaForPlans && (
          <div className="admin-modal-backdrop" onClick={() => setPlanModalOpen(false)}>
            <div className="card admin-modal-container" style={{ maxWidth: '1200px' }} onClick={(event) => event.stopPropagation()}>
              <button
                onClick={() => setPlanModalOpen(false)}
                style={{
                  position: 'absolute',
                  top: '16px',
                  right: '16px',
                  background: 'rgba(255,255,255,0.1)',
                  border: 'none',
                  color: '#e0e0e0',
                  fontSize: '24px',
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  cursor: 'pointer',
                }}
              >
                x
              </button>
              <PlanManager estabelecimentoId={selectedBarbeariaForPlans} />
            </div>
          </div>
        )}

        {reportModalOpen && selectedBarbeariaId && (
          <div className="admin-modal-backdrop" onClick={() => setReportModalOpen(false)}>
            <div className="card admin-modal-container" style={{ maxWidth: '1400px' }} onClick={(event) => event.stopPropagation()}>
              <button
                onClick={() => setReportModalOpen(false)}
                style={{
                  position: 'absolute',
                  top: '16px',
                  right: '16px',
                  background: 'rgba(255,255,255,0.1)',
                  border: 'none',
                  color: '#e0e0e0',
                  fontSize: '24px',
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  cursor: 'pointer',
                }}
              >
                x
              </button>
              <ReportLucro estabelecimentoId={selectedBarbeariaId} />
            </div>
          </div>
        )}
      </main>
    </>
  );
}
