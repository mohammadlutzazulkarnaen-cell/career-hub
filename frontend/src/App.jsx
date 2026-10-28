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
  const [openFaq, setOpenFaq] = useState(null)
  const [menuOpen, setMenuOpen] = useState(false)

function navigateFromMenu(nextPage) {
  setPage(nextPage)
  setMenuOpen(false)
}

  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user')
    return savedUser ? JSON.parse(savedUser) : null
  })

  const [darkMode, setDarkMode] = useState(
    localStorage.getItem('theme') === 'dark'
  )

  const [keywordInput, setKeywordInput] = useState('')
  const [locationInput, setLocationInput] = useState('')
  const [keyword, setKeyword] = useState('')
  const [location, setLocation] = useState('')
  const [jobTypeFilter, setJobTypeFilter] = useState('All')
  const [sortBy, setSortBy] = useState('newest')

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
    setJobTypeFilter('All')
    setSortBy('newest')
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
    if (!localStorage.getItem('token')) {
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
            Authorization: `Bearer ${localStorage.getItem('token')}`,
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
      !location ||
      job.location?.toLowerCase().includes(location)

    const typeMatch =
      jobTypeFilter === 'All' ||
      job.jobType === jobTypeFilter

    return keywordMatch && locationMatch && typeMatch
  })

  const sortedJobs = [...filteredJobs].sort((a, b) => {
    if (sortBy === 'highestSalary') {
      return (b.salaryMax || 0) - (a.salaryMax || 0)
    }

    if (sortBy === 'lowestSalary') {
      return (a.salaryMin || 0) - (b.salaryMin || 0)
    }

    if (sortBy === 'title') {
      return a.title.localeCompare(b.title)
    }

    return new Date(b.createdAt) - new Date(a.createdAt)
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
      <button
        className="logo"
        onClick={() => navigateFromMenu('home')}
      >
        Career<span>Hub</span>
      </button>

      <button
        className="menu-toggle"
        onClick={() => setMenuOpen((value) => !value)}
      >
        ☰
      </button>

      <div className={`nav-links ${menuOpen ? 'open' : ''}`}>
        <button onClick={() => navigateFromMenu('home')}>
          Cari Lowongan
        </button>

        <a
          href="#about"
          onClick={() => setMenuOpen(false)}
        >
          Tentang Kami
        </a>

        {isAdmin && (
          <button
            className="nav-page-button"
            onClick={() => navigateFromMenu('admin')}
          >
            Dashboard Admin
          </button>
        )}

        {user && !isAdmin && (
          <>
            <button
              className="nav-page-button"
              onClick={() => navigateFromMenu('applications')}
            >
              Lamaran Saya
            </button>

            <button
              className="nav-page-button"
              onClick={() => navigateFromMenu('bookmarks')}
            >
              Bookmark Saya
            </button>
          </>
        )}

        <button
          className="theme-button"
          onClick={() => setDarkMode((value) => !value)}
        >
          {darkMode ? '☀️' : '🌙'}
        </button>

        {user ? (
          <>
            <button
              className="logout-button"
              onClick={() => {
                handleLogout()
                setMenuOpen(false)
              }}
            >
              Keluar
            </button>

            <button
              className="profile-avatar"
              onClick={() => navigateFromMenu('profile')}
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
              onClick={() => navigateFromMenu('login')}
            >
              Masuk
            </button>

            <button
              className="register-button"
              onClick={() => navigateFromMenu('register')}
            >
              Daftar
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

              <select
                value={jobTypeFilter}
                onChange={(event) =>
                  setJobTypeFilter(event.target.value)
                }
              >
                <option value="All">Semua tipe</option>
                <option value="Full Time">Full Time</option>
                <option value="Part Time">Part Time</option>
                <option value="Internship">Internship</option>
                <option value="Remote">Remote</option>
              </select>

              <select
                value={sortBy}
                onChange={(event) =>
                  setSortBy(event.target.value)
                }
              >
                <option value="newest">Terbaru</option>
                <option value="highestSalary">
                  Gaji tertinggi
                </option>
                <option value="lowestSalary">
                  Gaji terendah
                </option>
                <option value="title">Judul A-Z</option>
              </select>

              <button type="submit">
                Cari Lowongan
              </button>
            </form>
          </div>
        </section>

        <section className="jobs-section">
          <div className="section-heading">
            <div>
              <p className="eyebrow">PELUANG TERBARU</p>
              <h2>Lowongan pekerjaan terbaru</h2>
            </div>

            {(keyword ||
              location ||
              jobTypeFilter !== 'All' ||
              sortBy !== 'newest') && (
              <button
                className="reset-button"
                onClick={resetSearch}
              >
                Reset pencarian
              </button>
            )}
          </div>

          {message && (
            <p className="error-message">
              {message}
            </p>
          )}

          {loading ? (
            <p className="empty-message">
              Memuat lowongan...
            </p>
          ) : sortedJobs.length === 0 ? (
            <p className="empty-message">
              Lowongan yang kamu cari belum tersedia.
            </p>
          ) : (
            <div className="jobs-grid">
              {sortedJobs.map((job) => (
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

                  <p className="company-name">
                    {job.companyName}
                  </p>

                  <p className="job-location">
                    📍 {job.location}
                  </p>

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

        <section id="about" className="about-section">
          <div className="about-content">
            <p className="eyebrow">TENTANG CAREERHUB</p>

            <h2>
              Membangun langkah karier dengan lebih percaya diri.
            </h2>

            <p>
              CareerHub hadir sebagai platform pencarian kerja yang
              membantu setiap orang menemukan peluang karier yang
              sesuai dengan kemampuan, pengalaman, dan tujuan hidupnya.
              Kami memahami bahwa mencari pekerjaan bukan hanya
              tentang menemukan posisi kosong, tetapi juga tentang
              menemukan lingkungan kerja yang tepat untuk berkembang.
            </p>

            <p>
              Melalui CareerHub, pencari kerja dapat menjelajahi
              berbagai lowongan dari perusahaan terpercaya, membaca
              informasi pekerjaan dengan jelas, mengirim pesan lamaran,
              melampirkan CV, dan memantau perkembangan lamaran secara
              transparan. Semua proses dibuat sederhana agar kamu dapat
              fokus mempersiapkan diri dan menunjukkan kemampuan terbaik.
            </p>

            <p>
              Kami berkomitmen untuk membangun pengalaman mencari kerja
              yang aman, mudah digunakan, dan dapat diandalkan. Dengan
              informasi yang lebih lengkap dan proses yang lebih jelas,
              CareerHub ingin menjadi teman perjalananmu dalam meraih
              karier impian.
            </p>

            <div className="about-features">
              <div>
                <strong>Lowongan terpercaya</strong>
                <span>
                  Informasi pekerjaan yang jelas dari perusahaan pilihan.
                </span>
              </div>

              <div>
                <strong>Lamaran mudah</strong>
                <span>
                  Kirim pesan dan CV dalam satu proses yang praktis.
                </span>
              </div>

              <div>
                <strong>Proses transparan</strong>
                <span>
                  Pantau status lamaran kapan pun kamu membutuhkannya.
                </span>
              </div>
            </div>
          </div>
        </section>
        <section className="faq-section">
          <div className="faq-content">
            <p className="eyebrow">PERTANYAAN UMUM</p>
            <h2>Butuh bantuan?</h2>

            {[
              {
                question: 'Bagaimana cara melamar pekerjaan?',
                answer:
                  'Pilih lowongan yang sesuai, tekan tombol Lamar, tuliskan pesan lamaran, lalu lampirkan CV dalam format gambar.'
              },
              {
                question: 'Apakah harus membuat akun?',
                answer:
                  'Ya. Akun diperlukan agar kamu dapat mengirim lamaran, menyimpan lowongan, dan memantau status lamaran.'
              },
              {
                question: 'Bagaimana cara melihat status lamaran?',
                answer:
                  'Buka menu Lamaran Saya setelah login. Status lamaran akan diperbarui oleh admin perusahaan.'
              }
            ].map((faq, index) => (
              <div className="faq-item" key={faq.question}>
                <button
                  className="faq-question"
                  onClick={() =>
                    setOpenFaq(openFaq === index ? null : index)
                  }
                >
                  {faq.question}
                  <span>{openFaq === index ? '−' : '+'}</span>
                </button>

                {openFaq === index && (
                  <p className="faq-answer">{faq.answer}</p>
                )}
              </div>
            ))}
          </div>
        </section>
      </main>

  {<footer className="site-footer">
          <div className="footer-content">
            <div className="footer-brand">
              <h3>
                Career<span>Hub</span>
              </h3>

              <p>
                Temukan peluang karier terbaik dan bangun masa depan profesionalmu
                bersama CareerHub.
              </p>
            </div>

            <div className="footer-links">
              <h4>Navigasi</h4>

              <button onClick={() => setPage('home')}>
                Cari Lowongan
              </button>

              <button onClick={() => setPage('applications')}>
                Lamaran Saya
              </button>

              <button onClick={() => setPage('bookmarks')}>
                Bookmark Saya
              </button>
            </div>

            <div className="footer-contact">
              <h4>Hubungi Kami</h4>

              <p>careerhub@gmail.com</p>
              <p>Jakarta, Indonesia</p>

              <div className="social-links">
                <a
                  href="https://www.instagram.com/lutzaaa_?rpxt=YXdjNTR1Ynd1cDJq"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Instagram"
                >
                  Instagram
                </a>

                <a
                  href="www.linkedin.com/in/mohammad-lutza-zulkarnaen-78975b447"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="LinkedIn"
                >
                  LinkedIn
                </a>

                <a
                  href="https://github.com/mohammadlutzazulkarnaen-cell"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="GitHub"
                >
                  GitHub
                </a>
              </div>
            </div>
          </div>

          <div className="footer-bottom">
            © 2026 CareerHub. Semua hak dilindungi.
          </div>
        </footer>}

      {applyJob && (
        <div className="apply-modal-overlay">
          <form
            className="apply-modal"
            onSubmit={submitApplication}
          >
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
              onChange={(event) =>
                setCoverLetter(event.target.value)
              }
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
              onChange={(event) =>
                setCvFile(event.target.files[0])
              }
              required
            />

            <small>
              Format JPG, JPEG, atau PNG. Maksimal 5 MB.
            </small>

            <button
              type="submit"
              disabled={applyLoading}
            >
              {applyLoading
                ? 'Mengirim...'
                : 'Kirim Lamaran'}
            </button>
          </form>
        </div>
      )}
    </div>
  )
}

export default App