using System.ComponentModel.DataAnnotations;

namespace backend.DTOs
{
    public class RegisterRequest
    {
        [Required(ErrorMessage = "Nama lengkap wajib diisi.")]
        public string FullName { get; set; } = string.Empty;

        [Required(ErrorMessage = "Email wajib diisi.")]
        [EmailAddress(ErrorMessage = "Format email tidak valid.")]
        public string Email { get; set; } = string.Empty;

        [Required(ErrorMessage = "Password wajib diisi.")]
        [RegularExpression(
            @"^(?=.*[A-Za-z])(?=.*\d).{6,}$",
            ErrorMessage = "Password minimal 6 karakter dan harus mengandung huruf serta angka."
        )]
        public string Password { get; set; } = string.Empty;

        public string? Phone { get; set; }
    }
}