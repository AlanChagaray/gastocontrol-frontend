import { api } from "@/lib/api";
import type { CategoryResponse } from "@/types/api";

export interface CreateCategoryRequest {
  name: string;
  icon: string;
  color?: string;
}

export interface UpdateCategoryRequest {
  name?: string;
  icon?: string;
  color?: string;
}

export const categoriesService = {
  // GET /categories
  getCategories: (token: string) =>
    api.get<CategoryResponse[]>("/categories", { token }),

  // POST /categories
  create: (data: CreateCategoryRequest, token: string) =>
    api.post<CategoryResponse>("/categories", data, { token }),

  // PUT /categories/{id}
  update: (id: number, data: UpdateCategoryRequest, token: string) =>
    api.put<CategoryResponse>(`/categories/${id}`, data, { token }),

  // DELETE /categories/{id}
  delete: (id: number, token: string) =>
    api.delete<{ message: string }>(`/categories/${id}`, { token }),
};