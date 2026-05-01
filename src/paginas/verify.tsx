import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../server/api";
import "./css/Verify.css";
import { UserSummary } from "../types/domain";

export default function Verify() {
  const navigate = useNavigate();
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);
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

  const email = localStorage.getItem("verifyEmail");

  function handleChange(value: string, index: number) {
    if (!/^[0-9]?$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    if (value && index < 5) {
      inputs.current[index + 1]?.focus();
    }
  }

  function handleBackspace(e: React.KeyboardEvent, index: number) {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  }

  async function handleSubmit() {
    setErro("");

    const finalCode = code.join("");

    if (finalCode.length !== 6) {
      setErro("Digite o código completo.");
      return;
    }

    try {
      setCarregando(true);

      await api.verifyUser({
        email,
        code: finalCode,
      });
      localStorage.removeItem("verifyEmail");
      navigate(getRedirectPathForUser(JSON.parse(localStorage.getItem('usuario') || '{}')));

    } catch (err) {
      setErro("Código inválido ou expirado.");
    } finally {
      setCarregando(false);
    }
  }

  async function handleResend() {
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
              maxLength={1}
              disabled={carregando}
            />
          ))}
        </div>

        {erro && <span className="verify-error">{erro}</span>}

        <button onClick={handleSubmit} disabled={carregando}>
          {carregando ? "Verificando..." : "Verificar"}
        </button>

        <span className="verify-resend">
          Não recebeu?{" "}
          <button onClick={handleResend} disabled={carregando}>
            Reenviar
          </button>
        </span>
      </div>
    </div>
  );
}