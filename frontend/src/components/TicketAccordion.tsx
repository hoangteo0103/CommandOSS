import React from "react";
import dayjs from "dayjs";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Text,
  Title,
  Group,
  Button,
  Accordion,
  Badge,
  Stack,
  Flex,
} from "@mantine/core";
import {
  IconCalendar,
  IconTicket,
  IconCurrencyDollar,
  IconClock,
  IconInfoCircle,
  IconMapPin,
  IconUsers,
} from "@tabler/icons-react";
import type { Event, TicketType } from "../types";

interface TicketAccordionProps {
  event: Event;
}

export const TicketAccordion: React.FC<TicketAccordionProps> = ({ event }) => {
  const navigate = useNavigate();

  const handleBuyTicket = (ticketTypeId: string) => {
    navigate(`/events/${event.id}/purchase/${ticketTypeId}`);
  };

  const formatDate = (dateString: string) => {
    return dayjs(dateString).format("ddd, DD MMM YYYY");
  };

  const formatTime = (dateString: string) => {
    return dayjs(dateString).format("HH:mm");
  };

  const renderTicketType = (ticketType: TicketType) => {
    const saleStartDate = ticketType.saleStartDate
      ? dayjs(ticketType.saleStartDate)
      : null;
    const saleEndDate = ticketType.saleEndDate
      ? dayjs(ticketType.saleEndDate)
      : null;
    const now = dayjs();

    const saleStarted =
      !saleStartDate || !saleStartDate.isValid() || saleStartDate.isBefore(now);
    const saleEnded =
      saleEndDate && saleEndDate.isValid() && saleEndDate.isBefore(now);
    const isAvailable =
      ticketType.availableSupply > 0 && saleStarted && !saleEnded;

    return (
      <Accordion.Item key={ticketType.id} value={String(ticketType.id)}>
        <Accordion.Control>
          <Group justify="space-between" style={{ width: "100%" }}>
            <Text fw={600} c="dark">
              {ticketType.name}
            </Text>
            <Group gap="xs">
              <Text fw={600} c="dark">
                ${ticketType.price}
              </Text>
              <IconCurrencyDollar size={16} stroke={1.5} color="#3b82f6" />
            </Group>
          </Group>
        </Accordion.Control>
        <Accordion.Panel>
          <Box
            style={{
              display: "flex",
              gap: "16px",
              padding: "16px",
              alignItems: "flex-start",
            }}
          >
            {/* Ticket icon/placeholder */}
            <Box
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "rgba(59, 130, 246, 0.1)",
                borderRadius: "8px",
                height: "80px",
                width: "80px",
                minWidth: "80px",
                border: "1px solid rgba(59, 130, 246, 0.2)",
              }}
            >
              <IconTicket size={32} stroke={1.5} color="#3b82f6" />
            </Box>

            {/* Ticket details */}
            <Box style={{ flex: 1 }}>
              <Group justify="space-between" mb="xs">
                <Badge
                  color={
                    isAvailable
                      ? "green"
                      : saleEnded
                      ? "red"
                      : !saleStarted
                      ? "orange"
                      : "gray"
                  }
                  variant="filled"
                  size="md"
                >
                  {!saleStarted
                    ? "Coming Soon"
                    : saleEnded
                    ? "Sale Ended"
                    : isAvailable
                    ? "Available"
                    : "Sold Out"}
                </Badge>
                <Button
                  size="sm"
                  leftSection={<IconTicket size={14} />}
                  radius="md"
                  disabled={!isAvailable}
                  onClick={() => handleBuyTicket(ticketType.id)}
                  style={{
                    background: isAvailable
                      ? "linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)"
                      : undefined,
                    color: isAvailable ? "white" : undefined,
                  }}
                >
                  Buy Ticket
                </Button>
              </Group>

              <Stack gap="xs">
                <Group gap="xs">
                  <IconTicket size={16} stroke={1.5} color="#3b82f6" />
                  <Text size="sm" fw={500} c="dark">
                    Available: {ticketType.availableSupply} of{" "}
                    {ticketType.supply}
                  </Text>
                </Group>

                {saleStartDate && saleStartDate.isValid() && (
                  <Group gap="xs">
                    <IconClock size={16} stroke={1.5} color="#3b82f6" />
                    <Text size="sm" c="dimmed">
                      Sale starts:{" "}
                      {saleStartDate.format("MMM DD, YYYY [at] HH:mm")}
                    </Text>
                  </Group>
                )}

                {saleEndDate && saleEndDate.isValid() && (
                  <Group gap="xs">
                    <IconClock size={16} stroke={1.5} color="#3b82f6" />
                    <Text size="sm" c="dimmed">
                      Sale ends: {saleEndDate.format("MMM DD, YYYY [at] HH:mm")}
                    </Text>
                  </Group>
                )}

                {ticketType.description && (
                  <Text size="sm" c="dimmed" style={{ marginTop: "8px" }}>
                    {ticketType.description}
                  </Text>
                )}
              </Stack>
            </Box>
          </Box>
        </Accordion.Panel>
      </Accordion.Item>
    );
  };

  return (
    <>
      <Title
        order={2}
        mb="xl"
        ta="center"
        style={{
          background: "linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          fontSize: "2.5rem",
          fontWeight: 800,
        }}
      >
        NFT Ticket Collection
      </Title>

      {!event.ticketTypes || event.ticketTypes.length === 0 ? (
        <Flex direction="column" align="center" py="xl" mt="md">
          <Box
            style={{
              background: "linear-gradient(135deg, #64748b 0%, #94a3b8 100%)",
              borderRadius: "50%",
              padding: "24px",
              marginBottom: "16px",
            }}
          >
            <IconInfoCircle size={48} color="white" />
          </Box>
          <Text size="xl" fw={600} mb="sm">
            No Ticket Types Available
          </Text>
          <Text size="md" c="dimmed">
            Ticket sales may not have started yet or have ended
          </Text>
        </Flex>
      ) : (
        <Box>
          {/* Event info header */}
          <Box
            mb="xl"
            p="xl"
            style={{
              background: "rgba(255, 255, 255, 0.9)",
              backdropFilter: "blur(20px)",
              border: "1px solid rgba(59, 130, 246, 0.2)",
              borderRadius: "16px",
            }}
          >
            <Group justify="space-between" align="flex-start">
              <Stack gap="md">
                <Group gap="md">
                  <IconCalendar size={24} color="#3b82f6" />
                  <div>
                    <Text fw={600} size="md">
                      Event Date
                    </Text>
                    <Text size="sm" c="dimmed">
                      {formatDate(event.date)} at {formatTime(event.date)}
                    </Text>
                  </div>
                </Group>
                <Group gap="md">
                  <IconMapPin size={24} color="#22c55e" />
                  <div>
                    <Text fw={600} size="md">
                      Location
                    </Text>
                    <Text size="sm" c="dimmed">
                      {event.location}
                    </Text>
                  </div>
                </Group>
              </Stack>
              <Stack gap="md">
                <Group gap="md">
                  <IconUsers size={24} color="#8b5cf6" />
                  <div>
                    <Text fw={600} size="md">
                      Organizer
                    </Text>
                    <Text size="sm" c="dimmed">
                      {event.organizerName}
                    </Text>
                  </div>
                </Group>
                <Group gap="md">
                  <IconTicket size={24} color="#f59e0b" />
                  <div>
                    <Text fw={600} size="md">
                      Available Tickets
                    </Text>
                    <Text size="sm" c="dimmed">
                      {event.availableTickets} of {event.totalTickets}
                    </Text>
                  </div>
                </Group>
              </Stack>
            </Group>
          </Box>

          {/* Ticket types accordion */}
          <Accordion
            defaultValue={
              event.ticketTypes[0]?.id ? String(event.ticketTypes[0].id) : ""
            }
            variant="contained"
            radius="md"
            styles={{
              item: {
                borderColor: "rgba(59, 130, 246, 0.2)",
                marginBottom: "16px",
                borderRadius: "12px",
                overflow: "hidden",
                background: "rgba(255, 255, 255, 0.9)",
                backdropFilter: "blur(20px)",
                "&[data-active]": {
                  backgroundColor: "rgba(59, 130, 246, 0.05)",
                  borderColor: "rgba(59, 130, 246, 0.3)",
                },
              },
              control: {
                padding: "16px",
                backgroundColor: "rgba(59, 130, 246, 0.1)",
                "&:hover": {
                  backgroundColor: "rgba(59, 130, 246, 0.15)",
                },
              },
              label: {
                fontWeight: 600,
                color: "#1e293b",
              },
              panel: {
                padding: "0",
                backgroundColor: "rgba(255, 255, 255, 0.95)",
                color: "#475569",
              },
              content: {
                color: "#475569",
              },
              chevron: {
                color: "#3b82f6",
                marginLeft: "16px",
              },
            }}
          >
            {event.ticketTypes.map((ticketType) =>
              renderTicketType(ticketType)
            )}
          </Accordion>
        </Box>
      )}
    </>
  );
};
