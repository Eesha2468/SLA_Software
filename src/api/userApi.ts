import { getApiUrl } from './apiConfig';

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
  line_name?: string;
  sp_id: number;
  sp_name?: string;
  active_status: boolean;
  user_email?: string;
}

const safeParseJson = async (response: Response) => {
  const text = await response.text();
  let json: any = null;
  try {
    json = JSON.parse(text);
  } catch (e) {
    // Non-JSON response
  }

  if (!response.ok) {
    const errorMsg =
      json?.error ||
      json?.message ||
      (text.includes('<!DOCTYPE') ? 'Backend server unreachable' : text.slice(0, 150)) ||
      'Request failed';
    throw new Error(errorMsg);
  }

  return json;
};

export const fetchUsers = async (sp_id?: number | string, user_type?: string): Promise<UserDTO[]> => {
  const url = getApiUrl('/users');
  if (sp_id) {
    url.searchParams.append('sp_id', String(sp_id));
  } else {
    url.searchParams.append('user_id', 'ALL');
  }

  if (user_type) {
    url.searchParams.append('user_type', user_type);
  }

  const response = await fetch(url.toString());
  return safeParseJson(response);
};

export const createUser = async (data: Omit<UserDTO, 'user_id'>): Promise<UserDTO> => {
  const url = getApiUrl('/users');
  const response = await fetch(url.toString(), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  return safeParseJson(response);
};

export const updateUser = async (data: UserDTO): Promise<UserDTO> => {
  const url = getApiUrl('/users');
  const response = await fetch(url.toString(), {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  return safeParseJson(response);
};

export const deleteUser = async (user_id: number): Promise<void> => {
  const url = getApiUrl(`/users/${user_id}`);
  const response = await fetch(url.toString(), {
    method: 'DELETE',
  });
  await safeParseJson(response);
};

export const fetchServiceProviderLines = async (): Promise<any[]> => {
  const url = getApiUrl('/serviceprovider-lines');
  const response = await fetch(url.toString());
  return safeParseJson(response);
};
