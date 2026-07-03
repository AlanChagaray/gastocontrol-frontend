// Exact shape of what the Laravel API returns

export interface UserResponse {
  id: number; first_name: string; last_name: string; email: string;
  email_verified_at: string|null; created_at: string;
  full_name?: string; provider?: string|null;
}
export interface AuthResponse { token: string; user: UserResponse; }
export interface MessageResponse { message: string; }
export interface LoginRequest { email: string; password: string; }
export interface RegisterRequest { name: string; email: string; password: string; password_confirmation: string; }
export interface UpdateProfileRequest { first_name: string; last_name: string; }
export interface ChangePasswordRequest { current_password: string; password: string; password_confirmation: string; }

export interface CategoryResponse {
  id: number; name: string; color: string; icon: string; is_default: boolean; sort_order: number;
}

export interface ExpenseResponse {
  id: number; amount: string; merchant: string|null; expense_date: string;
  notes: string|null; category: CategoryResponse; created_at: string;
}
export interface CreateExpenseRequest {
  category_id: number; amount: number; merchant?: string; expense_date: string; notes?: string;
}
export interface UpdateExpenseRequest {
  category_id?: number; amount?: number; merchant?: string; expense_date?: string; notes?: string;
}

export interface CategorySummary { category: CategoryResponse; total: string; count: number; percentage: number; }
export interface ExpenseSummaryResponse {
  month: string; total: string; count: number; income: string; balance: string;
  by_category: CategorySummary[];
}
export interface IncomeResponse { id: number; name: string; amount: string; income_date: string; }
export interface CreateIncomeRequest { name: string; amount: number; income_date: string; }
export interface UpdateIncomeRequest { name?: string; amount?: number; income_date?: string; }
