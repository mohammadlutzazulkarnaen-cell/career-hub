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

        public ApplicationController(CareerHubContext context)
        {
            _context = context;
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
                return StatusCode(403, new
                {
                    message = "Kamu bukan pemilik lowongan ini."
                });
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
                .FirstOrDefault(a => a.ApplicationId == applicationId);

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
                return StatusCode(403, new
                {
                    message = "Kamu bukan pemilik lowongan ini."
                });
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
    }
}