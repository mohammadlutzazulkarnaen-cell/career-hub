import { useEffect, useState } from 'react'

const API_URL = 'http://localhost:5057'

function Profile({ onBack, onUpdateUser }) {
  const token = localStorage.getItem('token')

  const [profile, setProfile] = useState(null)
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [selectedFile, setSelectedFile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!token) {
      return
    }

    const loadProfile = async () => {
      try {
        const response = await fetch(
          `${API_URL}/api/user/me`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        )

        const data = await response.json()

        if (!response.ok) {
          throw new Error(
            data.message || 'Gagal mengambil profil.'
          )
        }

        setProfile(data)
        setFullName(data.fullName || '')
        setPhone(data.phone || '')
      } catch (error) {
        setMessage(error.message)
      } finally {
        setLoading(false)
      }
    }

    loadProfile()
  }, [token])

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSaving(true)
    setMessage('')

    try {
      const response = await fetch(
        `${API_URL}/api/user/update`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            fullName,
            phone,
          }),
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data.message || 'Gagal memperbarui profil.'
        )
      }

      setProfile((currentProfile) => ({
        ...currentProfile,
        ...data.user,
      }))

      localStorage.setItem(
        'user',
        JSON.stringify(data.user)
      )

      if (onUpdateUser) {
        onUpdateUser(data.user)
      }

      setMessage('Profil berhasil diperbarui.')
    } catch (error) {
      setMessage(error.message)
    } finally {
      setSaving(false)
    }
  }

  const handleUpload = async (event) => {
    event.preventDefault()

    if (!selectedFile) {
      setMessage('Pilih foto terlebih dahulu.')
      return
    }

    setUploading(true)
    setMessage('')

    const formData = new FormData()
    formData.append('file', selectedFile)

    try {
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

      setProfile((currentProfile) => ({
        ...currentProfile,
        profilePicture: data.profilePicture,
      }))

      const savedUser = JSON.parse(
        localStorage.getItem('user') || '{}'
      )

      const updatedUser = {
        ...savedUser,
        profilePicture: data.profilePicture,
      }

      localStorage.setItem(
        'user',
        JSON.stringify(updatedUser)
      )

      if (onUpdateUser) {
        onUpdateUser(updatedUser)
      }

      setSelectedFile(null)
      setMessage('Foto profil berhasil diunggah.')
    } catch (error) {
      setMessage(error.message)
    } finally {
      setUploading(false)
    }
  }

  if (!token) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <button className="back-button" onClick={onBack}>
            ← Kembali
          </button>

          <p className="message">
            Silakan login terlebih dahulu.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="auth-page">
      <div className="auth-card profile-card">
        <button className="back-button" onClick={onBack}>
          ← Kembali
        </button>

        <p className="eyebrow">AKUN KAMU</p>

        <h1>Profil Saya</h1>

        {loading && (
          <p className="message">
            Memuat profil...
          </p>
        )}

        {!loading && profile && (
          <>
            <div className="profile-avatar-large">
              {profile.profilePicture ? (
                <img
                  src={`${API_URL}${profile.profilePicture}`}
                  alt="Foto profil"
                />
              ) : (
                profile.fullName?.charAt(0).toUpperCase()
              )}
            </div>

            <form
              className="photo-form"
              onSubmit={handleUpload}
            >
              <label>Foto profil</label>

              <input
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
                {uploading
                  ? 'Mengunggah...'
                  : 'Upload Foto'}
              </button>
            </form>

            <form onSubmit={handleSubmit}>
              <label>Email</label>

              <input
                type="email"
                value={profile.email}
                disabled
              />

              <label>Nama lengkap</label>

              <input
                type="text"
                value={fullName}
                onChange={(event) =>
                  setFullName(event.target.value)
                }
                required
              />

              <label>Nomor telepon</label>

              <input
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
                {saving
                  ? 'Menyimpan...'
                  : 'Simpan Perubahan'}
              </button>
            </form>
          </>
        )}

        {message && (
          <p className="auth-message">
            {message}
          </p>
        )}
      </div>
    </div>
  )
}

export default Profile