import { useEffect, useState } from 'react'

const API_URL = 'http://localhost:5057'

function Applications({ onBack }) {
  const token = localStorage.getItem('token')

  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!token) {
      return
    }

    let active = true

    fetch(`${API_URL}/api/applications/my`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then(async (response) => {
        const responseText = await response.text()

        let data = {}

        if (responseText) {
          try {
            data = JSON.parse(responseText)
          } catch {
            data = {}
          }
        }

        if (!response.ok) {
          throw new Error(
            data.message ||
              responseText ||
              'Gagal mengambil lamaran.'
          )
        }

        if (active) {
          setApplications(data)
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

  async function withdrawApplication(applicationId) {
    const confirmed = window.confirm(
      'Yakin ingin membatalkan lamaran ini?'
    )

    if (!confirmed) {
      return
    }

    try {
      const response = await fetch(
        `${API_URL}/api/applications/${applicationId}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      const responseText = await response.text()

      let data = {}

      if (responseText) {
        try {
          data = JSON.parse(responseText)
        } catch {
          data = {}
        }
      }

      if (!response.ok) {
        throw new Error(
          data.message ||
            responseText ||
            'Gagal membatalkan lamaran.'
        )
      }

      setApplications((current) =>
        current.filter(
          (item) => item.applicationId !== applicationId
        )
      )

      setMessage(
        data.message || 'Lamaran berhasil dibatalkan.'
      )
    } catch (error) {
      setMessage(error.message)
    }
  }

  const acceptedCount = applications.filter(
    (application) => application.status === 'Accepted'
  ).length

  const rejectedCount = applications.filter(
    (application) => application.status === 'Rejected'
  ).length

  return (
    <main className="applications-page">
      <button className="back-button" onClick={onBack}>
        ← Kembali
      </button>

      <div className="applications-container">
        <p className="eyebrow">AKTIVITAS KAMU</p>

        <h1>Lamaran Saya</h1>

        <p className="applications-subtitle">
          Pantau semua lowongan yang sudah kamu lamar.
        </p>

        {acceptedCount > 0 && (
          <div className="notification success-notification">
            🎉 Ada {acceptedCount} lamaran yang diterima!
          </div>
        )}

        {rejectedCount > 0 && (
          <div className="notification rejected-notification">
            Ada {rejectedCount} lamaran yang belum berhasil.
          </div>
        )}

        {message && (
          <p className="auth-message">
            {message}
          </p>
        )}

        {loading ? (
          <p>Memuat lamaran...</p>
        ) : applications.length === 0 ? (
          <div className="empty-applications">
            <h2>Belum ada lamaran</h2>
            <p>
              Kamu belum melamar lowongan pekerjaan apa pun.
            </p>
          </div>
        ) : (
          <div className="applications-list">
            {applications.map((application) => (
              <article
                className="application-card"
                key={application.applicationId}
              >
                <div className="application-content">
                  <span className="job-type">
                    {application.job?.jobType || 'Full Time'}
                  </span>

                  <h2>{application.job?.title}</h2>

                  <p className="company-name">
                    {application.job?.companyName}
                  </p>

                  <p className="job-location">
                    📍 {application.job?.location}
                  </p>

                  <p className="applied-date">
                    Dikirim pada:{' '}
                    {new Date(
                      application.appliedAt
                    ).toLocaleDateString('id-ID')}
                  </p>

                  {application.status === 'Pending' && (
                    <button
                      className="withdraw-button"
                      onClick={() =>
                        withdrawApplication(
                          application.applicationId
                        )
                      }
                    >
                      Batalkan Lamaran
                    </button>
                  )}
                </div>

                <span
                  className={`application-status status-${application.status.toLowerCase()}`}
                >
                  {application.status}
                </span>
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}

export default Applications