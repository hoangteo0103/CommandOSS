import React, { useState } from "react";
import {
  Button,
  Stack,
  Text,
  Group,
  Card,
  NumberInput,
  TextInput,
  Title,
  Alert,
  LoadingOverlay,
  Code,
  Divider,
} from "@mantine/core";
import { bookingApi } from "../services/api";
import { notifications } from "@mantine/notifications";

/**
 * BookingExample Component
 *
 * This component demonstrates how to integrate with the new BookingController APIs.
 * It shows all the available endpoints and how to use them properly.
 *
 * Usage in your components:
 *
 * 1. Reserve tickets:
 *    const reservation = await bookingApi.reserveTickets({
 *      eventId: "event-uuid",
 *      ticketTypeId: "ticket-type-uuid",
 *      quantity: 2,
 *      buyerAddress: "wallet-address"
 *    });
 *
 * 2. Complete purchase:
 *    const purchase = await bookingApi.purchaseTickets({
 *      orderId: reservation.data.id,
 *      paymentSignature: "payment-signature"
 *    });
 *
 * 3. Check availability:
 *    const availability = await bookingApi.checkAvailability(eventId, ticketTypeId);
 *
 * 4. Get user bookings:
 *    const bookings = await bookingApi.getUserBookings(walletAddress);
 *
 * 5. Cancel reservation:
 *    await bookingApi.cancelReservation(reservationId);
 */

export const BookingExample: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [eventId, setEventId] = useState("event1");
  const [ticketTypeId, setTicketTypeId] = useState("tickettype1");
  const [quantity, setQuantity] = useState(1);
  const [walletAddress, setWalletAddress] = useState("0x1234567890abcdef");
  const [reservationId, setReservationId] = useState("");
  const [results, setResults] = useState<any>(null);

  const handleReserveTickets = async () => {
    setLoading(true);
    try {
      const response = await bookingApi.reserveTickets({
        eventId,
        ticketTypeId,
        quantity,
        buyerAddress: walletAddress,
      });

      setResults(response);
      setReservationId(response.data?.id || "");

      notifications.show({
        title: "🎯 Tickets Reserved!",
        message: `Successfully reserved ${quantity} tickets for 15 minutes`,
        color: "green",
      });
    } catch (error: any) {
      notifications.show({
        title: "❌ Reservation Failed",
        message: error.message || "Failed to reserve tickets",
        color: "red",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePurchaseTickets = async () => {
    if (!reservationId) {
      notifications.show({
        title: "⚠️ No Reservation",
        message: "Please reserve tickets first",
        color: "orange",
      });
      return;
    }

    setLoading(true);
    try {
      const response = await bookingApi.purchaseTickets({
        orderId: reservationId,
        paymentSignature: "mock-payment-signature-" + Date.now(),
      });

      setResults(response);

      notifications.show({
        title: "🎉 Purchase Complete!",
        message: "NFT tickets have been minted successfully!",
        color: "green",
      });
    } catch (error: any) {
      notifications.show({
        title: "❌ Purchase Failed",
        message: error.message || "Failed to complete purchase",
        color: "red",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCheckAvailability = async () => {
    setLoading(true);
    try {
      const response = await bookingApi.checkAvailability(
        eventId,
        ticketTypeId
      );
      setResults(response);

      notifications.show({
        title: "📊 Availability Checked",
        message: `${response.data?.availableTickets} tickets available`,
        color: "blue",
      });
    } catch (error: any) {
      notifications.show({
        title: "❌ Check Failed",
        message: error.message || "Failed to check availability",
        color: "red",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGetUserBookings = async () => {
    setLoading(true);
    try {
      const response = await bookingApi.getUserBookings(walletAddress, {
        limit: 10,
        offset: 0,
      });
      setResults(response);

      notifications.show({
        title: "📜 Bookings Retrieved",
        message: `Found ${response.data?.total || 0} bookings`,
        color: "blue",
      });
    } catch (error: any) {
      notifications.show({
        title: "❌ Retrieval Failed",
        message: error.message || "Failed to get bookings",
        color: "red",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancelReservation = async () => {
    if (!reservationId) {
      notifications.show({
        title: "⚠️ No Reservation",
        message: "Please reserve tickets first",
        color: "orange",
      });
      return;
    }

    setLoading(true);
    try {
      await bookingApi.cancelReservation(reservationId);

      notifications.show({
        title: "🚫 Reservation Cancelled",
        message: "Tickets have been released back to inventory",
        color: "orange",
      });

      setReservationId("");
      setResults(null);
    } catch (error: any) {
      notifications.show({
        title: "❌ Cancellation Failed",
        message: error.message || "Failed to cancel reservation",
        color: "red",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card shadow="lg" padding="xl" radius="md" style={{ position: "relative" }}>
      <LoadingOverlay visible={loading} />

      <Title order={2} mb="lg">
        🎫 Booking API Integration Example
      </Title>

      <Stack gap="md">
        {/* Input Fields */}
        <Group grow>
          <TextInput
            label="Event ID"
            value={eventId}
            onChange={(e) => setEventId(e.target.value)}
            placeholder="event1"
          />
          <TextInput
            label="Ticket Type ID"
            value={ticketTypeId}
            onChange={(e) => setTicketTypeId(e.target.value)}
            placeholder="tickettype1"
          />
        </Group>

        <Group grow>
          <NumberInput
            label="Quantity"
            value={quantity}
            onChange={(value) =>
              setQuantity(typeof value === "number" ? value : 1)
            }
            min={1}
            max={5}
          />
          <TextInput
            label="Wallet Address"
            value={walletAddress}
            onChange={(e) => setWalletAddress(e.target.value)}
            placeholder="0x1234567890abcdef"
          />
        </Group>

        {reservationId && (
          <Alert color="blue" title="Active Reservation">
            <Text size="sm">
              Reservation ID: <Code>{reservationId}</Code>
            </Text>
          </Alert>
        )}

        <Divider />

        {/* Action Buttons */}
        <Group grow>
          <Button
            onClick={handleCheckAvailability}
            variant="light"
            color="blue"
          >
            📊 Check Availability
          </Button>
          <Button onClick={handleReserveTickets} color="blue">
            🎯 Reserve Tickets
          </Button>
        </Group>

        <Group grow>
          <Button
            onClick={handlePurchaseTickets}
            color="green"
            disabled={!reservationId}
          >
            💳 Complete Purchase
          </Button>
          <Button
            onClick={handleCancelReservation}
            color="orange"
            disabled={!reservationId}
          >
            🚫 Cancel Reservation
          </Button>
        </Group>

        <Button onClick={handleGetUserBookings} variant="light" color="violet">
          📜 Get User Bookings
        </Button>

        {/* Results Display */}
        {results && (
          <Card withBorder padding="md" radius="md">
            <Title order={4} mb="md">
              📤 API Response:
            </Title>
            <Code block style={{ whiteSpace: "pre-wrap" }}>
              {JSON.stringify(results, null, 2)}
            </Code>
          </Card>
        )}

        {/* Usage Instructions */}
        <Card withBorder padding="md" radius="md" bg="gray.0">
          <Title order={4} mb="md">
            🔧 Integration Guide:
          </Title>
          <Text size="sm" mb="xs">
            <strong>1. Import the API:</strong>
          </Text>
          <Code block mb="md">
            {`import { bookingApi } from '../services/api';`}
          </Code>

          <Text size="sm" mb="xs">
            <strong>2. Use in your components:</strong>
          </Text>
          <Code block>
            {`// Reserve tickets
const reservation = await bookingApi.reserveTickets({
  eventId: "event-uuid",
  ticketTypeId: "ticket-type-uuid",
  quantity: 2,
  buyerAddress: "wallet-address"
});

// Complete purchase
const purchase = await bookingApi.purchaseTickets({
  orderId: reservation.data.id,
  paymentSignature: "payment-signature"
});`}
          </Code>
        </Card>
      </Stack>
    </Card>
  );
};
