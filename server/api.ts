import type {
  ApiId,
  ApiMessageResponse,
  AppointmentCreateResponse,
  AvailablePlan,
  CreateAgendamentoPayload,
  CreatePlanPayload,
  CreateUserPayload,
  Establishment,
  GenerateReportLucroPayload,
  LoginCredentials,
  LoginResponse,
  MarketplacePlan,
  PlanBenefit,
  PlanBenefitPayload,
  PlanPartner,
  ReportLucroEntry,
  ReviewPayload,
  Service,
  SubscribeToPlanPayload,
  SubscribeToPlanResponse,
  TimeSlotsResponse,
  UpdatePlanPayload,
  UpdateUserPayload,
  UserAppointment,
  UserSubscription,
  UserSummary,
} from '../src/types/domain';

const configuredApiUrl = (import.meta.env.VITE_API_URL || '').trim().replace(/\/+$/, '');
const API_BASE_URL = configuredApiUrl || '/api';

function buildUrl(path: string): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function getErrorMessage(errorData: unknown, fallbackMessage: string): string {
  if (!isRecord(errorData)) {
    return fallbackMessage;
  }

  if (typeof errorData.erro === 'string' && errorData.erro.trim()) {
    return errorData.erro;
  }

  if (typeof errorData.message === 'string' && errorData.message.trim()) {
    return errorData.message;
  }

  return fallbackMessage;
}

async function parseError(response: Response, fallbackMessage: string): Promise<Error> {
  try {
    const errorData: unknown = await response.json();
    return new Error(getErrorMessage(errorData, fallbackMessage));
  } catch {
    const text = await response.text().catch(() => null);
    return new Error(text || fallbackMessage);
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  fallbackMessage = 'Erro ao processar requisicao',
): Promise<T> {
  const response = await fetch(buildUrl(path), options);

  if (!response.ok) {
    throw await parseError(response, fallbackMessage);
  }

  if (response.status === 204) {
    return null as T;
  }

  return response.json().catch(() => null as T);
}

export const api = {
  createUserWithPhoto(formData: FormData) {
    return request<ApiMessageResponse & { id: number | null; fotoUrl: string }>('/usuarios', {
      method: 'POST',
      body: formData,
    }, 'Erro ao criar usuario');
  },

  createUser(userData: CreateUserPayload) {
    return request<ApiMessageResponse & { id: number | null; fotoUrl?: string }>('/usuarios', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    }, 'Erro ao criar usuario');
  },

  getUsers() {
    return request<UserSummary[]>('/usuarios', {}, 'Erro ao buscar usuarios');
  },

  getUserById(id: ApiId) {
    return request<UserSummary>(`/usuarios/${id}`, {}, 'Erro ao buscar usuario');
  },

  login(credentials: LoginCredentials) {
    return request<LoginResponse>('/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    }, 'Erro ao efetuar login');
  },

  updateUserWithPhoto(id: ApiId, formData: FormData) {
    return request<ApiMessageResponse & { fotoUrl: string }>(`/usuarios/${id}`, {
      method: 'PUT',
      body: formData,
    }, 'Erro ao atualizar usuario');
  },

  updateUser(id: ApiId, userData: UpdateUserPayload) {
    return request<ApiMessageResponse & { fotoUrl?: string }>(`/usuarios/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    }, 'Erro ao atualizar usuario');
  },

  deleteUser(id: ApiId) {
    return request<ApiMessageResponse>(`/usuarios/${id}`, {
      method: 'DELETE',
    }, 'Erro ao deletar usuario');
  },

  getEstablishments(page = 1, limit = 5) {
    return request<Establishment[]>(`/establishments?page=${page}&limit=${limit}`, {}, 'Erro ao buscar estabelecimentos');
  },

  getEstablishmentById(id: ApiId) {
    return request<Establishment>(`/establishments/${id}`, {}, 'Erro ao buscar estabelecimento');
  },

  createEstablishmentWithPhoto(formData: FormData) {
    return request<ApiMessageResponse & { id?: number | null; imagem_url?: string }>('/establishments', {
      method: 'POST',
      body: formData,
    }, 'Erro ao criar estabelecimento');
  },

  createEstablishment(establishmentData: Record<string, unknown>) {
    return request<ApiMessageResponse & { id?: number | null; imagem_url?: string }>('/establishments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(establishmentData),
    }, 'Erro ao criar estabelecimento');
  },

  updateEstablishmentWithPhoto(id: ApiId, formData: FormData) {
    return request<ApiMessageResponse & { imagem_url?: string }>(`/establishments/${id}`, {
      method: 'PUT',
      body: formData,
    }, 'Erro ao atualizar estabelecimento');
  },

  updateEstablishment(id: ApiId, establishmentData: Record<string, unknown>) {
    return request<ApiMessageResponse & { imagem_url?: string }>(`/establishments/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(establishmentData),
    }, 'Erro ao atualizar estabelecimento');
  },

  deleteEstablishment(id: ApiId) {
    return request<ApiMessageResponse>(`/establishments/${id}`, {
      method: 'DELETE',
    }, 'Erro ao deletar estabelecimento');
  },

  getAgendamentos(usuarioId: ApiId) {
    return request<UserAppointment[]>(`/agendamentos?usuario_id=${usuarioId}`, {}, 'Erro ao buscar agendamentos');
  },

  createAgendamento(agendamentoData: CreateAgendamentoPayload) {
    return request<AppointmentCreateResponse>('/agendamentos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(agendamentoData),
    }, 'Erro ao criar agendamento');
  },

  getHorariosDisponiveis(estabelecimentoId: ApiId, data: string) {
    return request<TimeSlotsResponse>(
      `/agendamentos/horarios-disponiveis/${estabelecimentoId}?data=${data}`,
      {},
      'Erro ao buscar horarios disponiveis',
    );
  },

  cancelarAgendamento(agendamentoId: ApiId) {
    const usuarioId = localStorage.getItem('usuarioId');
    return request<ApiMessageResponse>(`/agendamentos/${agendamentoId}/cancelar`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usuario_id: usuarioId }),
    }, 'Erro ao cancelar agendamento');
  },

  reagendarAgendamento(agendamentoId: ApiId, novaData: string) {
    const usuarioId = localStorage.getItem('usuarioId');
    return request<ApiMessageResponse>(`/agendamentos/${agendamentoId}/reagendar`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        usuario_id: usuarioId,
        nova_data: novaData,
      }),
    }, 'Erro ao reagendar agendamento');
  },

  pagarAgendamento(agendamentoId: ApiId) {
    return request<ApiMessageResponse>(`/agendamentos/${agendamentoId}/pagar`, {
      method: 'PATCH',
    }, 'Erro ao confirmar pagamento');
  },

  getAgendamentosMinhaBarbearia(usuarioId: ApiId) {
    return request<UserAppointment[]>(
      `/agendamentos/minha-barbearia?usuario_id=${usuarioId}`,
      {},
      'Erro ao buscar agendamentos da minha barbearia',
    );
  },

  createReview(reviewData: ReviewPayload) {
    return request<ApiMessageResponse>('/avaliacoes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(reviewData),
    }, 'Erro ao criar avaliacao');
  },

  createPlano(planoData: CreatePlanPayload) {
    return request<ApiMessageResponse & { id: number | null }>('/planos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(planoData),
    }, 'Erro ao criar plano');
  },

  getPlanosByEstabelecimento(estabelecimentoId: ApiId) {
    return request<AvailablePlan[]>(`/planos/estabelecimento/${estabelecimentoId}`, {}, 'Erro ao buscar planos');
  },

  getPlanosDisponiveisByEstabelecimento(estabelecimentoId: ApiId) {
    return request<AvailablePlan[]>(
      `/planos/estabelecimento/${estabelecimentoId}/disponiveis`,
      {},
      'Erro ao carregar planos',
    );
  },

  getMyPlanos(estabelecimentoId: ApiId) {
    return request<AvailablePlan[]>(`/planos/meus/${estabelecimentoId}`, {}, 'Erro ao buscar meus planos');
  },

  getMarketplacePlanos(estabelecimentoId: ApiId) {
    return request<MarketplacePlan[]>(
      `/planos/marketplace?estabelecimento_id=${estabelecimentoId}`,
      {},
      'Erro ao buscar planos do marketplace',
    );
  },

  participarPlano(planoId: ApiId, estabelecimentoId: ApiId) {
    return request<ApiMessageResponse>(`/planos/${planoId}/participar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ estabelecimento_id: estabelecimentoId }),
    }, 'Erro ao participar do plano');
  },

  sairPlano(planoId: ApiId, estabelecimentoId: ApiId) {
    return request<ApiMessageResponse>(`/planos/${planoId}/sair`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ estabelecimento_id: estabelecimentoId }),
    }, 'Erro ao sair do plano');
  },

  getPlanoParceiros(planoId: ApiId) {
    return request<PlanPartner[]>(`/planos/${planoId}/parceiros`, {}, 'Erro ao buscar parceiros do plano');
  },

  getPlanosDisponiveis() {
    return request<AvailablePlan[]>('/planos/disponiveis', {}, 'Erro ao buscar planos disponiveis');
  },

  updatePlano(planoId: ApiId, planoData: UpdatePlanPayload) {
    return request<ApiMessageResponse>(`/planos/${planoId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(planoData),
    }, 'Erro ao atualizar plano');
  },

  deletePlano(planoId: ApiId, estabelecimentoId: ApiId) {
    return request<ApiMessageResponse>(`/planos/${planoId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ estabelecimento_id: estabelecimentoId }),
    }, 'Erro ao deletar plano');
  },

  subscribeToPlan(inscricaoData: SubscribeToPlanPayload) {
    return request<SubscribeToPlanResponse>('/inscricoes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(inscricaoData),
    }, 'Erro ao criar inscricao');
  },

  getUserSubscriptions(usuarioId: ApiId) {
    return request<UserSubscription[]>(`/inscricoes/usuario/${usuarioId}`, {}, 'Erro ao buscar inscricoes');
  },

  cancelSubscription(inscricaoId: ApiId, motivo: string | null) {
    return request<ApiMessageResponse>(`/inscricoes/${inscricaoId}/cancelar`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ motivo }),
    }, 'Erro ao cancelar inscricao');
  },

  getPlanoBeneficios(planoId: ApiId) {
    return request<PlanBenefit[]>(`/planos/${planoId}/beneficios`, {}, 'Erro ao buscar beneficios');
  },

  addPlanoBeneficio(planoId: ApiId, beneficioData: PlanBenefitPayload) {
    return request<ApiMessageResponse & { id: number | null }>(`/planos/${planoId}/beneficios`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(beneficioData),
    }, 'Erro ao adicionar beneficio');
  },

  getServicos() {
    return request<Service[]>('/servicos', {}, 'Erro ao buscar servicos');
  },

  getReportLucro(estabelecimentoId: ApiId) {
    return request<ReportLucroEntry[]>(
      `/report-lucro?estabelecimento_id=${estabelecimentoId}`,
      {},
      'Erro ao carregar relatorios',
    );
  },

  generateReportLucro(payload: GenerateReportLucroPayload) {
    return request<ApiMessageResponse>('/report-lucro/auto', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }, 'Erro ao gerar relatorio');
  },

  getPhotoUrl(photoPath: string | null | undefined) {
    if (!photoPath) {
      return null;
    }

    if (photoPath.startsWith('http')) {
      return photoPath;
    }

    return buildUrl(photoPath);
  },
};
