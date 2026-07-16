import { API_BASE_URL } from './apiConfig';

export interface SettingsDTO {
  user_id?: string | number;
  user_type?: string;
  system_name: string;
  organization: string;
  timezone: string;
  date_format: string;
  updated_at?: string;
}

export const fetchSettings = async (): Promise<SettingsDTO> => {
  const response = await fetch(`${API_BASE_URL}/settings`);
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch settings');
  }
  return response.json();
};

export const saveSettings = async (data: SettingsDTO): Promise<SettingsDTO> => {
  const response = await fetch(`${API_BASE_URL}/settings`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to save settings');
  }
  return response.json();
};
