import {
  Card,
  Text,
  Badge,
  Group,
  Stack,
  Button,
  Image,
  Divider,
} from "@mantine/core";
import {
  IconTicket,
  IconCalendar,
  IconMapPin,
  IconExternalLink,
} from "@tabler/icons-react";
import type { Ticket } from "../types";

interface TicketListProps {
  tickets: Ticket[];
  isLoading?: boolean;
}

export const TicketList = ({ tickets, isLoading = false }: TicketListProps) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (isLoading) {
    return (
      <Stack gap="md">
        {Array.from({ length: 3 }).map((_, index) => (
          <Card key={index} withBorder padding="lg">
            <div
              style={{
                height: 120,
                backgroundColor: "var(--mantine-color-gray-1)",
              }}
            />
          </Card>
        ))}
      </Stack>
    );
  }

  if (tickets.length === 0) {
    return (
      <Card withBorder padding="xl" ta="center">
        <IconTicket size={48} color="var(--mantine-color-gray-5)" />
        <Text size="lg" fw={500} mt="md">
          No tickets found
        </Text>
        <Text size="sm" c="dimmed">
          Your purchased tickets will appear here
        </Text>
      </Card>
    );
  }

  return (
    <Stack gap="md">
      {tickets.map((ticket) => (
        <Card key={ticket.id} withBorder padding="lg">
          <Group align="flex-start" gap="md">
            <Image
              src={ticket.event?.imageUrl}
              alt={ticket.event?.title}
              width={120}
              height={120}
              radius="md"
              fallbackSrc="https://placehold.co/120x120/e9ecef/868e96?text=Event"
            />

            <Stack gap="sm" style={{ flex: 1 }}>
              <Group justify="space-between" align="flex-start">
                <div>
                  <Text fw={600} size="lg" lineClamp={2}>
                    {ticket.event?.title}
                  </Text>
                  <Text size="sm" c="dimmed">
                    {ticket.ticketType?.name}
                  </Text>
                </div>
                <Badge color={ticket.isUsed ? "gray" : "green"} variant="light">
                  {ticket.isUsed ? "Used" : "Valid"}
                </Badge>
              </Group>

              <Stack gap="xs">
                <Group gap="xs">
                  <IconCalendar size={16} color="var(--mantine-color-dimmed)" />
                  <Text size="sm" c="dimmed">
                    {ticket.event?.date && formatDate(ticket.event.date)}
                  </Text>
                </Group>

                <Group gap="xs">
                  <IconMapPin size={16} color="var(--mantine-color-dimmed)" />
                  <Text size="sm" c="dimmed">
                    {ticket.event?.location}
                  </Text>
                </Group>

                <Group gap="xs">
                  <IconTicket size={16} color="var(--mantine-color-dimmed)" />
                  <Text size="sm" c="dimmed">
                    Purchased:{" "}
                    {new Date(ticket.purchaseDate).toLocaleDateString()}
                  </Text>
                </Group>

                {ticket.tokenId && (
                  <Group gap="xs">
                    <Text size="sm" c="dimmed">
                      NFT ID: {ticket.tokenId.slice(0, 8)}...
                      {ticket.tokenId.slice(-6)}
                    </Text>
                  </Group>
                )}
              </Stack>

              <Divider />

              <Group justify="space-between">
                <Text size="sm" fw={500}>
                  ${ticket.ticketType?.price}
                </Text>

                <Group gap="xs">
                  {ticket.tokenId && (
                    <Button
                      size="xs"
                      variant="light"
                      leftSection={<IconExternalLink size={14} />}
                      onClick={() =>
                        window.open(
                          `https://explorer.sui.io/object/${ticket.tokenId}`,
                          "_blank"
                        )
                      }
                    >
                      View NFT
                    </Button>
                  )}

                  {!ticket.isUsed && (
                    <Badge size="sm" color="blue" variant="light">
                      Ready to use
                    </Badge>
                  )}
                </Group>
              </Group>
            </Stack>
          </Group>
        </Card>
      ))}
    </Stack>
  );
};
