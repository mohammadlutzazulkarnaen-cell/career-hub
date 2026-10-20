import { useState } from 'react'

function Register({ onBack, onRegister }) {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [phone, setPhone] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()
    setMessage('')

    const passwordValid =
      password.length >= 6 &&
      /[A-Za-z]/.test(password) &&
      /\d/.test(password)

    if (!passwordValid) {
      setMessage(
        'Password minimal 6 karakter dan harus mengandung huruf serta angka.'
      )
      return
    }

    setLoading(true)

    try {
      const response = await fetch(
        'http://localhost:5057/api/auth/register',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            fullName,
            email,
            password,
            phone,
          }),
        }
      )

      const data = await response.json()

      if (!response.ok) {
        setMessage(
          data.message ||
          'Data belum valid. Periksa kembali isianmu.'
        )
        setLoading(false)
        return
      }

      setMessage(
        'Registrasi berhasil. Silakan login menggunakan akunmu.'
      )

      if (onRegister) {
        onRegister()
      }
    } catch {
      setMessage('Backend belum aktif.')
    }

    setLoading(false)
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <button className="back-button" onClick={onBack}>
          ← Kembali
        </button>

        <h1>
          Daftar di Career<span>Hub</span>
        </h1>

        <p className="auth-subtitle">
          Buat akun untuk mulai mencari pekerjaan.
        </p>

        <form onSubmit={handleSubmit}>
          <label>Nama lengkap</label>
          <input
            type="text"
            placeholder="Masukkan nama lengkap"
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            required
          />

          <label>Email</label>
          <input
            type="email"
            placeholder="Masukkan email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />

          <label>Password</label>
          <input
            type="password"
            placeholder="Minimal 6 karakter, huruf dan angka"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />

          <label>Nomor telepon</label>
          <input
            type="text"
            placeholder="Opsional"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
          />

          <button
            className="auth-submit"
            type="submit"
            disabled={loading}
          >
            {loading ? 'Mendaftarkan...' : 'Daftar'}
          </button>
        </form>

        {message && <p className="auth-message">{message}</p>}
      </div>
    </div>
  )
}

export default Register