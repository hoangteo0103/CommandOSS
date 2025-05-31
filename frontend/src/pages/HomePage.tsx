import { useState } from "react";
import {
  Container,
  Title,
  Text,
  Grid,
  TextInput,
  Button,
  Group,
  Stack,
  Center,
  Loader,
  Alert,
  Pagination,
  Box,
  Flex,
  Badge,
  Card,
} from "@mantine/core";
import {
  IconSearch,
  IconPlus,
  IconAlertCircle,
  IconRocket,
  IconDiamond,
  IconBolt,
} from "@tabler/icons-react";
import { useQuery } from "@tanstack/react-query";
import { EventCard } from "../components/EventCard";
import { WalletButton } from "../components/WalletButton";
import { eventsApi } from "../services/api";
import { useWallet } from "../hooks/useWallet";
import { useNavigate } from "react-router-dom";

export const HomePage = () => {
  const { isConnected } = useWallet();
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const navigate = useNavigate();

  const {
    data: eventsData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["events", currentPage, searchQuery],
    queryFn: () => eventsApi.getEvents(currentPage, 12),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const events = eventsData?.data || [];
  const totalPages = eventsData?.totalPages || 1;

  const filteredEvents = events.filter(
    (event) =>
      event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Box
      style={{
        background:
          "linear-gradient(180deg, rgba(59, 130, 246, 0.02) 0%, rgba(139, 92, 246, 0.02) 100%)",
        minHeight: "100vh",
        width: "100%",
      }}
    >
      {/* Hero Section - Full Width */}
      <Box
        style={{
          textAlign: "center",
          padding: "6rem 2rem",
          background:
            "linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(139, 92, 246, 0.05) 100%)",
          position: "relative",
          overflow: "hidden",
          width: "100%",
        }}
      >
        {/* Animated Background */}
        <Box
          style={{
            position: "absolute",
            top: "-50%",
            left: "-50%",
            width: "200%",
            height: "200%",
            background:
              "radial-gradient(circle, rgba(59, 130, 246, 0.1) 0%, transparent 70%)",
            animation: "pulse 4s ease-in-out infinite",
          }}
        />

        <Box
          style={{
            position: "relative",
            zIndex: 1,
            maxWidth: "1400px",
            margin: "0 auto",
            width: "100%",
          }}
        >
          <Stack gap="xl">
            <Badge
              size="xl"
              variant="gradient"
              gradient={{ from: "blue", to: "cyan", deg: 45 }}
              leftSection={<IconBolt size={20} />}
              style={{ alignSelf: "center", padding: "12px 24px" }}
            >
              POWERED BY SUI BLOCKCHAIN
            </Badge>

            <Title
              order={1}
              size="4rem"
              fw={900}
              style={{
                background:
                  "linear-gradient(135deg, #1e293b 0%, #3b82f6 50%, #06b6d4 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                letterSpacing: "-0.03em",
                lineHeight: 1.1,
              }}
            >
              The Future of
              <br />
              Event Ticketing
            </Title>

            <Text size="xl" c="dimmed" maw={800} mx="auto" lh={1.6}>
              Experience events like never before with NFT tickets secured on
              the Sui blockchain. Own your memories, trade your access, and join
              the next generation of event experiences.
            </Text>

            <Group justify="center" gap="lg">
              <WalletButton />
              {isConnected && (
                <Button
                  leftSection={<IconPlus size={20} />}
                  onClick={() => navigate("/admin/create-event")}
                  variant="outline"
                  size="xl"
                  radius="xl"
                  style={{
                    borderColor: "rgba(59, 130, 246, 0.3)",
                    color: "#3b82f6",
                    padding: "16px 32px",
                  }}
                >
                  Create Event
                </Button>
              )}
            </Group>
          </Stack>
        </Box>
      </Box>

      {/* Main Content - Full Width */}
      <Box style={{ padding: "3rem 2rem", width: "100%" }}>
        <Box
          style={{
            maxWidth: "1400px",
            margin: "0 auto",
            width: "100%",
          }}
        >
          <Stack gap="xl">
            {/* Search Section */}
            <Card
              shadow="lg"
              padding="xl"
              radius="xl"
              style={{
                background: "rgba(255, 255, 255, 0.8)",
                backdropFilter: "blur(20px)",
                border: "1px solid rgba(59, 130, 246, 0.2)",
              }}
            >
              <Group>
                <TextInput
                  placeholder="Search the metaverse for events..."
                  leftSection={
                    <IconSearch
                      size={24}
                      style={{
                        color: "#3b82f6",
                      }}
                    />
                  }
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.currentTarget.value)}
                  style={{ flex: 1 }}
                  size="xl"
                  radius="xl"
                  styles={{
                    input: {
                      border: "1px solid rgba(59, 130, 246, 0.2)",
                      background: "rgba(255, 255, 255, 0.9)",
                      fontSize: "1.1rem",
                      padding: "16px 20px",
                    },
                  }}
                />
                {searchQuery && (
                  <Button
                    variant="light"
                    onClick={() => setSearchQuery("")}
                    radius="xl"
                    color="blue"
                    size="lg"
                  >
                    Clear
                  </Button>
                )}
              </Group>
            </Card>

            {/* Content */}
            {isLoading ? (
              <Center py="xl">
                <Stack align="center" gap="md">
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
                    Scanning the blockchain for events...
                  </Text>
                </Stack>
              </Center>
            ) : error ? (
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
                Failed to load events from the blockchain. Please try again
                later.
              </Alert>
            ) : filteredEvents.length === 0 ? (
              <Center py="xl">
                <Card
                  shadow="lg"
                  padding="xl"
                  radius="xl"
                  style={{
                    background:
                      "linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(139, 92, 246, 0.05) 100%)",
                    border: "1px solid rgba(59, 130, 246, 0.1)",
                    textAlign: "center",
                    maxWidth: "600px",
                    width: "100%",
                  }}
                >
                  <Stack align="center" gap="lg">
                    <Box
                      style={{
                        background:
                          "linear-gradient(135deg, #64748b 0%, #94a3b8 100%)",
                        borderRadius: "50%",
                        padding: "32px",
                      }}
                    >
                      <IconSearch size={64} color="white" />
                    </Box>
                    <Title order={2} fw={700}>
                      No Events Found
                    </Title>
                    <Text c="dimmed" size="lg">
                      {searchQuery
                        ? "Try adjusting your search terms or explore all events"
                        : "No events are currently live in the metaverse. Check back soon for exciting experiences!"}
                    </Text>
                    {searchQuery && (
                      <Button
                        variant="gradient"
                        gradient={{ from: "blue", to: "cyan", deg: 45 }}
                        onClick={() => setSearchQuery("")}
                        radius="xl"
                        size="xl"
                      >
                        Explore All Events
                      </Button>
                    )}
                  </Stack>
                </Card>
              </Center>
            ) : (
              <>
                {/* Results Header */}
                <Flex
                  justify="space-between"
                  align="center"
                  wrap="wrap"
                  gap="md"
                >
                  <Box>
                    <Text size="xl" fw={600}>
                      {searchQuery ? (
                        <>
                          <Text span c="blue" fw={700}>
                            {filteredEvents.length}
                          </Text>{" "}
                          event{filteredEvents.length !== 1 ? "s" : ""} found
                          for
                          <Text span c="blue" fw={700}>
                            {" "}
                            "{searchQuery}"
                          </Text>
                        </>
                      ) : (
                        <>
                          Showing{" "}
                          <Text span c="blue" fw={700}>
                            {events.length}
                          </Text>{" "}
                          live event{events.length !== 1 ? "s" : ""}
                        </>
                      )}
                    </Text>
                    <Text size="md" c="dimmed">
                      All tickets are minted as NFTs on Sui blockchain
                    </Text>
                  </Box>

                  <Badge
                    leftSection={<IconDiamond size={16} />}
                    variant="gradient"
                    gradient={{ from: "blue", to: "cyan", deg: 45 }}
                    size="xl"
                    style={{ padding: "12px 20px" }}
                  >
                    NFT GUARANTEED
                  </Badge>
                </Flex>

                {/* Events Grid - Full Width */}
                <Grid gutter="xl">
                  {filteredEvents.map((event) => (
                    <Grid.Col
                      key={event.id}
                      span={{ base: 12, sm: 6, md: 4, xl: 3 }}
                    >
                      <EventCard event={event} />
                    </Grid.Col>
                  ))}
                </Grid>

                {/* Pagination */}
                {!searchQuery && totalPages > 1 && (
                  <Center pt="xl">
                    <Pagination
                      total={totalPages}
                      value={currentPage}
                      onChange={setCurrentPage}
                      size="xl"
                      radius="xl"
                      styles={{
                        control: {
                          border: "1px solid rgba(59, 130, 246, 0.2)",
                          padding: "12px 16px",
                          "&[data-active]": {
                            background:
                              "linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)",
                            border: "none",
                          },
                        },
                      }}
                    />
                  </Center>
                )}
              </>
            )}
          </Stack>
        </Box>
      </Box>

      {/* Stats Section - Full Width Background */}
      {!isLoading && !error && events.length > 0 && (
        <Box
          style={{
            background:
              "linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(139, 92, 246, 0.05) 100%)",
            padding: "4rem 2rem",
            marginTop: "2rem",
            width: "100%",
          }}
        >
          <Box
            style={{
              maxWidth: "1400px",
              margin: "0 auto",
              width: "100%",
            }}
          >
            <Card
              shadow="xl"
              padding="3rem"
              radius="xl"
              style={{
                background: "rgba(255, 255, 255, 0.9)",
                backdropFilter: "blur(20px)",
                border: "1px solid rgba(59, 130, 246, 0.2)",
              }}
            >
              <Grid gutter="xl">
                <Grid.Col span={{ base: 6, sm: 3 }}>
                  <Box ta="center">
                    <Text
                      size="3.5rem"
                      fw={900}
                      style={{
                        background:
                          "linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                      }}
                    >
                      {events.length}+
                    </Text>
                    <Text
                      size="md"
                      c="dimmed"
                      fw={500}
                      tt="uppercase"
                      style={{ letterSpacing: "0.1em" }}
                    >
                      Active Events
                    </Text>
                  </Box>
                </Grid.Col>
                <Grid.Col span={{ base: 6, sm: 3 }}>
                  <Box ta="center">
                    <Text
                      size="3.5rem"
                      fw={900}
                      style={{
                        background:
                          "linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%)",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                      }}
                    >
                      {events.reduce(
                        (sum, event) => sum + event.totalTickets,
                        0
                      )}
                      +
                    </Text>
                    <Text
                      size="md"
                      c="dimmed"
                      fw={500}
                      tt="uppercase"
                      style={{ letterSpacing: "0.1em" }}
                    >
                      NFT Tickets
                    </Text>
                  </Box>
                </Grid.Col>
                <Grid.Col span={{ base: 6, sm: 3 }}>
                  <Box ta="center">
                    <Text
                      size="3.5rem"
                      fw={900}
                      style={{
                        background:
                          "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                      }}
                    >
                      {events.reduce(
                        (sum, event) => sum + event.availableTickets,
                        0
                      )}
                      +
                    </Text>
                    <Text
                      size="md"
                      c="dimmed"
                      fw={500}
                      tt="uppercase"
                      style={{ letterSpacing: "0.1em" }}
                    >
                      Available Now
                    </Text>
                  </Box>
                </Grid.Col>
                <Grid.Col span={{ base: 6, sm: 3 }}>
                  <Box ta="center">
                    <Text
                      size="3.5rem"
                      fw={900}
                      style={{
                        background:
                          "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                      }}
                    >
                      ∞
                    </Text>
                    <Text
                      size="md"
                      c="dimmed"
                      fw={500}
                      tt="uppercase"
                      style={{ letterSpacing: "0.1em" }}
                    >
                      Possibilities
                    </Text>
                  </Box>
                </Grid.Col>
              </Grid>
            </Card>
          </Box>
        </Box>
      )}

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
