import {
  Card,
  Image,
  Text,
  Badge,
  Group,
  Stack,
  ActionIcon,
} from "@mantine/core";
import {
  IconCalendar,
  IconMapPin,
  IconHeart,
  IconCoin,
} from "@tabler/icons-react";
import { useNavigate } from "react-router-dom";
import type { Event } from "../types";

interface SearchEventCardProps {
  event: Event;
  onInterestToggle?: (eventId: string) => void;
  isInterested?: boolean;
}

export const SearchEventCard = ({
  event,
  onInterestToggle,
  isInterested = false,
}: SearchEventCardProps) => {
  const navigate = useNavigate();

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatPrice = (price?: number) => {
    if (!price || price === 0) return "Free";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(price);
  };

  const getMinimumPrice = () => {
    if (!event.ticketTypes || event.ticketTypes.length === 0) return 0;
    return Math.min(...event.ticketTypes.map((tt) => tt.price));
  };

  const getAvailabilityColor = () => {
    const percentage = (event.availableTickets / event.totalTickets) * 100;
    if (percentage > 50) return "green";
    if (percentage > 20) return "yellow";
    return "red";
  };

  const getAvailabilityText = () => {
    if (event.availableTickets === 0) return "SOLD OUT";
    if (event.availableTickets < 10) return "FEW LEFT";
    return "AVAILABLE";
  };

  return (
    <Card
      shadow="sm"
      padding="sm"
      radius="md"
      style={{
        cursor: "pointer",
        transition: "all 0.2s ease",
        height: "fit-content",
        background: "rgba(255, 255, 255, 0.95)",
        backdropFilter: "blur(10px)",
        border: "1px solid rgba(59, 130, 246, 0.1)",
      }}
      onClick={() => navigate(`/events/${event.id}`)}
    >
      <Card.Section style={{ position: "relative" }}>
        <Image
          src={event.bannerUrl || event.logoUrl || "/placeholder-event.jpg"}
          height={140}
          alt={event.name}
          fallbackSrc="https://placehold.co/300x140/1e293b/64748b?text=Event"
        />

        {/* Status Badge */}
        <Badge
          color={getAvailabilityColor()}
          variant="filled"
          size="xs"
          style={{
            position: "absolute",
            top: 8,
            right: 8,
            textTransform: "uppercase",
            fontSize: "10px",
          }}
        >
          {getAvailabilityText()}
        </Badge>

        {/* Interest Button */}
        <ActionIcon
          variant="filled"
          color={isInterested ? "red" : "gray"}
          size="sm"
          radius="xl"
          style={{
            position: "absolute",
            top: 8,
            left: 8,
            backgroundColor: isInterested ? "#ef4444" : "rgba(0,0,0,0.6)",
          }}
          onClick={(e) => {
            e.stopPropagation();
            onInterestToggle?.(event.id);
          }}
        >
          <IconHeart size={12} fill={isInterested ? "white" : "none"} />
        </ActionIcon>
      </Card.Section>

      <Stack gap="xs" mt="sm">
        <Text
          fw={600}
          size="sm"
          lineClamp={2}
          style={{ lineHeight: 1.3, minHeight: "2.6em" }}
        >
          {event.name}
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
                style={{ textTransform: "none", fontSize: "10px" }}
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

        {/* Date and Location */}
        <Stack gap="xs">
          <Group gap="xs" style={{ fontSize: "11px" }}>
            <IconCalendar size={12} color="#3b82f6" />
            <Text size="xs" c="blue" fw={500}>
              {formatDate(event.date)}
            </Text>
          </Group>

          <Group gap="xs" style={{ fontSize: "11px" }}>
            <IconMapPin size={12} color="#6b7280" />
            <Text size="xs" c="dimmed" lineClamp={1}>
              {event.location}
            </Text>
          </Group>

          <Group gap="xs" style={{ fontSize: "11px" }}>
            <IconCoin size={12} color="#f59e0b" />
            <Text size="xs" fw={600} c="orange">
              {formatPrice(getMinimumPrice())}
            </Text>
          </Group>
        </Stack>
      </Stack>
    </Card>
  );
};
