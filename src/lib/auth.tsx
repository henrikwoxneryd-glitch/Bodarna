import { useState } from 'react';
import { useAuth } from '../lib/auth';

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<'admin' | 'booth_staff'>('booth_staff');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { signIn, signUp } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        await signIn(email, password);
      } else {
        await signUp(email, password, fullName, role);
        setIsLogin(true);
        setError('Konto skapat! Logga in nu.');
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Ett fel uppstod');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1>{isLogin ? 'Logga In' : 'Skapa Konto'}</h1>
        <p>Julmarknad App</p>

        {error && (
          <div className={error.includes('skapat') ? 'success-message' : 'error-message'}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <>
              <div className="form-group">
                <label>Fullständigt Namn</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Roll</label>
                <select value={role} onChange={(e) => setRole(e.target.value as 'admin' | 'booth_staff')}>
                  <option value="booth_staff">Bodpersonal</option>
                  <option value="admin">Huvudansvarig</option>
                </select>
              </div>
            </>
          )}

          <div className="form-group">
            <label>E-post</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Lösenord</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="btn" disabled={loading}>
            {loading ? 'Laddar...' : (isLogin ? 'Logga In' : 'Skapa Konto')}
          </button>

          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => {
              setIsLogin(!isLogin);
              setError('');
            }}
          >
            {isLogin ? 'Skapa nytt konto' : 'Har redan konto'}
          </button>
        </form>
      </div>
    </div>
  );
}