import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Box,
  Button,
  Group,
  Stepper,
  Title,
  Text,
  ActionIcon,
  Divider,
  Badge,
  Progress,
  Container,
  Paper,
  LoadingOverlay,
  Alert,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import {
  IconArrowLeft,
  IconArrowRight,
  IconCheck,
  IconAlertCircle,
  IconEdit,
  IconTicket,
  IconInfoCircle,
  IconDeviceFloppy,
} from "@tabler/icons-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { eventsApi } from "../services/api";
import { EventDetailsStep } from "../components/EventDetailsStep";
import { TicketConfigurationStep } from "../components/TicketConfigurationStep";
import { useWallet } from "../hooks/useWallet";

interface TicketType {
  id: string;
  name: string;
  price: number;
  supply: number;
  availableSupply: number;
  description: string;
}

interface EventFormData {
  name: string;
  logo: File | null;
  banner: File | null;
  logoUrl: string;
  bannerUrl: string;
  location: string;
  latitude: number | null;
  longitude: number | null;
  placeId: string;
  description: string;
  categories: string[];
  organizerName: string;
  date: string;
  ticketTypes: TicketType[];
}

export const EditEventPage = () => {
  const navigate = useNavigate();
  const { eventId } = useParams();
  const { address } = useWallet();
  const [active, setActive] = useState(0);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const {
    data: event,
    isLoading: eventLoading,
    error: eventError,
  } = useQuery({
    queryKey: ["event", eventId],
    queryFn: () => eventsApi.getEvent(eventId!),
    enabled: !!eventId,
  });

  const form = useForm<EventFormData>({
    initialValues: {
      name: "",
      logo: null,
      banner: null,
      logoUrl: "",
      bannerUrl: "",
      location: "",
      latitude: null,
      longitude: null,
      placeId: "",
      description: "",
      categories: [],
      organizerName: "",
      date: "",
      ticketTypes: [],
    },
    validate: {
      name: (value) =>
        value.length < 3 ? "Event name must be at least 3 characters" : null,
      location: (value) => (value.length < 3 ? "Location is required" : null),
      description: (value) =>
        value.length < 10 ? "Description must be at least 10 characters" : null,
      organizerName: (value) =>
        value.length < 2 ? "Organizer name is required" : null,
      date: (value) => (!value ? "Event date is required" : null),
    },
  });

  // Populate form when event data is loaded
  useEffect(() => {
    if (event?.data) {
      const eventData = event.data;
      form.setValues({
        name: eventData.name || "",
        logo: null,
        banner: null,
        logoUrl: eventData.logoUrl || "",
        bannerUrl: eventData.bannerUrl || "",
        location: eventData.location || "",
        latitude: eventData.latitude || null,
        longitude: eventData.longitude || null,
        placeId: eventData.placeId || "",
        description: eventData.description || "",
        categories: eventData.categories || [],
        organizerName: eventData.organizerName || "",
        date: eventData.date || "",
        ticketTypes: (eventData.ticketTypes || []).map((tt) => ({
          ...tt,
          description: tt.description || "",
        })),
      });
      setLogoPreview(eventData.logoUrl || null);
      setBannerPreview(eventData.bannerUrl || null);
    }
  }, [event]);

  const updateEventMutation = useMutation({
    mutationFn: (data: any) => eventsApi.updateEvent(eventId!, data),
    onSuccess: () => {
      notifications.show({
        title: "🎉 Event Updated!",
        message: "Your event has been successfully updated",
        color: "green",
        icon: <IconCheck size={16} />,
      });
      navigate(`/events/${eventId}`);
    },
    onError: () => {
      notifications.show({
        title: "Update Failed",
        message: "Failed to update event. Please try again.",
        color: "red",
        icon: <IconAlertCircle size={16} />,
      });
    },
  });

  const addTicketType = () => {
    form.setFieldValue("ticketTypes", [
      ...form.values.ticketTypes,
      {
        id: crypto.randomUUID(),
        name: "",
        price: 0,
        supply: 100,
        availableSupply: 100,
        description: "",
      },
    ]);
  };

  const removeTicketType = (index: number) => {
    if (form.values.ticketTypes.length > 1) {
      const newTicketTypes = form.values.ticketTypes.filter(
        (_, i) => i !== index
      );
      form.setFieldValue("ticketTypes", newTicketTypes);
    }
  };

  const updateTicketType = (
    index: number,
    field: keyof TicketType,
    value: any
  ) => {
    const newTicketTypes = [...form.values.ticketTypes];
    if (field === "supply") {
      newTicketTypes[index].availableSupply = value;
    }
    newTicketTypes[index] = { ...newTicketTypes[index], [field]: value };
    form.setFieldValue("ticketTypes", newTicketTypes);
  };

  const nextStep = () => {
    if (active === 0) {
      const validation = form.validate();
      if (validation.hasErrors) return;
    }
    setActive((current) => (current < 1 ? current + 1 : current));
  };

  const prevStep = () =>
    setActive((current) => (current > 0 ? current - 1 : current));

  const handleSubmit = async () => {
    // Validate ticket types
    const hasValidTickets = form.values.ticketTypes.every(
      (ticket) => ticket.name.trim() && ticket.price >= 0 && ticket.supply > 0
    );

    if (!hasValidTickets) {
      notifications.show({
        title: "Invalid Ticket Configuration",
        message:
          "Please ensure all ticket types have valid names, prices, and supply",
        color: "red",
      });
      return;
    }

    const formData = {
      name: form.values.name,
      description: form.values.description,
      date: form.values.date,
      location: form.values.location,
      latitude: form.values.latitude,
      longitude: form.values.longitude,
      placeId: form.values.placeId,
      organizerName: form.values.organizerName,
      logoUrl: form.values.logoUrl,
      bannerUrl: form.values.bannerUrl,
      categories: form.values.categories,
      ticketTypes: form.values.ticketTypes,
    };

    updateEventMutation.mutate(formData);
  };

  // Check if user is the event creator
  // For now, we'll allow editing if the user is connected
  const isEventCreator = !!address;

  if (eventLoading) {
    return (
      <Box
        style={{
          background:
            "linear-gradient(180deg, rgba(59, 130, 246, 0.02) 0%, rgba(139, 92, 246, 0.02) 100%)",
          minHeight: "100vh",
          width: "100%",
          paddingTop: "110px",
        }}
      >
        <Container size="lg">
          <Paper
            shadow="xl"
            radius="xl"
            p="xl"
            style={{
              background: "rgba(255, 255, 255, 0.95)",
              backdropFilter: "blur(20px)",
              border: "1px solid rgba(59, 130, 246, 0.2)",
              position: "relative",
              minHeight: "400px",
            }}
          >
            <LoadingOverlay visible />
            <Text ta="center" size="xl" fw={500} c="dimmed">
              Loading event data...
            </Text>
          </Paper>
        </Container>
      </Box>
    );
  }

  if (eventError || !event) {
    return (
      <Box
        style={{
          background:
            "linear-gradient(180deg, rgba(59, 130, 246, 0.02) 0%, rgba(139, 92, 246, 0.02) 100%)",
          minHeight: "100vh",
          width: "100%",
          paddingTop: "110px",
        }}
      >
        <Container size="lg">
          <Alert
            icon={<IconAlertCircle size={20} />}
            color="red"
            radius="xl"
            style={{
              background: "rgba(239, 68, 68, 0.1)",
              border: "1px solid rgba(239, 68, 68, 0.2)",
              padding: "20px",
              fontSize: "1.1rem",
            }}
          >
            Event not found or failed to load
          </Alert>
        </Container>
      </Box>
    );
  }

  if (!isEventCreator) {
    return (
      <Box
        style={{
          background:
            "linear-gradient(180deg, rgba(59, 130, 246, 0.02) 0%, rgba(139, 92, 246, 0.02) 100%)",
          minHeight: "100vh",
          width: "100%",
          paddingTop: "110px",
        }}
      >
        <Container size="lg">
          <Alert
            icon={<IconAlertCircle size={20} />}
            color="orange"
            radius="xl"
            style={{
              background: "rgba(251, 146, 60, 0.1)",
              border: "1px solid rgba(251, 146, 60, 0.2)",
              padding: "20px",
              fontSize: "1.1rem",
            }}
          >
            You don't have permission to edit this event
          </Alert>
        </Container>
      </Box>
    );
  }

  const progress = ((active + 1) / 2) * 100;

  return (
    <Box
      style={{
        background:
          "linear-gradient(180deg, rgba(59, 130, 246, 0.02) 0%, rgba(139, 92, 246, 0.02) 100%)",
        minHeight: "100vh",
        width: "100%",
        paddingTop: "110px",
        paddingBottom: "2rem",
      }}
    >
      <Container size="lg">
        {/* Progress Header */}
        <Paper
          shadow="xl"
          radius="xl"
          p="xl"
          mb="xl"
          style={{
            background: "rgba(255, 255, 255, 0.95)",
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(59, 130, 246, 0.2)",
          }}
        >
          <Group justify="space-between" mb="lg">
            <Group>
              <ActionIcon
                variant="light"
                size="xl"
                radius="xl"
                onClick={() => navigate(`/events/${eventId}`)}
                style={{
                  background: "rgba(59, 130, 246, 0.1)",
                  border: "1px solid rgba(59, 130, 246, 0.2)",
                }}
              >
                <IconArrowLeft size={24} />
              </ActionIcon>
              <Box>
                <Title
                  order={1}
                  size="2.5rem"
                  style={{
                    background:
                      "linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    fontWeight: 900,
                  }}
                >
                  Edit Event
                </Title>
                <Text c="dimmed" size="lg" fw={500}>
                  Update your event on the Sui blockchain
                </Text>
              </Box>
            </Group>

            <Group>
              <Badge
                leftSection={<IconEdit size={16} />}
                variant="gradient"
                gradient={{ from: "blue", to: "cyan", deg: 45 }}
                size="xl"
                styles={{
                  root: {
                    paddingLeft: "16px",
                    paddingRight: "24px",
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
                EDITING MODE
              </Badge>
              <Badge
                variant="light"
                color="green"
                size="lg"
                styles={{
                  root: {
                    paddingLeft: "12px",
                    paddingRight: "16px",
                    paddingTop: "8px",
                    paddingBottom: "8px",
                  },
                  label: {
                    paddingBottom: "2px",
                  },
                }}
              >
                Step {active + 1} of 2
              </Badge>
            </Group>
          </Group>

          <Box mb="md">
            <Group justify="space-between" mb="xs">
              <Text size="sm" fw={500} c="dimmed">
                Progress
              </Text>
              <Text size="sm" fw={500} c="blue">
                {Math.round(progress)}%
              </Text>
            </Group>
            <Progress
              value={progress}
              size="lg"
              radius="xl"
              styles={{
                root: { background: "rgba(59, 130, 246, 0.1)" },
                section: {
                  background:
                    "linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)",
                },
              }}
            />
          </Box>

          <Stepper
            active={active}
            size="lg"
            radius="xl"
            styles={{
              step: {
                "&[data-completed]": {
                  background:
                    "linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)",
                },
                "&[data-progress]": {
                  background:
                    "linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)",
                },
              },
              stepLabel: {
                fontWeight: 600,
                fontSize: "1.1rem",
              },
              stepDescription: {
                fontSize: "0.95rem",
              },
            }}
          >
            <Stepper.Step
              label="Event Details"
              description="Update basic information"
              icon={<IconInfoCircle size={20} />}
            />
            <Stepper.Step
              label="NFT Tickets"
              description="Modify ticket configuration"
              icon={<IconTicket size={20} />}
            />
          </Stepper>
        </Paper>

        {/* Main Content */}
        <Paper
          shadow="xl"
          radius="xl"
          p="xl"
          style={{
            background: "rgba(255, 255, 255, 0.95)",
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(59, 130, 246, 0.2)",
            minHeight: "600px",
          }}
        >
          {active === 0 && (
            <EventDetailsStep
              form={form}
              logoPreview={logoPreview}
              bannerPreview={bannerPreview}
              setLogoPreview={setLogoPreview}
              setBannerPreview={setBannerPreview}
              uploading={uploading}
              setUploading={setUploading}
            />
          )}

          {active === 1 && (
            <TicketConfigurationStep
              form={form}
              addTicketType={addTicketType}
              removeTicketType={removeTicketType}
              updateTicketType={updateTicketType}
            />
          )}

          <Divider my="xl" size="sm" />

          {/* Navigation */}
          <Group justify="space-between">
            <Button
              variant="light"
              leftSection={<IconArrowLeft size={18} />}
              onClick={prevStep}
              disabled={active === 0}
              size="xl"
              radius="xl"
              style={{ fontWeight: 600, padding: "16px 32px" }}
            >
              Previous
            </Button>

            {active === 0 ? (
              <Button
                rightSection={<IconArrowRight size={18} />}
                onClick={nextStep}
                size="xl"
                radius="xl"
                variant="gradient"
                gradient={{ from: "blue", to: "cyan", deg: 45 }}
                style={{ fontWeight: 600, padding: "16px 32px" }}
              >
                Next: Update Tickets
              </Button>
            ) : (
              <Button
                rightSection={<IconDeviceFloppy size={18} />}
                onClick={handleSubmit}
                loading={updateEventMutation.isPending}
                size="xl"
                radius="xl"
                variant="gradient"
                gradient={{ from: "green", to: "teal", deg: 45 }}
                style={{ fontWeight: 600, padding: "16px 32px" }}
              >
                {updateEventMutation.isPending
                  ? "Saving Changes..."
                  : "Save Changes"}
              </Button>
            )}
          </Group>
        </Paper>
      </Container>
    </Box>
  );
};
