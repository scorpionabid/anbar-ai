import type { Category } from "@/types/api";

export interface CategoryForm {
  name: string;
  description: string;
  parent_id: string;
  is_active: boolean;
}

export const emptyForm: CategoryForm = {
  name: "",
  description: "",
  parent_id: "",
  is_active: true,
};
