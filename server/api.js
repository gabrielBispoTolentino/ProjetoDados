const API_BASE_URL = import.meta.env.PROD
  ? 'http://localhost:3000'
  : '/api';

export const api = {
  // ============= USUÁRIOS =============

  async createUserWithPhoto(formData) {
    const response = await fetch(`${API_BASE_URL}/usuarios`, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.erro || 'Erro ao criar usuário');
    }

    return response.json();
  },

  async createUser(userData) {
    const response = await fetch(`${API_BASE_URL}/usuarios`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.erro || 'Erro ao criar usuário');
    }

    return response.json();
  },

  async getUsers() {
    const response = await fetch(`${API_BASE_URL}/usuarios`);
    if (!response.ok) throw new Error('Erro ao buscar usuários');
    return response.json();
  },

  async getUserById(id) {
    const response = await fetch(`${API_BASE_URL}/usuarios/${id}`);
    if (!response.ok) throw new Error('Erro ao buscar usuário');
    return response.json();
  },

  async login(credentials) {
    const response = await fetch(`${API_BASE_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials)
    });

    if (!response.ok) {
      const text = await response.text().catch(() => null);
      throw new Error(text || 'Erro ao efetuar login');
    }

    return response.json();
  },

  async updateUserWithPhoto(id, formData) {
    const response = await fetch(`${API_BASE_URL}/usuarios/${id}`, {
      method: 'PUT',
      body: formData
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.erro || 'Erro ao atualizar usuário');
    }

    return response.json();
  },

  async updateUser(id, userData) {
    const response = await fetch(`${API_BASE_URL}/usuarios/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.erro || 'Erro ao atualizar usuário');
    }

    return response.json();
  },

  async deleteUser(id) {
    const response = await fetch(`${API_BASE_URL}/usuarios/${id}`, {
      method: 'DELETE'
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.erro || 'Erro ao deletar usuário');
    }

    return response.json();
  },

  // ============= ESTABELECIMENTOS =============

  async getEstablishments(page = 1, limit = 5) {
    const response = await fetch(`${API_BASE_URL}/establishments?page=${page}&limit=${limit}`);
    if (!response.ok) throw new Error('Erro ao buscar estabelecimentos');
    return response.json();
  },

  async getEstablishmentById(id) {
    const response = await fetch(`${API_BASE_URL}/establishments/${id}`);
    if (!response.ok) throw new Error('Erro ao buscar estabelecimento');
    return response.json();
  },

  async createEstablishmentWithPhoto(formData) {
    const response = await fetch(`${API_BASE_URL}/establishments`, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.erro || 'Erro ao criar estabelecimento');
    }

    return response.json();
  },

  async createEstablishment(establishmentData) {
    const response = await fetch(`${API_BASE_URL}/establishments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(establishmentData)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.erro || 'Erro ao criar estabelecimento');
    }

    return response.json();
  },

  async updateEstablishmentWithPhoto(id, formData) {
    const response = await fetch(`${API_BASE_URL}/establishments/${id}`, {
      method: 'PUT',
      body: formData
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.erro || 'Erro ao atualizar estabelecimento');
    }

    return response.json();
  },

  async updateEstablishment(id, establishmentData) {
    const response = await fetch(`${API_BASE_URL}/establishments/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(establishmentData)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.erro || 'Erro ao atualizar estabelecimento');
    }

    return response.json();
  },

  async deleteEstablishment(id) {
    const response = await fetch(`${API_BASE_URL}/establishments/${id}`, {
      method: 'DELETE'
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.erro || 'Erro ao deletar estabelecimento');
    }

    return response.json();
  },
  // ============= AGENDAMENTOS =============
  async getAgendamentos(usuarioId) {
    const response = await fetch(`${API_BASE_URL}/agendamentos?usuario_id=${usuarioId}`);
    if (!response.ok) throw new Error('Erro ao buscar agendamentos');
    return response.json();
  },

  async getHorariosDisponiveis(estabelecimentoId, data) {
    const response = await fetch(
      `${API_BASE_URL}/agendamentos/horarios-disponiveis/${estabelecimentoId}?data=${data}`
    );
    if (!response.ok) throw new Error('Erro ao buscar horários disponíveis');
    return response.json();
  },

  async cancelarAgendamento(agendamentoId) {
    const usuarioId = localStorage.getItem('usuarioId');
    const response = await fetch(`${API_BASE_URL}/agendamentos/${agendamentoId}/cancelar`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usuario_id: usuarioId })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.erro || 'Erro ao cancelar agendamento');
    }

    return response.json();
  },

  async reagendarAgendamento(agendamentoId, novaData) {
    const usuarioId = localStorage.getItem('usuarioId');
    const response = await fetch(`${API_BASE_URL}/agendamentos/${agendamentoId}/reagendar`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        usuario_id: usuarioId,
        nova_data: novaData
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.erro || 'Erro ao reagendar agendamento');
    }

    return response.json();
  },

  async pagarAgendamento(agendamentoId) {
    const response = await fetch(`${API_BASE_URL}/agendamentos/${agendamentoId}/pagar`, {
      method: 'PATCH'
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.erro || 'Erro ao confirmar pagamento');
    }

    return response.json();
  },
  async getAgendamentosMinhaBarbearia(usuarioId) {
    const response = await fetch(`${API_BASE_URL}/agendamentos/minha-barbearia?usuario_id=${usuarioId}`);
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.erro || 'Erro ao buscar agendamentos da minha barbearia');
    }
    return response.json(); // retorna array
  },
  //============ Avaliações ============
  async createReview(reviewData) {
    const response = await fetch(`${API_BASE_URL}/avaliacoes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(reviewData)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.erro || 'Erro ao criar avaliação');
    }

    return response.json();
  },

  //============ Planos ============
  async createPlano(planoData) {
    const response = await fetch(`${API_BASE_URL}/planos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(planoData)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.erro || 'Erro ao criar plano');
    }

    return response.json();
  },

  async getPlanosByEstabelecimento(estabelecimentoId) {
    const response = await fetch(`${API_BASE_URL}/planos/estabelecimento/${estabelecimentoId}`);
    if (!response.ok) throw new Error('Erro ao buscar planos');
    return response.json();
  },

  async getPlanosDisponiveis() {
    const response = await fetch(`${API_BASE_URL}/planos/disponiveis`);
    if (!response.ok) throw new Error('Erro ao buscar planos disponíveis');
    return response.json();
  },

  async updatePlano(planoId, planoData) {
    const response = await fetch(`${API_BASE_URL}/planos/${planoId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(planoData)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.erro || 'Erro ao atualizar plano');
    }

    return response.json();
  },

  async deletePlano(planoId) {
    const response = await fetch(`${API_BASE_URL}/planos/${planoId}`, {
      method: 'DELETE'
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.erro || 'Erro ao deletar plano');
    }

    return response.json();
  },

  //============ Inscrições ============
  async subscribeToPlan(inscricaoData) {
    const response = await fetch(`${API_BASE_URL}/inscricoes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(inscricaoData)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.erro || 'Erro ao criar inscrição');
    }

    return response.json();
  },

  async getUserSubscriptions(usuarioId) {
    const response = await fetch(`${API_BASE_URL}/inscricoes/usuario/${usuarioId}`);
    if (!response.ok) throw new Error('Erro ao buscar inscrições');
    return response.json();
  },

  async cancelSubscription(inscricaoId, motivo) {
    const response = await fetch(`${API_BASE_URL}/inscricoes/${inscricaoId}/cancelar`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ motivo })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.erro || 'Erro ao cancelar inscrição');
    }

    return response.json();
  },

  // ============= HELPERS =============

  getPhotoUrl(photoPath) {
    if (!photoPath) return null;
    if (photoPath.startsWith('http')) return photoPath;
    return `${API_BASE_URL}${photoPath}`;
  }
};