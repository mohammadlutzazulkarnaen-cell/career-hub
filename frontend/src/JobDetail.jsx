function JobDetail({ job, onBack, onApply }) {
  const formatSalary = (salaryMin, salaryMax) => {
    if (!salaryMin && !salaryMax) {
      return 'Gaji tidak dicantumkan'
    }

    const format = (value) =>
      new Intl.NumberFormat('id-ID').format(value)

    if (salaryMin && salaryMax) {
      return `Rp${format(salaryMin)} - Rp${format(salaryMax)}`
    }

    if (salaryMin) {
      return `Mulai dari Rp${format(salaryMin)}`
    }

    return `Hingga Rp${format(salaryMax)}`
  }

  return (
    <div className="job-detail-page">
      <div className="job-detail-container">
        <button className="back-button" onClick={onBack}>
          ← Kembali ke lowongan
        </button>

        <div className="job-detail-card">
          <div className="company-icon large-icon">
            {job.companyName.charAt(0)}
          </div>

          <span className="job-type">
            {job.jobType}
          </span>

          <h1>{job.title}</h1>

          <p className="detail-company">
            {job.companyName}
          </p>

          <p className="detail-location">
            📍 {job.location}
          </p>

          <p className="detail-salary">
            {formatSalary(job.salaryMin, job.salaryMax)}
          </p>

          <hr />

          <h2>Deskripsi pekerjaan</h2>
          <p className="detail-text">
            {job.description}
          </p>

          <h2>Persyaratan</h2>
          <p className="detail-text">
            {job.requirements || 'Tidak ada persyaratan khusus.'}
          </p>

          <button
            className="detail-apply-button"
            onClick={() => onApply(job.jobId)}
          >
            Lamar Sekarang
          </button>
        </div>
      </div>
    </div>
  )
}

export default JobDetail