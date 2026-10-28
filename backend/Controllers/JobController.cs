using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.IO;
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
        private readonly IWebHostEnvironment _environment;

        public JobController(
            CareerHubContext context,
            IWebHostEnvironment environment)
        {
            _context = context;
            _environment = environment;
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
                    message = "Data lowongan wajib diisi."
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
        public IActionResult ApplyJob(
            int id,
            [FromForm] ApplyJobRequest request)
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

            if (string.IsNullOrWhiteSpace(request.CoverLetter))
            {
                return BadRequest(new
                {
                    message = "Pesan lamaran wajib diisi."
                });
            }

            if (request.CvFile == null || request.CvFile.Length == 0)
            {
                return BadRequest(new
                {
                    message = "CV wajib dilampirkan."
                });
            }

            var allowedExtensions = new[]
            {
                ".jpg",
                ".jpeg",
                ".png"
            };

            var extension =
                Path.GetExtension(request.CvFile.FileName)
                    .ToLowerInvariant();

            if (!allowedExtensions.Contains(extension))
            {
                return BadRequest(new
                {
                    message = "CV hanya boleh JPG, JPEG, atau PNG."
                });
            }

            if (request.CvFile.Length > 5 * 1024 * 1024)
            {
                return BadRequest(new
                {
                    message = "Ukuran CV maksimal 5 MB."
                });
            }

            var job = _context.Jobs
                .FirstOrDefault(j => j.JobId == id);

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
                a.JobId == id &&
                a.UserId == userId);

            if (alreadyApplied)
            {
                return BadRequest(new
                {
                    message = "Kamu sudah melamar lowongan ini."
                });
            }

            var uploadFolder = Path.Combine(
                _environment.WebRootPath ?? "wwwroot",
                "uploads",
                "cv"
            );

            Directory.CreateDirectory(uploadFolder);

            var fileName = $"{Guid.NewGuid()}{extension}";
            var filePath = Path.Combine(uploadFolder, fileName);

            using (var stream = new FileStream(
                filePath,
                FileMode.Create))
            {
                request.CvFile.CopyTo(stream);
            }

            var application = new JobApplication
            {
                JobId = id,
                UserId = userId,
                CoverLetter = request.CoverLetter.Trim(),
                CvFilePath = $"/uploads/cv/{fileName}"
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
                    application.CvFilePath,
                    application.Status,
                    application.AppliedAt
                }
            });
        }

        [Authorize(Roles = "2")]
        [HttpPut("{id}")]
        public IActionResult UpdateJob(
            int id,
            UpdateJobRequest request)
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

            var job = _context.Jobs
                .FirstOrDefault(j => j.JobId == id);

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

            if (string.IsNullOrWhiteSpace(request.Title) ||
                string.IsNullOrWhiteSpace(request.CompanyName) ||
                string.IsNullOrWhiteSpace(request.Location) ||
                string.IsNullOrWhiteSpace(request.JobType) ||
                string.IsNullOrWhiteSpace(request.Description))
            {
                return BadRequest(new
                {
                    message = "Data lowongan wajib diisi."
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

            var job = _context.Jobs
                .FirstOrDefault(j => j.JobId == id);

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