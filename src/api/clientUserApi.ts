import { getApiUrl } from './apiConfig';

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
  line_name?: string;
  org_id: number;
  org_name?: string;
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

export const fetchClientUsers = async (org_id?: number | string, user_type?: string): Promise<ClientUserDTO[]> => {
  const url = getApiUrl('/client-users');
  if (org_id) {
    url.searchParams.append('org_id', String(org_id));
  } else {
    url.searchParams.append('client_user_id', 'ALL');
  }

  if (user_type) {
    url.searchParams.append('user_type', user_type);
  }

  const response = await fetch(url.toString());
  return safeParseJson(response);
};

export const createClientUser = async (data: Omit<ClientUserDTO, 'client_user_id'>): Promise<ClientUserDTO> => {
  const url = getApiUrl('/client-users');
  const response = await fetch(url.toString(), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  return safeParseJson(response);
};

export const updateClientUser = async (data: ClientUserDTO): Promise<ClientUserDTO> => {
  const url = getApiUrl('/client-users');
  const response = await fetch(url.toString(), {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  return safeParseJson(response);
};

export const deleteClientUser = async (client_user_id: number): Promise<void> => {
  const url = getApiUrl(`/client-users/${client_user_id}`);
  const response = await fetch(url.toString(), {
    method: 'DELETE',
  });
  await safeParseJson(response);
};
