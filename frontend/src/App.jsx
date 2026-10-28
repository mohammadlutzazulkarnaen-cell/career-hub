import { useEffect, useState } from 'react'
import './App.css'

import Login from './Login'
import Register from './Register'
import Applications from './Applications'
import Bookmarks from './Bookmarks'
import JobDetail from './JobDetail'
import Profile from './Profile'
import AdminDashboard from './AdminDashboard'

const API_URL = 'http://localhost:5057'

function App() {
  const [page, setPage] = useState('home')
  const [jobs, setJobs] = useState([])
  const [selectedJob, setSelectedJob] = useState(null)

  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user')
    return savedUser ? JSON.parse(savedUser) : null
  })

  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('theme') === 'dark'
  })

  const [keywordInput, setKeywordInput] = useState('')
  const [locationInput, setLocationInput] = useState('')
  const [keyword, setKeyword] = useState('')
  const [location, setLocation] = useState('')
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')

  const [applyJob, setApplyJob] = useState(null)
  const [coverLetter, setCoverLetter] = useState('')
  const [cvFile, setCvFile] = useState(null)
  const [applyLoading, setApplyLoading] = useState(false)

  const isAdmin = Number(user?.roleId ?? user?.RoleId) === 2

  useEffect(() => {
    localStorage.setItem('theme', darkMode ? 'dark' : 'light')
  }, [darkMode])

  useEffect(() => {
    async function loadJobs() {
      try {
        const response = await fetch(`${API_URL}/api/jobs`)
        const data = await response.json()

        if (!response.ok) {
          throw new Error('Gagal mengambil lowongan.')
        }

        setJobs(data)
      } catch (error) {
        setMessage(error.message)
      } finally {
        setLoading(false)
      }
    }

    loadJobs()
  }, [])

  function handleSearch(event) {
    event.preventDefault()
    setKeyword(keywordInput.trim().toLowerCase())
    setLocation(locationInput.trim().toLowerCase())
  }

  function resetSearch() {
    setKeywordInput('')
    setLocationInput('')
    setKeyword('')
    setLocation('')
  }

  function handleLogin(loggedUser) {
    setUser(loggedUser)
    setPage('home')
  }

  function handleLogout() {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
    setPage('home')
  }

  function handleUserUpdate(updatedUser) {
    setUser(updatedUser)
    localStorage.setItem('user', JSON.stringify(updatedUser))
  }

  async function handleBookmark(job) {
    const token = localStorage.getItem('token')

    if (!token) {
      setPage('login')
      return
    }

    try {
      const response = await fetch(`${API_URL}/api/bookmarks/${job.jobId}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Gagal menyimpan lowongan.')
      }

      alert(data.message || 'Lowongan berhasil disimpan.')
    } catch (error) {
      alert(error.message)
    }
  }

  function openApplyModal(job) {
    const token = localStorage.getItem('token')

    if (!token) {
      setPage('login')
      return
    }

    setApplyJob(job)
    setCoverLetter('')
    setCvFile(null)
  }

  function closeApplyModal() {
    setApplyJob(null)
    setCoverLetter('')
    setCvFile(null)
  }

  async function submitApplication(event) {
    event.preventDefault()

    if (!coverLetter.trim()) {
      alert('Pesan lamaran wajib diisi.')
      return
    }

    if (!cvFile) {
      alert('CV wajib dilampirkan.')
      return
    }

    const token = localStorage.getItem('token')
    const formData = new FormData()

    formData.append('CoverLetter', coverLetter.trim())
    formData.append('CvFile', cvFile)

    try {
      setApplyLoading(true)

      const response = await fetch(
        `${API_URL}/api/jobs/${applyJob.jobId}/apply`,
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
        throw new Error(data.message || 'Gagal mengirim lamaran.')
      }

      alert('Lamaran dan CV berhasil dikirim.')
      closeApplyModal()
    } catch (error) {
      alert(error.message)
    } finally {
      setApplyLoading(false)
    }
  }

  const filteredJobs = jobs.filter((job) => {
    const text = [
      job.title,
      job.companyName,
      job.location,
      job.jobType,
    ]
      .join(' ')
      .toLowerCase()

    const keywordMatch = !keyword || text.includes(keyword)
    const locationMatch =
      !location || job.location?.toLowerCase().includes(location)

    return keywordMatch && locationMatch
  })

  const avatarUrl = user?.profilePicture
    ? user.profilePicture.startsWith('http')
      ? user.profilePicture
      : `${API_URL}${user.profilePicture}`
    : null

  if (page === 'login') {
    return (
      <div className={darkMode ? 'app dark' : 'app'}>
        <Login
          onBack={() => setPage('home')}
          onLogin={handleLogin}
          onRegister={() => setPage('register')}
        />
      </div>
    )
  }

  if (page === 'register') {
    return (
      <div className={darkMode ? 'app dark' : 'app'}>
        <Register
          onBack={() => setPage('home')}
          onLogin={() => setPage('login')}
        />
      </div>
    )
  }

  if (page === 'admin' && isAdmin) {
    return (
      <div className={darkMode ? 'app dark' : 'app'}>
        <AdminDashboard onBack={() => setPage('home')} />
      </div>
    )
  }

  if (page === 'applications') {
    return (
      <div className={darkMode ? 'app dark' : 'app'}>
        <Applications onBack={() => setPage('home')} />
      </div>
    )
  }

  if (page === 'bookmarks') {
    return (
      <div className={darkMode ? 'app dark' : 'app'}>
        <Bookmarks
          onBack={() => setPage('home')}
          onSelectJob={(job) => {
            setSelectedJob(job)
            setPage('detail')
          }}
        />
      </div>
    )
  }

  if (page === 'profile') {
    return (
      <div className={darkMode ? 'app dark' : 'app'}>
        <Profile
          onBack={() => setPage('home')}
          onUpdateUser={handleUserUpdate}
        />
      </div>
    )
  }

  if (page === 'detail' && selectedJob) {
    return (
      <div className={darkMode ? 'app dark' : 'app'}>
        <JobDetail
          job={selectedJob}
          onBack={() => setPage('home')}
          onApply={openApplyModal}
          onBookmark={handleBookmark}
        />
      </div>
    )
  }

  return (
    <div className={darkMode ? 'app dark' : 'app'}>
      <nav className="navbar">
        <button className="logo" onClick={() => setPage('home')}>
          Career<span>Hub</span>
        </button>

        <div className="nav-links">
          <button onClick={() => setPage('home')}>
            Cari Lowongan
          </button>

          <a href="#about">Tentang Kami</a>

          {isAdmin && (
            <button
              className="nav-page-button"
              onClick={() => setPage('admin')}
            >
              Dashboard Admin
            </button>
          )}

          {user ? (
            <>
              <button
                className="nav-page-button"
                onClick={() => setPage('applications')}
              >
                Lamaran Saya
              </button>

              <button
                className="nav-page-button"
                onClick={() => setPage('bookmarks')}
              >
                Bookmark Saya
              </button>

              <button
                className="theme-button"
                onClick={() => setDarkMode((value) => !value)}
              >
                {darkMode ? '☀️' : '🌙'}
              </button>

              <button className="logout-button" onClick={handleLogout}>
                Keluar
              </button>

              <button
                className="profile-avatar"
                onClick={() => setPage('profile')}
              >
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Foto profil" />
                ) : (
                  user.fullName?.charAt(0).toUpperCase() || 'U'
                )}
              </button>

              <span className="welcome-text">
                Halo, {user.fullName || 'Pengguna'}
              </span>
            </>
          ) : (
            <>
              <button
                className="login-button"
                onClick={() => setPage('login')}
              >
                Masuk
              </button>

              <button
                className="register-button"
                onClick={() => setPage('register')}
              >
                Daftar
              </button>

              <button
                className="theme-button"
                onClick={() => setDarkMode((value) => !value)}
              >
                {darkMode ? '☀️' : '🌙'}
              </button>
            </>
          )}
        </div>
      </nav>

      <main>
        <section className="hero-section">
          <div className="hero-content">
            <p className="eyebrow">TEMUKAN KARIER IMPIANMU</p>

            <h1>
              Temukan pekerjaan yang
              <span> cocok untukmu.</span>
            </h1>

            <p className="hero-text">
              Cari peluang kerja terbaik dari berbagai perusahaan terpercaya.
            </p>

            <form className="search-box" onSubmit={handleSearch}>
              <input
                value={keywordInput}
                onChange={(event) => setKeywordInput(event.target.value)}
                placeholder="Cari posisi atau perusahaan"
              />

              <input
                value={locationInput}
                onChange={(event) => setLocationInput(event.target.value)}
                placeholder="Lokasi"
              />

              <button type="submit">Cari Lowongan</button>
            </form>
          </div>
        </section>

        <section id="jobs" className="jobs-section">
          <div className="section-heading">
            <div>
              <p className="eyebrow">PELUANG TERBARU</p>
              <h2>Lowongan pekerjaan terbaru</h2>
            </div>

            {(keyword || location) && (
              <button className="reset-button" onClick={resetSearch}>
                Reset pencarian
              </button>
            )}
          </div>

          {message && <p className="error-message">{message}</p>}

          {loading ? (
            <p className="empty-message">Memuat lowongan...</p>
          ) : filteredJobs.length === 0 ? (
            <p className="empty-message">
              Lowongan yang kamu cari belum tersedia.
            </p>
          ) : (
            <div className="jobs-grid">
              {filteredJobs.map((job) => (
                <article
                  className="job-card"
                  key={job.jobId}
                  onClick={() => {
                    setSelectedJob(job)
                    setPage('detail')
                  }}
                >
                  <div className="job-card-top">
                    <div className="company-icon">
                      {job.companyName?.charAt(0).toUpperCase() || 'C'}
                    </div>

                    <button
                      className="bookmark-button"
                      onClick={(event) => {
                        event.stopPropagation()
                        handleBookmark(job)
                      }}
                    >
                      ♡
                    </button>
                  </div>

                  <span className="job-type">
                    {job.jobType || 'Full Time'}
                  </span>

                  <h3>{job.title}</h3>
                  <p className="company-name">{job.companyName}</p>
                  <p className="job-location">📍 {job.location}</p>

                  <p className="salary">
                    Rp{Number(job.salaryMin || 0).toLocaleString('id-ID')} -
                    Rp{Number(job.salaryMax || 0).toLocaleString('id-ID')}
                  </p>

                  <button
                    className="apply-button"
                    onClick={(event) => {
                      event.stopPropagation()
                      openApplyModal(job)
                    }}
                  >
                    Lamar
                  </button>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>

      {applyJob && (
        <div className="apply-modal-overlay">
          <form className="apply-modal" onSubmit={submitApplication}>
            <button
              type="button"
              className="modal-close"
              onClick={closeApplyModal}
            >
              ×
            </button>

            <h2>Lamar {applyJob.title}</h2>

            <label htmlFor="coverLetter">
              Pesan lamaran
            </label>

            <textarea
              id="coverLetter"
              value={coverLetter}
              onChange={(event) => setCoverLetter(event.target.value)}
              placeholder="Tuliskan pesan lamaran kamu..."
              required
            />

            <label htmlFor="cvFile">
              Lampiran CV
            </label>

            <input
              id="cvFile"
              type="file"
              accept=".jpg,.jpeg,.png"
              onChange={(event) => setCvFile(event.target.files[0])}
              required
            />

            <small>
              Format JPG, JPEG, atau PNG. Maksimal 5 MB.
            </small>

            <button type="submit" disabled={applyLoading}>
              {applyLoading ? 'Mengirim...' : 'Kirim Lamaran'}
            </button>
          </form>
        </div>
      )}
    </div>
  )
}

export default App