import {
  Card,
  Image,
  Text,
  Badge,
  Button,
  Group,
  Stack,
  Box,
} from "@mantine/core";
import {
  IconCalendar,
  IconMapPin,
  IconUsers,
  IconTicket,
  IconSparkles,
  IconCoin,
} from "@tabler/icons-react";
import { useNavigate } from "react-router-dom";
import type { Event } from "../types";

interface EventCardProps {
  event: Event;
}

export const EventCard = ({ event }: EventCardProps) => {
  const navigate = useNavigate();

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getAvailabilityColor = () => {
    const percentage = (event.availableTickets / event.totalTickets) * 100;
    if (percentage > 50)
      return { color: "green", glow: "rgba(34, 197, 94, 0.3)" };
    if (percentage > 20)
      return { color: "yellow", glow: "rgba(234, 179, 8, 0.3)" };
    return { color: "red", glow: "rgba(239, 68, 68, 0.3)" };
  };

  const getAvailabilityText = () => {
    if (event.availableTickets === 0) return "SOLD OUT";
    if (event.availableTickets < 10) return "ALMOST GONE";
    return "AVAILABLE";
  };

  const availability = getAvailabilityColor();

  return (
    <Card
      className="futuristic-card"
      shadow="lg"
      padding={0}
      radius="xl"
      style={{
        background:
          "linear-gradient(145deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)",
        backdropFilter: "blur(20px)",
        border: "1px solid rgba(59, 130, 246, 0.2)",
        overflow: "hidden",
        position: "relative",
        cursor: "pointer",
        transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
      }}
      onClick={() => navigate(`/events/${event.id}`)}
    >
      {/* Holographic Effect Overlay */}
      <Box
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background:
            "linear-gradient(45deg, transparent 30%, rgba(59, 130, 246, 0.1) 50%, transparent 70%)",
          opacity: 0,
          transition: "opacity 0.3s ease",
          pointerEvents: "none",
          zIndex: 1,
        }}
        className="card-hologram"
      />

      <Card.Section style={{ position: "relative" }}>
        <Image
          src={event.bannerUrl || event.logoUrl || "/placeholder-event.jpg"}
          height={220}
          alt={event.name}
          fallbackSrc="https://placehold.co/400x220/1e293b/64748b?text=Future+Event"
          style={{
            filter: "brightness(0.9) contrast(1.1)",
            transition: "all 0.4s ease",
          }}
        />

        {/* Futuristic Overlay */}
        <Box
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background:
              "linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.3) 100%)",
          }}
        />

        {/* Status Badge */}
        <Badge
          color={availability.color}
          variant="filled"
          size="sm"
          style={{
            position: "absolute",
            top: 16,
            right: 16,
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            fontWeight: 700,
            boxShadow: `0 0 20px ${availability.glow}`,
            border: "1px solid rgba(255,255,255,0.3)",
          }}
          leftSection={<IconSparkles size={12} />}
        >
          {getAvailabilityText()}
        </Badge>
      </Card.Section>

      <Stack gap="md" p="lg" style={{ position: "relative", zIndex: 2 }}>
        <Group justify="space-between" align="flex-start">
          <Text
            fw={700}
            size="lg"
            lineClamp={2}
            style={{
              background: "linear-gradient(135deg, #1e293b 0%, #475569 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              fontSize: "1.1rem",
            }}
          >
            {event.name}
          </Text>
        </Group>

        <Text size="sm" c="dimmed" lineClamp={2} opacity={0.8}>
          {event.description}
        </Text>

        {/* Categories */}
        {event.categories && event.categories.length > 0 && (
          <Group gap="xs">
            {event.categories.slice(0, 2).map((category) => (
              <Badge
                key={category}
                size="xs"
                variant="light"
                color="blue"
                style={{ textTransform: "none" }}
              >
                {category}
              </Badge>
            ))}
            {event.categories.length > 2 && (
              <Badge size="xs" variant="outline" color="gray">
                +{event.categories.length - 2}
              </Badge>
            )}
          </Group>
        )}

        {/* Futuristic Info Grid */}
        <Stack gap="xs">
          <Group gap="sm" style={{ fontSize: "0.85rem" }}>
            <Box
              style={{
                padding: "4px 8px",
                borderRadius: "8px",
                background: "rgba(59, 130, 246, 0.1)",
                border: "1px solid rgba(59, 130, 246, 0.2)",
              }}
            >
              <Group gap="xs">
                <IconCalendar size={14} color="#3b82f6" />
                <Text size="xs" fw={500} c="blue">
                  {formatDate(event.date)}
                </Text>
              </Group>
            </Box>
          </Group>

          <Group gap="sm" style={{ fontSize: "0.85rem" }}>
            <Box
              style={{
                padding: "4px 8px",
                borderRadius: "8px",
                background: "rgba(34, 197, 94, 0.1)",
                border: "1px solid rgba(34, 197, 94, 0.2)",
              }}
            >
              <Group gap="xs">
                <IconMapPin size={14} color="#22c55e" />
                <Text size="xs" fw={500} c="green" lineClamp={1}>
                  {event.location}
                </Text>
              </Group>
            </Box>
          </Group>

          <Group gap="sm" justify="space-between">
            <Box
              style={{
                padding: "4px 8px",
                borderRadius: "8px",
                background: "rgba(139, 92, 246, 0.1)",
                border: "1px solid rgba(139, 92, 246, 0.2)",
              }}
            >
              <Group gap="xs">
                <IconUsers size={14} color="#8b5cf6" />
                <Text size="xs" fw={500} c="violet">
                  {event.organizerName}
                </Text>
              </Group>
            </Box>

            <Box
              style={{
                padding: "4px 8px",
                borderRadius: "8px",
                background: "rgba(245, 158, 11, 0.1)",
                border: "1px solid rgba(245, 158, 11, 0.2)",
              }}
            >
              <Group gap="xs">
                <IconTicket size={14} color="#f59e0b" />
                <Text size="xs" fw={500} c="orange">
                  {event.availableTickets}/{event.totalTickets}
                </Text>
              </Group>
            </Box>
          </Group>
        </Stack>

        {/* Price Display */}
        {event.ticketTypes && event.ticketTypes.length > 0 && (
          <Group justify="space-between" align="center">
            <Group gap="xs">
              <IconCoin size={16} color="#06b6d4" />
              <Text fw={700} size="lg" c="cyan">
                ${Math.min(...event.ticketTypes.map((tt) => tt.price))}
              </Text>
              {event.ticketTypes.length > 1 && (
                <Text size="sm" c="dimmed">
                  +{event.ticketTypes.length - 1} more
                </Text>
              )}
            </Group>
          </Group>
        )}

        {/* CTA Button */}
        <Button
          fullWidth
          radius="xl"
          size="md"
          disabled={event.availableTickets === 0}
          variant={event.availableTickets === 0 ? "outline" : "gradient"}
          gradient={{ from: "blue", to: "cyan", deg: 45 }}
          style={{
            marginTop: "0.5rem",
            fontWeight: 600,
            letterSpacing: "0.05em",
            textTransform: "uppercase",
            boxShadow:
              event.availableTickets > 0
                ? "0 8px 32px rgba(59, 130, 246, 0.3)"
                : "none",
          }}
        >
          {event.availableTickets === 0 ? "SOLD OUT" : "SECURE NFT TICKETS"}
        </Button>
      </Stack>

      <style>
        {`
          .futuristic-card:hover .card-hologram {
            opacity: 1;
          }
          
          .futuristic-card:hover {
            transform: translateY(-8px) scale(1.02);
            box-shadow: 0 25px 50px rgba(59, 130, 246, 0.4);
            border-color: rgba(59, 130, 246, 0.5);
          }
          
          .futuristic-card:hover img {
            transform: scale(1.05);
            filter: brightness(1.1) contrast(1.2);
          }
        `}
      </style>
    </Card>
  );
};
