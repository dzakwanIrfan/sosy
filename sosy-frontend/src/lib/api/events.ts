import { apiClient } from "@/lib/api";

export interface Event {
  ID: number;
  post_title: string;
  post_content: string | null;
  post_excerpt: string | null;
  post_status: string;
  post_type: string;
  post_date: string | null;
  post_modified: string | null;
}

export interface EventBuyer {
  user_id: number;
  user_login: string;
  user_email: string;
  display_name: string | null;
  order_id: number;
  order_status: string;
  total_amount: number | null;
  payment_method_title: string | null;
  date_created: string | null;
}

export interface EventListResponse {
  data: Event[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}

export interface EventDetailResponse {
  event: Event;
  buyers: EventBuyer[];
  total_buyers: number;
}

export interface EventsQueryParams {
  page?: number;
  page_size?: number;
  search?: string;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
  post_status?: string;
}

export const eventsApi = {
  // Get list of events
  getEvents: async (params: EventsQueryParams = {}): Promise<EventListResponse> => {
    const response = await apiClient.get('/events', { params });
    return response.data;
  },

  // Get event detail with buyers
  getEventDetail: async (eventId: number): Promise<EventDetailResponse> => {
    const response = await apiClient.get(`/events/${eventId}`);
    return response.data;
  },
};