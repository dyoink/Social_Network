using System;
using System.ComponentModel.DataAnnotations;

namespace SocialNetwork.Api.Entities
{
    public class Story
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int UserId { get; set; }
        public virtual User User { get; set; } = null!;

        [Required]
        public string MediaUrl { get; set; } = string.Empty;

        /// <summary>Image | Video</summary>
        [Required, StringLength(10)]
        public string MediaType { get; set; } = "Image";

        public string? Caption { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime ExpiresAt { get; set; } = DateTime.UtcNow.AddHours(24);

        // Navigation
        public virtual ICollection<StoryView> Views { get; set; } = new List<StoryView>();
    }

    public class StoryView
    {
        [Required]
        public int StoryId { get; set; }
        public virtual Story Story { get; set; } = null!;

        [Required]
        public int UserId { get; set; }
        public virtual User User { get; set; } = null!;

        public DateTime ViewedAt { get; set; } = DateTime.UtcNow;
    }
}
