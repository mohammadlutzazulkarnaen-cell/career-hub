using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using backend.Data;
using backend.Models;

namespace backend.Controllers
{
    [ApiController]
    [Route("api/bookmarks")]
    [Authorize]
    public class BookmarkController : ControllerBase
    {
        private readonly CareerHubContext _context;

        public BookmarkController(CareerHubContext context)
        {
            _context = context;
        }

        // POST: api/bookmarks/2
        [HttpPost("{jobId}")]
        public IActionResult AddBookmark(int jobId)
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

            var job = _context.Jobs.FirstOrDefault(j => j.JobId == jobId);

            if (job == null)
            {
                return NotFound(new
                {
                    message = "Lowongan tidak ditemukan."
                });
            }

            var alreadyBookmarked = _context.JobBookmarks.Any(b =>
                b.JobId == jobId && b.UserId == userId);

            if (alreadyBookmarked)
            {
                return BadRequest(new
                {
                    message = "Lowongan ini sudah disimpan."
                });
            }

            var bookmark = new JobBookmark
            {
                JobId = jobId,
                UserId = userId
            };

            _context.JobBookmarks.Add(bookmark);
            _context.SaveChanges();

            return StatusCode(201, new
            {
                message = "Lowongan berhasil disimpan.",
                bookmark = new
                {
                    bookmark.BookmarkId,
                    bookmark.JobId,
                    bookmark.UserId,
                    bookmark.CreatedAt
                }
            });
        }

        // GET: api/bookmarks/my
        [HttpGet("my")]
        public IActionResult GetMyBookmarks()
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

            var bookmarks = _context.JobBookmarks
                .Where(b => b.UserId == userId)
                .OrderByDescending(b => b.CreatedAt)
                .Select(b => new
                {
                    b.BookmarkId,
                    b.CreatedAt,
                    job = new
                    {
                        b.Job!.JobId,
                        b.Job.Title,
                        b.Job.CompanyName,
                        b.Job.Location,
                        b.Job.JobType,
                        b.Job.SalaryMin,
                        b.Job.SalaryMax
                    }
                })
                .ToList();

            return Ok(bookmarks);
        }
    }
}