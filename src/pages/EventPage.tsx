import React from "react";
import {
  Container,
  Title,
  Text,
  SimpleGrid,
  Card,
  Button,
  Badge,
  Group,
  Alert,
} from "@mantine/core";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { notifications } from "@mantine/notifications";
import { eventAPI, ticketTypeAPI, ticketAPI } from "../services/api";
import { useWallet } from "../hooks/useWallet";
import type { TicketType } from "../types";

export const EventPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { isConnected, address } = useWallet();

  const { data: event, isLoading: eventLoading } = useQuery({
    queryKey: ["event", id],
    queryFn: () => eventAPI.getEvent(Number(id)),
    enabled: !!id,
  });

  const { data: ticketTypes = [], isLoading: ticketTypesLoading } = useQuery({
    queryKey: ["ticketTypes", id],
    queryFn: () => ticketTypeAPI.getTicketTypes(Number(id)),
    enabled: !!id,
  });

  const purchaseMutation = useMutation({
    mutationFn: ticketAPI.purchaseTicket,
    onSuccess: () => {
      notifications.show({
        title: "Success!",
        message: "Ticket purchased successfully!",
        color: "green",
      });
    },
    onError: () => {
      notifications.show({
        title: "Error",
        message: "Failed to purchase ticket",
        color: "red",
      });
    },
  });

  const handlePurchase = (ticketTypeId: number) => {
    if (!isConnected || !address) {
      notifications.show({
        title: "Wallet Required",
        message: "Please connect your wallet to purchase tickets",
        color: "yellow",
      });
      return;
    }

    purchaseMutation.mutate({
      ticket_type_id: ticketTypeId,
      user_address: address,
    });
  };

  if (eventLoading) {
    return (
      <Container>
        <Text>Loading event...</Text>
      </Container>
    );
  }

  if (!event) {
    return (
      <Container>
        <Alert color="red">Event not found</Alert>
      </Container>
    );
  }

  return (
    <Container size="lg">
      <Title order={1} mb="md">
        {event.title}
      </Title>

      <Text size="lg" mb="md">
        {event.description}
      </Text>

      <Text mb="xl">📅 {new Date(event.date).toLocaleDateString()}</Text>

      <Title order={2} mb="md">
        Available Tickets
      </Title>

      {!isConnected && (
        <Alert color="blue" mb="md">
          Connect your wallet to purchase tickets
        </Alert>
      )}

      <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }}>
        {ticketTypes.map((ticketType: TicketType) => (
          <Card
            key={ticketType.id}
            shadow="sm"
            padding="lg"
            radius="md"
            withBorder
          >
            <Group justify="space-between" mb="xs">
              <Text fw={500}>{ticketType.name}</Text>
              <Badge color="green" variant="light">
                ${ticketType.price}
              </Badge>
            </Group>

            <Text size="sm" c="dimmed" mb="md">
              Available: {ticketType.supply - ticketType.sold} /{" "}
              {ticketType.supply}
            </Text>

            <Button
              onClick={() => handlePurchase(ticketType.id)}
              disabled={
                !isConnected ||
                ticketType.sold >= ticketType.supply ||
                purchaseMutation.isPending
              }
              loading={purchaseMutation.isPending}
              fullWidth
            >
              {ticketType.sold >= ticketType.supply ? "Sold Out" : "Purchase"}
            </Button>
          </Card>
        ))}
      </SimpleGrid>

      {ticketTypes.length === 0 && !ticketTypesLoading && (
        <Text ta="center" c="dimmed" mt="xl">
          No tickets available for this event.
        </Text>
      )}
    </Container>
  );
};
