import { useEffect, useState } from 'react'

function Bookmarks({ onBack }) {
  const token = localStorage.getItem('token')

  const [bookmarks, setBookmarks] = useState([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!token) {
      return
    }

    const loadBookmarks = async () => {
      try {
        const response = await fetch(
          'http://localhost:5057/api/bookmarks/my',
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        )

        const data = await response.json()

        if (!response.ok) {
          throw new Error(
            data.message || 'Gagal mengambil bookmark.'
          )
        }

        setBookmarks(data)
      } catch (error) {
        setMessage(error.message)
      } finally {
        setLoading(false)
      }
    }

    loadBookmarks()
  }, [token])

  return (
    <div className="applications-page">
      <div className="applications-container">
        <button className="back-button" onClick={onBack}>
          ← Kembali
        </button>

        <p className="eyebrow">LOWONGAN TERSIMPAN</p>

        <h1>Bookmark Saya</h1>

        <p className="applications-subtitle">
          Lowongan yang kamu simpan untuk dilihat nanti.
        </p>

        {!token && (
          <p className="message">
            Silakan login terlebih dahulu.
          </p>
        )}

        {token && loading && (
          <p className="message">
            Memuat bookmark...
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
          bookmarks.length === 0 && (
            <p className="message">
              Belum ada lowongan yang disimpan.
            </p>
          )}

        {token &&
          !loading &&
          !message &&
          bookmarks.length > 0 && (
            <div className="applications-list">
              {bookmarks.map((bookmark) => (
                <article
                  className="application-card"
                  key={bookmark.bookmarkId}
                >
                  <div>
                    <span className="job-type">
                      {bookmark.job.jobType}
                    </span>

                    <h2>{bookmark.job.title}</h2>

                    <p>{bookmark.job.companyName}</p>

                    <p>
                      📍 {bookmark.job.location}
                    </p>

                    <p className="salary">
                      Rp
                      {new Intl.NumberFormat('id-ID').format(
                        bookmark.job.salaryMin
                      )}{' '}
                      - Rp
                      {new Intl.NumberFormat('id-ID').format(
                        bookmark.job.salaryMax
                      )}
                    </p>
                  </div>

                  <span className="bookmark-label">
                    ♡ Tersimpan
                  </span>
                </article>
              ))}
            </div>
          )}
      </div>
    </div>
  )
}

export default Bookmarks