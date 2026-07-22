import { API_BASE_URL, getApiUrl } from './apiConfig';

export interface TicketDTO {
  ticket_id?: number;
  guid?: string;
  line_id: number;
  line_name?: string;
  ticket_number: string;
  ticket_title?: string;
  created_at?: string;
  created_by?: number;
  created_by_type?: string;
  creator_name?: string;
  reported_to?: number;
  reported_to_name?: string;
  kpi_main_category_id: number;
  main_category_name?: string;
  kpi_sub_category_id: number;
  sub_category_name?: string;
  fl_category_id: number;
  ticket_status: string;
  ticket_description: string;
  sp_id: number;
  sp_name?: string;
  org_id?: number;
  org_name?: string;
  remarks?: string;
  updated_by?: number;
  attachment?: string;
}

export interface TicketTrailDTO {
  guid?: string;
  comment?: string;
  created_at?: string;
  created_by?: number;
  creator_name?: string;
  attachment?: string;
  ticket_no: string;
  previous_status?: number;
  new_status?: number;
  sp_id: number;
  line_id: number;
}

export const fetchTickets = async (user_id?: number, user_type?: string): Promise<TicketDTO[]> => {
  const url = getApiUrl('/tickets');
  if (user_id !== undefined) url.searchParams.append('user_id', String(user_id));
  if (user_type !== undefined) url.searchParams.append('user_type', user_type);
  
  const response = await fetch(url.toString());
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch tickets');
  }
  return response.json();
};

export const createTicketInDb = async (data: TicketDTO): Promise<TicketDTO> => {
  const response = await fetch(`${API_BASE_URL}/tickets`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create ticket');
  }
  return response.json();
};

export const updateTicketInDb = async (data: Partial<TicketDTO>): Promise<TicketDTO> => {
  const response = await fetch(`${API_BASE_URL}/tickets`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update ticket');
  }
  return response.json();
};

export const deleteTicketInDb = async (ticket_id: number): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/tickets/${ticket_id}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to delete ticket');
  }
};

export const fetchTicketTrail = async (ticket_no: string): Promise<TicketTrailDTO[]> => {
  const response = await fetch(`${API_BASE_URL}/tickets/trail/${ticket_no}`);
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch ticket trail');
  }
  return response.json();
};

export interface DashboardStatsDTO {
  total: number;
  total_sent: number;
  total_received: number;
  new_tickets: number;
  opened: number;
  open_tickets: number;
  in_progress: number;
  resolved: number;
  closed: number;
  cancelled: number;
  overdue: number;
  sla_breached: number;
}

export interface DashboardChartsDTO {
  monthlyTrend: { name: string; value: number }[];
  statusData: { name: string; value: number }[];
  weeklyData: { name: string; value: number }[];
  faultLevelBreakdown: { name: string; value: number }[];
}

export interface RecentTicketDTO {
  ticket_id: number;
  ticket_number: string;
  ticket_title: string;
  ticket_status: string;
  created_at: string;
  line_name?: string;
  creator_name?: string;
}

export const fetchDashboardStats = async (line_id?: string): Promise<DashboardStatsDTO> => {
  const url = getApiUrl('/dashboard/stats');
  if (line_id && line_id !== 'All') url.searchParams.append('line_id', line_id);
  const response = await fetch(url.toString());
  if (!response.ok) throw new Error('Failed to fetch dashboard statistics');
  return response.json();
};

export const fetchDashboardCharts = async (line_id?: string): Promise<DashboardChartsDTO> => {
  const url = getApiUrl('/dashboard/charts');
  if (line_id && line_id !== 'All') url.searchParams.append('line_id', line_id);
  const response = await fetch(url.toString());
  if (!response.ok) throw new Error('Failed to fetch dashboard charts');
  return response.json();
};

export const fetchDashboardRecentTickets = async (line_id?: string): Promise<RecentTicketDTO[]> => {
  const url = getApiUrl('/dashboard/recent-tickets');
  if (line_id && line_id !== 'All') url.searchParams.append('line_id', line_id);
  const response = await fetch(url.toString());
  if (!response.ok) throw new Error('Failed to fetch recent tickets');
  return response.json();
};

export const fetchUnreadCount = async (user_id: number, user_type: string): Promise<number> => {
  const response = await fetch(`${API_BASE_URL}/tickets/unread-count?user_id=${user_id}&user_type=${user_type}`);
  if (!response.ok) return 0;
  const data = await response.json();
  return data.count || 0;
};

export const markTicketAsRead = async (ticket_id: number, user_id: number, user_type: string): Promise<void> => {
  await fetch(`${API_BASE_URL}/tickets/mark-read/${ticket_id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id, user_type }),
  });
};

export const markAllTicketsAsRead = async (user_id: number, user_type: string): Promise<void> => {
  await fetch(`${API_BASE_URL}/tickets/mark-all-read`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id, user_type }),
  });
};

