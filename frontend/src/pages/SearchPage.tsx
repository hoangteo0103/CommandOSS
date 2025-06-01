import { useState, useEffect, useCallback, useRef } from "react";
import { useLocation } from "react-router-dom";
import {
  Grid,
  Box,
  Text,
  Loader,
  Group,
  Button,
  ScrollArea,
  Container,
  Stack,
  Paper,
} from "@mantine/core";
import { useDebouncedCallback } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import { GoogleMap, InfoWindow, OverlayView } from "@react-google-maps/api";
import { IconRefresh, IconZoomIn } from "@tabler/icons-react";
import {
  SearchFilters,
  type SearchFiltersData,
} from "../components/SearchFilters";
import { SearchEventCard } from "../components/SearchEventCard";
import { GoogleMapsProvider } from "../components/GoogleMapsProvider";
import { useSemanticSearch } from "../hooks/useSemanticSearch";
import type { Event } from "../types";
import { CustomMarker } from "../components/CustomMarker";

// Add CSS for pulse animation
const pulseStyles = `
  @keyframes pulse {
    0% {
      opacity: 1;
      transform: scale(1);
    }
    50% {
      opacity: 0.6;
      transform: scale(1.15);
    }
    100% {
      opacity: 1;
      transform: scale(1);
    }
  }
`;

// Inject styles
if (typeof document !== "undefined") {
  const styleElement = document.createElement("style");
  styleElement.textContent = pulseStyles;
  document.head.appendChild(styleElement);
}

function useQueryParam(key: string) {
  const { search } = useLocation();
  return new URLSearchParams(search).get(key);
}

const mapContainerStyle = {
  width: "100%",
  height: "100vh",
};

const defaultCenter = {
  lat: 10.8231, // Ho Chi Minh City coordinates
  lng: 106.6297,
};

const mapOptions = {
  disableDefaultUI: false,
  zoomControl: true,
  streetViewControl: false,
  mapTypeControl: false,
  fullscreenControl: false,
  clickableIcons: false,
  gestureHandling: "greedy",
};

const SearchPageContent = () => {
  const queryParam = useQueryParam("q") || "";
  const categoryParam = useQueryParam("categories");

  const [filters, setFilters] = useState<SearchFiltersData>({
    query: queryParam,
    categories: categoryParam ? categoryParam.split(",") : [],
    startDate: "",
    endDate: "",
    status: "",
    organizerName: "",
  });

  const [page, setPage] = useState(1);
  const [allEvents, setAllEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [mapBounds, setMapBounds] = useState<{
    minLat?: number;
    maxLat?: number;
    minLon?: number;
    maxLon?: number;
  }>({});
  const [isMapInteracted, setIsMapInteracted] = useState(false);
  const [shouldAutoFit, setShouldAutoFit] = useState(true);

  const mapRef = useRef<google.maps.Map | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Search parameters for API
  const searchParams = {
    query: filters.query,
    limit: 20,
    page,
    categories: filters.categories.length > 0 ? filters.categories : undefined,
    startDate: filters.startDate || undefined,
    endDate: filters.endDate || undefined,
    status: filters.status || undefined,
    organizerName: filters.organizerName || undefined,
    ...(isMapInteracted ? mapBounds : {}),
  };

  // Semantic search query
  const {
    data: searchResult,
    isLoading,
    error,
    refetch,
  } = useSemanticSearch(searchParams);

  // Handle search results
  useEffect(() => {
    if (searchResult?.success && searchResult.result) {
      if (page === 1) {
        // For first page, replace all events
        setAllEvents(searchResult.result);
      } else {
        // For subsequent pages, append new events but deduplicate
        setAllEvents((prev) => {
          const newEvents = searchResult.result.filter(
            (newEvent) =>
              !prev.find((existingEvent) => existingEvent.id === newEvent.id)
          );
          return [...prev, ...newEvents];
        });
      }
    }
  }, [searchResult, page]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
    setAllEvents([]);
    setSelectedEvent(null);
    // Don't reset map bounds here as it's handled in filter change handlers
  }, [
    filters.query,
    filters.categories,
    filters.startDate,
    filters.endDate,
    filters.status,
    filters.organizerName,
  ]);

  // Reset page when map bounds change (separate from filters)
  useEffect(() => {
    if (isMapInteracted) {
      setPage(1);
      setAllEvents([]);
    }
  }, [mapBounds, isMapInteracted]);

  // Debounced function to handle map bounds change
  const debouncedBoundsChange = useDebouncedCallback(
    (bounds: google.maps.LatLngBounds) => {
      const ne = bounds.getNorthEast();
      const sw = bounds.getSouthWest();

      const newBounds = {
        minLat: sw.lat(),
        maxLat: ne.lat(),
        minLon: sw.lng(),
        maxLon: ne.lng(),
      };

      setMapBounds(newBounds);
      setPage(1);
      setIsMapInteracted(true);
    },
    500
  );

  // Handle map idle event
  const handleMapIdle = useCallback(() => {
    if (mapRef.current) {
      const bounds = mapRef.current.getBounds();
      if (bounds && isMapInteracted) {
        debouncedBoundsChange(bounds);
      }
    }
  }, [debouncedBoundsChange, isMapInteracted]);

  // Handle map load
  const handleMapLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;

    // Add listeners for user interaction
    map.addListener("dragstart", () => {
      setIsMapInteracted(true);
      setShouldAutoFit(false);
    });

    map.addListener("zoom_changed", () => {
      setIsMapInteracted(true);
      setShouldAutoFit(false);
    });
  }, []);

  // Handle scroll for infinite loading
  const handleScroll = useCallback(() => {
    if (!scrollAreaRef.current || isLoading) return;

    const { scrollTop, scrollHeight, clientHeight } = scrollAreaRef.current;
    const isNearBottom = scrollTop + clientHeight >= scrollHeight - 100;

    if (
      isNearBottom &&
      searchResult?.result &&
      searchResult.result.length >= 20
    ) {
      setPage((prev) => prev + 1);
    }
  }, [isLoading, searchResult]);

  // Function to handle overlapping markers by adding small offsets
  const adjustMarkersForOverlap = useCallback(
    (
      events: Event[]
    ): (Event & { offsetLat?: number; offsetLng?: number })[] => {
      // First, deduplicate events by ID to prevent duplicate markers
      const uniqueEvents = events.reduce((acc, event) => {
        if (!acc.find((e) => e.id === event.id)) {
          acc.push(event);
        }
        return acc;
      }, [] as Event[]);

      const adjustedEvents = uniqueEvents.map((event) => ({
        ...event,
        offsetLat: event.latitude,
        offsetLng: event.longitude,
      }));

      for (let i = 0; i < adjustedEvents.length; i++) {
        for (let j = i + 1; j < adjustedEvents.length; j++) {
          const event1 = adjustedEvents[i];
          const event2 = adjustedEvents[j];

          if (
            event1.latitude &&
            event1.longitude &&
            event2.latitude &&
            event2.longitude
          ) {
            // Calculate distance between markers
            const latDiff = Math.abs(event1.offsetLat! - event2.offsetLat!);
            const lngDiff = Math.abs(event1.offsetLng! - event2.offsetLng!);

            // If markers are too close (within ~100 meters)
            if (latDiff < 0.001 && lngDiff < 0.001) {
              // Add small random offset to the second marker
              const offsetDistance = 0.0005; // ~50 meters
              const angle = Math.random() * 2 * Math.PI;

              event2.offsetLat =
                event2.offsetLat! + Math.cos(angle) * offsetDistance;
              event2.offsetLng =
                event2.offsetLng! + Math.sin(angle) * offsetDistance;
            }
          }
        }
      }

      return adjustedEvents;
    },
    []
  );

  // Events with coordinates for map (with overlap adjustment and deduplication)
  const adjustedEventsWithCoordinates = adjustMarkersForOverlap(
    allEvents.filter((event) => event.latitude && event.longitude)
  );

  // Auto-fit map to events when results change
  useEffect(() => {
    if (
      adjustedEventsWithCoordinates.length > 0 &&
      shouldAutoFit &&
      mapRef.current
    ) {
      const bounds = new google.maps.LatLngBounds();
      adjustedEventsWithCoordinates.forEach((event) => {
        if (event.offsetLat && event.offsetLng) {
          bounds.extend(
            new google.maps.LatLng(event.offsetLat, event.offsetLng)
          );
        }
      });

      if (!bounds.isEmpty()) {
        setTimeout(() => {
          if (mapRef.current) {
            mapRef.current.fitBounds(bounds);
            // Add some padding to the bounds
            const zoom = mapRef.current.getZoom();
            if (zoom && zoom > 15) {
              mapRef.current.setZoom(Math.min(zoom, 15));
            }
            setShouldAutoFit(false);
          }
        }, 300);
      }
    }
  }, [adjustedEventsWithCoordinates, shouldAutoFit]);

  // Handle filter changes
  const handleFiltersChange = (newFilters: SearchFiltersData) => {
    setFilters(newFilters);
    setShouldAutoFit(true);
    setIsMapInteracted(false);
    setMapBounds({});
    setSelectedEvent(null); // Clear selection when filters change
    setPage(1); // Reset to first page
    setAllEvents([]); // Clear current events to force refresh

    // Force refetch with new parameters
    setTimeout(() => refetch(), 100);
  };

  // Reset filters
  const resetFilters = () => {
    const clearedFilters = {
      query: "",
      categories: [],
      startDate: "",
      endDate: "",
      status: "",
      organizerName: "",
    };
    setFilters(clearedFilters);
    setShouldAutoFit(true);
    setIsMapInteracted(false);
    setMapBounds({});
    setSelectedEvent(null);
    setPage(1); // Reset to first page
    setAllEvents([]); // Clear current events to force refresh

    // Force refetch with cleared parameters
    setTimeout(() => refetch(), 100);
  };

  // Fit map to all events
  const fitMapToEvents = () => {
    if (mapRef.current && adjustedEventsWithCoordinates.length > 0) {
      const bounds = new google.maps.LatLngBounds();
      adjustedEventsWithCoordinates.forEach((event) => {
        if (event.offsetLat && event.offsetLng) {
          bounds.extend(
            new google.maps.LatLng(event.offsetLat, event.offsetLng)
          );
        }
      });

      if (!bounds.isEmpty()) {
        mapRef.current.fitBounds(bounds);
        // Add some padding and limit max zoom
        setTimeout(() => {
          const zoom = mapRef.current?.getZoom();
          if (zoom && zoom > 15) {
            mapRef.current?.setZoom(15);
          }
        }, 100);
      }
    }
  };

  // Handle error
  useEffect(() => {
    if (error) {
      notifications.show({
        title: "Search Error",
        message: "Failed to search events. Please try again.",
        color: "red",
      });
    }
  }, [error]);

  return (
    <Container fluid p={0} style={{ height: "100vh", overflow: "hidden" }}>
      <Grid style={{ margin: 0, height: "100vh" }}>
        {/* Left side: Filters and Results */}
        <Grid.Col
          span={6}
          style={{
            padding: 0,
            height: "100vh",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* Filters */}
          <Box
            p="sm"
            style={{ borderBottom: "1px solid rgba(59, 130, 246, 0.1)" }}
          >
            <SearchFilters
              filters={filters}
              onFiltersChange={handleFiltersChange}
              onReset={resetFilters}
            />
          </Box>

          {/* Results Header */}
          <Box
            p="md"
            style={{ borderBottom: "1px solid rgba(59, 130, 246, 0.1)" }}
          >
            <Group justify="space-between" align="center">
              <Text size="lg" fw={600}>
                {isLoading && page === 1
                  ? "Searching..."
                  : `Found ${allEvents.length} events`}
              </Text>
              {allEvents.length > 0 && (
                <Group gap="xs">
                  <Button
                    variant="light"
                    size="xs"
                    leftSection={<IconZoomIn size={14} />}
                    onClick={fitMapToEvents}
                  >
                    Fit to Events
                  </Button>
                  <Button
                    variant="light"
                    size="xs"
                    leftSection={<IconRefresh size={14} />}
                    onClick={() => {
                      setPage(1);
                      window.location.reload();
                    }}
                  >
                    Refresh
                  </Button>
                </Group>
              )}
            </Group>
          </Box>

          {/* Events Grid */}
          <ScrollArea
            flex={1}
            style={{ height: "calc(100vh - 200px)" }}
            viewportRef={scrollAreaRef}
            onScrollPositionChange={handleScroll}
          >
            {isLoading && page === 1 ? (
              <Box p="xl" style={{ textAlign: "center" }}>
                <Loader size="lg" />
                <Text mt="md" c="dimmed">
                  Searching events...
                </Text>
              </Box>
            ) : allEvents.length > 0 ? (
              <Box p="md">
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                    gap: "16px",
                    alignItems: "start",
                  }}
                >
                  {allEvents.map((event) => (
                    <SearchEventCard
                      key={event.id}
                      event={event}
                      onInterestToggle={(eventId) => {
                        // TODO: Implement interest toggle
                        console.log("Toggle interest for event:", eventId);
                      }}
                    />
                  ))}
                </div>
                {isLoading && page > 1 && (
                  <Box p="md" style={{ textAlign: "center" }}>
                    <Loader size="sm" />
                    <Text size="sm" c="dimmed" mt="xs">
                      Loading more events...
                    </Text>
                  </Box>
                )}
                {searchResult?.result && searchResult.result.length < 20 && (
                  <Box p="md" style={{ textAlign: "center" }}>
                    <Text size="sm" c="dimmed">
                      No more events to load
                    </Text>
                  </Box>
                )}
              </Box>
            ) : (
              <Box p="xl" style={{ textAlign: "center" }}>
                <Text size="xl" c="dimmed" mb="sm">
                  No events found
                </Text>
                <Text size="sm" c="dimmed">
                  Try adjusting your search filters or explore different
                  keywords
                </Text>
                <Button variant="light" mt="md" onClick={resetFilters}>
                  Clear Filters
                </Button>
              </Box>
            )}
          </ScrollArea>
        </Grid.Col>

        {/* Right side: Google Map */}
        <Grid.Col span={6} style={{ padding: 0, position: "relative" }}>
          <GoogleMap
            mapContainerStyle={mapContainerStyle}
            center={defaultCenter}
            zoom={12}
            options={mapOptions}
            onLoad={handleMapLoad}
            onIdle={handleMapIdle}
          >
            {/* Custom markers using OverlayView */}
            {adjustedEventsWithCoordinates.map((event, index) => {
              // Debug logging (remove in production)
              if (process.env.NODE_ENV === "development") {
              }

              return (
                <OverlayView
                  key={`marker-${event.id}-${index}`} // Unique key to prevent duplicates
                  position={{
                    lat: event.offsetLat!,
                    lng: event.offsetLng!,
                  }}
                  mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
                >
                  <CustomMarker
                    event={event}
                    isSelected={selectedEvent?.id === event.id}
                    onClick={() => setSelectedEvent(event)}
                  />
                </OverlayView>
              );
            })}

            {/* Info window for selected event */}
            {selectedEvent &&
              selectedEvent.latitude &&
              selectedEvent.longitude && (
                <InfoWindow
                  position={{
                    lat: selectedEvent.latitude,
                    lng: selectedEvent.longitude,
                  }}
                  onCloseClick={() => setSelectedEvent(null)}
                  options={{
                    pixelOffset: new google.maps.Size(0, -40), // Offset to account for marker height
                    maxWidth: 380,
                  }}
                >
                  <Box
                    style={{
                      padding: "0",
                      minWidth: "320px",
                      maxWidth: "360px",
                    }}
                  >
                    {/* Event Banner/Logo */}
                    {(selectedEvent.bannerUrl || selectedEvent.logoUrl) && (
                      <Box
                        style={{
                          width: "100%",
                          height: "160px",
                          borderRadius: "12px 12px 0 0",
                          overflow: "hidden",
                          position: "relative",
                          marginBottom: "12px",
                        }}
                      >
                        <img
                          src={selectedEvent.bannerUrl || selectedEvent.logoUrl}
                          alt={selectedEvent.name}
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                            display: "block",
                          }}
                          onError={(e) => {
                            // Fallback to logo if banner fails, or hide if both fail
                            const img = e.target as HTMLImageElement;
                            if (
                              selectedEvent.bannerUrl &&
                              img.src === selectedEvent.bannerUrl &&
                              selectedEvent.logoUrl
                            ) {
                              img.src = selectedEvent.logoUrl;
                            } else {
                              img.style.display = "none";
                              const parent = img.parentElement;
                              if (parent) parent.style.display = "none";
                            }
                          }}
                        />

                        {/* Gradient overlay for better text readability */}
                        <Box
                          style={{
                            position: "absolute",
                            bottom: 0,
                            left: 0,
                            right: 0,
                            height: "50%",
                            background:
                              "linear-gradient(transparent, rgba(0,0,0,0.7))",
                            display: "flex",
                            alignItems: "flex-end",
                            padding: "16px",
                          }}
                        >
                          {/* Availability Badge */}
                          {selectedEvent.availableTickets !== undefined && (
                            <Box
                              style={{
                                position: "absolute",
                                top: "12px",
                                right: "12px",
                                backgroundColor:
                                  selectedEvent.availableTickets > 0
                                    ? "#10b981"
                                    : "#ef4444",
                                color: "white",
                                padding: "6px 12px",
                                borderRadius: "20px",
                                fontSize: "12px",
                                fontWeight: 700,
                                boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
                              }}
                            >
                              {selectedEvent.availableTickets > 0
                                ? `${selectedEvent.availableTickets} tickets left`
                                : "Sold out"}
                            </Box>
                          )}
                        </Box>
                      </Box>
                    )}

                    {/* Content Container */}
                    <Box style={{ padding: "12px" }}>
                      <Stack gap="sm">
                        {/* Event Header */}
                        <Box>
                          <Text
                            fw={700}
                            size="lg"
                            lineClamp={2}
                            mb="xs"
                            style={{ color: "#1a1a1a" }}
                          >
                            {selectedEvent.name}
                          </Text>

                          {/* Date and Time */}
                          <Group gap="md" mb="sm">
                            <Group gap="xs">
                              <Text
                                size="sm"
                                fw={600}
                                style={{ color: "#3b82f6" }}
                              >
                                📅{" "}
                                {new Date(
                                  selectedEvent.date
                                ).toLocaleDateString("en-US", {
                                  weekday: "short",
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                })}
                              </Text>
                            </Group>

                            <Group gap="xs">
                              <Text
                                size="sm"
                                fw={600}
                                style={{ color: "#6b7280" }}
                              >
                                🕐{" "}
                                {new Date(
                                  selectedEvent.date
                                ).toLocaleTimeString("en-US", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </Text>
                            </Group>
                          </Group>

                          {/* Show availability badge only if no image */}
                          {!(
                            selectedEvent.bannerUrl || selectedEvent.logoUrl
                          ) &&
                            selectedEvent.availableTickets !== undefined && (
                              <Group gap="xs" mb="sm">
                                <Text
                                  size="sm"
                                  fw={600}
                                  style={{
                                    color:
                                      selectedEvent.availableTickets > 0
                                        ? "#059669"
                                        : "#dc2626",
                                  }}
                                >
                                  🎫{" "}
                                  {selectedEvent.availableTickets > 0
                                    ? `${selectedEvent.availableTickets} tickets left`
                                    : "Sold out"}
                                </Text>
                              </Group>
                            )}
                        </Box>

                        {/* Description */}
                        <Text
                          size="sm"
                          c="dimmed"
                          lineClamp={3}
                          style={{ lineHeight: 1.4 }}
                        >
                          {selectedEvent.description?.replace(/<[^>]*>/g, "") ||
                            "No description available"}
                        </Text>

                        {/* Categories */}
                        {selectedEvent.categories &&
                          selectedEvent.categories.length > 0 && (
                            <Group gap="xs">
                              {selectedEvent.categories
                                .slice(0, 3)
                                .map((category, index) => (
                                  <Text
                                    key={index}
                                    size="xs"
                                    style={{
                                      backgroundColor:
                                        "rgba(59, 130, 246, 0.1)",
                                      color: "#3b82f6",
                                      padding: "4px 10px",
                                      borderRadius: "16px",
                                      fontWeight: 600,
                                      border:
                                        "1px solid rgba(59, 130, 246, 0.2)",
                                    }}
                                  >
                                    {category}
                                  </Text>
                                ))}
                              {selectedEvent.categories.length > 3 && (
                                <Text size="xs" c="dimmed" fw={500}>
                                  +{selectedEvent.categories.length - 3} more
                                </Text>
                              )}
                            </Group>
                          )}

                        {/* Location */}
                        <Box
                          style={{
                            backgroundColor: "rgba(75, 85, 99, 0.05)",
                            padding: "8px 12px",
                            borderRadius: "8px",
                            border: "1px solid rgba(75, 85, 99, 0.1)",
                          }}
                        >
                          <Text
                            size="sm"
                            c="dimmed"
                            lineClamp={2}
                            style={{ fontWeight: 500 }}
                          >
                            📍 {selectedEvent.location}
                          </Text>
                        </Box>

                        {/* Organizer */}
                        <Text
                          size="sm"
                          c="dimmed"
                          style={{ fontStyle: "italic" }}
                        >
                          👤 Organized by{" "}
                          <Text span fw={600} c="dark">
                            {selectedEvent.organizerName}
                          </Text>
                        </Text>

                        {/* Action Buttons */}
                        <Group gap="xs" mt="md">
                          <Button
                            size="sm"
                            variant="filled"
                            onClick={() =>
                              window.open(
                                `/events/${selectedEvent.id}`,
                                "_blank"
                              )
                            }
                            style={{
                              flex: 1,
                              background:
                                "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
                              border: "none",
                              fontWeight: 600,
                            }}
                          >
                            View Details
                          </Button>
                          {selectedEvent.availableTickets &&
                            selectedEvent.availableTickets > 0 && (
                              <Button
                                size="sm"
                                variant="light"
                                color="green"
                                onClick={() =>
                                  window.open(
                                    `/events/${selectedEvent.id}`,
                                    "_blank"
                                  )
                                }
                                style={{ fontWeight: 600 }}
                              >
                                Get Tickets
                              </Button>
                            )}
                        </Group>
                      </Stack>
                    </Box>
                  </Box>
                </InfoWindow>
              )}
          </GoogleMap>

          {/* Map overlay info */}
          {adjustedEventsWithCoordinates.length === 0 &&
            allEvents.length > 0 && (
              <Paper
                shadow="md"
                p="md"
                style={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                  zIndex: 1000,
                  textAlign: "center",
                }}
              >
                <Text size="sm" c="dimmed">
                  No events found with location data
                </Text>
                <Text size="xs" c="dimmed" mt="xs">
                  Try adjusting your search or zoom out to see more events
                </Text>
              </Paper>
            )}

          {/* Map controls */}
          <Box
            style={{
              position: "absolute",
              top: "16px",
              left: "16px",
              zIndex: 1000,
            }}
          >
            <Group gap="xs">
              <Paper shadow="sm" p="xs">
                <Text size="xs" fw={600}>
                  Events: {adjustedEventsWithCoordinates.length}/
                  {allEvents.length}
                </Text>
              </Paper>
              {isMapInteracted && (
                <Paper
                  shadow="sm"
                  p="xs"
                  style={{ backgroundColor: "rgba(59, 130, 246, 0.1)" }}
                >
                  <Text size="xs" c="blue">
                    Searching in map area
                  </Text>
                </Paper>
              )}
            </Group>
          </Box>
        </Grid.Col>
      </Grid>
    </Container>
  );
};

export const SearchPage = () => {
  return (
    <GoogleMapsProvider>
      <SearchPageContent />
    </GoogleMapsProvider>
  );
};
