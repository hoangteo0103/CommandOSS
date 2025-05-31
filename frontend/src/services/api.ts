import axios from "axios";
import type {
  Event,
  TicketType,
  Ticket,
  Order,
  ApiResponse,
  PaginatedResponse,
  CreateEventRequest,
  CreateTicketTypeRequest,
  ReserveTicketRequest,
  PurchaseTicketRequest,
  StorageUploadResponse,
} from "../types";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add request interceptor for authentication if needed
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("authToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Storage API
export const storageApi = {
  uploadFile: async (
    file: File
  ): Promise<ApiResponse<StorageUploadResponse>> => {
    try {
      const formData = new FormData();
      formData.append("file", file);

      console.log("Uploading file:", file.name, file.type, file.size);

      const response = await api.post("/storage/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      console.log("Upload response:", response.data);

      // The backend now returns { success: true, data: { url }, message }
      // but we need to return it in the format { data: { url } }
      if (response.data.success && response.data.data?.url) {
        return {
          success: true,
          data: { url: response.data.data.url },
          message: response.data.message,
        };
      } else {
        throw new Error(response.data.message || "Upload failed");
      }
    } catch (error: any) {
      console.error("Upload error:", error);
      throw new Error(
        error.response?.data?.message || error.message || "Upload failed"
      );
    }
  },

  deleteFile: async (filename: string): Promise<ApiResponse<void>> => {
    const response = await api.delete(`/storage/file/${filename}`);
    return response.data;
  },
};

// Events API
export const eventsApi = {
  // Get all events with pagination
  getEvents: async (
    page = 1,
    limit = 10
  ): Promise<PaginatedResponse<Event>> => {
    const response = await api.get(`/events?page=${page}&limit=${limit}`);
    return response.data;
  },

  // Get single event by ID
  getEvent: async (id: string): Promise<ApiResponse<Event>> => {
    const response = await api.get(`/events/${id}`);
    return response.data;
  },

  // Create new event
  createEvent: async (
    data: CreateEventRequest
  ): Promise<ApiResponse<Event>> => {
    const response = await api.post("/events", data);
    return response.data;
  },

  // Update event
  updateEvent: async (
    id: string,
    data: Partial<CreateEventRequest>
  ): Promise<ApiResponse<Event>> => {
    const response = await api.put(`/events/${id}`, data);
    return response.data;
  },

  // Delete event
  deleteEvent: async (id: string): Promise<ApiResponse<void>> => {
    const response = await api.delete(`/events/${id}`);
    return response.data;
  },
};

// Ticket Types API
export const ticketTypesApi = {
  // Get ticket types for an event
  getTicketTypes: async (
    eventId: string
  ): Promise<ApiResponse<TicketType[]>> => {
    const response = await api.get(`/events/${eventId}/ticket-types`);
    return response.data;
  },

  // Create ticket type
  createTicketType: async (
    data: CreateTicketTypeRequest
  ): Promise<ApiResponse<TicketType>> => {
    const response = await api.post("/ticket-types", data);
    return response.data;
  },

  // Update ticket type
  updateTicketType: async (
    id: string,
    data: Partial<CreateTicketTypeRequest>
  ): Promise<ApiResponse<TicketType>> => {
    const response = await api.put(`/ticket-types/${id}`, data);
    return response.data;
  },

  // Delete ticket type
  deleteTicketType: async (id: string): Promise<ApiResponse<void>> => {
    const response = await api.delete(`/ticket-types/${id}`);
    return response.data;
  },
};

// Orders API
export const ordersApi = {
  // Reserve tickets (creates pending order)
  reserveTickets: async (
    data: ReserveTicketRequest
  ): Promise<ApiResponse<Order>> => {
    const response = await api.post("/reserve", data);
    return response.data;
  },

  // Purchase tickets (confirms order and mints NFTs)
  purchaseTickets: async (
    data: PurchaseTicketRequest
  ): Promise<ApiResponse<Order>> => {
    const response = await api.post("/purchase", data);
    return response.data;
  },

  // Get user's orders
  getMyOrders: async (userAddress: string): Promise<ApiResponse<Order[]>> => {
    const response = await api.get(`/orders/user/${userAddress}`);
    return response.data;
  },

  // Get order by ID
  getOrder: async (id: string): Promise<ApiResponse<Order>> => {
    const response = await api.get(`/orders/${id}`);
    return response.data;
  },
};

// Tickets API
export const ticketsApi = {
  // Get user's tickets
  getMyTickets: async (userAddress: string): Promise<ApiResponse<Ticket[]>> => {
    const response = await api.get(`/my-tickets/${userAddress}`);
    return response.data;
  },

  // Verify ticket
  verifyTicket: async (
    ticketId: string
  ): Promise<ApiResponse<{ isValid: boolean; ticket?: Ticket }>> => {
    const response = await api.get(`/verify/${ticketId}`);
    return response.data;
  },

  // Use ticket (mark as used)
  useTicket: async (ticketId: string): Promise<ApiResponse<Ticket>> => {
    const response = await api.post(`/tickets/${ticketId}/use`);
    return response.data;
  },
};

export default api;
