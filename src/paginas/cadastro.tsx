import { useEffect, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import SignupPlanPaymentModal from '../components/SignupPlanPaymentModal';
import { api } from '../../server/api';
import type {
  AdmFields,
  BarbershopPlanType,
  CreateUserPayload,
  UserFields,
  UserSummary,
} from '../types/domain';
import './css/Cadastro.css';

type CadastroFormData = CreateUserPayload & Partial<AdmFields> & Partial<UserFields>;

const INITIAL_FORM_DATA: CadastroFormData = {
  nome: '',
  email: '',
  senha: '',
  cpf: '',
  telefone: '',
  role: '',
  cnpj: '',
  barbershop_plan_id: '',
};

function getRedirectPathForUser(usuario: UserSummary) {
  if (usuario.userTable === 'usuarioBarber') {
    return '/barber-painel';
  }

  if (usuario.role === 'ADM_Estabelecimento') {
    return '/painel-admin';
  }

  return '/painel';
}

export default function Cadastro() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<CadastroFormData>(INITIAL_FORM_DATA);
  const [foto, setFoto] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [barbershopPlans, setBarbershopPlans] = useState<BarbershopPlanType[]>([]);
  const [barbershopPlansLoading, setBarbershopPlansLoading] = useState(true);
  const [barbershopPlansError, setBarbershopPlansError] = useState('');
  const [adminSignupModalOpen, setAdminSignupModalOpen] = useState(false);

  useEffect(() => {
    void loadBarbershopPlans();
  }, []);

  async function loadBarbershopPlans() {
    try {
      setBarbershopPlansLoading(true);
      setBarbershopPlansError('');
      const plans = await api.getBarbershopPlanTypes();
      setBarbershopPlans(plans);
    } catch (caughtError) {
      console.error(caughtError);
      setBarbershopPlans([]);
      setBarbershopPlansError(
        caughtError instanceof Error ? caughtError.message : 'Erro ao carregar planos da barbearia.',
      );
    } finally {
      setBarbershopPlansLoading(false);
    }
  }

  function handleChange(event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = event.target;
    setErro('');
    setFormData((currentForm) => ({
      ...currentForm,
      [name]: value,
      ...(name === 'role' && value !== 'ADM_Estabelecimento'
        ? { cnpj: '', barbershop_plan_id: '' }
        : {}),
    } as CadastroFormData));

    if (name === 'role' && value !== 'ADM_Estabelecimento') {
      closeSignupModal();
    }
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
    setPreviewUrl(null);
    const fileInput = document.getElementById('foto-input');
    if (fileInput instanceof HTMLInputElement) {
      fileInput.value = '';
    }
  }

  async function submitCadastro() {
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

      const cnpj = formData.cnpj?.trim();
      if (formData.role === 'ADM_Estabelecimento' && cnpj) {
        formDataToSend.append('cnpj', cnpj);
        formDataToSend.append('barbershop_plan_id', String(formData.barbershop_plan_id));
      }

      const response = await api.createUserWithPhoto(formDataToSend);

      if (!response.id) {
        throw new Error('Nao foi possivel identificar a conta criada.');
      }

      const usuarioCriado = await api.getUserById(response.id);
      localStorage.setItem('usuarioId', String(usuarioCriado.id));
      localStorage.setItem('usuario', JSON.stringify(usuarioCriado));

      closeSignupModal();
      navigate(getRedirectPathForUser(usuarioCriado));
    } catch (caughtError) {
      setErro(caughtError instanceof Error ? caughtError.message : 'Erro ao cadastrar. Tente novamente.');
      console.error(caughtError);
    } finally {
      setCarregando(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErro('');

    if (formData.role === 'ADM_Estabelecimento') {
      if (barbershopPlansLoading) {
        setErro('Os planos da barbearia ainda estao sendo carregados.');
        return;
      }

      if (barbershopPlans.length === 0) {
        setErro('Nao foi possivel carregar os planos da barbearia. Tente novamente em instantes.');
        return;
      }

      setAdminSignupModalOpen(true);
      return;
    }

    await submitCadastro();
  }

  function handleBarbershopPlanSelect(planId: number) {
    setErro('');
    setFormData((currentForm) => ({
      ...currentForm,
      barbershop_plan_id: String(planId),
    }));
  }

  function closeSignupModal() {
    setAdminSignupModalOpen(false);
  }

  return (
    <div className="cadastro-container">
      <div className="cadastro-card">
        <h2>Criar Conta</h2>
        {erro && !adminSignupModalOpen && <p className="cadastro-error">{erro}</p>}

        <form onSubmit={handleSubmit} className="cadastro-form">
          <div className="cadastro-photo-preview">
            <div className="cadastro-photo-container">
              {previewUrl ? (
                <img src={previewUrl} alt="Preview" className="cadastro-photo-img" />
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
              <label htmlFor="foto-input" className="cadastro-photo-label">
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
              Formatos aceitos: JPEG, PNG, GIF, WebP (max. 5MB)
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

          <input
            type="tel"
            name="telefone"
            placeholder="Numero de telefone"
            value={formData.telefone}
            onChange={handleChange}
            disabled={carregando}
            required
          />

          <label htmlFor="role" className="cadastro-role-label">
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
            <option value="" disabled>
              Selecione o tipo de conta
            </option>
            <option value="Cliente">Cliente</option>
            <option value="ADM_Estabelecimento">Administrador da Barbearia</option>
          </select>

          {formData.role === 'ADM_Estabelecimento' && (
            <input
              type="text"
              name="cnpj"
              placeholder="CNPJ da Barbearia"
              value={formData.cnpj || ''}
              onChange={handleChange}
              disabled={carregando}
              required
            />
          )}

          <button type="submit" className="cadastro-btn" disabled={carregando}>
            {carregando ? 'Cadastrando...' : formData.role === 'ADM_Estabelecimento' ? 'Continuar' : 'Cadastrar'}
          </button>
        </form>

        <button
          className="cadastro-back-btn"
          type="button"
          onClick={() => navigate('/')}
          disabled={carregando}
        >
          &larr; Voltar para Home
        </button>
      </div>

      <SignupPlanPaymentModal
        isOpen={adminSignupModalOpen}
        plans={barbershopPlans}
        loading={barbershopPlansLoading}
        loadError={barbershopPlansError}
        selectedPlanId={formData.barbershop_plan_id}
        submitting={carregando}
        submitError={erro}
        onClose={closeSignupModal}
        onSelectPlan={handleBarbershopPlanSelect}
        onConfirm={submitCadastro}
      />
    </div>
  );
}
