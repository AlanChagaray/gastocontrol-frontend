import { api } from "@/lib/api";
import type { ExpenseResponse, ExpenseSummaryResponse, CreateExpenseRequest } from "@/types/api";

export const expensesService = {
  // GET /expenses/byMonth?date=YYYY-MM
  getByMonth: (month: string, token: string) =>
    api.get<ExpenseResponse[]>(`/expenses/byMonth?date=${month}`, { token }),

  // GET /expenses/summary?date=YYYY-MM
  getSummary: (month: string, token: string) =>
    api.get<ExpenseSummaryResponse>(`/expenses/summary?date=${month}`, { token }),

  // POST /expenses
  create: (data: CreateExpenseRequest, token: string) =>
    api.post<ExpenseResponse>("/expenses", data, { token }),

  // DELETE /expenses/:id
  remove: (id: number, token: string) =>
    api.delete<void>(`/expenses/${id}`, { token }),
};
