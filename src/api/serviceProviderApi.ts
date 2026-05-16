export interface ServiceProviderDTO {
  sp_id: number;
  guid?: string;
  sp_name: string;
  service_category?: string;
  address?: string;
  active: boolean; // mapped to "active   " in DB
  sp_contact_no?: string;
  sp_abbreviation?: string;
}

const API_BASE_URL = 'http://localhost:5000/api';

export const fetchServiceProviders = async (): Promise<ServiceProviderDTO[]> => {
  const response = await fetch(`${API_BASE_URL}/service-providers?sp_id=ALL`);
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch service providers');
  }
  const data = await response.json();
  // Map the weirdly named column from DB back to 'active' for frontend
  return data.map((item: any) => ({
    ...item,
    active: item['active   ']
  }));
};

export const createServiceProvider = async (data: Omit<ServiceProviderDTO, 'sp_id'>): Promise<ServiceProviderDTO> => {
  const response = await fetch(`${API_BASE_URL}/service-providers`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create service provider');
  }
  return response.json();
};

export const updateServiceProvider = async (data: ServiceProviderDTO): Promise<ServiceProviderDTO> => {
  const response = await fetch(`${API_BASE_URL}/service-providers`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update service provider');
  }
  return response.json();
};

export const deleteServiceProvider = async (sp_id: number): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/service-providers/${sp_id}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to delete service provider');
  }
};
