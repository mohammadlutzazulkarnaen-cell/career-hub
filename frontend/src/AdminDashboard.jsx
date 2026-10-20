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

  const [form, setForm] = useState(emptyForm)
  const [message, setMessage] = useState('')
  const [loadingApplicants, setLoadingApplicants] = useState(false)

  useEffect(() => {
    let active = true

    fetch(`${API_URL}/api/jobs`)
      .then(async (response) => {
        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.message || 'Gagal mengambil lowongan.')
        }

        if (active) {
          setJobs(data)
        }
      })
      .catch((error) => {
        if (active) {
          setMessage(error.message)
        }
      })

    return () => {
      active = false
    }
  }, [])

  async function loadJobs() {
    const response = await fetch(`${API_URL}/api/jobs`)
    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.message || 'Gagal mengambil lowongan.')
    }

    setJobs(data)
  }

  function resetForm() {
    setEditingJob(null)
    setForm(emptyForm)
  }

  function handleChange(event) {
    setForm({
      ...form,
      [event.target.name]: event.target.value,
    })
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

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    })
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setMessage('')

    const isEditing = Boolean(editingJob)

    try {
      const url = isEditing
        ? `${API_URL}/api/jobs/${editingJob.jobId}`
        : `${API_URL}/api/jobs`

      const response = await fetch(url, {
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
      })

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
    const confirmed = window.confirm(
      'Yakin ingin menghapus lowongan ini?'
    )

    if (!confirmed) {
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

      if (selectedJob?.jobId === jobId) {
        setSelectedJob(null)
        setApplicants([])
      }

      if (editingJob?.jobId === jobId) {
        resetForm()
      }

      await loadJobs()
    } catch (error) {
      setMessage(error.message)
    }
  }

  async function showApplicants(job) {
    setSelectedJob(job)
    setApplicants([])
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

        {message && (
          <p className="auth-message">
            {message}
          </p>
        )}

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
            <h2>
              Pelamar: {selectedJob.title}
            </h2>

            {loadingApplicants ? (
              <p>Memuat pelamar...</p>
            ) : applicants.length === 0 ? (
              <p>Belum ada pelamar untuk lowongan ini.</p>
            ) : (
              <div className="applicants-list">
                {applicants.map((application) => (
                  <div
                    className="applicant-card"
                    key={application.applicationId}
                  >
                    <h3>
                      {application.applicant.fullName}
                    </h3>

                    <p>
                      {application.applicant.email}
                    </p>

                    <p>
                      {application.applicant.phone ||
                        'Nomor tidak tersedia'}
                    </p>

                    <p className="cover-letter">
                      {application.coverLetter}
                    </p>

                    <strong>
                      Status: {application.status}
                    </strong>

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