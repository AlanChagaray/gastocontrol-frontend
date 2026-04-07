import { api } from "@/lib/api";
import type { CategoryResponse } from "@/types/api";

export const categoriesService = {
  // GET /categories
  getCategories: (token: string) =>
    api.get<CategoryResponse[]>("/categories", { token }),
};