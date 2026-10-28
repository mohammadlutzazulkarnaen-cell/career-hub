import { useEffect, useState } from 'react'

const API_URL = 'http://localhost:5057'

function Profile({ onBack, onUpdateUser }) {
  const token = localStorage.getItem('token')

  const [profile, setProfile] = useState(null)
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [selectedFile, setSelectedFile] = useState(null)

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [showCurrentPassword, setShowCurrentPassword] =
    useState(false)
  const [showNewPassword, setShowNewPassword] =
    useState(false)

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [changingPassword, setChangingPassword] =
    useState(false)

  const [message, setMessage] = useState('')
  const [passwordMessage, setPasswordMessage] =
    useState('')

  useEffect(() => {
    if (!token) {
      return
    }

    let active = true

    fetch(`${API_URL}/api/user/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then(async (response) => {
        const data = await response.json()

        if (!response.ok) {
          throw new Error(
            data.message || 'Gagal mengambil profil.'
          )
        }

        if (active) {
          setProfile(data)
          setFullName(data.fullName || '')
          setPhone(data.phone || '')
        }
      })
      .catch((error) => {
        if (active) {
          setMessage(error.message)
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false)
        }
      })

    return () => {
      active = false
    }
  }, [token])

  async function handleSubmit(event) {
    event.preventDefault()
    setMessage('')

    try {
      setSaving(true)

      const response = await fetch(`${API_URL}/api/user/update`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          fullName: fullName.trim(),
          phone: phone.trim(),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data.message || 'Gagal memperbarui profil.'
        )
      }

      const updatedUser = {
        ...profile,
        ...data.user,
        fullName: fullName.trim(),
        phone: phone.trim(),
      }

      setProfile(updatedUser)
      localStorage.setItem(
        'user',
        JSON.stringify(updatedUser)
      )
      onUpdateUser?.(updatedUser)
      setMessage('Profil berhasil diperbarui.')
    } catch (error) {
      setMessage(error.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleUpload(event) {
    event.preventDefault()
    setMessage('')

    if (!selectedFile) {
      setMessage('Pilih foto terlebih dahulu.')
      return
    }

    const formData = new FormData()
    formData.append('file', selectedFile)

    try {
      setUploading(true)

      const response = await fetch(
        `${API_URL}/api/user/profile-picture`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data.message || 'Gagal mengunggah foto.'
        )
      }

      const updatedUser = {
        ...profile,
        profilePicture: data.profilePicture,
      }

      setProfile(updatedUser)
      localStorage.setItem(
        'user',
        JSON.stringify(updatedUser)
      )
      onUpdateUser?.(updatedUser)
      setSelectedFile(null)
      setMessage('Foto profil berhasil diperbarui.')
    } catch (error) {
      setMessage(error.message)
    } finally {
      setUploading(false)
    }
  }

  async function handleChangePassword(event) {
    event.preventDefault()
    setPasswordMessage('')

    if (!currentPassword || !newPassword) {
      setPasswordMessage(
        'Password lama dan password baru wajib diisi.'
      )
      return
    }

    if (
      newPassword.length < 6 ||
      !/[A-Za-z]/.test(newPassword) ||
      !/\d/.test(newPassword)
    ) {
      setPasswordMessage(
        'Password baru minimal 6 karakter dan harus mengandung huruf serta angka.'
      )
      return
    }

    try {
      setChangingPassword(true)

      const response = await fetch(
        `${API_URL}/api/user/change-password`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            currentPassword,
            newPassword,
          }),
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data.message || 'Gagal mengubah password.'
        )
      }

      setCurrentPassword('')
      setNewPassword('')
      setPasswordMessage(
        'Password berhasil diubah.'
      )
    } catch (error) {
      setPasswordMessage(error.message)
    } finally {
      setChangingPassword(false)
    }
  }

  if (!token) {
    return (
      <main className="auth-page">
        <div className="auth-card">
          <button className="back-button" onClick={onBack}>
            ← Kembali
          </button>

          <h1>Profil Saya</h1>
          <p>Silakan login terlebih dahulu.</p>
        </div>
      </main>
    )
  }

  if (loading) {
    return (
      <main className="auth-page">
        <div className="auth-card">
          <p>Memuat profil...</p>
        </div>
      </main>
    )
  }

  const avatarUrl = profile?.profilePicture
    ? profile.profilePicture.startsWith('http')
      ? profile.profilePicture
      : `${API_URL}${profile.profilePicture}`
    : null

  const initial =
    profile?.fullName?.charAt(0).toUpperCase() || 'U'

  return (
    <main className="profile-page">
      <button className="back-button" onClick={onBack}>
        ← Kembali
      </button>

      <div className="profile-card">
        <div className="profile-header">
          <p className="eyebrow">AKUN KAMU</p>
          <h1>Profil Saya</h1>
        </div>

        <div className="profile-avatar-large">
          {avatarUrl ? (
            <img src={avatarUrl} alt="Foto profil" />
          ) : (
            initial
          )}
        </div>

        <form className="photo-form" onSubmit={handleUpload}>
          <label htmlFor="profile-photo">
            Foto profil
          </label>

          <input
            id="profile-photo"
            type="file"
            accept=".jpg,.jpeg,.png,.webp"
            onChange={(event) =>
              setSelectedFile(event.target.files[0])
            }
          />

          <button
            className="photo-submit"
            type="submit"
            disabled={uploading}
          >
            {uploading ? 'Mengunggah...' : 'Unggah Foto'}
          </button>
        </form>

        <form className="profile-form" onSubmit={handleSubmit}>
          <label htmlFor="email">Email</label>

          <input
            id="email"
            type="email"
            value={profile?.email || ''}
            disabled
          />

          <label htmlFor="fullName">
            Nama lengkap
          </label>

          <input
            id="fullName"
            type="text"
            value={fullName}
            onChange={(event) =>
              setFullName(event.target.value)
            }
            required
          />

          <label htmlFor="phone">
            Nomor telepon
          </label>

          <input
            id="phone"
            type="text"
            value={phone}
            onChange={(event) =>
              setPhone(event.target.value)
            }
          />

          <button
            className="auth-submit"
            type="submit"
            disabled={saving}
          >
            {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
          </button>
        </form>

        {message && (
          <p className="auth-message">
            {message}
          </p>
        )}

        <form
          className="password-form"
          onSubmit={handleChangePassword}
        >
          <h2>Ubah Password</h2>

          <label htmlFor="currentPassword">
            Password lama
          </label>

          <div className="password-input-wrap">
            <input
              id="currentPassword"
              type={
                showCurrentPassword ? 'text' : 'password'
              }
              value={currentPassword}
              onChange={(event) =>
                setCurrentPassword(event.target.value)
              }
              placeholder="Masukkan password lama"
              required
            />

            <button
              type="button"
              className="password-toggle"
              onClick={() =>
                setShowCurrentPassword(
                  (value) => !value
                )
              }
            >
              {showCurrentPassword ? '🙈' : '👁️'}
            </button>
          </div>

          <label htmlFor="newPassword">
            Password baru
          </label>

          <div className="password-input-wrap">
            <input
              id="newPassword"
              type={showNewPassword ? 'text' : 'password'}
              value={newPassword}
              onChange={(event) =>
                setNewPassword(event.target.value)
              }
              placeholder="Minimal 6 karakter, huruf dan angka"
              required
            />

            <button
              type="button"
              className="password-toggle"
              onClick={() =>
                setShowNewPassword(
                  (value) => !value
                )
              }
            >
              {showNewPassword ? '🙈' : '👁️'}
            </button>
          </div>

          <button
            className="auth-submit"
            type="submit"
            disabled={changingPassword}
          >
            {changingPassword
              ? 'Mengubah...'
              : 'Ubah Password'}
          </button>

          {passwordMessage && (
            <p className="auth-message">
              {passwordMessage}
            </p>
          )}
        </form>
      </div>
    </main>
  )
}

export default Profile