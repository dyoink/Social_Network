/**
 * Định dạng thời gian tương đối từ ISO timestamp.
 * Ví dụ: "2 giờ trước", "5 phút trước", "hôm qua"
 */
export function timeAgo(iso: string | undefined): string {
  if (!iso) return '';
  const now = Date.now();
  const diff = now - new Date(iso).getTime(); // ms
  const mins  = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days  = Math.floor(diff / 86_400_000);

  if (mins  < 1)  return 'Vừa xong';
  if (mins  < 60) return `${mins} phút trước`;
  if (hours < 24) return `${hours} giờ trước`;
  if (days  < 7)  return `${days} ngày trước`;

  return new Date(iso).toLocaleDateString('vi-VN');
}

/**
 * Format số cho hiển thị ngắn gọn.
 * Ví dụ: 1200 → "1.2k", 4500000 → "4.5m"
 */
export function formatCount(n: number | string | undefined): string {
  const num = Number(n ?? 0);
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}m`;
  if (num >= 1_000)     return `${(num / 1_000).toFixed(1)}k`;
  return String(num);
}
