import { api } from "@/lib/api";
import type { IncomeResponse, CreateIncomeRequest, UpdateIncomeRequest } from "@/types/api";

export const incomesService = {
  // GET /incomes/byMonth?date=YYYY-MM
  getByMonth: (month: string, token: string) =>
    api.get<IncomeResponse[]>(`/incomes/byMonth?date=${month}`, { token }),

  // POST /incomes
  create: (data: CreateIncomeRequest, token: string) =>
    api.post<IncomeResponse>("/incomes", data, { token }),

  // PATCH /incomes/{id}
  update: (id: number, data: UpdateIncomeRequest, token: string) =>
    api.patch<IncomeResponse>(`/incomes/${id}`, data, { token }),

  // DELETE /incomes/{id}
  remove: (id: number, token: string) =>
    api.delete<{ message: string }>(`/incomes/${id}`, { token }),
};
