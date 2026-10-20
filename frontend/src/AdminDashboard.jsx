import { useEffect, useState } from 'react'

const API_URL = 'http://localhost:5057'

const emptyForm = {
  title: '',
  companyName: '',
  location: '',
  jobType: 'Full Time',
  description: '',
  requirements: '',
  salaryMin: '',
  salaryMax: '',
}

function AdminDashboard({ onBack }) {
  const token = localStorage.getItem('token')

  const [jobs, setJobs] = useState([])
  const [selectedJob, setSelectedJob] = useState(null)
  const [applicants, setApplicants] = useState([])
  const [editingJob, setEditingJob] = useState(null)
  const [statusFilter, setStatusFilter] = useState('All')
  const [message, setMessage] = useState('')
  const [loadingApplicants, setLoadingApplicants] = useState(false)
  const [form, setForm] = useState(emptyForm)

  const [stats, setStats] = useState({
    totalJobs: 0,
    totalApplicants: 0,
    accepted: 0,
    rejected: 0,
  })

  const filteredApplicants =
    statusFilter === 'All'
      ? applicants
      : applicants.filter(
          (application) => application.status === statusFilter
        )

  async function loadJobs() {
    const response = await fetch(`${API_URL}/api/jobs`)
    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.message || 'Gagal mengambil lowongan.')
    }

    setJobs(data)

    const applicantResults = await Promise.all(
      data.map(async (job) => {
        const applicantResponse = await fetch(
          `${API_URL}/api/applications/job/${job.jobId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        )

        if (!applicantResponse.ok) {
          return []
        }

        return applicantResponse.json()
      })
    )

    const allApplicants = applicantResults.flat()

    setStats({
      totalJobs: data.length,
      totalApplicants: allApplicants.length,
      accepted: allApplicants.filter(
        (item) => item.status === 'Accepted'
      ).length,
      rejected: allApplicants.filter(
        (item) => item.status === 'Rejected'
      ).length,
    })
  }

  useEffect(() => {
    let active = true

    async function initialize() {
      try {
        const response = await fetch(`${API_URL}/api/jobs`)
        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.message || 'Gagal mengambil lowongan.')
        }

        const applicantResults = await Promise.all(
          data.map(async (job) => {
            const applicantResponse = await fetch(
              `${API_URL}/api/applications/job/${job.jobId}`,
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              }
            )

            if (!applicantResponse.ok) {
              return []
            }

            return applicantResponse.json()
          })
        )

        const allApplicants = applicantResults.flat()

        if (active) {
          setJobs(data)
          setStats({
            totalJobs: data.length,
            totalApplicants: allApplicants.length,
            accepted: allApplicants.filter(
              (item) => item.status === 'Accepted'
            ).length,
            rejected: allApplicants.filter(
              (item) => item.status === 'Rejected'
            ).length,
          })
        }
      } catch (error) {
        if (active) {
          setMessage(error.message)
        }
      }
    }

    initialize()

    return () => {
      active = false
    }
  }, [token])

  function handleChange(event) {
    setForm({
      ...form,
      [event.target.name]: event.target.value,
    })
  }

  function resetForm() {
    setForm(emptyForm)
    setEditingJob(null)
  }

  function editJob(job) {
    setEditingJob(job)

    setForm({
      title: job.title || '',
      companyName: job.companyName || '',
      location: job.location || '',
      jobType: job.jobType || 'Full Time',
      description: job.description || '',
      requirements: job.requirements || '',
      salaryMin: job.salaryMin || '',
      salaryMax: job.salaryMax || '',
    })

    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setMessage('')

    const isEditing = Boolean(editingJob)

    try {
      const response = await fetch(
        isEditing
          ? `${API_URL}/api/jobs/${editingJob.jobId}`
          : `${API_URL}/api/jobs`,
        {
          method: isEditing ? 'PUT' : 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            ...form,
            salaryMin: form.salaryMin ? Number(form.salaryMin) : null,
            salaryMax: form.salaryMax ? Number(form.salaryMax) : null,
          }),
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Gagal menyimpan lowongan.')
      }

      setMessage(
        isEditing
          ? 'Lowongan berhasil diperbarui.'
          : 'Lowongan berhasil dibuat.'
      )

      resetForm()
      await loadJobs()
    } catch (error) {
      setMessage(error.message)
    }
  }

  async function deleteJob(jobId) {
    if (!window.confirm('Yakin ingin menghapus lowongan ini?')) {
      return
    }

    try {
      const response = await fetch(`${API_URL}/api/jobs/${jobId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Gagal menghapus lowongan.')
      }

      setMessage('Lowongan berhasil dihapus.')
      await loadJobs()
    } catch (error) {
      setMessage(error.message)
    }
  }

  async function showApplicants(job) {
    setSelectedJob(job)
    setApplicants([])
    setStatusFilter('All')
    setLoadingApplicants(true)
    setMessage('')

    try {
      const response = await fetch(
        `${API_URL}/api/applications/job/${job.jobId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Gagal mengambil pelamar.')
      }

      setApplicants(data)
    } catch (error) {
      setMessage(error.message)
    } finally {
      setLoadingApplicants(false)
    }
  }

  async function updateStatus(applicationId, status) {
    try {
      const response = await fetch(
        `${API_URL}/api/applications/${applicationId}/status`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status }),
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Gagal mengubah status.')
      }

      setMessage(data.message || 'Status berhasil diperbarui.')

      if (selectedJob) {
        await showApplicants(selectedJob)
      }

      await loadJobs()
    } catch (error) {
      setMessage(error.message)
    }
  }

  return (
    <main className="admin-page">
      <button className="back-button" onClick={onBack}>
        ← Kembali
      </button>

      <div className="admin-container">
        <p className="eyebrow">AREA ADMIN</p>
        <h1>Dashboard Admin</h1>
        <p>Kelola lowongan dan pelamar CareerHub.</p>

        <div className="admin-stats">
          <div className="stat-card">
            <span>Total Lowongan</span>
            <strong>{stats.totalJobs}</strong>
          </div>

          <div className="stat-card">
            <span>Total Pelamar</span>
            <strong>{stats.totalApplicants}</strong>
          </div>

          <div className="stat-card accepted">
            <span>Diterima</span>
            <strong>{stats.accepted}</strong>
          </div>

          <div className="stat-card rejected">
            <span>Ditolak</span>
            <strong>{stats.rejected}</strong>
          </div>
        </div>

        <form className="admin-form" onSubmit={handleSubmit}>
          <input
            name="title"
            placeholder="Judul lowongan"
            value={form.title}
            onChange={handleChange}
            required
          />

          <input
            name="companyName"
            placeholder="Nama perusahaan"
            value={form.companyName}
            onChange={handleChange}
            required
          />

          <input
            name="location"
            placeholder="Lokasi"
            value={form.location}
            onChange={handleChange}
            required
          />

          <select
            name="jobType"
            value={form.jobType}
            onChange={handleChange}
          >
            <option>Full Time</option>
            <option>Part Time</option>
            <option>Internship</option>
            <option>Remote</option>
          </select>

          <textarea
            name="description"
            placeholder="Deskripsi pekerjaan"
            value={form.description}
            onChange={handleChange}
            required
          />

          <textarea
            name="requirements"
            placeholder="Persyaratan"
            value={form.requirements}
            onChange={handleChange}
          />

          <input
            name="salaryMin"
            type="number"
            placeholder="Gaji minimum"
            value={form.salaryMin}
            onChange={handleChange}
          />

          <input
            name="salaryMax"
            type="number"
            placeholder="Gaji maksimum"
            value={form.salaryMax}
            onChange={handleChange}
          />

          <button type="submit">
            {editingJob ? 'Simpan Perubahan' : 'Tambah Lowongan'}
          </button>

          {editingJob && (
            <button
              type="button"
              className="cancel-edit-button"
              onClick={resetForm}
            >
              Batal Edit
            </button>
          )}
        </form>

        {message && <p className="auth-message">{message}</p>}

        <h2>Daftar Lowongan</h2>

        <div className="admin-job-list">
          {jobs.map((job) => (
            <div className="admin-job-item" key={job.jobId}>
              <h3>{job.title}</h3>
              <p>{job.companyName}</p>
              <span>{job.location}</span>

              <button
                className="edit-job-button"
                onClick={() => editJob(job)}
              >
                Edit Lowongan
              </button>

              <button
                className="view-applicants-button"
                onClick={() => showApplicants(job)}
              >
                Lihat Pelamar
              </button>

              <button
                className="delete-job-button"
                onClick={() => deleteJob(job.jobId)}
              >
                Hapus Lowongan
              </button>
            </div>
          ))}
        </div>

        {selectedJob && (
          <section className="applicants-section">
            <h2>Pelamar: {selectedJob.title}</h2>

            <select
              className="status-filter"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
            >
              <option value="All">Semua Status</option>
              <option value="Pending">Pending</option>
              <option value="Accepted">Accepted</option>
              <option value="Rejected">Rejected</option>
            </select>

            {loadingApplicants ? (
              <p>Memuat pelamar...</p>
            ) : filteredApplicants.length === 0 ? (
              <p>Tidak ada pelamar dengan status tersebut.</p>
            ) : (
              <div className="applicants-list">
                {filteredApplicants.map((application) => (
                  <div
                    className="applicant-card"
                    key={application.applicationId}
                  >
                    <h3>{application.applicant.fullName}</h3>
                    <p>{application.applicant.email}</p>
                    <p>
                      {application.applicant.phone ||
                        'Nomor tidak tersedia'}
                    </p>

                    <p className="cover-letter">
                      {application.coverLetter}
                    </p>

                    <strong>Status: {application.status}</strong>

                    <div className="applicant-actions">
                      <button
                        onClick={() =>
                          updateStatus(
                            application.applicationId,
                            'Accepted'
                          )
                        }
                      >
                        Terima
                      </button>

                      <button
                        onClick={() =>
                          updateStatus(
                            application.applicationId,
                            'Rejected'
                          )
                        }
                      >
                        Tolak
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}
      </div>
    </main>
  )
}

export default AdminDashboard