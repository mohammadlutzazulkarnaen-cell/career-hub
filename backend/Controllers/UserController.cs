using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using backend.Data;
using backend.DTOs;

namespace backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class UserController : ControllerBase
    {
        private readonly CareerHubContext _context;
        private readonly IWebHostEnvironment _environment;

        public UserController(
            CareerHubContext context,
            IWebHostEnvironment environment)
        {
            _context = context;
            _environment = environment;
        }

        [HttpGet("me")]
        public IActionResult GetProfile()
        {
            var email = User.FindFirst(ClaimTypes.Email)?.Value;

            if (email == null)
            {
                return Unauthorized();
            }

            var user = _context.Users
                .FirstOrDefault(u => u.Email == email);

            if (user == null)
            {
                return NotFound();
            }

            return Ok(new
            {
                user.UserId,
                user.FullName,
                user.Email,
                user.Phone,
                user.RoleId,
                user.ProfilePicture,
                user.CreatedAt
            });
        }

        [HttpPut("update")]
        public IActionResult UpdateProfile(
            UpdateProfileRequest request)
        {
            var email = User.FindFirst(ClaimTypes.Email)?.Value;

            if (email == null)
            {
                return Unauthorized();
            }

            var user = _context.Users
                .FirstOrDefault(u => u.Email == email);

            if (user == null)
            {
                return NotFound();
            }

            if (string.IsNullOrWhiteSpace(request.FullName))
            {
                return BadRequest(new
                {
                    message = "Nama lengkap wajib diisi."
                });
            }

            user.FullName = request.FullName.Trim();
            user.Phone = request.Phone?.Trim();

            _context.SaveChanges();

            return Ok(new
            {
                message = "Profil berhasil diperbarui.",
                user = new
                {
                    user.UserId,
                    user.FullName,
                    user.Email,
                    user.Phone,
                    user.ProfilePicture
                }
            });
        }

        [HttpPut("change-password")]
        public IActionResult ChangePassword(
            ChangePasswordRequest request)
        {
            var email = User.FindFirst(ClaimTypes.Email)?.Value;

            if (email == null)
            {
                return Unauthorized();
            }

            var user = _context.Users
                .FirstOrDefault(u => u.Email == email);

            if (user == null)
            {
                return NotFound();
            }

            if (string.IsNullOrWhiteSpace(request.CurrentPassword) ||
                string.IsNullOrWhiteSpace(request.NewPassword))
            {
                return BadRequest(new
                {
                    message = "Password lama dan password baru wajib diisi."
                });
            }

            if (!BCrypt.Net.BCrypt.Verify(
                request.CurrentPassword,
                user.PasswordHash))
            {
                return BadRequest(new
                {
                    message = "Password lama salah."
                });
            }

            if (request.NewPassword.Length < 6 ||
                !request.NewPassword.Any(char.IsLetter) ||
                !request.NewPassword.Any(char.IsDigit))
            {
                return BadRequest(new
                {
                    message =
                        "Password baru minimal 6 karakter dan harus mengandung huruf serta angka."
                });
            }

            user.PasswordHash =
                BCrypt.Net.BCrypt.HashPassword(
                    request.NewPassword);

            _context.SaveChanges();

            return Ok(new
            {
                message = "Password berhasil diubah."
            });
        }

        [HttpPost("profile-picture")]
        public IActionResult UploadProfilePicture(
            IFormFile file)
        {
            var email = User.FindFirst(ClaimTypes.Email)?.Value;

            if (email == null)
            {
                return Unauthorized();
            }

            var user = _context.Users
                .FirstOrDefault(u => u.Email == email);

            if (user == null)
            {
                return NotFound();
            }

            if (file == null || file.Length == 0)
            {
                return BadRequest(new
                {
                    message = "File foto wajib dipilih."
                });
            }

            if (file.Length > 5 * 1024 * 1024)
            {
                return BadRequest(new
                {
                    message = "Ukuran foto maksimal 5 MB."
                });
            }

            var allowedExtensions = new[]
            {
                ".jpg",
                ".jpeg",
                ".png",
                ".webp"
            };

            var extension = Path
                .GetExtension(file.FileName)
                .ToLowerInvariant();

            if (!allowedExtensions.Contains(extension))
            {
                return BadRequest(new
                {
                    message = "Format foto harus JPG, PNG, atau WEBP."
                });
            }

            var webRootPath = _environment.WebRootPath;

            if (string.IsNullOrWhiteSpace(webRootPath))
            {
                webRootPath = Path.Combine(
                    Directory.GetCurrentDirectory(),
                    "wwwroot");
            }

            var uploadFolder = Path.Combine(
                webRootPath,
                "uploads",
                "profiles");

            Directory.CreateDirectory(uploadFolder);

            var fileName = $"{Guid.NewGuid()}{extension}";

            var filePath = Path.Combine(
                uploadFolder,
                fileName);

            using (var stream = new FileStream(
                filePath,
                FileMode.Create))
            {
                file.CopyTo(stream);
            }

            user.ProfilePicture =
                $"/uploads/profiles/{fileName}";

            _context.SaveChanges();

            return Ok(new
            {
                message = "Foto profil berhasil diunggah.",
                profilePicture = user.ProfilePicture
            });
        }
    }
}