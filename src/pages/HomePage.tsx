import React from "react";
import {
  Container,
  Title,
  SimpleGrid,
  Card,
  Text,
  Button,
  Badge,
  Group,
} from "@mantine/core";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { eventAPI } from "../services/api";
import type { Event } from "../types";

export const HomePage: React.FC = () => {
  const { data: events = [], isLoading } = useQuery({
    queryKey: ["events"],
    queryFn: eventAPI.getEvents,
  });

  if (isLoading) {
    return (
      <Container>
        <Text>Loading events...</Text>
      </Container>
    );
  }

  return (
    <Container size="lg">
      <Title order={1} mb="xl">
        Upcoming Events
      </Title>

      <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }}>
        {events.map((event: Event) => (
          <Card key={event.id} shadow="sm" padding="lg" radius="md" withBorder>
            <Group justify="space-between" mb="xs">
              <Text fw={500}>{event.title}</Text>
              <Badge color="blue" variant="light">
                Event
              </Badge>
            </Group>

            <Text size="sm" c="dimmed" mb="md">
              {event.description}
            </Text>

            <Text size="sm" mb="md">
              📅 {new Date(event.date).toLocaleDateString()}
            </Text>

            <Button
              component={Link}
              to={`/events/${event.id}`}
              variant="filled"
              fullWidth
            >
              View Tickets
            </Button>
          </Card>
        ))}
      </SimpleGrid>

      {events.length === 0 && (
        <Text ta="center" c="dimmed" mt="xl">
          No events available at the moment.
        </Text>
      )}
    </Container>
  );
};
