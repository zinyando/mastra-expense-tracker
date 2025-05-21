import { create } from "zustand";
import { PaymentMethod } from "@/types";
import * as api from "@/utils/api";

interface PaymentMethodState {
  paymentMethods: PaymentMethod[];
  isLoading: boolean;
  error: Error | null;
  fetchPaymentMethods: () => Promise<void>;
  addPaymentMethod: (
    methodData: Omit<PaymentMethod, "id">
  ) => Promise<PaymentMethod | undefined>;
  updatePaymentMethod: (
    id: string,
    methodData: Partial<Omit<PaymentMethod, "id">>
  ) => Promise<PaymentMethod | undefined>;
  deletePaymentMethod: (id: string) => Promise<void>;
  setDefaultPaymentMethod: (id: string) => Promise<void>;
}

export const usePaymentMethodStore = create<PaymentMethodState>((set, get) => ({
  paymentMethods: [],
  isLoading: false,
  error: null,

  fetchPaymentMethods: async () => {
    set({ isLoading: true, error: null });
    try {
      const { paymentMethods } = await api.getPaymentMethods();
      set({ paymentMethods, isLoading: false });
    } catch (error) {
      console.error("Failed to fetch payment methods:", error);
      set({
        isLoading: false,
        error:
          error instanceof Error
            ? error
            : new Error("Failed to fetch payment methods"),
      });
    }
  },

  addPaymentMethod: async (methodData) => {
    set({ isLoading: true, error: null });
    try {
      const newMethod = await api.createPaymentMethod(methodData);
      set((state) => ({
        paymentMethods: [...state.paymentMethods, newMethod],
        isLoading: false,
      }));
      // If the new method is default, update others
      if (newMethod.isDefault) {
        set((state) => ({
          paymentMethods: state.paymentMethods.map((pm) =>
            pm.id === newMethod.id ? newMethod : { ...pm, isDefault: false }
          ),
        }));
      }
      return newMethod;
    } catch (error) {
      console.error("Failed to add payment method:", error);
      set({
        isLoading: false,
        error:
          error instanceof Error
            ? error
            : new Error("Failed to add payment method"),
      });
      return undefined;
    }
  },

  updatePaymentMethod: async (id, methodData) => {
    set({ isLoading: true, error: null });
    try {
      const updatedMethod = await api.updatePaymentMethod(id, methodData);
      set((state) => ({
        paymentMethods: state.paymentMethods.map((pm) =>
          pm.id === id ? { ...pm, ...updatedMethod } : pm
        ),
        isLoading: false,
      }));
      // If the updated method is now default, update others
      if (updatedMethod.isDefault) {
        set((state) => ({
          paymentMethods: state.paymentMethods.map((pm) =>
            pm.id === updatedMethod.id
              ? updatedMethod
              : { ...pm, isDefault: false }
          ),
        }));
      }
      return updatedMethod;
    } catch (error) {
      console.error("Failed to update payment method:", error);
      set({
        isLoading: false,
        error:
          error instanceof Error
            ? error
            : new Error("Failed to update payment method"),
      });
      return undefined;
    }
  },

  deletePaymentMethod: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await api.deletePaymentMethod(id);
      set((state) => ({
        paymentMethods: state.paymentMethods.filter((pm) => pm.id !== id),
        isLoading: false,
      }));
    } catch (error) {
      console.error("Failed to delete payment method:", error);
      set({
        isLoading: false,
        error:
          error instanceof Error
            ? error
            : new Error("Failed to delete payment method"),
      });
    }
  },

  setDefaultPaymentMethod: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      // Call updatePaymentMethod to set the isDefault flag
      const updatedDefaultMethod = await api.updatePaymentMethod(id, { isDefault: true });
      
      // If the API call is successful and returns the updated method
      if (updatedDefaultMethod) {
        set((state) => ({
          paymentMethods: state.paymentMethods.map((pm) => ({
            ...pm,
            // Set the current one as default, others as not default
            isDefault: pm.id === updatedDefaultMethod.id,
          })),
          isLoading: false,
        }));
      } else {
        // Fallback or error if updatedDefaultMethod is not returned as expected
        // This case might indicate an issue with the API or local logic not aligning
        // For now, we'll assume the API returns the updated method and handles unsetting others.
        // If not, the store's updatePaymentMethod logic already handles updating other methods if 'isDefault' is true.
        // To be safe, refetch or manually ensure other defaults are false if API doesn't manage it.
        console.warn('setDefaultPaymentMethod: updatedDefaultMethod was not returned, relying on API to unset other defaults.');
        // Re-fetch to ensure consistency if API behavior is uncertain
        // get().fetchPaymentMethods(); 
        // Or, more directly, assume the specific one is now default:
        set((state) => ({
            paymentMethods: state.paymentMethods.map((pm) => ({
                ...pm,
                isDefault: pm.id === id,
            })),
            isLoading: false,
        }));
      }
    } catch (error) {
      console.error("Failed to set default payment method:", error);
      set({
        isLoading: false,
        error:
          error instanceof Error
            ? error
            : new Error("Failed to set default payment method"),
      });
    }
  },
}));
