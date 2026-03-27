const configuredApiUrl = (import.meta.env.VITE_API_URL || '').trim().replace(/\/+$/, '');
const API_BASE_URL = configuredApiUrl || '/api';

function buildUrl(path) {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
}

async function parseError(response, fallbackMessage) {
  try {
    const errorData = await response.json();
    return new Error(errorData.erro || errorData.message || fallbackMessage);
  } catch {
    const text = await response.text().catch(() => null);
    return new Error(text || fallbackMessage);
  }
}

async function request(path, options = {}, fallbackMessage = 'Erro ao processar requisicao') {
  const response = await fetch(buildUrl(path), options);

  if (!response.ok) {
    throw await parseError(response, fallbackMessage);
  }

  if (response.status === 204) {
    return null;
  }

  return response.json().catch(() => null);
}

export const api = {
  createUserWithPhoto(formData) {
    return request('/usuarios', {
      method: 'POST',
      body: formData,
    }, 'Erro ao criar usuario');
  },

  createUser(userData) {
    return request('/usuarios', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    }, 'Erro ao criar usuario');
  },

  getUsers() {
    return request('/usuarios', {}, 'Erro ao buscar usuarios');
  },

  getUserById(id) {
    return request(`/usuarios/${id}`, {}, 'Erro ao buscar usuario');
  },

  login(credentials) {
    return request('/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    }, 'Erro ao efetuar login');
  },

  updateUserWithPhoto(id, formData) {
    return request(`/usuarios/${id}`, {
      method: 'PUT',
      body: formData,
    }, 'Erro ao atualizar usuario');
  },

  updateUser(id, userData) {
    return request(`/usuarios/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    }, 'Erro ao atualizar usuario');
  },

  deleteUser(id) {
    return request(`/usuarios/${id}`, {
      method: 'DELETE',
    }, 'Erro ao deletar usuario');
  },

  getEstablishments(page = 1, limit = 5) {
    return request(`/establishments?page=${page}&limit=${limit}`, {}, 'Erro ao buscar estabelecimentos');
  },

  getEstablishmentById(id) {
    return request(`/establishments/${id}`, {}, 'Erro ao buscar estabelecimento');
  },

  createEstablishmentWithPhoto(formData) {
    return request('/establishments', {
      method: 'POST',
      body: formData,
    }, 'Erro ao criar estabelecimento');
  },

  createEstablishment(establishmentData) {
    return request('/establishments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(establishmentData),
    }, 'Erro ao criar estabelecimento');
  },

  updateEstablishmentWithPhoto(id, formData) {
    return request(`/establishments/${id}`, {
      method: 'PUT',
      body: formData,
    }, 'Erro ao atualizar estabelecimento');
  },

  updateEstablishment(id, establishmentData) {
    return request(`/establishments/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(establishmentData),
    }, 'Erro ao atualizar estabelecimento');
  },

  deleteEstablishment(id) {
    return request(`/establishments/${id}`, {
      method: 'DELETE',
    }, 'Erro ao deletar estabelecimento');
  },

  getAgendamentos(usuarioId) {
    return request(`/agendamentos?usuario_id=${usuarioId}`, {}, 'Erro ao buscar agendamentos');
  },

  createAgendamento(agendamentoData) {
    return request('/agendamentos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(agendamentoData),
    }, 'Erro ao criar agendamento');
  },

  getHorariosDisponiveis(estabelecimentoId, data) {
    return request(
      `/agendamentos/horarios-disponiveis/${estabelecimentoId}?data=${data}`,
      {},
      'Erro ao buscar horarios disponiveis',
    );
  },

  cancelarAgendamento(agendamentoId) {
    const usuarioId = localStorage.getItem('usuarioId');
    return request(`/agendamentos/${agendamentoId}/cancelar`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usuario_id: usuarioId }),
    }, 'Erro ao cancelar agendamento');
  },

  reagendarAgendamento(agendamentoId, novaData) {
    const usuarioId = localStorage.getItem('usuarioId');
    return request(`/agendamentos/${agendamentoId}/reagendar`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        usuario_id: usuarioId,
        nova_data: novaData,
      }),
    }, 'Erro ao reagendar agendamento');
  },

  pagarAgendamento(agendamentoId) {
    return request(`/agendamentos/${agendamentoId}/pagar`, {
      method: 'PATCH',
    }, 'Erro ao confirmar pagamento');
  },

  getAgendamentosMinhaBarbearia(usuarioId) {
    return request(`/agendamentos/minha-barbearia?usuario_id=${usuarioId}`, {}, 'Erro ao buscar agendamentos da minha barbearia');
  },

  createReview(reviewData) {
    return request('/avaliacoes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(reviewData),
    }, 'Erro ao criar avaliacao');
  },

  createPlano(planoData) {
    return request('/planos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(planoData),
    }, 'Erro ao criar plano');
  },

  getPlanosByEstabelecimento(estabelecimentoId) {
    return request(`/planos/estabelecimento/${estabelecimentoId}`, {}, 'Erro ao buscar planos');
  },

  getPlanosDisponiveisByEstabelecimento(estabelecimentoId) {
    return request(`/planos/estabelecimento/${estabelecimentoId}/disponiveis`, {}, 'Erro ao carregar planos');
  },

  getMyPlanos(estabelecimentoId) {
    return request(`/planos/meus/${estabelecimentoId}`, {}, 'Erro ao buscar meus planos');
  },

  getMarketplacePlanos(estabelecimentoId) {
    return request(`/planos/marketplace?estabelecimento_id=${estabelecimentoId}`, {}, 'Erro ao buscar planos do marketplace');
  },

  participarPlano(planoId, estabelecimentoId) {
    return request(`/planos/${planoId}/participar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ estabelecimento_id: estabelecimentoId }),
    }, 'Erro ao participar do plano');
  },

  sairPlano(planoId, estabelecimentoId) {
    return request(`/planos/${planoId}/sair`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ estabelecimento_id: estabelecimentoId }),
    }, 'Erro ao sair do plano');
  },

  getPlanoParceiros(planoId) {
    return request(`/planos/${planoId}/parceiros`, {}, 'Erro ao buscar parceiros do plano');
  },

  getPlanosDisponiveis() {
    return request('/planos/disponiveis', {}, 'Erro ao buscar planos disponiveis');
  },

  updatePlano(planoId, planoData) {
    return request(`/planos/${planoId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(planoData),
    }, 'Erro ao atualizar plano');
  },

  deletePlano(planoId, estabelecimentoId) {
    return request(`/planos/${planoId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ estabelecimento_id: estabelecimentoId }),
    }, 'Erro ao deletar plano');
  },

  subscribeToPlan(inscricaoData) {
    return request('/inscricoes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(inscricaoData),
    }, 'Erro ao criar inscricao');
  },

  getUserSubscriptions(usuarioId) {
    return request(`/inscricoes/usuario/${usuarioId}`, {}, 'Erro ao buscar inscricoes');
  },

  cancelSubscription(inscricaoId, motivo) {
    return request(`/inscricoes/${inscricaoId}/cancelar`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ motivo }),
    }, 'Erro ao cancelar inscricao');
  },

  getPlanoBeneficios(planoId) {
    return request(`/planos/${planoId}/beneficios`, {}, 'Erro ao buscar beneficios');
  },

  addPlanoBeneficio(planoId, beneficioData) {
    return request(`/planos/${planoId}/beneficios`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(beneficioData),
    }, 'Erro ao adicionar beneficio');
  },

  getServicos() {
    return request('/servicos', {}, 'Erro ao buscar servicos');
  },

  getReportLucro(estabelecimentoId) {
    return request(`/report-lucro?estabelecimento_id=${estabelecimentoId}`, {}, 'Erro ao carregar relatorios');
  },

  generateReportLucro(payload) {
    return request('/report-lucro/auto', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }, 'Erro ao gerar relatorio');
  },

  getPhotoUrl(photoPath) {
    if (!photoPath) {
      return null;
    }

    if (photoPath.startsWith('http')) {
      return photoPath;
    }

    return buildUrl(photoPath);
  },
};
