import api from "./api";

export interface MarketplaceListing {
  id: string;
  ticketId: string;
  sellerAddress: string;
  buyerAddress?: string;
  listingPrice: number;
  originalPrice: number;
  status: "active" | "sold" | "cancelled" | "expired";
  category?: string;
  transactionHash?: string;
  saleTransactionHash?: string;
  expiresAt?: string;
  soldAt?: string;
  cancelledAt?: string;
  isHot: boolean;
  description?: string;
  createdAt: string;
  updatedAt: string;
  ticket: {
    id: string;
    nftTokenId: string;
    ownerAddress: string;
    eventId: string;
    price: number;
    isUsed: boolean;
    event: {
      id: string;
      name: string;
      description: string;
      location: string;
      date: string;
      logoUrl?: string;
      bannerUrl?: string;
    };
  };
}

export interface CreateListingDto {
  ticketId: string;
  sellerAddress: string;
  listingPrice: number;
  originalPrice: number;
  category?: string;
  transactionHash?: string;
  expiresAt?: string;
  description?: string;
}

export interface MarketplaceQueryDto {
  search?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  status?: string;
  sortBy?: "newest" | "oldest" | "price-low" | "price-high" | "ending-soon";
  limit?: number;
  offset?: number;
  sellerAddress?: string;
  hotOnly?: boolean;
}

export interface BuyListingDto {
  buyerAddress: string;
  transactionHash: string;
}

export interface MarketplaceStats {
  totalListings: number;
  totalVolume: number;
  avgPrice: number;
  hotListings: number;
  recentSales: number;
}

export const marketplaceApi = {
  // Create a new listing
  createListing: async (data: CreateListingDto) => {
    return api.post("/marketplace/listings", data);
  },

  // Get all listings with filters
  getListings: async (params?: MarketplaceQueryDto) => {
    return api.get("/marketplace/listings", { params });
  },

  // Get a specific listing by ID
  getListing: async (id: string) => {
    return api.get(`/marketplace/listings/${id}`);
  },

  // Buy a listing
  buyListing: async (listingId: string, data: BuyListingDto) => {
    return api.post(`/marketplace/listings/${listingId}/buy`, data);
  },

  // Cancel a listing
  cancelListing: async (listingId: string, sellerAddress: string) => {
    return api.put(`/marketplace/listings/${listingId}/cancel`, {
      sellerAddress,
    });
  },

  // Get listings by seller
  getSellerListings: async (sellerAddress: string) => {
    return api.get(`/marketplace/sellers/${sellerAddress}/listings`);
  },

  // Mark listing as hot
  markAsHot: async (listingId: string) => {
    return api.put(`/marketplace/listings/${listingId}/mark-hot`);
  },

  // Get marketplace statistics
  getStats: async (): Promise<{ data: MarketplaceStats }> => {
    return api.get("/marketplace/stats");
  },

  // Get available categories
  getCategories: async () => {
    return api.get("/marketplace/categories");
  },

  // Get escrow address
  getEscrowAddress: async (): Promise<{ data: any }> => {
    return api.get("/marketplace/escrow-address");
  },
};
