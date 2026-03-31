import api from './axios';
import type { ApiResponseOfUploadResultDto } from './api-generated';

// ─── Types ────────────────────────────────────────────────────────────────

export interface StoryDto {
  id: number;
  userId: number;
  username: string;
  fullName?: string | null;
  avatarUrl?: string | null;
  mediaUrl: string;
  mediaType: string;
  caption?: string | null;
  createdAt: string;
  expiresAt: string;
  viewCount: number;
  isViewed: boolean;
}

export interface StoryGroupDto {
  userId: number;
  username: string;
  fullName?: string | null;
  avatarUrl?: string | null;
  hasUnviewed: boolean;
  stories: StoryDto[];
}

export interface StoryViewerDto {
  userId: number;
  username: string;
  fullName?: string | null;
  avatarUrl?: string | null;
  viewedAt: string;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string | null;
}

// ─── API calls ────────────────────────────────────────────────────────────

export async function getStoryFeed(): Promise<StoryGroupDto[]> {
  const res = await api.get<ApiResponse<StoryGroupDto[]>>('/api/Stories');
  return res.data.data;
}

export async function getMyStories(): Promise<StoryDto[]> {
  const res = await api.get<ApiResponse<StoryDto[]>>('/api/Stories/me');
  return res.data.data;
}

export async function createStory(body: { mediaUrl: string; mediaType: string; caption?: string }): Promise<StoryDto> {
  const res = await api.post<ApiResponse<StoryDto>>('/api/Stories', body);
  return res.data.data;
}

export async function markStoryViewed(storyId: number): Promise<void> {
  await api.post(`/api/Stories/${storyId}/view`);
}

export async function getStoryViewers(storyId: number): Promise<StoryViewerDto[]> {
  const res = await api.get<ApiResponse<StoryViewerDto[]>>(`/api/Stories/${storyId}/viewers`);
  return res.data.data;
}

export async function deleteStory(storyId: number): Promise<void> {
  await api.delete(`/api/Stories/${storyId}`);
}

// ─── Video Upload ─────────────────────────────────────────────────────────

export async function uploadVideo(file: File): Promise<ApiResponseOfUploadResultDto> {
  const formData = new FormData();
  formData.append('file', file);
  const res = await api.post<ApiResponseOfUploadResultDto>('/api/Upload/video', formData, {
    timeout: 120_000, // 2 phút cho video lớn
  });
  return res.data;
}

// ─── Reels ────────────────────────────────────────────────────────────────

export interface ReelPostDto {
  id: number;
  user: { id: number; username: string; fullName?: string | null; avatarUrl?: string | null };
  content: string;
  videoUrl: string;
  likesCount: number;
  commentsCount: number;
  isLiked: boolean;
  myReaction?: string | null;
}

export async function getReels(count = 10): Promise<ReelPostDto[]> {
  const res = await api.get<ApiResponse<ReelPostDto[]>>('/api/Posts/reels', { params: { count } });
  return res.data.data;
}
