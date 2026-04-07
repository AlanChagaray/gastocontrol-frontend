import { api } from "@/lib/api";
import type { LoginRequest, RegisterRequest, AuthResponse, MessageResponse } from "@/types/api";

export const authService = {
  login:    (data: LoginRequest)    => api.post<AuthResponse>("/auth/login", data),
  register: (data: RegisterRequest) => api.post<MessageResponse>("/auth/register", data),
  logout:   (token: string)         => api.post<MessageResponse>("/auth/logout", {}, { token }),
};
