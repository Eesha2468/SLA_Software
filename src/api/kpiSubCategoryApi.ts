export interface KPISubCategoryDTO {
  sub_category_id: number;
  guid?: string;
  kpi_main_cat_id: number;
  main_category_name?: string;
  sub_category_name: string;
  sp_id: number;
  sp_name?: string;
  line_id: number;
  line_name?: string;
  fl_category_id: number;
}

const API_BASE_URL = 'http://localhost:5000/api';

export const fetchKPISubCategories = async (): Promise<KPISubCategoryDTO[]> => {
  const response = await fetch(`${API_BASE_URL}/kpi-sub-categories?sub_category_id=ALL`);
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch KPI sub-categories');
  }
  return response.json();
};

export const createKPISubCategory = async (data: Omit<KPISubCategoryDTO, 'sub_category_id'>): Promise<KPISubCategoryDTO> => {
  const response = await fetch(`${API_BASE_URL}/kpi-sub-categories`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create KPI sub-category');
  }
  return response.json();
};

export const updateKPISubCategory = async (data: KPISubCategoryDTO): Promise<KPISubCategoryDTO> => {
  const response = await fetch(`${API_BASE_URL}/kpi-sub-categories`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update KPI sub-category');
  }
  return response.json();
};

export const deleteKPISubCategory = async (sub_category_id: number): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/kpi-sub-categories/${sub_category_id}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to delete KPI sub-category');
  }
};
