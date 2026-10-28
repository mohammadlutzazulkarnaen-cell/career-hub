using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using backend.Data;
using backend.DTOs;

namespace backend.Controllers
{
    [ApiController]
    [Route("api/applications")]
    [Authorize]
    public class ApplicationController : ControllerBase
    {
        private readonly CareerHubContext _context;
        private readonly IWebHostEnvironment _environment;

        public ApplicationController(
            CareerHubContext context,
            IWebHostEnvironment environment)
        {
            _context = context;
            _environment = environment;
        }

        [HttpGet("my")]
        public IActionResult GetMyApplications()
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

            var applications = _context.JobApplications
                .Where(a => a.UserId == userId)
                .OrderByDescending(a => a.AppliedAt)
                .Select(a => new
                {
                    a.ApplicationId,
                    a.CoverLetter,
                    a.CvFilePath,
                    a.Status,
                    a.AppliedAt,
                    job = new
                    {
                        a.Job!.JobId,
                        a.Job.Title,
                        a.Job.CompanyName,
                        a.Job.Location,
                        a.Job.JobType
                    }
                })
                .ToList();

            return Ok(applications);
        }

        [Authorize(Roles = "2")]
        [HttpGet("job/{jobId}")]
        public IActionResult GetApplicationsForJob(int jobId)
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
                .FirstOrDefault(j => j.JobId == jobId);

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

            var applications = _context.JobApplications
                .Where(a => a.JobId == jobId)
                .OrderByDescending(a => a.AppliedAt)
                .Select(a => new
                {
                    a.ApplicationId,
                    a.CoverLetter,
                    a.CvFilePath,
                    a.Status,
                    a.AppliedAt,
                    applicant = new
                    {
                        a.User!.UserId,
                        a.User.FullName,
                        a.User.Email,
                        a.User.Phone
                    }
                })
                .ToList();

            return Ok(applications);
        }

        [Authorize(Roles = "2")]
        [HttpPut("{applicationId}/status")]
        public IActionResult UpdateApplicationStatus(
            int applicationId,
            UpdateApplicationStatusRequest request)
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

            var application = _context.JobApplications
                .Include(a => a.Job)
                .FirstOrDefault(a =>
                    a.ApplicationId == applicationId);

            if (application == null)
            {
                return NotFound(new
                {
                    message = "Lamaran tidak ditemukan."
                });
            }

            if (application.Job == null ||
                application.Job.UserId != userId)
            {
                return Forbid();
            }

            if (string.IsNullOrWhiteSpace(request.Status))
            {
                return BadRequest(new
                {
                    message = "Status wajib diisi."
                });
            }

            var newStatus = request.Status.Trim().ToLower();

            if (newStatus != "accepted" &&
                newStatus != "rejected")
            {
                return BadRequest(new
                {
                    message = "Status hanya boleh Accepted atau Rejected."
                });
            }

            application.Status =
                newStatus == "accepted"
                    ? "Accepted"
                    : "Rejected";

            _context.SaveChanges();

            return Ok(new
            {
                message = "Status lamaran berhasil diperbarui.",
                application = new
                {
                    application.ApplicationId,
                    application.JobId,
                    application.UserId,
                    application.Status,
                    application.AppliedAt
                }
            });
        }

        [Authorize(Roles = "2")]
        [HttpGet("{applicationId}/cv")]
        public IActionResult GetCv(int applicationId)
        {
            var application = _context.JobApplications
                .FirstOrDefault(a =>
                    a.ApplicationId == applicationId);

            if (application == null ||
                string.IsNullOrWhiteSpace(application.CvFilePath))
            {
                return NotFound(new
                {
                    message = "CV tidak ditemukan."
                });
            }

            var relativePath = application.CvFilePath
                .TrimStart('/')
                .Replace('/', Path.DirectorySeparatorChar);

            var filePath = Path.Combine(
                _environment.WebRootPath ?? "wwwroot",
                relativePath
            );

            if (!System.IO.File.Exists(filePath))
            {
                return NotFound(new
                {
                    message = "File CV tidak ditemukan."
                });
            }

            var extension = Path
                .GetExtension(filePath)
                .ToLowerInvariant();

            var contentType = extension switch
            {
                ".png" => "image/png",
                ".jpg" => "image/jpeg",
                ".jpeg" => "image/jpeg",
                _ => "application/octet-stream"
            };

            return PhysicalFile(
                filePath,
                contentType,
                enableRangeProcessing: true
            );
        }

        [HttpDelete("{applicationId}")]
        public IActionResult WithdrawApplication(int applicationId)
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

            var application = _context.JobApplications
                .FirstOrDefault(a =>
                    a.ApplicationId == applicationId &&
                    a.UserId == userId);

            if (application == null)
            {
                return NotFound(new
                {
                    message = "Lamaran tidak ditemukan."
                });
            }

            if (application.Status != "Pending")
            {
                return BadRequest(new
                {
                    message = "Lamaran yang sudah diproses tidak dapat dibatalkan."
                });
            }

            _context.JobApplications.Remove(application);
            _context.SaveChanges();

            return Ok(new
            {
                message = "Lamaran berhasil dibatalkan."
            });
        }
    }
}