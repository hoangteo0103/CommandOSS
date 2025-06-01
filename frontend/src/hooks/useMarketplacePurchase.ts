import { useState } from "react";
import { Transaction } from "@mysten/sui/transactions";
import { useWallet } from "./useWallet";
import type { MarketplaceListing } from "../services/marketplace";
import { notifications } from "@mantine/notifications";

export const useMarketplacePurchase = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const { signAndExecuteTransaction, address } = useWallet();

  const purchaseTicket = async (listing: MarketplaceListing) => {
    if (!address) {
      throw new Error("Wallet not connected");
    }

    if (listing.sellerAddress === address) {
      throw new Error("Cannot buy your own listing");
    }

    setIsProcessing(true);

    try {
      // Show initial processing notification
      notifications.show({
        id: "marketplace-purchase",
        title: "🔄 Processing Purchase",
        message: `Preparing to pay ${listing.listingPrice} SUI...`,
        color: "blue",
        autoClose: false,
        loading: true,
      });

      // Create Sui transaction for payment
      const transaction = new Transaction();

      // Convert SUI to MIST (1 SUI = 1_000_000_000 MIST)
      const amountInMist = Math.floor(listing.listingPrice * 1_000_000_000);

      console.log("💰 Payment details:", {
        listingPrice: listing.listingPrice,
        amountInMist,
        sellerAddress: listing.sellerAddress,
        buyerAddress: address,
      });

      // Transfer payment to seller
      transaction.transferObjects(
        [transaction.splitCoins(transaction.gas, [amountInMist])],
        listing.sellerAddress
      );

      // Update notification for wallet interaction
      notifications.update({
        id: "marketplace-purchase",
        title: "💳 Wallet Confirmation Required",
        message: "Please confirm the payment in your wallet...",
        color: "orange",
        autoClose: false,
        loading: true,
      });

      // Sign and execute the transaction
      const result = await signAndExecuteTransaction(transaction);

      if (!result || !result.digest) {
        throw new Error("Transaction failed: No transaction hash received");
      }

      // Update notification for backend processing
      notifications.update({
        id: "marketplace-purchase",
        title: "⚙️ Finalizing Purchase",
        message: "Processing NFT transfer...",
        color: "blue",
        autoClose: false,
        loading: true,
      });

      // Close processing notification
      notifications.hide("marketplace-purchase");

      // Show success notification
      notifications.show({
        title: "🎉 Purchase Successful!",
        message: `You've successfully purchased the ticket for ${listing.listingPrice} SUI!`,
        color: "green",
        autoClose: 5000,
      });

      return result;
    } catch (error: any) {
      console.error("❌ Purchase error:", error);

      // Close processing notification
      notifications.hide("marketplace-purchase");

      // Show error notification with more specific message
      let errorMessage = "Failed to complete purchase";

      if (error.message?.includes("User rejected")) {
        errorMessage = "Transaction was cancelled by user";
      } else if (error.message?.includes("Insufficient")) {
        errorMessage = "Insufficient SUI balance for this purchase";
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }

      notifications.show({
        title: "❌ Purchase Failed",
        message: errorMessage,
        color: "red",
        autoClose: 5000,
      });

      throw error;
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    purchaseTicket,
    isProcessing,
  };
};
