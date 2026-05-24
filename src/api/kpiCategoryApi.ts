export interface KPICategoryDTO {
  kpi_main_cat_id: number;
  guid?: string;
  weight?: number;
  kpi_status?: string;
  kpi_name: string;
  sp_id: number;
  sp_name?: string;
  line_id: number;
  line_name?: string;
  kpi_desc?: string;
}

const API_BASE_URL = '/api';

export const fetchKPICategories = async (): Promise<KPICategoryDTO[]> => {
  const response = await fetch(`${API_BASE_URL}/kpi-categories?kpi_main_cat_id=ALL`);
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch KPI categories');
  }
  return response.json();
};

export const createKPICategory = async (data: Omit<KPICategoryDTO, 'kpi_main_cat_id'>): Promise<KPICategoryDTO> => {
  const response = await fetch(`${API_BASE_URL}/kpi-categories`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create KPI category');
  }
  return response.json();
};

export const updateKPICategory = async (data: KPICategoryDTO): Promise<KPICategoryDTO> => {
  const response = await fetch(`${API_BASE_URL}/kpi-categories`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update KPI category');
  }
  return response.json();
};

export const deleteKPICategory = async (kpi_main_cat_id: number): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/kpi-categories/${kpi_main_cat_id}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to delete KPI category');
  }
};
