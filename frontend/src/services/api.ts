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

// Booking API (Updated to match BookingController)
export const bookingApi = {
  // Reserve tickets (15-minute hold)
  reserveTickets: async (
    data: ReserveTicketRequest
  ): Promise<
    ApiResponse<{
      id: string;
      eventId: string;
      ticketTypeId: string;
      quantity: number;
      buyerAddress: string;
      expiresAt: string;
      status: string;
      totalPrice: number;
      createdAt: string;
    }>
  > => {
    const response = await api.post("/booking/reserve", data);
    return response.data;
  },

  // Complete purchase and mint NFTs
  purchaseTickets: async (
    data: PurchaseTicketRequest
  ): Promise<
    ApiResponse<{
      orderId: string;
      transactionHash: string;
      nftTokenIds: string[];
      status: string;
      mintedAt: string;
    }>
  > => {
    const response = await api.post("/booking/purchase", data);
    return response.data;
  },

  // Get reservation details
  getReservation: async (
    reservationId: string
  ): Promise<
    ApiResponse<{
      id: string;
      status: string;
      expiresAt: string;
      timeLeft: number;
      tickets: {
        eventName: string;
        ticketTypeName: string;
        quantity: number;
        unitPrice: number;
        totalPrice: number;
      };
    }>
  > => {
    const response = await api.get(`/booking/reserve/${reservationId}`);
    return response.data;
  },

  // Cancel reservation
  cancelReservation: async (
    reservationId: string
  ): Promise<ApiResponse<void>> => {
    const response = await api.delete(`/booking/reserve/${reservationId}`);
    return response.data;
  },

  // Get user's booking history
  getUserBookings: async (
    walletAddress: string,
    options?: {
      status?: string;
      limit?: number;
      offset?: number;
    }
  ): Promise<
    ApiResponse<{
      bookings: any[];
      total: number;
      offset: number;
      limit: number;
    }>
  > => {
    const params = new URLSearchParams();
    if (options?.status) params.append("status", options.status);
    if (options?.limit) params.append("limit", options.limit.toString());
    if (options?.offset) params.append("offset", options.offset.toString());

    const queryString = params.toString();
    const url = `/booking/user/${walletAddress}${
      queryString ? `?${queryString}` : ""
    }`;

    const response = await api.get(url);
    return response.data;
  },

  // Check ticket availability
  checkAvailability: async (
    eventId: string,
    ticketTypeId: string
  ): Promise<
    ApiResponse<{
      availableTickets: number;
      totalTickets: number;
      reservedTickets: number;
      soldTickets: number;
      isAvailable: boolean;
      pricePerTicket: number;
    }>
  > => {
    const response = await api.get(
      `/booking/availability/${eventId}/${ticketTypeId}`
    );
    return response.data;
  },

  // Admin: Get all bookings
  getAllBookings: async (options?: {
    eventId?: string;
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<
    ApiResponse<{
      bookings: any[];
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    }>
  > => {
    const params = new URLSearchParams();
    if (options?.eventId) params.append("eventId", options.eventId);
    if (options?.status) params.append("status", options.status);
    if (options?.page) params.append("page", options.page.toString());
    if (options?.limit) params.append("limit", options.limit.toString());

    const queryString = params.toString();
    const url = `/booking/admin/all${queryString ? `?${queryString}` : ""}`;

    const response = await api.get(url);
    return response.data;
  },

  // Admin: Cleanup expired reservations
  cleanupExpiredReservations: async (): Promise<
    ApiResponse<{
      cleanedReservations: number;
      timestamp: string;
    }>
  > => {
    const response = await api.post("/booking/admin/cleanup-expired");
    return response.data;
  },
};

// Legacy Orders API (for backward compatibility)
export const ordersApi = {
  // Reserve tickets (creates pending order) - Legacy wrapper
  reserveTickets: async (
    data: ReserveTicketRequest
  ): Promise<ApiResponse<Order>> => {
    const response = await bookingApi.reserveTickets(data);

    // Transform the new booking response to match the old Order interface
    if (response.success && response.data) {
      const bookingData = response.data;
      const orderData: Order = {
        id: bookingData.id,
        eventId: bookingData.eventId,
        ticketTypeId: bookingData.ticketTypeId,
        buyerAddress: bookingData.buyerAddress,
        quantity: bookingData.quantity,
        totalPrice: bookingData.totalPrice,
        status: bookingData.status as
          | "pending"
          | "confirmed"
          | "failed"
          | "cancelled",
        createdAt: bookingData.createdAt,
        updatedAt: bookingData.createdAt, // Use createdAt as updatedAt for now
      };

      return {
        success: true,
        data: orderData,
        message: response.message,
      };
    }

    return response as any;
  },

  // Purchase tickets (confirms order and mints NFTs) - Legacy wrapper
  purchaseTickets: async (
    data: PurchaseTicketRequest
  ): Promise<ApiResponse<Order>> => {
    const response = await bookingApi.purchaseTickets(data);

    // Transform the new booking response to match the old Order interface
    if (response.success && response.data) {
      const purchaseData = response.data;
      const orderData: Order = {
        id: purchaseData.orderId,
        eventId: "", // Would need to fetch this from reservation
        ticketTypeId: "", // Would need to fetch this from reservation
        buyerAddress: "", // Would need to fetch this from reservation
        quantity: 0, // Would need to fetch this from reservation
        totalPrice: 0, // Would need to fetch this from reservation
        status: "confirmed",
        createdAt: purchaseData.mintedAt,
        updatedAt: purchaseData.mintedAt,
      };

      return {
        success: true,
        data: orderData,
        message: response.message,
      };
    }

    return response as any;
  },

  // Get user's orders - Legacy wrapper
  getMyOrders: async (userAddress: string): Promise<ApiResponse<Order[]>> => {
    const response = await bookingApi.getUserBookings(userAddress);

    if (response.success && response.data) {
      const orders: Order[] = response.data.bookings.map((booking: any) => ({
        id: booking.id,
        eventId: booking.eventId,
        ticketTypeId: booking.ticketTypeId,
        buyerAddress: booking.buyerAddress,
        quantity: booking.quantity,
        totalPrice: booking.totalPrice,
        status: booking.status,
        createdAt: booking.createdAt,
        updatedAt: booking.createdAt,
      }));

      return {
        success: true,
        data: orders,
        message: response.message,
      };
    }

    return response as any;
  },

  // Get order by ID - Legacy wrapper
  getOrder: async (id: string): Promise<ApiResponse<Order>> => {
    const response = await bookingApi.getReservation(id);

    if (response.success && response.data) {
      const reservationData = response.data;
      const orderData: Order = {
        id: reservationData.id,
        eventId: "", // Not available in reservation response
        ticketTypeId: "", // Not available in reservation response
        buyerAddress: "", // Not available in reservation response
        quantity: reservationData.tickets.quantity,
        totalPrice: reservationData.tickets.totalPrice,
        status: reservationData.status as
          | "pending"
          | "confirmed"
          | "failed"
          | "cancelled",
        createdAt: "", // Not available in reservation response
        updatedAt: "", // Not available in reservation response
      };

      return {
        success: true,
        data: orderData,
        message: response.message,
      };
    }

    return response as any;
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
