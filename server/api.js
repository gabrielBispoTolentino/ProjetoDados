const API_BASE_URL = import.meta.env.PROD 
  ? 'http://localhost:3000'
  : '/api';

export const api = {
  // Usuários - Criar usuário COM foto
  async createUserWithPhoto(formData) {
    const response = await fetch(`${API_BASE_URL}/usuarios`, {
      method: 'POST',
      body: formData // FormData já tem o Content-Type correto
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.erro || 'Erro ao criar usuário');
    }
    
    return response.json();
  },

  // Usuários - Criar usuário SEM foto (método antigo mantido para compatibilidade)
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

  // Autenticação (login)
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

  // Atualizar usuário COM foto
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

  // Atualizar usuário SEM foto (método antigo)
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
  
  // Helper para obter URL completa da foto
  getPhotoUrl(photoPath) {
    if (!photoPath) return null;
    if (photoPath.startsWith('http')) return photoPath;
    return `${API_BASE_URL}${photoPath}`;
  }
};