import { useEffect, useState } from 'react'

function Applications({ onBack }) {
  const token = localStorage.getItem('token')

  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!token) {
      return
    }

    const loadApplications = async () => {
      try {
        const response = await fetch(
          'http://localhost:5057/api/applications/my',
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        )

        const data = await response.json()

        if (!response.ok) {
          throw new Error(
            data.message || 'Gagal mengambil lamaran.'
          )
        }

        setApplications(data)
      } catch (error) {
        setMessage(error.message)
      } finally {
        setLoading(false)
      }
    }

    loadApplications()
  }, [token])

  return (
    <div className="applications-page">
      <div className="applications-container">
        <button className="back-button" onClick={onBack}>
          ← Kembali
        </button>

        <p className="eyebrow">AKTIVITAS KAMU</p>

        <h1>Lamaran Saya</h1>

        <p className="applications-subtitle">
          Pantau semua lowongan yang sudah kamu lamar.
        </p>

        {!token && (
          <p className="message">
            Silakan login terlebih dahulu.
          </p>
        )}

        {token && loading && (
          <p className="message">
            Memuat lamaran...
          </p>
        )}

        {token && !loading && message && (
          <p className="message">
            {message}
          </p>
        )}

        {token &&
          !loading &&
          !message &&
          applications.length === 0 && (
            <p className="message">
              Kamu belum memiliki lamaran.
            </p>
          )}

        {token &&
          !loading &&
          !message &&
          applications.length > 0 && (
            <div className="applications-list">
              {applications.map((application) => (
                <article
                  className="application-card"
                  key={application.applicationId}
                >
                  <div>
                    <span className="job-type">
                      {application.job.jobType}
                    </span>

                    <h2>{application.job.title}</h2>

                    <p>{application.job.companyName}</p>

                    <p>
                      📍 {application.job.location}
                    </p>

                    <small>
                      Dikirim pada:{' '}
                      {new Date(
                        application.appliedAt
                      ).toLocaleDateString('id-ID')}
                    </small>
                  </div>

                  <span
                    className={`application-status ${application.status.toLowerCase()}`}
                  >
                    {application.status}
                  </span>
                </article>
              ))}
            </div>
          )}
      </div>
    </div>
  )
}

export default Applications