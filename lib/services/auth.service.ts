import { api, API_URL } from "@/lib/api";
import type { LoginRequest, RegisterRequest, AuthResponse, MessageResponse, UserResponse } from "@/types/api";

export const authService = {
  login:    (data: LoginRequest)    => api.post<AuthResponse>("/auth/login", data),
  register: (data: RegisterRequest) => api.post<MessageResponse>("/auth/register", data),
  logout:   (token: string)         => api.post<MessageResponse>("/auth/logout", {}, { token }),
  me:       (token: string)         => api.get<{ user: UserResponse }>("/auth/me", { token }),
  googleRedirectUrl: ()             => `${API_URL}/auth/google/redirect`,
};
