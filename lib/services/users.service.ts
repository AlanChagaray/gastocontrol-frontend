import { api } from "@/lib/api";
import type { UserResponse, UpdateProfileRequest, ChangePasswordRequest, MessageResponse } from "@/types/api";

// El backend expone GET /api/auth/me y devuelve { user: {...} } con un único campo `name`.
type RawUser = { id: number; name?: string; email: string; email_verified_at: string | null; created_at: string; provider?: string | null };

export const usersService = {
  getProfile: async (token: string): Promise<UserResponse> => {
    const { user } = await api.get<{ user: RawUser }>("/auth/me", { token });
    const name = (user.name ?? "").trim();
    const [first, ...rest] = name.split(/\s+/);
    return {
      ...user,
      first_name: first ?? "",
      last_name: rest.join(" "),
      full_name: name,
      provider: user.provider ?? null,
    };
  },
  updateProfile:  (data: UpdateProfileRequest, token: string)      => api.patch<UserResponse>("/user/me", data, { token }),
  changePassword: (data: ChangePasswordRequest, token: string)     => api.patch<MessageResponse>("/user/me/password", data, { token }),
  deleteAccount:  (token: string)                                  => api.delete<MessageResponse>("/user/me", { token }),
};
