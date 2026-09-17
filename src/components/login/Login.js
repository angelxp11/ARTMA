import { useState } from 'react';
import './Login.css';

const Login = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (event) => {
    event.preventDefault();

    if (onLogin) {
      onLogin(email, password);
    }
  };

  return (
    <section className="login-section">
      <div className="login-card">
        <p className="login-label">Bienvenido</p>
        <h2>Iniciar sesión</h2>

        <form className="login-form" onSubmit={handleSubmit}>
          <label>
            <span>Correo</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="correo@ejemplo.com"
            />
          </label>

          <label>
            <span>Contraseña</span>
            <div className="password-wrap">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
              <button
                type="button"
                className="toggle-password"
                onClick={() => setShowPassword((prev) => !prev)}
              >
                {showPassword ? 'Ocultar' : 'Mostrar'}
              </button>
            </div>
          </label>

          <button type="submit">Entrar</button>
        </form>
      </div>
    </section>
  );
};

export default Login;
