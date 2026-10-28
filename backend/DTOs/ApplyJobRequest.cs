using Microsoft.AspNetCore.Http;

namespace backend.DTOs
{
    public class ApplyJobRequest
    {
        public string? CoverLetter { get; set; }

        public IFormFile? CvFile { get; set; }
    }
}