export interface UserDTO {
  user_id: number;
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
  sp_id: number;
  sp_name?: string; // from join
  active_status: boolean;
  user_email?: string;
}

const API_BASE_URL = 'http://localhost:5000/api';

export const fetchUsers = async (): Promise<UserDTO[]> => {
  const response = await fetch(`${API_BASE_URL}/users?user_id=ALL`);
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch users');
  }
  return response.json();
};

export const createUser = async (data: Omit<UserDTO, 'user_id'>): Promise<UserDTO> => {
  const response = await fetch(`${API_BASE_URL}/users`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create user');
  }
  return response.json();
};

export const updateUser = async (data: UserDTO): Promise<UserDTO> => {
  const response = await fetch(`${API_BASE_URL}/users`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update user');
  }
  return response.json();
};

export const deleteUser = async (user_id: number): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/users/${user_id}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to delete user');
  }
};

export const fetchServiceProviderLines = async (): Promise<any[]> => {
  const response = await fetch(`${API_BASE_URL}/serviceprovider-lines`);
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch service provider lines');
  }
  return response.json();
};
