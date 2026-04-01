/**
 * Types được orval tự sinh từ OpenAPI spec — KHÔNG sửa tay ở đây.
 * Dùng trực tiếp từ: import { UserDto, LoginDto, ... } from '../api/api-generated'
 *
 * File này chỉ chứa các type CHƯA có controller/endpoint (Post, Comment, Message, Notification).
 * Khi controller tương ứng được tạo ở backend → `npm run generate:api` → xóa type ở đây.
 */

// Re-export từ generated để code cũ không bị break
export type {
  UserDto,
  RegisterDto,
  LoginDto,
  AuthResponseDto,
  ApiResponseOfAuthResponseDto,
  ApiResponseOfUserDto,
} from '../api/api-generated';

// ============================================================
// Wrappers — chưa được generate vì chưa có generic endpoint
// ============================================================

export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  hasNextPage: boolean;
}

// ============================================================
// User — types phụ chưa có trong generated
// ============================================================

/** Dùng khi embed trong PostDto, CommentDto, v.v. */
export interface UserSummaryDto {
  id: number;
  username: string;
  fullName?: string | null;
  avatarUrl?: string | null;
  followersCount?: number;
  isFollowing?: boolean;
  displayedBadge?: import('../api/api-generated').UserBadgeDto | null;
}

export interface UpdateUserDto {
  fullName?: string;
  bio?: string;
  avatarUrl?: string;
  coverUrl?: string;
  dateOfBirth?: string;
}

// ============================================================
// Post — thêm khi PostController được implement
// ============================================================

export interface PostDto {
  id: number;
  user: UserSummaryDto;
  content: string;
  imageUrl?: string | null;
  videoUrl?: string | null;
  createdAt: string;
  updatedAt: string;
  likesCount: number;
  commentsCount: number;
  isLiked: boolean;
  myReaction?: string | null;
  reactionCounts?: Record<string, number>;
  hashtags?: string[];
}

export interface CreatePostDto {
  content: string;
  imageUrl?: string;
}

export interface UpdatePostDto {
  content: string;
  imageUrl?: string;
}

// ============================================================
// Comment — thêm khi CommentController được implement
// ============================================================

export interface CommentDto {
  id: number;
  postId: number;
  user: UserSummaryDto;
  content: string;
  parentId?: number | null;
  createdAt: string;
  repliesCount: number;
}

export interface CreateCommentDto {
  postId: number;
  content: string;
  parentId?: number;
}

// ============================================================
// Message — thêm khi MessageController được implement
// ============================================================

export interface MessageDto {
  id: number;
  conversationId: number;
  senderId: number;
  content: string;
  isRead: boolean;
  createdAt: string;
}

export interface ConversationDto {
  id: number;
  createdAt: string;
  participants: UserSummaryDto[];
  lastMessage?: MessageDto | null;
  unreadCount: number;
}

export interface CreateMessageDto {
  conversationId: number;
  content: string;
}

// ============================================================
// Notification — thêm khi NotificationController được implement
// ============================================================

export type NotificationType = 'like' | 'comment' | 'follow' | 'reply';

export interface NotificationDto {
  id: number;
  actor: UserSummaryDto;
  notificationType: NotificationType;
  entityId?: number | null;
  isRead: boolean;
  createdAt: string;
}

