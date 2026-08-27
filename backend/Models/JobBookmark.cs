using System;
using System.ComponentModel.DataAnnotations;

namespace backend.Models
{
    public class JobBookmark
    {
        [Key]
        public int BookmarkId { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public int JobId { get; set; }

        public Job? Job { get; set; }

        public int UserId { get; set; }

        public User? User { get; set; }
    }
}