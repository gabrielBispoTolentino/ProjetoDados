import { useEffect, useState } from 'react';
import type { ChangeEvent, DragEvent, FormEvent } from 'react';
import { api } from '../../server/api';
import type { UserSummary } from '../types/domain';
import { useFeedback } from './FeedbackProvider';

type ProfileEditorModalProps = {
  user: UserSummary;
  isOpen: boolean;
  onClose: () => void;
  onSaved: (user: UserSummary) => void;
};

type ProfileFormData = {
  nome: string;
  email: string;
  telefone: string;
  senha: string;
  confirmarSenha: string;
  cnpj: string;
};

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;

function buildFormFromUser(user: UserSummary): ProfileFormData {
  return {
    nome: user.nome || '',
    email: user.email || '',
    telefone: user.telefone || '',
    senha: '',
    confirmarSenha: '',
    cnpj: user.cnpj || '',
  };
}

export default function ProfileEditorModal({
  user,
  isOpen,
  onClose,
  onSaved,
}: ProfileEditorModalProps) {
  const feedback = useFeedback();
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [profilePhoto, setProfilePhoto] = useState<File | null>(null);
  const [profilePreviewUrl, setProfilePreviewUrl] = useState<string | null>(null);
  const [avatarLoadFailed, setAvatarLoadFailed] = useState(false);
  const [isDraggingPhoto, setIsDraggingPhoto] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserSummary>(user);
  const [profileForm, setProfileForm] = useState<ProfileFormData>(() => buildFormFromUser(user));

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    let cancelled = false;

    async function loadUser() {
      setLoadingProfile(true);
      setProfileError('');
      setProfilePhoto(null);
      setProfilePreviewUrl(null);

      try {
        const freshUser = await api.getUserById(user.id);

        if (cancelled) {
          return;
        }

        setCurrentUser(freshUser);
        setProfileForm(buildFormFromUser(freshUser));
      } catch (caughtError) {
        if (cancelled) {
          return;
        }

        const message = caughtError instanceof Error ? caughtError.message : 'Erro ao carregar perfil';
        setCurrentUser(user);
        setProfileForm(buildFormFromUser(user));
        setProfileError(message);
      } finally {
        if (!cancelled) {
          setLoadingProfile(false);
        }
      }
    }

    void loadUser();

    return () => {
      cancelled = true;
    };
  }, [isOpen, user]);

  useEffect(() => {
    if (isOpen) {
      setAvatarLoadFailed(false);
    }
  }, [isOpen, currentUser.fotoUrl, currentUser.foto_url, currentUser.imagem_url, profilePreviewUrl]);

  if (!isOpen) {
    return null;
  }

  const isBarber = currentUser.userTable === 'usuarioBarber';
  const isAdmin = currentUser.role === 'ADM_Estabelecimento';
  const photoUrl = api.getPhotoUrl(currentUser.fotoUrl || currentUser.foto_url || currentUser.imagem_url) || null;
  const displayedPhotoUrl = profilePreviewUrl || photoUrl;

  function handleProfileChange(event: ChangeEvent<HTMLInputElement>) {
    const { name, value } = event.target;
    setProfileForm((currentForm) => ({
      ...currentForm,
      [name]: value,
    }));
  }

  function handleProfilePhotoChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    processSelectedPhoto(file);
  }

  function processSelectedPhoto(file: File) {
    setIsDraggingPhoto(false);

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      setProfileError('Selecione uma imagem valida em JPEG, PNG, GIF ou WebP.');
      return;
    }

    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      setProfileError('A imagem deve ter no maximo 5MB.');
      return;
    }

    setProfileError('');
    setProfilePhoto(file);

    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result;
      setProfilePreviewUrl(typeof result === 'string' ? result : null);
    };
    reader.readAsDataURL(file);
  }

  function handlePhotoDragOver(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    if (!savingProfile && !loadingProfile) {
      setIsDraggingPhoto(true);
    }
  }

  function handlePhotoDragLeave(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    if (event.currentTarget.contains(event.relatedTarget as Node | null)) {
      return;
    }

    setIsDraggingPhoto(false);
  }

  function handlePhotoDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();

    if (savingProfile || loadingProfile) {
      setIsDraggingPhoto(false);
      return;
    }

    const file = event.dataTransfer.files?.[0];
    if (!file) {
      setIsDraggingPhoto(false);
      return;
    }

    processSelectedPhoto(file);
  }

  async function handleProfileSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setProfileError('');

    if (profileForm.senha && profileForm.senha !== profileForm.confirmarSenha) {
      setProfileError('A confirmacao de senha nao confere.');
      return;
    }

    const formData = new FormData();
    formData.append('nome', profileForm.nome.trim());
    formData.append('email', profileForm.email.trim());
    formData.append('telefone', profileForm.telefone.trim());

    if (isAdmin) {
      formData.append('cnpj', profileForm.cnpj.trim());
    }

    if (profileForm.senha.trim()) {
      formData.append('senha', profileForm.senha.trim());
    }

    if (profilePhoto) {
      formData.append('foto', profilePhoto);
    }

    setSavingProfile(true);

    try {
      const response = await api.updateUserWithPhoto(currentUser.id, formData);
      const nextPhotoUrl = response.fotoUrl ?? currentUser.fotoUrl ?? currentUser.foto_url ?? currentUser.imagem_url ?? null;
      const updatedUser: UserSummary = {
        ...currentUser,
        nome: profileForm.nome.trim() || currentUser.nome,
        email: profileForm.email.trim() || currentUser.email,
        telefone: profileForm.telefone.trim() || currentUser.telefone,
        cnpj: isAdmin ? profileForm.cnpj.trim() || null : currentUser.cnpj ?? null,
        fotoUrl: nextPhotoUrl,
        foto_url: nextPhotoUrl,
        imagem_url: nextPhotoUrl,
      };

      setCurrentUser(updatedUser);
      onSaved(updatedUser);
      onClose();
      feedback.success('Perfil atualizado com sucesso!');
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : 'Erro ao atualizar perfil';
      setProfileError(message);
      feedback.error(message);
    } finally {
      setSavingProfile(false);
    }
  }

  return (
    <div
      className="user-profile-backdrop"
      onClick={() => {
        if (!savingProfile) {
          onClose();
        }
      }}
    >
      <div
        className="user-profile-modal"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          className="user-profile-close"
          onClick={onClose}
          disabled={savingProfile}
        >
          x
        </button>
        <h2>Editar Perfil</h2>
        <p className="user-profile-subtitle">Atualize sua foto, dados de acesso e contato.</p>

        {profileError && <div className="user-profile-error">{profileError}</div>}

        <form className="user-profile-form" onSubmit={handleProfileSubmit}>
          <div
            className={`user-profile-photo-section ${isDraggingPhoto ? 'is-dragging' : ''}`}
            onDragOver={handlePhotoDragOver}
            onDragLeave={handlePhotoDragLeave}
            onDrop={handlePhotoDrop}
          >
            <div className="user-profile-photo-preview">
              {displayedPhotoUrl && !avatarLoadFailed ? (
                <img
                  src={displayedPhotoUrl}
                  alt={currentUser.nome}
                  onError={() => setAvatarLoadFailed(true)}
                />
              ) : (
                <svg
                  width="40"
                  height="40"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              )}
            </div>

            <div className="user-profile-photo-copy">
              <strong>Foto do perfil</strong>
              <span>JPEG, PNG, GIF ou WebP ate 5MB.</span>
              <span>Arraste uma imagem aqui ou selecione um arquivo.</span>
            </div>

            <label htmlFor="profile-foto" className="user-profile-photo-button">
              {profilePreviewUrl ? 'Trocar foto' : 'Enviar foto'}
            </label>
            <input
              id="profile-foto"
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
              onChange={handleProfilePhotoChange}
              disabled={savingProfile || loadingProfile}
              hidden
            />
          </div>

          <label htmlFor="profile-nome">Nome</label>
          <input
            id="profile-nome"
            type="text"
            name="nome"
            value={profileForm.nome}
            onChange={handleProfileChange}
            disabled={savingProfile || loadingProfile}
            required
          />

          <label htmlFor="profile-email">Email</label>
          <input
            id="profile-email"
            type="email"
            name="email"
            value={profileForm.email}
            onChange={handleProfileChange}
            disabled={savingProfile || loadingProfile}
            required
          />

          <label htmlFor="profile-telefone">Telefone</label>
          <input
            id="profile-telefone"
            type="tel"
            name="telefone"
            value={profileForm.telefone}
            onChange={handleProfileChange}
            disabled={savingProfile || loadingProfile}
            required
          />

          {isAdmin && (
            <>
              <label htmlFor="profile-cnpj">CNPJ</label>
              <input
                id="profile-cnpj"
                type="text"
                name="cnpj"
                value={profileForm.cnpj}
                onChange={handleProfileChange}
                disabled={savingProfile || loadingProfile}
                required
              />
            </>
          )}

          {isBarber && (
            <>
              <label htmlFor="profile-verifycode">Codigo de verificacao</label>
              <input
                id="profile-verifycode"
                type="text"
                value={currentUser.verifycode || 'Nao disponivel'}
                disabled
                readOnly
              />
              <p className="user-profile-note">Esse codigo e gerado pela barbearia e nao pode ser alterado.</p>

              <label htmlFor="profile-verified">Status do parceiro</label>
              <input
                id="profile-verified"
                type="text"
                value={currentUser.verified ? 'Verificado' : 'Pendente de verificacao'}
                disabled
                readOnly
              />
            </>
          )}

          <label htmlFor="profile-senha">Nova senha</label>
          <input
            id="profile-senha"
            type="password"
            name="senha"
            value={profileForm.senha}
            onChange={handleProfileChange}
            disabled={savingProfile || loadingProfile}
            placeholder="Deixe em branco para manter a atual"
          />

          <label htmlFor="profile-confirmar-senha">Confirmar nova senha</label>
          <input
            id="profile-confirmar-senha"
            type="password"
            name="confirmarSenha"
            value={profileForm.confirmarSenha}
            onChange={handleProfileChange}
            disabled={savingProfile || loadingProfile}
            placeholder="Repita a nova senha"
          />

          <div className="user-profile-actions">
            <button type="submit" disabled={savingProfile || loadingProfile}>
              {loadingProfile ? 'Carregando...' : savingProfile ? 'Salvando...' : 'Salvar Alteracoes'}
            </button>
            <button
              type="button"
              className="user-profile-cancel"
              onClick={onClose}
              disabled={savingProfile}
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
