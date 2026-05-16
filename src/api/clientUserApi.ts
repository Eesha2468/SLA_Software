export interface ClientUserDTO {
  client_user_id: number;
  guid?: string;
  first_name: string;
  last_name?: string;
  CNIC?: string;
  username?: string;
  password?: string;
  user_designation?: string;
  emp_id?: string;
  line_id: number;
  line_name?: string; // from join
  org_id: number;
  org_name?: string; // from join
  active_status: boolean;
  user_email?: string;
}

const API_BASE_URL = 'http://localhost:5000/api';

export const fetchClientUsers = async (): Promise<ClientUserDTO[]> => {
  const response = await fetch(`${API_BASE_URL}/client-users?client_user_id=ALL`);
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch client users');
  }
  return response.json();
};

export const createClientUser = async (data: Omit<ClientUserDTO, 'client_user_id'>): Promise<ClientUserDTO> => {
  const response = await fetch(`${API_BASE_URL}/client-users`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create client user');
  }
  return response.json();
};

export const updateClientUser = async (data: ClientUserDTO): Promise<ClientUserDTO> => {
  const response = await fetch(`${API_BASE_URL}/client-users`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update client user');
  }
  return response.json();
};

export const deleteClientUser = async (client_user_id: number): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/client-users/${client_user_id}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to delete client user');
  }
};
