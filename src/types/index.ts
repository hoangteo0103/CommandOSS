export interface Event {
  id: number;
  title: string;
  description: string;
  date: string;
  created_by: string;
}

export interface TicketType {
  id: number;
  event_id: number;
  name: string;
  price: number;
  supply: number;
  sold: number;
}

export interface Order {
  id: number;
  user_address: string;
  ticket_type_id: number;
  status: "pending" | "completed" | "failed";
}

export interface Ticket {
  id: string;
  event_id: number;
  ticket_type: number;
  owner: string;
  used: boolean;
}

export interface ReserveTicketRequest {
  ticket_type_id: number;
  user_address: string;
}

export interface PurchaseTicketRequest {
  ticket_type_id: number;
  user_address: string;
}

export interface CreateEventRequest {
  title: string;
  description: string;
  date: string;
}
