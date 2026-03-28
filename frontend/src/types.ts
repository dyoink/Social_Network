export type View = 'newsfeed' | 'profile' | 'messenger' | 'search' | 'notifications';

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
  name: string;
  avatar: string;
  cover: string;
  bio: string;
  following: string;
  followers: string;
  posts: string;
  role: string;
  isFollowing?: boolean;
}
