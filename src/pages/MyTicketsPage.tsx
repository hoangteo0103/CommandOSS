import React from "react";
import {
  Container,
  Title,
  Text,
  SimpleGrid,
  Card,
  Badge,
  Group,
  Alert,
} from "@mantine/core";
import { useQuery } from "@tanstack/react-query";
import { ticketAPI } from "../services/api";
import { useWallet } from "../hooks/useWallet";
import type { Ticket } from "../types";

export const MyTicketsPage: React.FC = () => {
  const { isConnected, address } = useWallet();

  const { data: tickets = [], isLoading } = useQuery({
    queryKey: ["myTickets", address],
    queryFn: () => ticketAPI.getMyTickets(address!),
    enabled: !!address,
  });

  if (!isConnected) {
    return (
      <Container>
        <Alert color="blue">
          Please connect your wallet to view your tickets
        </Alert>
      </Container>
    );
  }

  if (isLoading) {
    return (
      <Container>
        <Text>Loading your tickets...</Text>
      </Container>
    );
  }

  return (
    <Container size="lg">
      <Title order={1} mb="xl">
        My Tickets
      </Title>

      <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }}>
        {tickets.map((ticket: Ticket) => (
          <Card key={ticket.id} shadow="sm" padding="lg" radius="md" withBorder>
            <Group justify="space-between" mb="xs">
              <Text fw={500}>Event #{ticket.event_id}</Text>
              <Badge color={ticket.used ? "gray" : "green"} variant="light">
                {ticket.used ? "Used" : "Valid"}
              </Badge>
            </Group>

            <Text size="sm" c="dimmed" mb="md">
              Ticket Type: {ticket.ticket_type}
            </Text>

            <Text size="xs" c="dimmed" style={{ wordBreak: "break-all" }}>
              ID: {ticket.id}
            </Text>
          </Card>
        ))}
      </SimpleGrid>

      {tickets.length === 0 && (
        <Text ta="center" c="dimmed" mt="xl">
          You don't have any tickets yet. Purchase tickets from events to see
          them here.
        </Text>
      )}
    </Container>
  );
};
