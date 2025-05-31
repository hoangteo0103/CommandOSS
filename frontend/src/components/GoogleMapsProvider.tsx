import React from "react";
import { useJsApiLoader } from "@react-google-maps/api";
import { Box, Loader, Text, Stack } from "@mantine/core";

interface GoogleMapsProviderProps {
  children: React.ReactNode;
}

export const GoogleMapsProvider: React.FC<GoogleMapsProviderProps> = ({
  children,
}) => {
  const { isLoaded, loadError } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "",
  });

  if (loadError) {
    return (
      <Box
        style={{
          width: "100%",
          height: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#f8f9fa",
        }}
      >
        <Stack align="center" gap="md">
          <Text c="red" size="lg" fw={600}>
            Failed to load Google Maps
          </Text>
          <Text c="dimmed" size="sm">
            Please check your API key configuration
          </Text>
        </Stack>
      </Box>
    );
  }

  if (!isLoaded) {
    return (
      <Box
        style={{
          width: "100%",
          height: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#f8f9fa",
        }}
      >
        <Stack align="center" gap="md">
          <Loader size="lg" />
          <Text c="dimmed">Loading Google Maps...</Text>
        </Stack>
      </Box>
    );
  }

  return <>{children}</>;
};
