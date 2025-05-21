import { create } from "zustand";
import { Category } from "@/types";
import * as api from "@/utils/api";

interface CategoryState {
  categories: Category[];
  isLoading: boolean;
  error: Error | null;
  fetchCategories: () => Promise<void>;
  addCategory: (
    categoryData: Omit<Category, "id">
  ) => Promise<Category | undefined>;
  updateCategory: (
    id: string,
    categoryData: Partial<Omit<Category, "id">>
  ) => Promise<Category | undefined>;
  deleteCategory: (id: string) => Promise<void>;
}

export const useCategoryStore = create<CategoryState>((set, get) => ({
  categories: [],
  isLoading: false,
  error: null,

  fetchCategories: async () => {
    set({ isLoading: true, error: null });
    try {
      const { categories } = await api.getCategories();
      set({ categories, isLoading: false });
    } catch (error) {
      console.error("Failed to fetch categories:", error);
      set({
        isLoading: false,
        error:
          error instanceof Error
            ? error
            : new Error("Failed to fetch categories"),
      });
    }
  },

  addCategory: async (categoryData) => {
    set({ isLoading: true, error: null });
    try {
      const newCategory = await api.createCategory(categoryData);
      set((state) => ({
        categories: [...state.categories, newCategory],
        isLoading: false,
      }));
      return newCategory;
    } catch (error) {
      console.error("Failed to add category:", error);
      set({
        isLoading: false,
        error:
          error instanceof Error ? error : new Error("Failed to add category"),
      });
      return undefined;
    }
  },

  updateCategory: async (id, categoryData) => {
    set({ isLoading: true, error: null });
    try {
      const updatedCategory = await api.updateCategory(id, categoryData);
      set((state) => ({
        categories: state.categories.map((cat) =>
          cat.id === id ? { ...cat, ...updatedCategory } : cat
        ),
        isLoading: false,
      }));
      return updatedCategory;
    } catch (error) {
      console.error("Failed to update category:", error);
      set({
        isLoading: false,
        error:
          error instanceof Error
            ? error
            : new Error("Failed to update category"),
      });
      return undefined;
    }
  },

  deleteCategory: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await api.deleteCategory(id);
      set((state) => ({
        categories: state.categories.filter((cat) => cat.id !== id),
        isLoading: false,
      }));
    } catch (error) {
      console.error("Failed to delete category:", error);
      set({
        isLoading: false,
        error:
          error instanceof Error
            ? error
            : new Error("Failed to delete category"),
      });
    }
  },
}));
