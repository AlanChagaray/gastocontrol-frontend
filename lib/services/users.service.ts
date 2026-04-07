import { api } from "@/lib/api";
import type { UserResponse, UpdateProfileRequest, ChangePasswordRequest, MonthlyIncomeResponse, UpdateIncomeRequest, MessageResponse } from "@/types/api";

export const usersService = {
  getProfile:     (token: string)                                  => api.get<UserResponse>("/user/me", { token }),
  updateProfile:  (data: UpdateProfileRequest, token: string)      => api.patch<UserResponse>("/user/me", data, { token }),
  changePassword: (data: ChangePasswordRequest, token: string)     => api.patch<MessageResponse>("/user/me/password", data, { token }),
  getIncome:      (month: string, token: string)                   => api.get<MonthlyIncomeResponse>(`/user/income?date=${month}`, { token }),
  updateIncome:   (month: string, data: UpdateIncomeRequest, token: string) => api.put<MonthlyIncomeResponse>(`/user/income?date=${month}`, data, { token }),
  deleteAccount:  (token: string)                                  => api.delete<MessageResponse>("/user/me", { token }),
};
