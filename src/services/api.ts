import axios from "axios";
import type {
  Event,
  TicketType,
  Ticket,
  CreateEventRequest,
  ReserveTicketRequest,
  PurchaseTicketRequest,
} from "../types";

const API_BASE_URL = "http://localhost:3000";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

export const eventAPI = {
  getEvents: (): Promise<Event[]> => api.get("/events").then((res) => res.data),

  createEvent: (data: CreateEventRequest): Promise<Event> =>
    api.post("/events", data).then((res) => res.data),

  getEvent: (id: number): Promise<Event> =>
    api.get(`/events/${id}`).then((res) => res.data),
};

export const ticketTypeAPI = {
  getTicketTypes: (eventId: number): Promise<TicketType[]> =>
    api.get(`/ticket-types?event_id=${eventId}`).then((res) => res.data),

  createTicketType: (
    data: Omit<TicketType, "id" | "sold">
  ): Promise<TicketType> =>
    api.post("/ticket-types", data).then((res) => res.data),
};

export const ticketAPI = {
  reserveTicket: (data: ReserveTicketRequest): Promise<{ success: boolean }> =>
    api.post("/reserve", data).then((res) => res.data),

  purchaseTicket: (
    data: PurchaseTicketRequest
  ): Promise<{ success: boolean; ticket_id?: string }> =>
    api.post("/purchase", data).then((res) => res.data),

  getMyTickets: (wallet: string): Promise<Ticket[]> =>
    api.get(`/my-tickets?wallet=${wallet}`).then((res) => res.data),

  verifyTicket: (
    ticketId: string
  ): Promise<{ valid: boolean; ticket?: Ticket }> =>
    api.get(`/verify/${ticketId}`).then((res) => res.data),
};
