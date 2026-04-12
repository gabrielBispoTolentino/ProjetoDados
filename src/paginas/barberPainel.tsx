import { useEffect, useState } from 'react';
import type { ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import UserBar from '../components/UserBar';
import { api } from '../../server/api';
import type { UserAppointment, UserSummary } from '../types/domain';
import './css/PainelCliente.css';
import './css/PainelAdmin.css';

const DEFAULT_PROFILE_PHOTO = '/uploads/profile-photos/default-avatar.png';

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

function persistStoredUser(usuario: UserSummary) {
  localStorage.setItem('usuarioId', String(usuario.id));
  localStorage.setItem('usuario', JSON.stringify(usuario));
}

function isDefaultProfilePhoto(usuario: UserSummary | null) {
  if (!usuario) {
    return false;
  }

  const foto = usuario.fotoUrl || usuario.foto_url || usuario.imagem_url || null;
  return !foto || foto === DEFAULT_PROFILE_PHOTO;
}

export default function BarberPainel() {
  const navigate = useNavigate();
  const [usuario, setUsuario] = useState<UserSummary | null>(() => parseStoredUser());
  const [agendamentos, setAgendamentos] = useState<UserAppointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [foto, setFoto] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoError, setPhotoError] = useState('');

  useEffect(() => {
    if (!usuario) {
      navigate('/parceiros-login');
      return;
    }

    if (usuario.userTable !== 'usuarioBarber') {
      navigate('/login');
      return;
    }

    void carregarAgendamentos(usuario.id);
  }, [navigate, usuario]);

  async function carregarAgendamentos(usuarioId: number) {
    setLoading(true);
    setError('');

    try {
      const data = await api.getAgendamentosBarbeiro(usuarioId);
      setAgendamentos(Array.isArray(data) ? data : []);
    } catch (caughtError) {
      console.error(caughtError);
      setError(caughtError instanceof Error ? caughtError.message : 'Erro ao carregar agendamentos');
      setAgendamentos([]);
    } finally {
      setLoading(false);
    }
  }

  async function atualizarStatusAgendamento(
    agendamentoId: number,
    acao: 'cancelar' | 'concluir',
  ) {
    const mensagens = {
      cancelar: 'Deseja realmente cancelar este agendamento?',
      concluir: 'Deseja marcar este agendamento como concluido?',
    } as const;

    if (!window.confirm(mensagens[acao])) {
      return;
    }

    setProcessingId(agendamentoId);

    try {
      if (acao === 'cancelar') {
        await api.cancelarAgendamentoBarbeiro(agendamentoId);
        alert('Agendamento cancelado com sucesso!');
      } else {
        await api.concluirAgendamentoBarbeiro(agendamentoId);
        alert('Agendamento concluido com sucesso!');
      }

      setAgendamentos((current) => current.map((agendamento) => (
        agendamento.id === agendamentoId
          ? { ...agendamento, status: acao === 'cancelar' ? 'cancelado' : 'completo' }
          : agendamento
      )));
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : 'Erro ao atualizar agendamento';
      alert(message);
    } finally {
      setProcessingId(null);
    }
  }

  function handlePhotoChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setPhotoError('Selecione uma imagem valida em JPEG, PNG, GIF ou WebP.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setPhotoError('A imagem deve ter no maximo 5MB.');
      return;
    }

    setPhotoError('');
    setFoto(file);

    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result;
      setPreviewUrl(typeof result === 'string' ? result : null);
    };
    reader.readAsDataURL(file);
  }

  async function handlePhotoUpload() {
    if (!usuario || !foto) {
      return;
    }

    setUploadingPhoto(true);
    setPhotoError('');

    try {
      const formData = new FormData();
      formData.append('foto', foto);

      const response = await api.updateUserWithPhoto(usuario.id, formData);
      const novaFotoUrl = response.fotoUrl;
      const usuarioAtualizado: UserSummary = {
        ...usuario,
        fotoUrl: novaFotoUrl,
        foto_url: novaFotoUrl,
        imagem_url: novaFotoUrl,
      };

      persistStoredUser(usuarioAtualizado);
      setUsuario(usuarioAtualizado);
      setFoto(null);
      setPreviewUrl(null);
      alert('Foto atualizada com sucesso!');
    } catch (caughtError) {
      setPhotoError(caughtError instanceof Error ? caughtError.message : 'Erro ao atualizar foto');
    } finally {
      setUploadingPhoto(false);
    }
  }

  const fotoAtual = previewUrl || api.getPhotoUrl(usuario?.fotoUrl || usuario?.foto_url || usuario?.imagem_url) || null;
  const shouldPromptPhotoUpload = isDefaultProfilePhoto(usuario);

  return (
    <>
      <UserBar />
      <main className="painel-main">
        <div className="painel-header">
          <h1>Meus Cortes Agendados</h1>
          <p>Visualize os clientes agendados com voce.</p>
        </div>

        {usuario && (
          <section className={`barber-profile-card ${shouldPromptPhotoUpload ? 'is-highlighted' : ''}`}>
            <div className="barber-profile-summary">
              <div className="barber-profile-avatar">
                {fotoAtual ? (
                  <img src={fotoAtual || undefined} alt={usuario.nome} />
                ) : (
                  <svg width="54" height="54" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                )}
              </div>

              <div className="barber-profile-copy">
                <h2>Foto do perfil</h2>
                <p>
                  {shouldPromptPhotoUpload
                    ? 'Seu perfil ainda esta com a foto padrao. Envie uma foto para aparecer corretamente para os clientes.'
                    : 'Atualize sua foto quando quiser para manter seu perfil do barbeiro identificado.'}
                </p>
                <span className="barber-profile-hint">Formatos aceitos: JPEG, PNG, GIF e WebP ate 5MB.</span>
              </div>
            </div>

            <div className="barber-profile-actions">
              <label htmlFor="barber-photo-input" className="barber-photo-picker">
                {previewUrl ? 'Escolher outra foto' : shouldPromptPhotoUpload ? 'Adicionar foto' : 'Trocar foto'}
              </label>
              <input
                id="barber-photo-input"
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                onChange={handlePhotoChange}
                disabled={uploadingPhoto}
                hidden
              />
              <button
                type="button"
                className="barber-appointment-btn barber-appointment-btn-complete"
                onClick={() => {
                  void handlePhotoUpload();
                }}
                disabled={!foto || uploadingPhoto}
              >
                {uploadingPhoto ? 'Enviando...' : 'Salvar foto'}
              </button>
            </div>

            {photoError && <p className="barber-profile-error">{photoError}</p>}
          </section>
        )}

        {error && <div className="loader error">{error}</div>}

        {loading ? (
          <div className="loader">Carregando agendamentos...</div>
        ) : agendamentos.length === 0 ? (
          <div className="loader">Nenhum corte agendado com voce no momento.</div>
        ) : (
          <div className="admin-grid">
            {agendamentos.map((agendamento) => {
              const statusFinalizado = agendamento.status === 'cancelado' || agendamento.status === 'completo';
              const isProcessing = processingId === agendamento.id;

              return (
                <article key={agendamento.id} className="shop-card admin-shop-card">
                  <div className="shop-info">
                    <h4 className="shop-name">{agendamento.usuario_nome || 'Cliente'}</h4>
                    <p className="shop-address">{agendamento.estabelecimento_nome || 'Barbearia'}</p>
                    <p className="admin-shop-phone">
                      Data: {agendamento.proximo_pag ? new Date(agendamento.proximo_pag).toLocaleDateString('pt-BR') : '-'}
                    </p>
                    <p className="admin-shop-phone">
                      Horario: {agendamento.proximo_pag ? new Date(agendamento.proximo_pag).toLocaleTimeString('pt-BR', {
                        hour: '2-digit',
                        minute: '2-digit',
                      }) : '-'}
                    </p>
                    <p className="admin-shop-phone">Status: {agendamento.status || '-'}</p>
                    <p className="admin-shop-phone">Pagamento: {agendamento.pagamento_status || 'pendente'}</p>
                    <p className="admin-shop-phone">Valor: R$ {Number(agendamento.valor || 0).toFixed(2)}</p>

                    {!statusFinalizado && (
                      <div className="barber-appointment-actions">
                        <button
                          type="button"
                          className="barber-appointment-btn barber-appointment-btn-complete"
                          disabled={isProcessing}
                          onClick={() => {
                            void atualizarStatusAgendamento(agendamento.id, 'concluir');
                          }}
                        >
                          {isProcessing ? 'Processando...' : 'Concluir'}
                        </button>
                        <button
                          type="button"
                          className="barber-appointment-btn barber-appointment-btn-cancel"
                          disabled={isProcessing}
                          onClick={() => {
                            void atualizarStatusAgendamento(agendamento.id, 'cancelar');
                          }}
                        >
                          {isProcessing ? 'Processando...' : 'Cancelar'}
                        </button>
                      </div>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>
    </>
  );
}
