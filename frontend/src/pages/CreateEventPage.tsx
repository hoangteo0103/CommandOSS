import { useState } from "react";
import { useNavigate } from "react-router-dom";
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
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import {
  IconArrowLeft,
  IconArrowRight,
  IconCheck,
  IconAlertCircle,
  IconRocket,
  IconTicket,
  IconInfoCircle,
} from "@tabler/icons-react";
import { useMutation } from "@tanstack/react-query";
import { eventsApi } from "../services/api";
import { EventDetailsStep } from "../components/EventDetailsStep";
import { TicketConfigurationStep } from "../components/TicketConfigurationStep";

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

export const CreateEventPage = () => {
  const navigate = useNavigate();
  const [active, setActive] = useState(0);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

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
      ticketTypes: [
        {
          id: crypto.randomUUID(),
          name: "General Admission",
          price: 0,
          supply: 100,
          availableSupply: 100,
          description: "",
        },
      ],
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

  const createEventMutation = useMutation({
    mutationFn: (data: any) => eventsApi.createEvent(data),
    onSuccess: (response) => {
      notifications.show({
        title: "🎉 Event Created!",
        message: "Your event has been published to the blockchain",
        color: "green",
        icon: <IconCheck size={16} />,
      });
      if (response.data?.id) {
        navigate(`/events/${response.data.id}`);
      } else {
        navigate("/");
      }
    },
    onError: () => {
      notifications.show({
        title: "Creation Failed",
        message: "Failed to create event. Please try again.",
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

    createEventMutation.mutate(formData);
  };

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
                onClick={() => navigate("/")}
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
                  Create Epic Event
                </Title>
                <Text c="dimmed" size="lg" fw={500}>
                  Launch your experience on the Sui blockchain
                </Text>
              </Box>
            </Group>

            <Group>
              <Badge
                leftSection={<IconRocket size={16} />}
                variant="gradient"
                gradient={{ from: "blue", to: "cyan", deg: 45 }}
                size="lg"
              >
                NFT POWERED
              </Badge>
              <Badge
                variant="light"
                color="green"
                size="lg"
                style={{ padding: "12px 16px" }}
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
              description="Basic information and branding"
              icon={<IconInfoCircle size={20} />}
            />
            <Stepper.Step
              label="NFT Tickets"
              description="Configure your ticket types"
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
                Next: Configure Tickets
              </Button>
            ) : (
              <Button
                rightSection={<IconRocket size={18} />}
                onClick={handleSubmit}
                loading={createEventMutation.isPending}
                size="xl"
                radius="xl"
                variant="gradient"
                gradient={{ from: "violet", to: "purple", deg: 45 }}
                style={{ fontWeight: 600, padding: "16px 32px" }}
              >
                {createEventMutation.isPending
                  ? "Creating Event..."
                  : "Launch Event"}
              </Button>
            )}
          </Group>
        </Paper>
      </Container>
    </Box>
  );
};
