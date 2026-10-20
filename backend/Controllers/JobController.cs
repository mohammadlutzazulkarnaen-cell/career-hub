using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using backend.Data;
using backend.DTOs;
using backend.Models;

namespace backend.Controllers
{
    [ApiController]
    [Route("api/jobs")]
    [Authorize]
    public class JobController : ControllerBase
    {
        private readonly CareerHubContext _context;

        public JobController(CareerHubContext context)
        {
            _context = context;
        }

        [HttpGet]
        [AllowAnonymous]
        public IActionResult GetJobs()
        {
            var jobs = _context.Jobs
                .OrderByDescending(j => j.CreatedAt)
                .Select(j => new
                {
                    j.JobId,
                    j.Title,
                    j.CompanyName,
                    j.Location,
                    j.JobType,
                    j.Description,
                    j.Requirements,
                    j.SalaryMin,
                    j.SalaryMax,
                    j.CreatedAt,
                    j.UserId
                })
                .ToList();

            return Ok(jobs);
        }

        [HttpGet("search")]
        [AllowAnonymous]
        public IActionResult SearchJobs(string? keyword)
        {
            var query = _context.Jobs.AsQueryable();

            if (!string.IsNullOrWhiteSpace(keyword))
            {
                var search = keyword.ToLower();

                query = query.Where(j =>
                    j.Title.ToLower().Contains(search) ||
                    j.CompanyName.ToLower().Contains(search) ||
                    j.Location.ToLower().Contains(search) ||
                    j.JobType.ToLower().Contains(search)
                );
            }

            var jobs = query
                .OrderByDescending(j => j.CreatedAt)
                .Select(j => new
                {
                    j.JobId,
                    j.Title,
                    j.CompanyName,
                    j.Location,
                    j.JobType,
                    j.Description,
                    j.Requirements,
                    j.SalaryMin,
                    j.SalaryMax,
                    j.CreatedAt,
                    j.UserId
                })
                .ToList();

            return Ok(jobs);
        }

        [HttpGet("{id}")]
        [AllowAnonymous]
        public IActionResult GetJobById(int id)
        {
            var job = _context.Jobs
                .Where(j => j.JobId == id)
                .Select(j => new
                {
                    j.JobId,
                    j.Title,
                    j.CompanyName,
                    j.Location,
                    j.JobType,
                    j.Description,
                    j.Requirements,
                    j.SalaryMin,
                    j.SalaryMax,
                    j.CreatedAt,
                    j.UserId
                })
                .FirstOrDefault();

            if (job == null)
            {
                return NotFound(new
                {
                    message = "Lowongan tidak ditemukan."
                });
            }

            return Ok(job);
        }

        [Authorize(Roles = "2")]
        [HttpPost]
        public IActionResult CreateJob(CreateJobRequest request)
        {
            var userIdClaim =
                User.FindFirst(ClaimTypes.NameIdentifier)?.Value ??
                User.FindFirst(JwtRegisteredClaimNames.Sub)?.Value;

            if (!int.TryParse(userIdClaim, out int userId))
            {
                return Unauthorized(new
                {
                    message = "Token tidak valid."
                });
            }

            if (string.IsNullOrWhiteSpace(request.Title) ||
                string.IsNullOrWhiteSpace(request.CompanyName) ||
                string.IsNullOrWhiteSpace(request.Location) ||
                string.IsNullOrWhiteSpace(request.JobType) ||
                string.IsNullOrWhiteSpace(request.Description))
            {
                return BadRequest(new
                {
                    message = "Judul, perusahaan, lokasi, tipe kerja, dan deskripsi wajib diisi."
                });
            }

            if (request.SalaryMin.HasValue &&
                request.SalaryMax.HasValue &&
                request.SalaryMin > request.SalaryMax)
            {
                return BadRequest(new
                {
                    message = "Gaji minimum tidak boleh lebih besar dari gaji maksimum."
                });
            }

            var job = new Job
            {
                Title = request.Title,
                CompanyName = request.CompanyName,
                Location = request.Location,
                JobType = request.JobType,
                Description = request.Description,
                Requirements = request.Requirements,
                SalaryMin = request.SalaryMin,
                SalaryMax = request.SalaryMax,
                UserId = userId
            };

            _context.Jobs.Add(job);
            _context.SaveChanges();

            return StatusCode(201, new
            {
                message = "Lowongan berhasil dibuat.",
                job
            });
        }

        [HttpPost("{id}/apply")]
        public IActionResult ApplyJob(int id, ApplyJobRequest request)
        {
            var userIdClaim =
                User.FindFirst(ClaimTypes.NameIdentifier)?.Value ??
                User.FindFirst(JwtRegisteredClaimNames.Sub)?.Value;

            if (!int.TryParse(userIdClaim, out int userId))
            {
                return Unauthorized(new
                {
                    message = "Token tidak valid."
                });
            }

            var job = _context.Jobs.FirstOrDefault(j => j.JobId == id);

            if (job == null)
            {
                return NotFound(new
                {
                    message = "Lowongan tidak ditemukan."
                });
            }

            if (job.UserId == userId)
            {
                return BadRequest(new
                {
                    message = "Kamu tidak dapat melamar lowongan sendiri."
                });
            }

            var alreadyApplied = _context.JobApplications.Any(a =>
                a.JobId == id && a.UserId == userId);

            if (alreadyApplied)
            {
                return BadRequest(new
                {
                    message = "Kamu sudah melamar lowongan ini."
                });
            }

            var application = new JobApplication
            {
                JobId = id,
                UserId = userId,
                CoverLetter = request.CoverLetter
            };

            _context.JobApplications.Add(application);
            _context.SaveChanges();

            return StatusCode(201, new
            {
                message = "Lamaran berhasil dikirim.",
                application = new
                {
                    application.ApplicationId,
                    application.JobId,
                    application.UserId,
                    application.CoverLetter,
                    application.Status,
                    application.AppliedAt
                }
            });
        }

        [Authorize(Roles = "2")]
        [HttpPut("{id}")]
        public IActionResult UpdateJob(int id, UpdateJobRequest request)
        {
            var userIdClaim =
                User.FindFirst(ClaimTypes.NameIdentifier)?.Value ??
                User.FindFirst(JwtRegisteredClaimNames.Sub)?.Value;

            if (!int.TryParse(userIdClaim, out int userId))
            {
                return Unauthorized(new
                {
                    message = "Token tidak valid."
                });
            }

            var job = _context.Jobs.FirstOrDefault(j => j.JobId == id);

            if (job == null)
            {
                return NotFound(new
                {
                    message = "Lowongan tidak ditemukan."
                });
            }

            if (job.UserId != userId)
            {
                return Forbid();
            }

            job.Title = request.Title;
            job.CompanyName = request.CompanyName;
            job.Location = request.Location;
            job.JobType = request.JobType;
            job.Description = request.Description;
            job.Requirements = request.Requirements;
            job.SalaryMin = request.SalaryMin;
            job.SalaryMax = request.SalaryMax;

            _context.SaveChanges();

            return Ok(new
            {
                message = "Lowongan berhasil diperbarui.",
                job
            });
        }

        [Authorize(Roles = "2")]
        [HttpDelete("{id}")]
        public IActionResult DeleteJob(int id)
        {
            var userIdClaim =
                User.FindFirst(ClaimTypes.NameIdentifier)?.Value ??
                User.FindFirst(JwtRegisteredClaimNames.Sub)?.Value;

            if (!int.TryParse(userIdClaim, out int userId))
            {
                return Unauthorized(new
                {
                    message = "Token tidak valid."
                });
            }

            var job = _context.Jobs.FirstOrDefault(j => j.JobId == id);

            if (job == null)
            {
                return NotFound(new
                {
                    message = "Lowongan tidak ditemukan."
                });
            }

            if (job.UserId != userId)
            {
                return Forbid();
            }

            _context.Jobs.Remove(job);
            _context.SaveChanges();

            return Ok(new
            {
                message = "Lowongan berhasil dihapus."
            });
        }
    }
}