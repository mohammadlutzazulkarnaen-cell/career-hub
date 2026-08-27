namespace backend.DTOs
{
    public class CreateJobRequest
    {
        public string Title { get; set; } = string.Empty;

        public string CompanyName { get; set; } = string.Empty;

        public string Location { get; set; } = string.Empty;

        public string JobType { get; set; } = string.Empty;

        public string Description { get; set; } = string.Empty;

        public string? Requirements { get; set; }

        public decimal? SalaryMin { get; set; }

        public decimal? SalaryMax { get; set; }
    }
}