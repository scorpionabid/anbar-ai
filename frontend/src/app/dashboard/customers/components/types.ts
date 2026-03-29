import type { Customer } from "@/types/api";

export interface CustomerForm {
  customer_type: "individual" | "company";
  name: string;
  email: string;
  phone: string;
  tax_number: string;
  address: string;
  notes: string;
  is_active: boolean;
}

export const emptyForm: CustomerForm = {
  customer_type: "individual",
  name: "",
  email: "",
  phone: "",
  tax_number: "",
  address: "",
  notes: "",
  is_active: true,
};
