import { useState } from 'react'

const API_URL = 'http://localhost:5057'

function Register({ onBack, onLogin }) {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  async function handleSubmit(event) {
    event.preventDefault()
    setMessage('')

    if (
      password.length < 6 ||
      !/[A-Za-z]/.test(password) ||
      !/\d/.test(password)
    ) {
      setMessage(
        'Password minimal 6 karakter dan harus mengandung huruf serta angka.'
      )
      return
    }

    try {
      setLoading(true)

      const response = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fullName,
          email,
          phone,
          password,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data.message || 'Registrasi gagal.'
        )
      }

      alert(
        'Registrasi berhasil. Silakan login menggunakan akun kamu.'
      )

      onLogin()
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

        <p className="eyebrow">BUAT AKUN BARU</p>

        <h1>Daftar di CareerHub</h1>

        <p className="auth-subtitle">
          Buat akun untuk mulai melamar pekerjaan.
        </p>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label htmlFor="register-name">
            Nama lengkap
          </label>

          <input
            id="register-name"
            type="text"
            value={fullName}
            onChange={(event) =>
              setFullName(event.target.value)
            }
            placeholder="Masukkan nama lengkap"
            required
          />

          <label htmlFor="register-email">Email</label>

          <input
            id="register-email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="Masukkan email"
            required
          />

          <label htmlFor="register-phone">
            Nomor telepon
          </label>

          <input
            id="register-phone"
            type="text"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            placeholder="Masukkan nomor telepon"
            required
          />

          <label htmlFor="register-password">
            Password
          </label>

          <div className="password-input-wrap">
            <input
              id="register-password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(event) =>
                setPassword(event.target.value)
              }
              placeholder="Minimal 6 karakter, huruf dan angka"
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
            {loading ? 'Mendaftarkan...' : 'Daftar'}
          </button>
        </form>

        {message && (
          <p className="auth-message">
            {message}
          </p>
        )}

        <p className="auth-switch">
          Sudah punya akun?{' '}
          <button type="button" onClick={onLogin}>
            Masuk sekarang
          </button>
        </p>
      </div>
    </main>
  )
}

export default Register