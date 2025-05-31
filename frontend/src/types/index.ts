export interface Event {
  id: string;
  name: string;
  description: string;
  date: string;
  location: string;
  latitude?: number;
  longitude?: number;
  placeId?: string;
  logoUrl?: string;
  bannerUrl?: string;
  organizerName: string;
  categories: string[];
  totalTickets: number;
  availableTickets: number;
  status: string;
  createdAt: string;
  updatedAt: string;
  ticketTypes?: TicketType[];
}

export interface TicketType {
  id: string;
  eventId: string;
  name: string;
  description?: string;
  price: number;
  supply: number;
  availableSupply: number;
  saleStartDate: string;
  saleEndDate: string;
  isActive: boolean;
  event?: Event;
}

export interface Ticket {
  id: string;
  eventId: string;
  ticketTypeId: string;
  ownerAddress: string;
  tokenId?: string;
  isUsed: boolean;
  purchaseDate: string;
  event?: Event;
  ticketType?: TicketType;
}

export interface Order {
  id: string;
  eventId: string;
  ticketTypeId: string;
  buyerAddress: string;
  quantity: number;
  totalPrice: number;
  status: "pending" | "confirmed" | "failed" | "cancelled";
  createdAt: string;
  updatedAt: string;
  event?: Event;
  ticketType?: TicketType;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CreateEventRequest {
  name: string;
  description: string;
  date: string;
  location: string;
  latitude?: number;
  longitude?: number;
  placeId?: string;
  logoUrl?: string;
  bannerUrl?: string;
  organizerName: string;
  categories: string[];
}

export interface CreateTicketTypeRequest {
  eventId: string;
  name: string;
  description?: string;
  price: number;
  totalSupply: number;
  saleStartDate: string;
  saleEndDate: string;
}

export interface ReserveTicketRequest {
  eventId: string;
  ticketTypeId: string;
  quantity: number;
  buyerAddress: string;
}

export interface PurchaseTicketRequest {
  orderId: string;
  paymentSignature: string;
}

export interface StorageUploadResponse {
  url: string;
}
