import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { UserDto } from '../api/api-generated';

interface AuthState {
  user: UserDto | null;
  accessToken: string | null;
  isAuthenticated: boolean;
}

interface AuthActions {
  /** Lưu thông tin user và token sau khi đăng nhập / đăng ký thành công */
  setAuth: (user: UserDto, accessToken: string) => void;
  /** Cập nhật một phần thông tin user (dùng sau khi edit profile) */
  updateUser: (partial: Partial<UserDto>) => void;
  /** Đăng xuất — xóa toàn bộ auth state */
  logout: () => void;
}

type AuthStore = AuthState & AuthActions;

const initialState: AuthState = {
  user: null,
  accessToken: null,
  isAuthenticated: false,
};

const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      ...initialState,

      setAuth: (user, accessToken) =>
        set({ user, accessToken, isAuthenticated: true }),

      updateUser: (partial) =>
        set((state) =>
          state.user ? { user: { ...state.user, ...partial } } : {}
        ),

      logout: () => set(initialState),
    }),
    {
      name: 'auth-storage', // phải khớp với key axios.ts đọc từ localStorage
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

export default useAuthStore;
