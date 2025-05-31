import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  Card,
  Group,
  Stack,
  Stepper,
  TextInput,
  NumberInput,
  MultiSelect,
  FileInput,
  Title,
  Text,
  ActionIcon,
  Divider,
  Badge,
  Image,
  Alert,
  Progress,
  Container,
  SimpleGrid,
  Paper,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import {
  IconArrowLeft,
  IconArrowRight,
  IconPlus,
  IconTrash,
  IconUpload,
  IconCheck,
  IconAlertCircle,
  IconRocket,
  IconTicket,
  IconInfoCircle,
  IconMapPin,
  IconPhoto,
  IconX,
} from "@tabler/icons-react";
import { useMutation } from "@tanstack/react-query";
import { eventsApi } from "../services/api";
import { GooglePlacesAutocomplete } from "../components/GooglePlacesAutocomplete";
import { CustomRichTextEditor } from "../components/RichTextEditor";

interface TicketType {
  name: string;
  price: number;
  supply: number;
  description: string;
}

interface EventFormData {
  name: string;
  logo: File | null;
  banner: File | null;
  location: string;
  description: string;
  categories: string[];
  organizerName: string;
  ticketTypes: TicketType[];
}

interface PlaceDetails {
  name: string;
  formattedAddress: string;
  latitude: number;
  longitude: number;
  placeId: string;
}

const eventCategories = [
  "Concert",
  "Tech Conference",
  "Workshop",
  "Sports",
  "Food & Drinks",
  "Art & Culture",
  "Business",
  "Networking",
  "Entertainment",
  "Education",
];

// Mock Google Maps API key - replace with actual key
const GOOGLE_MAPS_API_KEY =
  import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "demo-key";

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
      location: "",
      description: "",
      categories: [],
      organizerName: "",
      ticketTypes: [
        {
          name: "General Admission",
          price: 0,
          supply: 100,
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
    onError: (error) => {
      notifications.show({
        title: "Creation Failed",
        message: "Failed to create event. Please try again.",
        color: "red",
        icon: <IconAlertCircle size={16} />,
      });
    },
  });

  // Mock file upload function - integrate with backend storage controller
  const uploadFile = async (file: File): Promise<string> => {
    setUploading(true);
    try {
      // In real implementation, upload to backend storage controller
      // const formData = new FormData();
      // formData.append('file', file);
      // const response = await fetch('/api/storage', { method: 'POST', body: formData });
      // return response.json().url;

      // For now, return a mock URL
      return `https://storage.googleapis.com/bucket-name/${Date.now()}-${
        file.name
      }`;
    } finally {
      setUploading(false);
    }
  };

  const handleFileUpload = async (
    file: File | null,
    type: "logo" | "banner"
  ) => {
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (type === "logo") {
          setLogoPreview(reader.result as string);
          form.setFieldValue("logo", file);
        } else {
          setBannerPreview(reader.result as string);
          form.setFieldValue("banner", file);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePlaceSelect = (place: PlaceDetails) => {
    form.setFieldValue("location", place.formattedAddress);
  };

  const addTicketType = () => {
    form.setFieldValue("ticketTypes", [
      ...form.values.ticketTypes,
      { name: "", price: 0, supply: 100, description: "" },
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

    try {
      // Upload files to GCS via backend
      let logoUrl = "";
      let bannerUrl = "";

      if (form.values.logo) {
        logoUrl = await uploadFile(form.values.logo);
      }
      if (form.values.banner) {
        bannerUrl = await uploadFile(form.values.banner);
      }

      const formData = {
        ...form.values,
        logoUrl,
        bannerUrl,
      };

      createEventMutation.mutate(formData);
    } catch (error) {
      notifications.show({
        title: "Upload Failed",
        message: "Failed to upload images. Please try again.",
        color: "red",
      });
    }
  };

  const progress = ((active + 1) / 2) * 100;

  return (
    <Box
      style={{
        background:
          "linear-gradient(180deg, rgba(59, 130, 246, 0.02) 0%, rgba(139, 92, 246, 0.02) 100%)",
        minHeight: "100vh",
        width: "100%",
        paddingTop: "110px", // Account for header height + margin
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
                size="xl"
                style={{ padding: "16px 24px" }}
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
            <Stack gap="xl">
              <Group justify="space-between" mb="md">
                <Box>
                  <Title order={2} c="blue" size="1.8rem" fw={700}>
                    Event Information
                  </Title>
                  <Text c="dimmed" size="lg">
                    Tell the world about your amazing event
                  </Text>
                </Box>
              </Group>

              <SimpleGrid cols={{ base: 1, md: 2 }} spacing="xl">
                {/* Left Column */}
                <Stack gap="lg">
                  <TextInput
                    label="Event Name"
                    placeholder="Enter your event name"
                    required
                    size="lg"
                    radius="xl"
                    {...form.getInputProps("name")}
                    styles={{
                      label: { fontSize: "1rem", fontWeight: 600 },
                      input: {
                        border: "2px solid rgba(59, 130, 246, 0.2)",
                        background: "rgba(255, 255, 255, 0.9)",
                        padding: "16px 20px",
                        fontSize: "1rem",
                        "&:focus": {
                          borderColor: "#3b82f6",
                          boxShadow: "0 0 0 3px rgba(59, 130, 246, 0.1)",
                        },
                      },
                    }}
                  />

                  <TextInput
                    label="Organizer Name"
                    placeholder="Your name or organization"
                    required
                    size="lg"
                    radius="xl"
                    {...form.getInputProps("organizerName")}
                    styles={{
                      label: { fontSize: "1rem", fontWeight: 600 },
                      input: {
                        border: "2px solid rgba(59, 130, 246, 0.2)",
                        background: "rgba(255, 255, 255, 0.9)",
                        padding: "16px 20px",
                        fontSize: "1rem",
                        "&:focus": {
                          borderColor: "#3b82f6",
                          boxShadow: "0 0 0 3px rgba(59, 130, 246, 0.1)",
                        },
                      },
                    }}
                  />

                  <Box>
                    <Text
                      component="label"
                      size="md"
                      fw={600}
                      mb="xs"
                      style={{ display: "block" }}
                    >
                      Location{" "}
                      <Text span c="red">
                        *
                      </Text>
                    </Text>
                    <GooglePlacesAutocomplete
                      placeholder="Search for venue or address"
                      value={form.values.location}
                      onChange={(value) =>
                        form.setFieldValue("location", value)
                      }
                      onPlaceSelect={handlePlaceSelect}
                      apiKey={GOOGLE_MAPS_API_KEY}
                      size="lg"
                      radius="xl"
                      leftSection={<IconMapPin size={20} color="#3b82f6" />}
                      styles={{
                        input: {
                          border: "2px solid rgba(59, 130, 246, 0.2)",
                          background: "rgba(255, 255, 255, 0.9)",
                          padding: "16px 20px",
                          fontSize: "1rem",
                          "&:focus": {
                            borderColor: "#3b82f6",
                            boxShadow: "0 0 0 3px rgba(59, 130, 246, 0.1)",
                          },
                        },
                      }}
                      error={form.errors.location}
                    />
                  </Box>

                  <MultiSelect
                    label="Categories"
                    placeholder="Select up to 3 categories"
                    data={eventCategories}
                    maxValues={3}
                    size="lg"
                    radius="xl"
                    {...form.getInputProps("categories")}
                    styles={{
                      label: { fontSize: "1rem", fontWeight: 600 },
                      input: {
                        border: "2px solid rgba(59, 130, 246, 0.2)",
                        background: "rgba(255, 255, 255, 0.9)",
                        minHeight: "56px",
                        "&:focus": {
                          borderColor: "#3b82f6",
                          boxShadow: "0 0 0 3px rgba(59, 130, 246, 0.1)",
                        },
                      },
                      pill: {
                        background:
                          "linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)",
                        color: "white",
                        fontWeight: 500,
                      },
                    }}
                  />
                </Stack>

                {/* Right Column - Image Uploads */}
                <Stack gap="lg">
                  <Box>
                    <Text
                      component="label"
                      size="md"
                      fw={600}
                      mb="xs"
                      style={{ display: "block" }}
                    >
                      Event Logo
                    </Text>
                    <FileInput
                      placeholder="Upload event logo"
                      accept="image/*"
                      leftSection={<IconPhoto size={20} />}
                      size="lg"
                      radius="xl"
                      onChange={(file) => handleFileUpload(file, "logo")}
                      styles={{
                        input: {
                          border: "2px dashed rgba(59, 130, 246, 0.3)",
                          background: "rgba(255, 255, 255, 0.9)",
                          padding: "16px 20px",
                          fontSize: "1rem",
                          "&:hover": {
                            borderColor: "#3b82f6",
                            background: "rgba(59, 130, 246, 0.05)",
                          },
                        },
                      }}
                    />

                    {logoPreview && (
                      <Paper
                        mt="md"
                        p="md"
                        radius="xl"
                        style={{
                          border: "2px solid rgba(59, 130, 246, 0.2)",
                          background: "rgba(249, 250, 251, 0.8)",
                          position: "relative",
                        }}
                      >
                        <Group justify="space-between" mb="xs">
                          <Text size="sm" fw={500} c="dimmed">
                            Logo Preview
                          </Text>
                          <ActionIcon
                            variant="light"
                            color="red"
                            size="sm"
                            radius="xl"
                            onClick={() => {
                              setLogoPreview(null);
                              form.setFieldValue("logo", null);
                            }}
                          >
                            <IconX size={14} />
                          </ActionIcon>
                        </Group>
                        <Image
                          src={logoPreview}
                          alt="Logo preview"
                          h={120}
                          w="auto"
                          style={{ borderRadius: "12px" }}
                        />
                      </Paper>
                    )}
                  </Box>

                  <Box>
                    <Text
                      component="label"
                      size="md"
                      fw={600}
                      mb="xs"
                      style={{ display: "block" }}
                    >
                      Event Banner
                    </Text>
                    <FileInput
                      placeholder="Upload event banner"
                      accept="image/*"
                      leftSection={<IconPhoto size={20} />}
                      size="lg"
                      radius="xl"
                      onChange={(file) => handleFileUpload(file, "banner")}
                      styles={{
                        input: {
                          border: "2px dashed rgba(59, 130, 246, 0.3)",
                          background: "rgba(255, 255, 255, 0.9)",
                          padding: "16px 20px",
                          fontSize: "1rem",
                          "&:hover": {
                            borderColor: "#3b82f6",
                            background: "rgba(59, 130, 246, 0.05)",
                          },
                        },
                      }}
                    />

                    {bannerPreview && (
                      <Paper
                        mt="md"
                        p="md"
                        radius="xl"
                        style={{
                          border: "2px solid rgba(59, 130, 246, 0.2)",
                          background: "rgba(249, 250, 251, 0.8)",
                          position: "relative",
                        }}
                      >
                        <Group justify="space-between" mb="xs">
                          <Text size="sm" fw={500} c="dimmed">
                            Banner Preview
                          </Text>
                          <ActionIcon
                            variant="light"
                            color="red"
                            size="sm"
                            radius="xl"
                            onClick={() => {
                              setBannerPreview(null);
                              form.setFieldValue("banner", null);
                            }}
                          >
                            <IconX size={14} />
                          </ActionIcon>
                        </Group>
                        <Image
                          src={bannerPreview}
                          alt="Banner preview"
                          h={150}
                          w="100%"
                          style={{ borderRadius: "12px", objectFit: "cover" }}
                        />
                      </Paper>
                    )}
                  </Box>
                </Stack>
              </SimpleGrid>

              <CustomRichTextEditor
                label="Event Description"
                placeholder="Describe your event in detail. Use the toolbar to format your text, add links, and make it engaging!"
                required
                value={form.values.description}
                onChange={(value) => form.setFieldValue("description", value)}
                error={
                  typeof form.errors.description === "string"
                    ? form.errors.description
                    : undefined
                }
              />
            </Stack>
          )}

          {active === 1 && (
            <Stack gap="xl">
              <Group justify="space-between">
                <Box>
                  <Title order={2} c="blue" size="1.8rem" fw={700}>
                    NFT Ticket Configuration
                  </Title>
                  <Text c="dimmed" size="lg">
                    Design your blockchain ticket experience
                  </Text>
                </Box>
                <Button
                  leftSection={<IconPlus size={18} />}
                  onClick={addTicketType}
                  variant="gradient"
                  gradient={{ from: "blue", to: "cyan", deg: 45 }}
                  radius="xl"
                  size="lg"
                  style={{ fontWeight: 600 }}
                >
                  Add Ticket Type
                </Button>
              </Group>

              <Alert
                icon={<IconInfoCircle size={20} />}
                color="blue"
                radius="xl"
                p="lg"
                style={{
                  background: "rgba(59, 130, 246, 0.05)",
                  border: "2px solid rgba(59, 130, 246, 0.2)",
                  fontSize: "1rem",
                }}
              >
                <Text fw={600} mb="xs">
                  ⚡ Blockchain-Powered Tickets
                </Text>
                Each ticket type becomes a unique NFT collection on the Sui
                blockchain. Supply limits are permanent and cannot be increased
                after creation.
              </Alert>

              <Stack gap="lg">
                {form.values.ticketTypes.map((ticket, index) => (
                  <Paper
                    key={index}
                    shadow="md"
                    p="xl"
                    radius="xl"
                    style={{
                      background: "rgba(139, 92, 246, 0.03)",
                      border: "2px solid rgba(139, 92, 246, 0.2)",
                      transition: "all 0.3s ease",
                    }}
                  >
                    <Group justify="space-between" mb="lg">
                      <Badge
                        variant="gradient"
                        gradient={{ from: "violet", to: "purple", deg: 45 }}
                        leftSection={<IconTicket size={16} />}
                        size="xl"
                        style={{ padding: "12px 20px" }}
                      >
                        Ticket Type {index + 1}
                      </Badge>
                      {form.values.ticketTypes.length > 1 && (
                        <ActionIcon
                          color="red"
                          variant="light"
                          onClick={() => removeTicketType(index)}
                          radius="xl"
                          size="lg"
                        >
                          <IconTrash size={18} />
                        </ActionIcon>
                      )}
                    </Group>

                    <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="lg" mb="lg">
                      <TextInput
                        label="Ticket Name"
                        placeholder="VIP, Early Bird, General..."
                        value={ticket.name}
                        onChange={(e) =>
                          updateTicketType(index, "name", e.currentTarget.value)
                        }
                        size="lg"
                        radius="xl"
                        styles={{
                          label: { fontSize: "1rem", fontWeight: 600 },
                          input: {
                            border: "2px solid rgba(139, 92, 246, 0.2)",
                            background: "rgba(255, 255, 255, 0.9)",
                            "&:focus": {
                              borderColor: "#8b5cf6",
                              boxShadow: "0 0 0 3px rgba(139, 92, 246, 0.1)",
                            },
                          },
                        }}
                      />

                      <NumberInput
                        label="Price (SUI)"
                        placeholder="0.00"
                        value={ticket.price}
                        onChange={(value) =>
                          updateTicketType(index, "price", value || 0)
                        }
                        min={0}
                        step={0.01}
                        decimalScale={2}
                        size="lg"
                        radius="xl"
                        styles={{
                          label: { fontSize: "1rem", fontWeight: 600 },
                          input: {
                            border: "2px solid rgba(139, 92, 246, 0.2)",
                            background: "rgba(255, 255, 255, 0.9)",
                            "&:focus": {
                              borderColor: "#8b5cf6",
                              boxShadow: "0 0 0 3px rgba(139, 92, 246, 0.1)",
                            },
                          },
                        }}
                      />

                      <NumberInput
                        label="Max Supply"
                        placeholder="100"
                        value={ticket.supply}
                        onChange={(value) =>
                          updateTicketType(index, "supply", value || 1)
                        }
                        min={1}
                        size="lg"
                        radius="xl"
                        styles={{
                          label: { fontSize: "1rem", fontWeight: 600 },
                          input: {
                            border: "2px solid rgba(139, 92, 246, 0.2)",
                            background: "rgba(255, 255, 255, 0.9)",
                            "&:focus": {
                              borderColor: "#8b5cf6",
                              boxShadow: "0 0 0 3px rgba(139, 92, 246, 0.1)",
                            },
                          },
                        }}
                      />
                    </SimpleGrid>

                    <TextInput
                      label="Perks & Benefits (Optional)"
                      placeholder="Describe special access, perks, or benefits included..."
                      value={ticket.description}
                      onChange={(e) =>
                        updateTicketType(
                          index,
                          "description",
                          e.currentTarget.value
                        )
                      }
                      size="lg"
                      radius="xl"
                      styles={{
                        label: { fontSize: "1rem", fontWeight: 600 },
                        input: {
                          border: "2px solid rgba(139, 92, 246, 0.2)",
                          background: "rgba(255, 255, 255, 0.9)",
                          "&:focus": {
                            borderColor: "#8b5cf6",
                            boxShadow: "0 0 0 3px rgba(139, 92, 246, 0.1)",
                          },
                        },
                      }}
                    />
                  </Paper>
                ))}
              </Stack>
            </Stack>
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
                loading={createEventMutation.isPending || uploading}
                size="xl"
                radius="xl"
                variant="gradient"
                gradient={{ from: "violet", to: "purple", deg: 45 }}
                style={{ fontWeight: 600, padding: "16px 32px" }}
              >
                {uploading ? "Uploading..." : "Launch Event"}
              </Button>
            )}
          </Group>
        </Paper>
      </Container>
    </Box>
  );
};
