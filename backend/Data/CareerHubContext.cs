using Microsoft.EntityFrameworkCore;
using backend.Models;

namespace backend.Data
{
    public class CareerHubContext : DbContext
    {
        public CareerHubContext(DbContextOptions<CareerHubContext> options)
            : base(options)
        {
        }

        public DbSet<User> Users { get; set; }

        public DbSet<Role> Roles { get; set; }

        public DbSet<Job> Jobs { get; set; }

        public DbSet<JobApplication> JobApplications { get; set; }

        public DbSet<JobBookmark> JobBookmarks { get; set; }
    }
}