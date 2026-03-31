import type { UserBadgeDto } from './api/api-generated';

export type View = 'newsfeed' | 'profile' | 'messenger' | 'search' | 'notifications' | 'admin' | 'hashtag' | 'settings' | 'reels';

export interface Post {
  id: string;
  author: {
    id: string;
    name: string;
    avatar: string;
    role?: string;
  };
  time: string;
  content: string;
  image?: string;
  reactions: number;
  comments: number;
  shares: number;
  isLiked?: boolean;
}

export interface UserProfile {
  id: string;
  username: string;
  name: string;
  avatar: string;
  cover: string;
  bio: string;
  following: string;
  followers: string;
  posts: string;
  role: string;
  isFollowing?: boolean;
  createdAt?: string;
  dateOfBirth?: string;
  hometown?: string;
  gender?: string;
  displayedBadge?: UserBadgeDto | null;
}
