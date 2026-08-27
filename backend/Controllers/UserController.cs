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

        public UserController(CareerHubContext context)
        {
            _context = context;
        }

        // GET PROFILE
        [HttpGet("me")]
        public IActionResult GetProfile()
        {
            var email = User.FindFirst(ClaimTypes.Email)?.Value;

            if (email == null)
                return Unauthorized();

            var user = _context.Users.FirstOrDefault(u => u.Email == email);

            if (user == null)
                return NotFound();

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

        // UPDATE PROFILE
        [HttpPut("update")]
        public IActionResult UpdateProfile(UpdateProfileRequest request)
        {
            var email = User.FindFirst(ClaimTypes.Email)?.Value;

            if (email == null)
                return Unauthorized();

            var user = _context.Users.FirstOrDefault(u => u.Email == email);

            if (user == null)
                return NotFound();

            user.FullName = request.FullName;
            user.Phone = request.Phone;

            _context.SaveChanges();

            return Ok(new
            {
                message = "Profile berhasil diperbarui.",
                user = new
                {
                    user.UserId,
                    user.FullName,
                    user.Email,
                    user.Phone
                }
            });
        }
    }
}