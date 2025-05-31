import { useState } from "react";
import {
  Card,
  Text,
  Button,
  Group,
  Stack,
  NumberInput,
  Badge,
  Divider,
  Alert,
  LoadingOverlay,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import {
  IconWallet,
  IconTicket,
  IconCreditCard,
  IconAlertCircle,
} from "@tabler/icons-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { notifications } from "@mantine/notifications";
import type { TicketType, Event } from "../types";
import { useWallet } from "../hooks/useWallet";
import { WalletButton } from "./WalletButton";
import { ordersApi } from "../services/api";

interface TicketPurchaseFormProps {
  event: Event;
  ticketType: TicketType;
  onSuccess?: () => void;
}

export const TicketPurchaseForm = ({
  event,
  ticketType,
  onSuccess,
}: TicketPurchaseFormProps) => {
  const { isConnected, address } = useWallet();
  const queryClient = useQueryClient();
  const [isProcessing, setIsProcessing] = useState(false);

  const form = useForm({
    initialValues: {
      quantity: 1,
    },
    validate: {
      quantity: (value) => {
        if (value < 1) return "Quantity must be at least 1";
        if (value > ticketType.availableSupply)
          return "Not enough tickets available";
        if (value > 5) return "Maximum 5 tickets per purchase";
        return null;
      },
    },
  });

  const reserveMutation = useMutation({
    mutationFn: ordersApi.reserveTickets,
    onSuccess: (data) => {
      if (data.success && data.data) {
        // Proceed to purchase
        purchaseMutation.mutate({
          orderId: data.data.id,
          paymentSignature: "temp-signature", // This would be from actual payment
        });
      }
    },
    onError: (error) => {
      notifications.show({
        title: "Reservation Failed",
        message:
          error instanceof Error ? error.message : "Failed to reserve tickets",
        color: "red",
      });
      setIsProcessing(false);
    },
  });

  const purchaseMutation = useMutation({
    mutationFn: ordersApi.purchaseTickets,
    onSuccess: (data) => {
      if (data.success) {
        notifications.show({
          title: "Purchase Successful!",
          message:
            "Your tickets have been minted as NFTs and added to your wallet",
          color: "green",
        });
        queryClient.invalidateQueries({ queryKey: ["event", event.id] });
        queryClient.invalidateQueries({ queryKey: ["my-tickets"] });
        form.reset();
        onSuccess?.();
      }
      setIsProcessing(false);
    },
    onError: (error) => {
      notifications.show({
        title: "Purchase Failed",
        message:
          error instanceof Error
            ? error.message
            : "Failed to complete purchase",
        color: "red",
      });
      setIsProcessing(false);
    },
  });

  const handlePurchase = (values: { quantity: number }) => {
    if (!isConnected || !address) {
      notifications.show({
        title: "Wallet Required",
        message: "Please connect your wallet to purchase tickets",
        color: "orange",
      });
      return;
    }

    setIsProcessing(true);
    reserveMutation.mutate({
      eventId: event.id,
      ticketTypeId: ticketType.id,
      quantity: values.quantity,
      buyerAddress: address,
    });
  };

  const totalPrice = form.values.quantity * ticketType.price;
  const isAvailable = ticketType.availableSupply > 0 && ticketType.isActive;
  const saleStarted = new Date(ticketType.saleStartDate) <= new Date();
  const saleEnded = new Date(ticketType.saleEndDate) <= new Date();

  if (!saleStarted) {
    return (
      <Card withBorder padding="lg">
        <Alert icon={<IconAlertCircle size={16} />} color="blue">
          Ticket sales for "{ticketType.name}" start on{" "}
          {new Date(ticketType.saleStartDate).toLocaleDateString()}
        </Alert>
      </Card>
    );
  }

  if (saleEnded) {
    return (
      <Card withBorder padding="lg">
        <Alert icon={<IconAlertCircle size={16} />} color="orange">
          Ticket sales for "{ticketType.name}" have ended
        </Alert>
      </Card>
    );
  }

  return (
    <Card withBorder padding="lg" pos="relative">
      <LoadingOverlay visible={isProcessing} />

      <Stack gap="md">
        <Group justify="space-between" align="flex-start">
          <div>
            <Text fw={600} size="lg">
              {ticketType.name}
            </Text>
            {ticketType.description && (
              <Text size="sm" c="dimmed">
                {ticketType.description}
              </Text>
            )}
          </div>
          <Badge color={isAvailable ? "green" : "red"} variant="light">
            {isAvailable
              ? `${ticketType.availableSupply} available`
              : "Sold Out"}
          </Badge>
        </Group>

        <Group gap="xs">
          <IconTicket size={16} />
          <Text fw={500} size="xl">
            ${ticketType.price}
          </Text>
          <Text size="sm" c="dimmed">
            per ticket
          </Text>
        </Group>

        {isAvailable && (
          <form onSubmit={form.onSubmit(handlePurchase)}>
            <Stack gap="md">
              <NumberInput
                label="Quantity"
                placeholder="Enter number of tickets"
                min={1}
                max={Math.min(ticketType.availableSupply, 5)}
                {...form.getInputProps("quantity")}
              />

              <Divider />

              <Group justify="space-between">
                <Text fw={500}>Total:</Text>
                <Text fw={600} size="lg">
                  ${totalPrice.toFixed(2)}
                </Text>
              </Group>

              {!isConnected ? (
                <WalletButton fullWidth variant="light" />
              ) : (
                <Button
                  type="submit"
                  fullWidth
                  leftSection={<IconCreditCard size={16} />}
                  loading={isProcessing}
                  disabled={!form.isValid() || !isAvailable}
                >
                  Purchase Tickets
                </Button>
              )}

              {isConnected && (
                <Text size="xs" c="dimmed" ta="center">
                  Connected: {address?.slice(0, 6)}...{address?.slice(-4)}
                </Text>
              )}
            </Stack>
          </form>
        )}
      </Stack>
    </Card>
  );
};
