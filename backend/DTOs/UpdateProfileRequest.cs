namespace backend.DTOs
{
    public class UpdateProfileRequest
    {
        public string FullName { get; set; } = string.Empty;
        public string? Phone { get; set; }
    }
}