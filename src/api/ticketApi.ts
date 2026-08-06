import { getApiUrl, getAuthHeaders } from './apiConfig';

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
  reported_to_type?: string;
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
  is_read?: boolean;
  last_action_by?: number;
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

export const fetchTickets = async (user_id?: number, user_type?: string): Promise<TicketDTO[]> => {
  try {
    const url = getApiUrl('/tickets');
    if (user_id !== undefined) url.searchParams.append('user_id', String(user_id));
    if (user_type !== undefined) url.searchParams.append('user_type', user_type);

    const response = await fetch(url.toString(), { headers: getAuthHeaders() });
    if (response.ok) {
      const data = await response.json();
      if (Array.isArray(data)) return data;
    }
  } catch (e) {
    console.warn('Backend fetch failed, falling back to local memory:', e);
  }
  return [];
};

export const fetchTicketById = async (ticket_id: string | number): Promise<TicketDTO | null> => {
  try {
    const url = getApiUrl(`/tickets/${ticket_id}`);
    const response = await fetch(url.toString(), { headers: getAuthHeaders() });
    if (response.ok) {
      const data = await response.json();
      if (data && typeof data === 'object') return data;
    }
  } catch (e) {
    console.warn('Backend fetch by ticket ID failed:', e);
  }
  return null;
};

export const createTicketInDb = async (data: TicketDTO): Promise<TicketDTO> => {
  const url = getApiUrl('/tickets');
  const response = await fetch(url.toString(), {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });

  if (response.ok) {
    const result = await response.json();
    if (result && typeof result === 'object') return result;
  } else {
    let errorMsg = 'Failed to create ticket on backend';
    try {
      const errObj = await response.json();
      errorMsg = errObj.error || errObj.message || errorMsg;
    } catch {
      // fallback
    }
    throw new Error(errorMsg);
  }

  throw new Error('Failed to create ticket: Invalid response format');
};

export const updateTicketInDb = async (data: Partial<TicketDTO>): Promise<TicketDTO> => {
  try {
    const url = getApiUrl('/tickets');
    const response = await fetch(url.toString(), {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (response.ok) {
      const result = await response.json();
      if (result) return result;
    }
  } catch (e) {
    console.warn('Backend update failed:', e);
  }
  return data as TicketDTO;
};

export const deleteTicketInDb = async (ticket_id: number): Promise<void> => {
  try {
    const url = getApiUrl(`/tickets/${ticket_id}`);
    await fetch(url.toString(), {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
  } catch (e) {
    console.warn('Backend delete failed:', e);
  }
};

export const fetchTicketTrail = async (ticket_no: string): Promise<TicketTrailDTO[]> => {
  try {
    const url = getApiUrl(`/tickets/trail/${ticket_no}`);
    const response = await fetch(url.toString(), { headers: getAuthHeaders() });
    if (response.ok) {
      const data = await response.json();
      if (Array.isArray(data)) return data;
    }
  } catch (e) {
    console.warn('Fetch trail failed:', e);
  }
  return [];
};

export const fetchDashboardStats = async (line_id?: string): Promise<DashboardStatsDTO> => {
  try {
    const url = getApiUrl('/dashboard/stats');
    if (line_id && line_id !== 'All') url.searchParams.append('line_id', line_id);
    const response = await fetch(url.toString(), { headers: getAuthHeaders() });
    if (response.ok) return response.json();
  } catch (e) {
    console.warn('Fetch stats failed:', e);
  }
  return {
    total: 0,
    total_sent: 0,
    total_received: 0,
    new_tickets: 0,
    opened: 0,
    open_tickets: 0,
    in_progress: 0,
    resolved: 0,
    closed: 0,
    cancelled: 0,
    overdue: 0,
    sla_breached: 0,
  };
};

export const fetchDashboardCharts = async (line_id?: string): Promise<DashboardChartsDTO> => {
  try {
    const url = getApiUrl('/dashboard/charts');
    if (line_id && line_id !== 'All') url.searchParams.append('line_id', line_id);
    const response = await fetch(url.toString(), { headers: getAuthHeaders() });
    if (response.ok) return response.json();
  } catch (e) {
    console.warn('Fetch charts failed:', e);
  }
  return {
    monthlyTrend: [
      { name: 'Jan', value: 0 }, { name: 'Feb', value: 0 }, { name: 'Mar', value: 0 },
      { name: 'Apr', value: 0 }, { name: 'May', value: 0 }, { name: 'Jun', value: 0 },
      { name: 'Jul', value: 0 }, { name: 'Aug', value: 0 }, { name: 'Sep', value: 0 },
      { name: 'Oct', value: 0 }, { name: 'Nov', value: 0 }, { name: 'Dec', value: 0 }
    ],
    statusData: [
      { name: 'Open', value: 0 }, { name: 'In-progress', value: 0 },
      { name: 'Resolved', value: 0 }, { name: 'Cancelled', value: 0 }
    ],
    weeklyData: [
      { name: 'Sun', value: 0 }, { name: 'Mon', value: 0 }, { name: 'Tue', value: 0 },
      { name: 'Wed', value: 0 }, { name: 'Thu', value: 0 }, { name: 'Fri', value: 0 }, { name: 'Sat', value: 0 }
    ],
    faultLevelBreakdown: []
  };
};

export const fetchDashboardRecentTickets = async (line_id?: string): Promise<RecentTicketDTO[]> => {
  try {
    const url = getApiUrl('/dashboard/recent-tickets');
    if (line_id && line_id !== 'All') url.searchParams.append('line_id', line_id);
    const response = await fetch(url.toString(), { headers: getAuthHeaders() });
    if (response.ok) return response.json();
  } catch (e) {
    console.warn('Fetch recent tickets failed:', e);
  }
  return [];
};

export const fetchUnreadCount = async (user_id: number, user_type: string): Promise<number> => {
  try {
    const url = getApiUrl(`/tickets/unread-count?user_id=${user_id}&user_type=${user_type}`);
    const response = await fetch(url.toString(), { headers: getAuthHeaders() });
    if (!response.ok) return 0;
    const data = await response.json();
    return data.count || 0;
  } catch {
    return 0;
  }
};

export const markTicketAsRead = async (ticket_id: number, user_id: number, user_type: string): Promise<void> => {
  try {
    const url = getApiUrl(`/tickets/mark-read/${ticket_id}`);
    await fetch(url.toString(), {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ user_id, user_type }),
    });
  } catch (e) {
    console.error('Failed to mark ticket as read:', e);
  }
};

export const markAllTicketsAsRead = async (user_id: number, user_type: string): Promise<void> => {
  try {
    const url = getApiUrl(`/tickets/mark-all-read`);
    await fetch(url.toString(), {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ user_id, user_type }),
    });
  } catch (e) {
    console.error('Failed to mark all tickets as read:', e);
  }
};
