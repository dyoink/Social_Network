using System.ComponentModel.DataAnnotations;

namespace SocialNetwork.Api.Entities
{
    /// <summary>Liên kết giữa Post và Hashtag (được parse từ content khi save).</summary>
    public class PostHashtag
    {
        public int PostId { get; set; }
        public virtual Post Post { get; set; } = null!;

        [Required, StringLength(100)]
        public string Tag { get; set; } = string.Empty;
    }
}
