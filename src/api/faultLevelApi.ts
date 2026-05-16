export interface FaultLevelCategoryDTO {
  fl_category_id: number;
  guid?: string;
  fl_name?: string;
  fl_desc?: string;
  resolution_time?: string;
  kpi_main_cat_id?: number;
  kpi_sub_category_id?: number;
  sp_id?: number;
  line_id?: number;
}

const API_BASE_URL = 'http://localhost:5000/api';

export const fetchFaultLevelCategories = async (): Promise<FaultLevelCategoryDTO[]> => {
  const response = await fetch(`${API_BASE_URL}/fault-level-categories?fl_category_id=ALL`);
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch fault level categories');
  }
  return response.json();
};

export const createFaultLevelCategory = async (data: Omit<FaultLevelCategoryDTO, 'fl_category_id'>): Promise<FaultLevelCategoryDTO> => {
  const response = await fetch(`${API_BASE_URL}/fault-level-categories`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create fault level category');
  }
  return response.json();
};

export const updateFaultLevelCategory = async (data: FaultLevelCategoryDTO): Promise<FaultLevelCategoryDTO> => {
  const response = await fetch(`${API_BASE_URL}/fault-level-categories`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update fault level category');
  }
  return response.json();
};

export const deleteFaultLevelCategory = async (fl_category_id: number): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/fault-level-categories/${fl_category_id}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to delete fault level category');
  }
};
