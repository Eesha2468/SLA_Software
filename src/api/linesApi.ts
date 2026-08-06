import { API_BASE_URL, getAuthHeaders } from './apiConfig';

export interface LineDTO {
  line_id: number;
  guid?: string;
  org_id: number;
  org_name?: string;
  line_name: string;
  description?: string;
  line_abbrevation: string;
  line_color?: string;
  line_city?: string;
  line_type?: string;
  created_at?: string;
  updated_at?: string;
}

export const fetchLines = async (): Promise<LineDTO[]> => {
  const response = await fetch(`${API_BASE_URL}/lines?line_id=ALL`, { headers: getAuthHeaders() });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch lines');
  }
  return response.json();
};

export const createLine = async (data: Omit<LineDTO, 'line_id'>): Promise<LineDTO> => {
  const response = await fetch(`${API_BASE_URL}/lines`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create line');
  }
  return response.json();
};

export const updateLine = async (data: LineDTO): Promise<LineDTO> => {
  const response = await fetch(`${API_BASE_URL}/lines`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update line');
  }
  return response.json();
};

export const deleteLine = async (line_id: number): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/lines/${line_id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to delete line');
  }
};
