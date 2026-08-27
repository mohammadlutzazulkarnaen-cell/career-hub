using System;
using System.ComponentModel.DataAnnotations;

namespace backend.Models
{
    public class JobApplication
    {
        [Key]
        public int ApplicationId { get; set; }

        public string? CoverLetter { get; set; }

        public string Status { get; set; } = "Pending";

        public DateTime AppliedAt { get; set; } = DateTime.UtcNow;

        public int JobId { get; set; }

        public Job? Job { get; set; }

        public int UserId { get; set; }

        public User? User { get; set; }
    }
}