export interface OrganizationDTO {
  org_id: number;
  guid?: string;
  org_name: string;
  org_description?: string;
  org_abbrevation: string;
  org_address: string;
  org_contact_no: string;
  org_parent?: string;
  created_at?: string;
  updated_at?: string;
}

const API_BASE_URL = 'http://localhost:5000/api';

export const fetchOrganizations = async (line_id?: number | string): Promise<OrganizationDTO[]> => {
  const url = new URL(`${API_BASE_URL}/organization`);
  if (line_id) {
    url.searchParams.append('line_id', String(line_id));
  } else {
    url.searchParams.append('org_id', 'ALL');
  }
  
  const response = await fetch(url.toString());
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch organizations');
  }
  return response.json();
};

export const createOrganization = async (data: Omit<OrganizationDTO, 'org_id'>): Promise<OrganizationDTO> => {
  const response = await fetch(`${API_BASE_URL}/organization`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create organization');
  }
  return response.json();
};

export const updateOrganization = async (data: OrganizationDTO): Promise<OrganizationDTO> => {
  const response = await fetch(`${API_BASE_URL}/organization`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update organization');
  }
  return response.json();
};

export const deleteOrganization = async (org_id: number): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/organization/${org_id}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to delete organization');
  }
};
