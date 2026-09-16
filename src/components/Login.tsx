import { useState } from 'react';
import { members, Member } from '../types';

interface LoginProps {
  onLogin: (user: Member) => void;
}

function Login({ onLogin }: LoginProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Simulate loading
    await new Promise(resolve => setTimeout(resolve, 500));

    const normalizedInput = username.toLowerCase().trim();
    
    const user = members.find(m => {
      // So sánh với id (không dấu, không dấu cách)
      const matchId = m.id.toLowerCase() === normalizedInput;
      // Hoặc so sánh với tên (loại bỏ dấu)
      const normalizedName = m.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '');
      const matchName = normalizedName === normalizedInput;
      
      return (matchId || matchName) && m.password === password;
    });

    if (user) {
      onLogin(user);
    } else {
      setError('Tên đăng nhập hoặc mật khẩu không đúng!');
    }
    setIsLoading(false);
  };

  return (
    <div className="login-container">
      <div className="login-card fade-in">
        <div className="login-header">
          <h1>Đăng Ký Slot Lân</h1>
          <p>Trung Thu 2026</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="username">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
              Tên đăng nhập
            </label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Nhập tên đăng nhập"
              autoComplete="username"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
              Mật khẩu
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Nhập mật khẩu"
              autoComplete="current-password"
              required
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <button type="submit" className="login-button" disabled={isLoading}>
            {isLoading ? (
              <span className="loading-spinner"></span>
            ) : (
              <>
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
                  <polyline points="10,17 15,12 10,7"/>
                  <line x1="15" y1="12" x2="3" y2="12"/>
                </svg>
                Đăng Nhập
              </>
            )}
          </button>
        </form>

        <div className="login-footer">
          <div className="account-guide">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
              <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
            <span>Hướng dẫn đăng nhập</span>
          </div>
          <p className="login-hint">Dùng <strong>tên thành viên</strong> làm tài khoản và <strong>mật khẩu mặc định</strong> là: <code>123</code></p>
        </div>
      </div>

      <style>{`
        .login-container {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          position: relative;
          overflow: hidden;
          background: var(--bg-main);
        }

        .login-card {
          background: var(--bg-card);
          border-radius: 24px;
          padding: 40px;
          width: 100%;
          max-width: 420px;
          box-shadow: 0 20px 60px var(--shadow);
          border: 1px solid var(--border);
          position: relative;
          z-index: 1;
        }

        .login-header {
          text-align: center;
          margin-bottom: 32px;
        }

        .login-header h1 {
          font-size: 1.8rem;
          color: var(--primary);
          margin-bottom: 8px;
          font-family: 'Cinzel', 'Segoe UI', sans-serif;
          font-weight: 700;
          letter-spacing: 2px;
          text-shadow: 0 2px 10px rgba(212, 175, 55, 0.3);
        }

        .login-header p {
          color: var(--text-muted);
          font-size: 1rem;
          font-family: 'Quicksand', 'Segoe UI', sans-serif;
          font-weight: 500;
        }

        .login-form {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .form-group label {
          display: flex;
          align-items: center;
          gap: 8px;
          font-weight: 600;
          color: var(--text-light);
          font-size: 0.9rem;
        }

        .form-group label svg {
          color: var(--primary);
        }

        .form-group input {
          padding: 14px 16px;
          border: 2px solid var(--border);
          border-radius: 12px;
          background: var(--bg-dark);
          color: var(--text-light);
          font-size: 1rem;
          font-family: 'Quicksand', sans-serif;
          transition: all 0.3s ease;
        }

        .form-group input:focus {
          outline: none;
          border-color: var(--primary);
          box-shadow: 0 0 0 4px rgba(212, 175, 55, 0.2);
        }

        .form-group input::placeholder {
          color: var(--text-muted);
        }

        .error-message {
          background: rgba(244, 67, 54, 0.1);
          border: 1px solid var(--error);
          color: var(--error);
          padding: 12px 16px;
          border-radius: 8px;
          font-size: 0.9rem;
          text-align: center;
        }

        .login-button {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          padding: 16px 24px;
          background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%);
          color: #1a1a2e;
          border: none;
          border-radius: 12px;
          font-size: 1.1rem;
          font-weight: 700;
          font-family: 'Cinzel', 'Segoe UI', sans-serif;
          letter-spacing: 2px;
          text-transform: none;
          cursor: pointer;
          transition: all 0.3s ease;
          margin-top: 8px;
        }

        .login-button:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 10px 30px rgba(212, 175, 55, 0.4);
        }

        .login-button:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .loading-spinner {
          width: 20px;
          height: 20px;
          border: 3px solid transparent;
          border-top-color: currentColor;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .login-footer {
          margin-top: 24px;
          padding-top: 24px;
          border-top: 1px solid var(--border);
          text-align: center;
        }

        .account-guide {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          color: var(--primary);
          font-weight: 600;
          margin-bottom: 12px;
        }

        .login-hint {
          color: var(--text-muted);
          font-size: 0.85rem;
          margin-bottom: 16px;
        }

        .login-hint strong {
          color: var(--primary);
        }

        .login-hint code {
          background: var(--bg-dark);
          padding: 2px 8px;
          border-radius: 4px;
          color: var(--accent);
          font-family: monospace;
        }

        .member-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 8px;
          margin-bottom: 16px;
        }

        .member-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 10px 8px;
          background: var(--bg-dark);
          border: 1px solid var(--border);
          border-radius: 10px;
          transition: all 0.3s ease;
        }

        .member-card:hover {
          border-color: var(--primary);
          transform: translateY(-2px);
        }

        .member-name {
          font-weight: 700;
          color: var(--text-light);
          font-size: 0.9rem;
        }

        .member-id {
          font-size: 0.7rem;
          color: var(--text-muted);
          font-family: monospace;
        }

        .admin-hint {
          color: var(--text-muted);
          font-size: 0.8rem;
          padding: 10px;
          background: rgba(212, 175, 55, 0.1);
          border-radius: 8px;
        }

        .admin-hint code {
          background: var(--bg-dark);
          padding: 2px 8px;
          border-radius: 4px;
          color: var(--primary);
          font-family: monospace;
        }

        @media (max-width: 600px) {
          .member-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }

        @media (max-width: 400px) {
          .member-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        .loading-screen {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 20px;
          color: var(--text-muted);
        }

        .loading-lan {
          color: var(--primary);
        }

        @media (max-width: 480px) {
          .login-card {
            padding: 24px;
          }

          .login-header h1 {
            font-size: 1.5rem;
          }
        }
      `}</style>
    </div>
  );
}

export default Login;
