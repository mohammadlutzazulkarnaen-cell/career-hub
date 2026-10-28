import { useState } from 'react'

const API_URL = 'http://localhost:5057'

function Login({ onBack, onLogin, onRegister }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  async function handleSubmit(event) {
    event.preventDefault()
    setMessage('')

    try {
      setLoading(true)

      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data.message || 'Email atau password salah.'
        )
      }

      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))

      onLogin(data.user)
    } catch (error) {
      setMessage(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="auth-page">
      <div className="auth-card">
        <button className="back-button" onClick={onBack}>
          ← Kembali
        </button>

        <p className="eyebrow">SELAMAT DATANG KEMBALI</p>

        <h1>Masuk ke CareerHub</h1>

        <p className="auth-subtitle">
          Masuk untuk melamar dan menyimpan lowongan.
        </p>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label htmlFor="login-email">Email</label>

          <input
            id="login-email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="Masukkan email"
            required
          />

          <label htmlFor="login-password">Password</label>

          <div className="password-input-wrap">
            <input
              id="login-password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(event) =>
                setPassword(event.target.value)
              }
              placeholder="Masukkan password"
              required
            />

            <button
              type="button"
              className="password-toggle"
              onClick={() =>
                setShowPassword((value) => !value)
              }
            >
              {showPassword ? '🙈' : '👁️'}
            </button>
          </div>

          <button
            className="auth-submit"
            type="submit"
            disabled={loading}
          >
            {loading ? 'Memproses...' : 'Masuk'}
          </button>
        </form>

        {message && (
          <p className="auth-message">
            {message}
          </p>
        )}

        <p className="auth-switch">
          Belum punya akun?{' '}
          <button type="button" onClick={onRegister}>
            Daftar sekarang
          </button>
        </p>
      </div>
    </main>
  )
}

export default Login