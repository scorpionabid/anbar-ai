import type { Supplier } from "@/types/api";

export interface SupplierForm {
  name: string;
  email: string;
  phone: string;
  contact_name: string;
  address: string;
  tax_number: string;
  payment_terms_days: number;
  notes: string;
  is_active: boolean;
}

export const emptyForm: SupplierForm = {
  name: "",
  email: "",
  phone: "",
  contact_name: "",
  address: "",
  tax_number: "",
  payment_terms_days: 30,
  notes: "",
  is_active: true,
};
