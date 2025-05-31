import { useParams, useNavigate } from "react-router-dom";
import {
  Container,
  Title,
  Text,
  Image,
  Grid,
  Stack,
  Group,
  Badge,
  Divider,
  Card,
  Center,
  Loader,
  Alert,
  ActionIcon,
  Box,
  Button,
} from "@mantine/core";
import {
  IconCalendar,
  IconMapPin,
  IconUsers,
  IconTicket,
  IconArrowLeft,
  IconShare,
  IconAlertCircle,
  IconSparkles,
  IconEdit,
  IconScan,
} from "@tabler/icons-react";
import { useQuery } from "@tanstack/react-query";
import { notifications } from "@mantine/notifications";
import parse from "html-react-parser";
import { TicketAccordion } from "../components/TicketAccordion";
import { eventsApi } from "../services/api";

export const EventPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const {
    data: eventData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["event", id],
    queryFn: () => eventsApi.getEvent(id!),
    enabled: !!id,
  });

  const event = eventData?.data;

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

  const handleShare = async () => {
    try {
      await navigator.share({
        title: event?.name,
        text: event?.description,
        url: window.location.href,
      });
    } catch (error) {
      // Fallback to clipboard
      navigator.clipboard.writeText(window.location.href);
      notifications.show({
        title: "Link Copied",
        message: "Event link copied to clipboard",
        color: "blue",
      });
    }
  };

  if (isLoading) {
    return (
      <Box
        style={{
          background:
            "linear-gradient(180deg, rgba(59, 130, 246, 0.02) 0%, rgba(139, 92, 246, 0.02) 100%)",
          minHeight: "100vh",
        }}
      >
        <Container size="xl" py="xl">
          <Center py="xl">
            <Stack align="center" gap="lg">
              <Box
                style={{
                  background:
                    "linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)",
                  borderRadius: "50%",
                  padding: "30px",
                  animation: "pulse 2s infinite",
                }}
              >
                <Loader size="xl" color="white" />
              </Box>
              <Text size="xl" fw={500}>
                Loading event from blockchain...
              </Text>
            </Stack>
          </Center>
        </Container>
      </Box>
    );
  }

  if (error || !event) {
    return (
      <Box
        style={{
          background:
            "linear-gradient(180deg, rgba(59, 130, 246, 0.02) 0%, rgba(139, 92, 246, 0.02) 100%)",
          minHeight: "100vh",
        }}
      >
        <Container size="xl" py="xl">
          <Alert
            icon={<IconAlertCircle size={20} />}
            color="red"
            radius="xl"
            style={{
              background: "rgba(239, 68, 68, 0.1)",
              border: "1px solid rgba(239, 68, 68, 0.2)",
              padding: "20px",
            }}
          >
            Failed to load event details from the blockchain. Please try again
            later.
          </Alert>
        </Container>
      </Box>
    );
  }

  const eventDate = new Date(event.date);
  const isEventPast = eventDate < new Date();

  return (
    <Box
      style={{
        background:
          "linear-gradient(180deg, rgba(59, 130, 246, 0.02) 0%, rgba(139, 92, 246, 0.02) 100%)",
        minHeight: "100vh",
      }}
    >
      <Container size="xl" py="xl">
        <Stack gap="xl">
          {/* Back Navigation */}
          <Group justify="space-between">
            <Group>
              <ActionIcon
                variant="gradient"
                gradient={{ from: "blue", to: "cyan", deg: 45 }}
                size="xl"
                onClick={() => navigate("/")}
                radius="xl"
              >
                <IconArrowLeft size={24} />
              </ActionIcon>
              <Text size="lg" fw={500} c="blue">
                Back to Discovery
              </Text>
            </Group>

            {/* Event Management Actions */}
            <Group gap="sm">
              <Button
                leftSection={<IconEdit size={18} />}
                onClick={() => navigate(`/events/${id}/edit`)}
                variant="light"
                size="lg"
                radius="xl"
                style={{
                  background: "rgba(59, 130, 246, 0.1)",
                  border: "1px solid rgba(59, 130, 246, 0.2)",
                  color: "#3b82f6",
                  fontWeight: 600,
                }}
              >
                Edit Event
              </Button>

              <Button
                leftSection={<IconScan size={18} />}
                onClick={() => navigate(`/events/${id}/check-in`)}
                variant="gradient"
                gradient={{ from: "green", to: "teal", deg: 45 }}
                size="lg"
                radius="xl"
                style={{
                  fontWeight: 600,
                }}
              >
                Check-In
              </Button>
            </Group>
          </Group>

          {/* Event Header */}
          <Grid gutter="xl">
            <Grid.Col span={{ base: 12, md: 8 }}>
              <Card
                radius="xl"
                padding={0}
                style={{
                  overflow: "hidden",
                  background: "rgba(255, 255, 255, 0.9)",
                  backdropFilter: "blur(20px)",
                  border: "1px solid rgba(59, 130, 246, 0.2)",
                }}
              >
                <Image
                  src={
                    event.bannerUrl || event.logoUrl || "/placeholder-event.jpg"
                  }
                  alt={event.name}
                  height={500}
                  radius="xl"
                  fallbackSrc="https://placehold.co/800x500/1e293b/64748b?text=Future+Event"
                  style={{
                    filter: "brightness(0.95) contrast(1.1)",
                  }}
                />
              </Card>
            </Grid.Col>

            <Grid.Col span={{ base: 12, md: 4 }}>
              <Card
                shadow="xl"
                padding="xl"
                radius="xl"
                h="100%"
                style={{
                  background: "rgba(255, 255, 255, 0.9)",
                  backdropFilter: "blur(20px)",
                  border: "1px solid rgba(59, 130, 246, 0.2)",
                }}
              >
                <Stack gap="lg" h="100%">
                  <Group justify="space-between">
                    <Badge
                      size="xl"
                      color={
                        isEventPast
                          ? "gray"
                          : event.availableTickets > 0
                          ? "green"
                          : "red"
                      }
                      variant="gradient"
                      gradient={
                        isEventPast
                          ? { from: "gray", to: "dark", deg: 45 }
                          : event.availableTickets > 0
                          ? { from: "green", to: "teal", deg: 45 }
                          : { from: "red", to: "pink", deg: 45 }
                      }
                      leftSection={<IconSparkles size={16} />}
                      styles={{
                        root: {
                          paddingLeft: "16px",
                          paddingRight: "20px",
                          paddingTop: "12px",
                          paddingBottom: "12px",
                        },
                        label: {
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          paddingBottom: "2px",
                        },
                      }}
                    >
                      {isEventPast
                        ? "PAST EVENT"
                        : event.availableTickets > 0
                        ? "AVAILABLE"
                        : "SOLD OUT"}
                    </Badge>

                    <ActionIcon
                      variant="light"
                      onClick={handleShare}
                      size="lg"
                      radius="xl"
                    >
                      <IconShare size={20} />
                    </ActionIcon>
                  </Group>

                  <div>
                    <Title
                      order={1}
                      mb="md"
                      style={{
                        background:
                          "linear-gradient(135deg, #1e293b 0%, #3b82f6 100%)",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                        fontSize: "2.5rem",
                        fontWeight: 900,
                        lineHeight: 1.2,
                      }}
                    >
                      {event.name}
                    </Title>
                    <Box
                      size="lg"
                      c="dimmed"
                      style={{
                        overflow: "hidden",
                        display: "-webkit-box",
                        WebkitLineClamp: 4,
                        WebkitBoxOrient: "vertical",
                        lineHeight: 1.5,
                      }}
                    >
                      {event.description
                        ? parse(event.description)
                        : event.description}
                    </Box>
                  </div>

                  <Stack gap="md">
                    <Card
                      padding="md"
                      radius="lg"
                      style={{
                        background: "rgba(59, 130, 246, 0.1)",
                        border: "1px solid rgba(59, 130, 246, 0.2)",
                      }}
                    >
                      <Group gap="md">
                        <IconCalendar size={24} color="#3b82f6" />
                        <div>
                          <Text fw={600} size="md">
                            Date & Time
                          </Text>
                          <Text size="sm" c="dimmed">
                            {formatDate(event.date)}
                          </Text>
                        </div>
                      </Group>
                    </Card>

                    <Card
                      padding="md"
                      radius="lg"
                      style={{
                        background: "rgba(34, 197, 94, 0.1)",
                        border: "1px solid rgba(34, 197, 94, 0.2)",
                      }}
                    >
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
                    </Card>

                    <Card
                      padding="md"
                      radius="lg"
                      style={{
                        background: "rgba(139, 92, 246, 0.1)",
                        border: "1px solid rgba(139, 92, 246, 0.2)",
                      }}
                    >
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
                    </Card>

                    <Card
                      padding="md"
                      radius="lg"
                      style={{
                        background: "rgba(245, 158, 11, 0.1)",
                        border: "1px solid rgba(245, 158, 11, 0.2)",
                      }}
                    >
                      <Group gap="md">
                        <IconTicket size={24} color="#f59e0b" />
                        <div>
                          <Text fw={600} size="md">
                            Availability
                          </Text>
                          <Text size="sm" c="dimmed">
                            {event.availableTickets} of {event.totalTickets} NFT
                            tickets available
                          </Text>
                        </div>
                      </Group>
                    </Card>
                  </Stack>
                </Stack>
              </Card>
            </Grid.Col>
          </Grid>

          <Divider
            size="md"
            style={{
              background:
                "linear-gradient(90deg, transparent 0%, rgba(59, 130, 246, 0.3) 50%, transparent 100%)",
              border: "none",
              height: "2px",
            }}
          />

          {/* Ticket Accordion */}
          <TicketAccordion event={event} />

          {/* Event Details */}
          <Card
            shadow="xl"
            padding="xl"
            radius="xl"
            style={{
              background: "rgba(255, 255, 255, 0.9)",
              backdropFilter: "blur(20px)",
              border: "1px solid rgba(59, 130, 246, 0.2)",
            }}
          >
            <Title
              order={3}
              mb="lg"
              style={{
                background: "linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                fontSize: "1.8rem",
                fontWeight: 700,
              }}
            >
              About This Experience
            </Title>
            <Box size="lg" style={{ whiteSpace: "pre-wrap", lineHeight: 1.7 }}>
              {event.description ? parse(event.description) : event.description}
            </Box>
          </Card>

          {/* Terms */}
          <Card
            shadow="xl"
            padding="xl"
            radius="xl"
            style={{
              background: "rgba(255, 255, 255, 0.9)",
              backdropFilter: "blur(20px)",
              border: "1px solid rgba(59, 130, 246, 0.2)",
            }}
          >
            <Title
              order={4}
              mb="md"
              style={{
                background: "linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                fontSize: "1.5rem",
                fontWeight: 700,
              }}
            >
              Blockchain Terms & Conditions
            </Title>
            <Text size="md" c="dimmed" style={{ lineHeight: 1.6 }}>
              • Tickets are minted as NFTs on the Sui blockchain and are
              non-refundable
              <br />
              • Each NFT ticket provides immutable proof of ownership and
              authenticity
              <br />
              • You must present your NFT ticket for entry verification
              <br />
              • Event organizer reserves the right to modify event details
              <br />
              • By purchasing, you agree to our smart contract terms
              <br />• NFT tickets may have resale value on secondary markets
            </Text>
          </Card>
        </Stack>
      </Container>

      <style>
        {`
          @keyframes pulse {
            0%, 100% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.8; transform: scale(1.05); }
          }
        `}
      </style>
    </Box>
  );
};
