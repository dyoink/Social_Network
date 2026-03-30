namespace SocialNetwork.Api.Common
{
    public class PagedResult<T>
    {
        public List<T> Items { get; set; } = new();
        public int TotalCount { get; set; }
        public int Page { get; set; }
        public int PageSize { get; set; }
        public bool HasNextPage => Page * PageSize < TotalCount;

        /// <summary>Factory method tiện lợi để tạo PagedResult.</summary>
        public static PagedResult<T> Create(List<T> items, int total, int page, int pageSize) => new()
        {
            Items      = items,
            TotalCount = total,
            Page       = page,
            PageSize   = pageSize
        };
    }
}
