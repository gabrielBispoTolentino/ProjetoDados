import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../server/api";
import "./css/Verify.css";
import { UserSummary } from "../types/domain";

export default function Verify() {
  const navigate = useNavigate();
  const [usuario, setUsuario] = useState<UserSummary | null>(null);
  const [code, setCode] = useState(["", "", "", "", "", "", "", ""]);
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);

  useEffect(() => {
    const storedUsuario = localStorage.getItem('usuario');
    if (!storedUsuario) {
      navigate('/cadastro');
      return;
    }

    try {
      setUsuario(JSON.parse(storedUsuario));
    } catch {
      localStorage.removeItem('usuario');
      navigate('/cadastro');
    }
  }, [navigate]);

  function getRedirectPathForUser(usuario: UserSummary) {
    if (usuario.userTable === 'usuarioBarber') {
      return '/barber-painel';
    }

    if (usuario.role === 'ADM_Estabelecimento') {
      return '/painel-admin';
    }

    return '/painel';
  }

  const inputs = useRef<HTMLInputElement[]>([]);
  const email = usuario?.email ?? localStorage.getItem('verifyEmail');

  function handleChange(value: string, index: number) {
    const newCode = [...code];
    newCode[index] = value.toUpperCase();
    setCode(newCode);

    if (value && index < 7) {
      inputs.current[index + 1]?.focus();
    }
  }

  function handlePaste(e: React.ClipboardEvent<HTMLInputElement>, index: number) {
    e.preventDefault();
    const pastedText = e.clipboardData.getData('text').toUpperCase();
    const newCode = [...code];
    
    for (let i = 0; i < pastedText.length && index + i < 8; i++) {
      newCode[index + i] = pastedText[i];
    }
    
    setCode(newCode);
    
    const lastFilledIndex = Math.min(index + pastedText.length - 1, 7);
    if (lastFilledIndex < 7) {
      setTimeout(() => inputs.current[lastFilledIndex + 1]?.focus(), 0);
    }
  }

  function handleBackspace(e: React.KeyboardEvent, index: number) {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  }

  async function handleSubmit() {
    setErro("");

    if (!email) {
      setErro('Email de verificacao nao encontrado. Por favor, reinicie o cadastro.');
      return;
    }

    const finalCode = code.join("");

    if (finalCode.length !== 8) {
      setErro("Digite o código completo (8 caracteres).");
      return;
    }

    try {
      setCarregando(true);

      await api.verifyUser({
        email,
        code: finalCode,
      });
      localStorage.removeItem("verifyEmail");
      navigate(usuario ? getRedirectPathForUser(usuario) : '/login');
    } catch (err) {
      setErro("Código inválido ou expirado.");
    } finally {
      setCarregando(false);
    }
  }

  async function handleResend() {
    if (!email) {
      setErro('Email de verificacao nao encontrado. Por favor, reinicie o cadastro.');
      return;
    }

    try {
      await api.resendVerifyCode({ email });
      setErro("Código reenviado!");
    } catch {
      setErro("Erro ao reenviar código.");
    }
  }

  return (
    <div className="verify-container">
      <div className="verify-card">
        <h2>Verificação</h2>
        <p>Digite o código enviado para seu email</p>

        <div className="verify-inputs">
          {code.map((digit, i) => (
            <input
              key={i}
              ref={(el) => {
                if (el) inputs.current[i] = el;
              }}
              value={digit}
              onChange={(e) => handleChange(e.target.value, i)}
              onKeyDown={(e) => handleBackspace(e, i)}
              onPaste={(e) => handlePaste(e, i)}
              maxLength={1}
              disabled={carregando}

            />
          ))}
        </div>

        {erro && <div className="verify-error">{erro}</div>}

        <button className="verify-btn" onClick={handleSubmit} disabled={carregando}>
          {carregando ? "Verificando..." : "Verificar"}
        </button>

        <span className="verify-resend">
          Não recebeu?{" "}
          <button onClick={handleResend} disabled={carregando}>
            Reenviar
          </button>
        </span>

        <button className="verify-back-btn" type="button" onClick={() => navigate('/login')} disabled={carregando}>
          &larr; Voltar para Login
        </button>
      </div>
    </div>
  );
}