/**
 * Skeleton loading cho PostCard — dùng animate-pulse của Tailwind.
 * Được dùng khi feed đang tải lần đầu.
 */
export function PostCardSkeleton() {
  return (
    <div className="bg-surface-container-lowest rounded-xl p-6 animate-pulse">
      {/* Author */}
      <div className="flex gap-3 mb-5">
        <div className="w-11 h-11 rounded-full bg-surface-container-high flex-shrink-0" />
        <div className="flex-1 space-y-2 pt-1">
          <div className="h-4 bg-surface-container-high rounded w-1/3" />
          <div className="h-3 bg-surface-container-high rounded w-1/5" />
        </div>
      </div>
      {/* Content */}
      <div className="space-y-2 mb-5">
        <div className="h-4 bg-surface-container-high rounded w-full" />
        <div className="h-4 bg-surface-container-high rounded w-4/5" />
        <div className="h-4 bg-surface-container-high rounded w-3/5" />
      </div>
      {/* Actions */}
      <div className="flex gap-4 pt-4 border-t border-surface-container-low">
        <div className="h-8 bg-surface-container-high rounded-full w-20" />
        <div className="h-8 bg-surface-container-high rounded-full w-20" />
      </div>
    </div>
  );
}

export default PostCardSkeleton;
