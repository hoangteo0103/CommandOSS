import {
  Stack,
  TextInput,
  MultiSelect,
  FileInput,
  Text,
  Box,
  SimpleGrid,
  Paper,
  Group,
  ActionIcon,
  Image,
  Card,
  Flex,
  Loader,
} from "@mantine/core";
import { DateTimePicker } from "@mantine/dates";
import {
  IconPhoto,
  IconX,
  IconMapPin,
  IconCalendar,
  IconUser,
} from "@tabler/icons-react";
import { GooglePlacesAutocomplete } from "./GooglePlacesAutocomplete";
import { CustomRichTextEditor } from "./RichTextEditor";
import { notifications } from "@mantine/notifications";
import { IconCheck } from "@tabler/icons-react";
import { useMutation } from "@tanstack/react-query";
import { storageApi } from "../services/api";
import type { ApiResponse, StorageUploadResponse } from "../types";
import { useState } from "react";

interface PlaceDetails {
  name: string;
  formattedAddress: string;
  latitude: number;
  longitude: number;
  placeId: string;
}

interface EventDetailsStepProps {
  form: any;
  logoPreview: string | null;
  bannerPreview: string | null;
  setLogoPreview: (preview: string | null) => void;
  setBannerPreview: (preview: string | null) => void;
  uploading: boolean;
  setUploading: (uploading: boolean) => void;
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

const GOOGLE_MAPS_API_KEY =
  import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "demo-key";

export const EventDetailsStep: React.FC<EventDetailsStepProps> = ({
  form,
  logoPreview,
  bannerPreview,
  setLogoPreview,
  setBannerPreview,
  setUploading,
}) => {
  const [uploadingType, setUploadingType] = useState<"logo" | "banner" | null>(
    null
  );

  const uploadFileMutation = useMutation({
    mutationFn: (file: File) => storageApi.uploadFile(file),
    onError: () => {
      notifications.show({
        title: "Upload Failed",
        message: "Failed to upload file. Please try again.",
        color: "red",
        icon: <IconX size={16} />,
      });
    },
  });

  const handleFileUpload = async (
    file: File | null,
    type: "logo" | "banner"
  ) => {
    if (file) {
      try {
        setUploading(true);
        setUploadingType(type);

        // Create preview immediately
        const reader = new FileReader();
        reader.onloadend = () => {
          if (type === "logo") {
            setLogoPreview(reader.result as string);
          } else {
            setBannerPreview(reader.result as string);
          }
        };
        reader.readAsDataURL(file);

        // Upload to server immediately
        const result = (await uploadFileMutation.mutateAsync(
          file
        )) as ApiResponse<StorageUploadResponse>;

        if (result.data?.url) {
          if (type === "logo") {
            form.setFieldValue("logo", file);
            form.setFieldValue("logoUrl", result.data.url);
          } else {
            form.setFieldValue("banner", file);
            form.setFieldValue("bannerUrl", result.data.url);
          }

          notifications.show({
            title: "Upload Successful",
            message: `${
              type.charAt(0).toUpperCase() + type.slice(1)
            } uploaded successfully`,
            color: "green",
            icon: <IconCheck size={16} />,
          });
        }
      } catch (error) {
        notifications.show({
          title: "Upload Failed",
          message: `Failed to upload ${type}. Please try again.`,
          color: "red",
          icon: <IconX size={16} />,
        });
      } finally {
        setUploading(false);
        setUploadingType(null);
      }
    }
  };

  const handlePlaceSelect = (place: PlaceDetails) => {
    form.values.location = place.name + ", " + place.formattedAddress;
    form.values.latitude = place.latitude;
    form.values.longitude = place.longitude;
    form.values.placeId = place.placeId;
  };

  return (
    <Stack gap="xl">
      {/* Basic Information Card */}
      <Card
        shadow="sm"
        padding="xl"
        radius="xl"
        style={{
          background:
            "linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(139, 92, 246, 0.05) 100%)",
          border: "2px solid rgba(59, 130, 246, 0.2)",
        }}
      >
        <Text size="lg" fw={700} mb="lg" c="blue">
          📝 Basic Information
        </Text>

        <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
          <TextInput
            label="Event Name"
            placeholder="Enter your event name"
            required
            size="lg"
            radius="xl"
            leftSection={<IconUser size={18} color="#3b82f6" />}
            {...form.getInputProps("name")}
            styles={{
              label: { fontSize: "1rem", fontWeight: 600, marginBottom: "8px" },
              input: {
                border: "2px solid rgba(59, 130, 246, 0.2)",
                background: "rgba(255, 255, 255, 0.95)",
                padding: "16px 20px",
                paddingLeft: "52px",
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
            leftSection={<IconUser size={18} color="#3b82f6" />}
            {...form.getInputProps("organizerName")}
            styles={{
              label: { fontSize: "1rem", fontWeight: 600, marginBottom: "8px" },
              input: {
                border: "2px solid rgba(59, 130, 246, 0.2)",
                background: "rgba(255, 255, 255, 0.95)",
                padding: "16px 20px",
                paddingLeft: "52px",
                fontSize: "1rem",
                "&:focus": {
                  borderColor: "#3b82f6",
                  boxShadow: "0 0 0 3px rgba(59, 130, 246, 0.1)",
                },
              },
            }}
          />
        </SimpleGrid>

        <DateTimePicker
          label="Event Date & Time"
          placeholder="Select date and time"
          required
          size="lg"
          radius="xl"
          mt="lg"
          leftSection={<IconCalendar size={18} color="#3b82f6" />}
          value={form.values.date ? new Date(form.values.date) : null}
          onChange={(value) =>
            form.setFieldValue(
              "date",
              value ? new Date(value).toISOString() : ""
            )
          }
          error={form.errors.date}
          styles={{
            label: { fontSize: "1rem", fontWeight: 600, marginBottom: "8px" },
            input: {
              border: "2px solid rgba(59, 130, 246, 0.2)",
              background: "rgba(255, 255, 255, 0.95)",
              padding: "16px 20px",
              paddingLeft: "52px",
              fontSize: "1rem",
              "&:focus": {
                borderColor: "#3b82f6",
                boxShadow: "0 0 0 3px rgba(59, 130, 246, 0.1)",
              },
            },
          }}
        />
      </Card>

      {/* Location & Categories Card */}
      <Card
        shadow="sm"
        padding="xl"
        radius="xl"
        style={{
          background:
            "linear-gradient(135deg, rgba(16, 185, 129, 0.05) 0%, rgba(59, 130, 246, 0.05) 100%)",
          border: "2px solid rgba(16, 185, 129, 0.2)",
        }}
      >
        <Text size="lg" fw={700} mb="lg" c="teal">
          📍 Location & Categories
        </Text>

        <Box mb="lg">
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
            onChange={(value) => form.setFieldValue("location", value)}
            onPlaceSelect={handlePlaceSelect}
            apiKey={GOOGLE_MAPS_API_KEY}
            size="lg"
            radius="xl"
            leftSection={<IconMapPin size={18} color="#10b981" />}
            styles={{
              input: {
                border: "2px solid rgba(16, 185, 129, 0.2)",
                background: "rgba(255, 255, 255, 0.95)",
                padding: "16px 20px",
                paddingLeft: "52px",
                fontSize: "1rem",
                "&:focus": {
                  borderColor: "#10b981",
                  boxShadow: "0 0 0 3px rgba(16, 185, 129, 0.1)",
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
            label: { fontSize: "1rem", fontWeight: 600, marginBottom: "8px" },
            input: {
              border: "2px solid rgba(16, 185, 129, 0.2)",
              background: "rgba(255, 255, 255, 0.95)",
              minHeight: "56px",
              "&:focus": {
                borderColor: "#10b981",
                boxShadow: "0 0 0 3px rgba(16, 185, 129, 0.1)",
              },
            },
            pill: {
              background: "linear-gradient(135deg, #10b981 0%, #3b82f6 100%)",
              color: "white",
              fontWeight: 500,
            },
          }}
        />
      </Card>

      {/* Visual Assets Card */}
      <Card
        shadow="sm"
        padding="xl"
        radius="xl"
        style={{
          background:
            "linear-gradient(135deg, rgba(139, 92, 246, 0.05) 0%, rgba(236, 72, 153, 0.05) 100%)",
          border: "2px solid rgba(139, 92, 246, 0.2)",
        }}
      >
        <Text size="lg" fw={700} mb="lg" c="violet">
          🎨 Visual Assets
        </Text>

        <SimpleGrid cols={{ base: 1, md: 2 }} spacing="xl">
          {/* Logo Upload */}
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
            <Box style={{ position: "relative" }}>
              <FileInput
                key={`logo-${form.values.logo ? "uploaded" : "empty"}`}
                placeholder={
                  uploadingType === "logo"
                    ? "Uploading logo..."
                    : "Upload event logo (JPG, PNG)"
                }
                accept="image/*"
                leftSection={
                  uploadingType === "logo" ? (
                    <Loader size={18} color="violet" />
                  ) : (
                    <IconPhoto size={18} />
                  )
                }
                size="lg"
                radius="xl"
                value={form.values.logo}
                onChange={(file) => handleFileUpload(file, "logo")}
                disabled={uploadingType === "logo"}
                styles={{
                  input: {
                    border:
                      uploadingType === "logo"
                        ? "2px solid rgba(139, 92, 246, 0.6)"
                        : "2px dashed rgba(139, 92, 246, 0.3)",
                    background:
                      uploadingType === "logo"
                        ? "rgba(139, 92, 246, 0.1)"
                        : "rgba(255, 255, 255, 0.95)",
                    padding: "16px 20px",
                    paddingLeft: "52px",
                    fontSize: "1rem",
                    color: uploadingType === "logo" ? "#8b5cf6" : "inherit",
                    "&:hover": {
                      borderColor: "#8b5cf6",
                      background: "rgba(139, 92, 246, 0.05)",
                    },
                    "&:disabled": {
                      opacity: 0.8,
                      cursor: "not-allowed",
                    },
                  },
                }}
              />
            </Box>

            {logoPreview && (
              <Paper
                mt="md"
                p="md"
                radius="xl"
                style={{
                  border: "2px solid rgba(139, 92, 246, 0.2)",
                  background: "rgba(249, 250, 251, 0.8)",
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
                      form.setFieldValue("logoUrl", "");
                    }}
                  >
                    <IconX size={14} />
                  </ActionIcon>
                </Group>
                <Flex justify="center">
                  <Image
                    src={logoPreview}
                    alt="Logo preview"
                    h={120}
                    w="auto"
                    style={{ borderRadius: "12px" }}
                  />
                </Flex>
              </Paper>
            )}
          </Box>

          {/* Banner Upload */}
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
            <Box style={{ position: "relative" }}>
              <FileInput
                key={`banner-${form.values.banner ? "uploaded" : "empty"}`}
                placeholder={
                  uploadingType === "banner"
                    ? "Uploading banner..."
                    : "Upload event banner (JPG, PNG)"
                }
                accept="image/*"
                leftSection={
                  uploadingType === "banner" ? (
                    <Loader size={18} color="violet" />
                  ) : (
                    <IconPhoto size={18} />
                  )
                }
                size="lg"
                radius="xl"
                value={form.values.banner}
                onChange={(file) => handleFileUpload(file, "banner")}
                disabled={uploadingType === "banner"}
                styles={{
                  input: {
                    border:
                      uploadingType === "banner"
                        ? "2px solid rgba(139, 92, 246, 0.6)"
                        : "2px dashed rgba(139, 92, 246, 0.3)",
                    background:
                      uploadingType === "banner"
                        ? "rgba(139, 92, 246, 0.1)"
                        : "rgba(255, 255, 255, 0.95)",
                    padding: "16px 20px",
                    paddingLeft: "52px",
                    fontSize: "1rem",
                    color: uploadingType === "banner" ? "#8b5cf6" : "inherit",
                    "&:hover": {
                      borderColor: "#8b5cf6",
                      background: "rgba(139, 92, 246, 0.05)",
                    },
                    "&:disabled": {
                      opacity: 0.8,
                      cursor: "not-allowed",
                    },
                  },
                }}
              />
            </Box>

            {bannerPreview && (
              <Paper
                mt="md"
                p="md"
                radius="xl"
                style={{
                  border: "2px solid rgba(139, 92, 246, 0.2)",
                  background: "rgba(249, 250, 251, 0.8)",
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
                      form.setFieldValue("bannerUrl", "");
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
        </SimpleGrid>
      </Card>

      {/* Description Card */}
      <Card
        shadow="sm"
        padding="xl"
        radius="xl"
        style={{
          background:
            "linear-gradient(135deg, rgba(245, 158, 11, 0.05) 0%, rgba(239, 68, 68, 0.05) 100%)",
          border: "2px solid rgba(245, 158, 11, 0.2)",
        }}
      >
        <Text size="lg" fw={700} mb="lg" c="orange">
          📄 Event Description
        </Text>

        <CustomRichTextEditor
          label=""
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
      </Card>
    </Stack>
  );
};
