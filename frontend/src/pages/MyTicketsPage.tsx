import { useState, useEffect } from "react";
import {
  Container,
  Title,
  Text,
  Stack,
  Group,
  Button,
  Center,
  Loader,
  Alert,
  Tabs,
  Badge,
  Card,
  SimpleGrid,
  Avatar,
  Transition,
  Box,
  Skeleton,
  ThemeIcon,
  Image,
  Tooltip,
  ActionIcon,
  Paper,
  Divider,
  Timeline,
  Modal,
  NumberFormatter,
  CopyButton,
} from "@mantine/core";
import {
  IconTicket,
  IconAlertCircle,
  IconRefresh,
  IconCalendar,
  IconMapPin,
  IconClock,
  IconCheck,
  IconX,
  IconEye,
  IconShare,
  IconDownload,
  IconQrcode,
  IconSparkles,
  IconTrophy,
  IconStar,
  IconDiamond,
  IconBolt,
  IconWallet,
  IconGift,
  IconCertificate,
  IconShieldCheck,
  IconCopy,
  IconFingerprint,
  IconCoin,
} from "@tabler/icons-react";
import { useQuery } from "@tanstack/react-query";
import { WalletButton } from "../components/WalletButton";
import { useWallet } from "../hooks/useWallet";
import { ticketsApi } from "../services/api";
import { notifications } from "@mantine/notifications";
import { useDisclosure } from "@mantine/hooks";
import dayjs from "dayjs";
import QRCode from "qrcode";

export const MyTicketsPage = () => {
  const { isConnected, address } = useWallet();
  const [activeTab, setActiveTab] = useState<string | null>("all");
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [
    ticketModalOpened,
    { open: openTicketModal, close: closeTicketModal },
  ] = useDisclosure(false);
  const [showAnimation, setShowAnimation] = useState(false);

  const {
    data: ticketsData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["my-tickets", address],
    queryFn: () => ticketsApi.getMyTickets(address!),
    enabled: isConnected && !!address,
    staleTime: 1000 * 60, // 1 minute
  });

  const tickets = ticketsData?.data || [];

  // Trigger animation on load
  useEffect(() => {
    if (tickets.length > 0) {
      setShowAnimation(true);
    }
  }, [tickets.length]);

  // Filter tickets based on active tab
  const filteredTickets = tickets.filter((ticket) => {
    if (activeTab === "all") return true;
    if (activeTab === "upcoming") {
      return (
        ticket.event &&
        new Date(ticket.event.date) > new Date() &&
        !ticket.isUsed
      );
    }
    if (activeTab === "past") {
      return ticket.event && new Date(ticket.event.date) <= new Date();
    }
    if (activeTab === "used") {
      return ticket.isUsed;
    }
    return true;
  });

  const upcomingCount = tickets.filter(
    (t) => t.event && new Date(t.event.date) > new Date() && !t.isUsed
  ).length;
  const pastCount = tickets.filter(
    (t) => t.event && new Date(t.event.date) <= new Date()
  ).length;
  const usedCount = tickets.filter((t) => t.isUsed).length;
  const totalValue = tickets.reduce(
    (sum, ticket) => sum + (ticket?.price || 0),
    0
  );

  const handleTicketView = (ticket: any) => {
    setSelectedTicket(ticket);
    openTicketModal();
  };

  const handleShare = (ticket: any) => {
    navigator.clipboard.writeText(
      `Check out my ticket for ${ticket.event?.name}!`
    );
    notifications.show({
      title: "🎉 Shared!",
      message: "Ticket link copied to clipboard",
      color: "green",
      autoClose: 3000,
    });
  };

  if (!isConnected) {
    return (
      <Box
        style={{
          background:
            "linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)",
          minHeight: "100vh",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Floating background elements */}
        <Box
          style={{
            position: "absolute",
            top: "15%",
            left: "10%",
            width: "200px",
            height: "200px",
            background: "rgba(255, 255, 255, 0.1)",
            borderRadius: "50%",
            animation: "float 8s ease-in-out infinite",
          }}
        />
        <Box
          style={{
            position: "absolute",
            bottom: "20%",
            right: "15%",
            width: "150px",
            height: "150px",
            background: "rgba(255, 255, 255, 0.05)",
            borderRadius: "50%",
            animation: "float 6s ease-in-out infinite reverse",
          }}
        />

        <Container size="xl" py="xl">
          <Center style={{ minHeight: "70vh" }}>
            <Card
              shadow="xl"
              padding="xl"
              radius="xl"
              style={{
                background: "rgba(255, 255, 255, 0.95)",
                backdropFilter: "blur(20px)",
                border: "1px solid rgba(255, 255, 255, 0.2)",
                maxWidth: "500px",
                textAlign: "center",
              }}
            >
              <Stack align="center" gap="xl">
                <ThemeIcon
                  size={120}
                  radius="xl"
                  variant="gradient"
                  gradient={{ from: "blue", to: "purple", deg: 45 }}
                >
                  <IconWallet size={60} />
                </ThemeIcon>
                <Title order={1} c="dark">
                  Connect Your Wallet
                </Title>
                <Text size="lg" c="dimmed" ta="center" maw={400}>
                  Connect your Sui wallet to view your exclusive NFT tickets and
                  manage your premium event experience.
                </Text>
                <WalletButton />
                <Group gap="lg" mt="md">
                  <Group gap="xs">
                    <IconShieldCheck size={16} color="#22c55e" />
                    <Text size="xs" c="dimmed">
                      Secure
                    </Text>
                  </Group>
                  <Group gap="xs">
                    <IconBolt size={16} color="#eab308" />
                    <Text size="xs" c="dimmed">
                      Fast
                    </Text>
                  </Group>
                  <Group gap="xs">
                    <IconDiamond size={16} color="#8b5cf6" />
                    <Text size="xs" c="dimmed">
                      Premium
                    </Text>
                  </Group>
                </Group>
              </Stack>
            </Card>
          </Center>
        </Container>

        <style>
          {`
            @keyframes float {
              0%, 100% { transform: translateY(0px) rotate(0deg); }
              50% { transform: translateY(-20px) rotate(180deg); }
            }
          `}
        </style>
      </Box>
    );
  }

  return (
    <Box
      style={{
        background:
          tickets.length > 0
            ? "linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)"
            : "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
        minHeight: "100vh",
        position: "relative",
        overflow: "hidden",
        transition: "background 0.8s ease-in-out",
      }}
    >
      {/* Animated background elements */}
      <Box
        style={{
          position: "absolute",
          top: "10%",
          left: "5%",
          width: "300px",
          height: "300px",
          background: "rgba(255, 255, 255, 0.05)",
          borderRadius: "50%",
          animation: "float 12s ease-in-out infinite",
        }}
      />
      <Box
        style={{
          position: "absolute",
          bottom: "15%",
          right: "10%",
          width: "200px",
          height: "200px",
          background: "rgba(255, 255, 255, 0.08)",
          borderRadius: "50%",
          animation: "float 10s ease-in-out infinite reverse",
        }}
      />

      <Container size="xl" py="xl" style={{ position: "relative", zIndex: 1 }}>
        <Stack gap="xl">
          {/* Header */}
          <Transition mounted={true} transition="slide-down" duration={600}>
            {(styles) => (
              <Card
                style={{
                  ...styles,
                  background: "rgba(255, 255, 255, 0.95)",
                  backdropFilter: "blur(20px)",
                  border: "1px solid rgba(255, 255, 255, 0.2)",
                }}
                shadow="xl"
                padding="xl"
                radius="xl"
              >
                <Group justify="space-between" align="flex-start">
                  <Stack gap="xs">
                    <Group gap="md">
                      <ThemeIcon
                        size={60}
                        radius="xl"
                        variant="gradient"
                        gradient={{ from: "blue", to: "purple", deg: 45 }}
                      >
                        <IconTrophy size={30} />
                      </ThemeIcon>
                      <div>
                        <Title order={1} size="h1" c="dark">
                          My Premium Collection
                        </Title>
                        <Text size="lg" c="dimmed">
                          Your exclusive NFT tickets & experiences
                        </Text>
                      </div>
                    </Group>
                  </Stack>

                  <Group>
                    <Tooltip label="Refresh tickets">
                      <ActionIcon
                        size="lg"
                        variant="light"
                        color="blue"
                        onClick={() => refetch()}
                        loading={isLoading}
                        radius="xl"
                      >
                        <IconRefresh size={18} />
                      </ActionIcon>
                    </Tooltip>
                    <WalletButton />
                  </Group>
                </Group>

                {/* Wallet Info */}
                <Divider my="lg" />
                <Group justify="space-between">
                  <Group gap="md">
                    <Avatar size="md" radius="xl" color="blue" variant="light">
                      <IconWallet size={20} />
                    </Avatar>
                    <div>
                      <Text size="sm" fw={500}>
                        Connected Wallet
                      </Text>
                      <Text size="xs" c="dimmed" ff="monospace">
                        {address?.slice(0, 12)}...{address?.slice(-8)}
                      </Text>
                    </div>
                  </Group>
                  <Badge
                    size="lg"
                    variant="gradient"
                    gradient={{ from: "green", to: "teal", deg: 45 }}
                    leftSection={<IconCheck size={14} />}
                  >
                    {tickets.length} NFT{tickets.length !== 1 ? "s" : ""}{" "}
                    Collected
                  </Badge>
                </Group>
              </Card>
            )}
          </Transition>

          {/* Stats Cards */}
          {tickets.length > 0 && (
            <Transition
              mounted={showAnimation}
              transition="slide-up"
              duration={800}
            >
              {(styles) => (
                <SimpleGrid
                  cols={{ base: 2, sm: 4 }}
                  spacing="lg"
                  style={styles}
                >
                  <Card
                    shadow="lg"
                    padding="lg"
                    radius="xl"
                    style={{
                      background:
                        "linear-gradient(135deg, rgba(34, 197, 94, 0.9) 0%, rgba(16, 185, 129, 0.9) 100%)",
                      color: "white",
                      transition: "transform 0.3s ease",
                    }}
                    className="hover-card"
                  >
                    <Group justify="space-between">
                      <div>
                        <Text size="xs" style={{ opacity: 0.9 }}>
                          Total Collection
                        </Text>
                        <Text size="xl" fw={700}>
                          {tickets.length}
                        </Text>
                      </div>
                      <ThemeIcon
                        size={50}
                        radius="xl"
                        color="white"
                        variant="light"
                      >
                        <IconTicket size={24} />
                      </ThemeIcon>
                    </Group>
                  </Card>

                  <Card
                    shadow="lg"
                    padding="lg"
                    radius="xl"
                    style={{
                      background:
                        "linear-gradient(135deg, rgba(59, 130, 246, 0.9) 0%, rgba(99, 102, 241, 0.9) 100%)",
                      color: "white",
                      transition: "transform 0.3s ease",
                    }}
                    className="hover-card"
                  >
                    <Group justify="space-between">
                      <div>
                        <Text size="xs" style={{ opacity: 0.9 }}>
                          Upcoming Events
                        </Text>
                        <Text size="xl" fw={700}>
                          {upcomingCount}
                        </Text>
                      </div>
                      <ThemeIcon
                        size={50}
                        radius="xl"
                        color="white"
                        variant="light"
                      >
                        <IconCalendar size={24} />
                      </ThemeIcon>
                    </Group>
                  </Card>

                  <Card
                    shadow="lg"
                    padding="lg"
                    radius="xl"
                    style={{
                      background:
                        "linear-gradient(135deg, rgba(139, 92, 246, 0.9) 0%, rgba(168, 85, 247, 0.9) 100%)",
                      color: "white",
                      transition: "transform 0.3s ease",
                    }}
                    className="hover-card"
                  >
                    <Group justify="space-between">
                      <div>
                        <Text size="xs" style={{ opacity: 0.9 }}>
                          Total Value
                        </Text>
                        <Text size="xl" fw={700}>
                          <NumberFormatter
                            value={totalValue}
                            prefix="$"
                            thousandSeparator
                          />
                        </Text>
                      </div>
                      <ThemeIcon
                        size={50}
                        radius="xl"
                        color="white"
                        variant="light"
                      >
                        <IconDiamond size={24} />
                      </ThemeIcon>
                    </Group>
                  </Card>

                  <Card
                    shadow="lg"
                    padding="lg"
                    radius="xl"
                    style={{
                      background:
                        "linear-gradient(135deg, rgba(245, 158, 11, 0.9) 0%, rgba(251, 191, 36, 0.9) 100%)",
                      color: "white",
                      transition: "transform 0.3s ease",
                    }}
                    className="hover-card"
                  >
                    <Group justify="space-between">
                      <div>
                        <Text size="xs" style={{ opacity: 0.9 }}>
                          Events Attended
                        </Text>
                        <Text size="xl" fw={700}>
                          {new Set(tickets.map((t) => t.eventId)).size}
                        </Text>
                      </div>
                      <ThemeIcon
                        size={50}
                        radius="xl"
                        color="white"
                        variant="light"
                      >
                        <IconStar size={24} />
                      </ThemeIcon>
                    </Group>
                  </Card>
                </SimpleGrid>
              )}
            </Transition>
          )}

          {/* Content */}
          {isLoading ? (
            <Card
              shadow="xl"
              padding="xl"
              radius="xl"
              style={{
                background: "rgba(255, 255, 255, 0.95)",
                backdropFilter: "blur(20px)",
              }}
            >
              <Center py="xl">
                <Stack align="center" gap="lg">
                  <Loader size="xl" color="blue" />
                  <Text size="lg" fw={500}>
                    Loading your premium collection...
                  </Text>
                  <Group gap="md">
                    <Skeleton height={8} radius="xl" width={100} />
                    <Skeleton height={8} radius="xl" width={150} />
                    <Skeleton height={8} radius="xl" width={80} />
                  </Group>
                </Stack>
              </Center>
            </Card>
          ) : error ? (
            <Alert
              icon={<IconAlertCircle size={20} />}
              color="red"
              variant="light"
              radius="xl"
              style={{
                background: "rgba(255, 255, 255, 0.95)",
                backdropFilter: "blur(20px)",
              }}
            >
              <Group justify="space-between">
                <Text>
                  Failed to load your tickets. Please try again later.
                </Text>
                <Button variant="light" color="red" onClick={() => refetch()}>
                  Retry
                </Button>
              </Group>
            </Alert>
          ) : tickets.length === 0 ? (
            <Card
              shadow="xl"
              padding="xl"
              radius="xl"
              style={{
                background: "rgba(255, 255, 255, 0.95)",
                backdropFilter: "blur(20px)",
                border: "1px solid rgba(255, 255, 255, 0.2)",
              }}
            >
              <Center py="xl">
                <Stack align="center" gap="xl" ta="center">
                  <ThemeIcon
                    size={120}
                    radius="xl"
                    variant="gradient"
                    gradient={{ from: "blue", to: "purple", deg: 45 }}
                  >
                    <IconGift size={60} />
                  </ThemeIcon>
                  <div>
                    <Title order={2} c="dark" mb="md">
                      Your Collection Awaits
                    </Title>
                    <Text size="lg" c="dimmed" maw={500}>
                      Start building your exclusive NFT ticket collection. Each
                      ticket is a unique digital asset representing
                      unforgettable experiences.
                    </Text>
                  </div>
                  <Button
                    size="lg"
                    leftSection={<IconSparkles size={20} />}
                    radius="xl"
                    variant="gradient"
                    gradient={{ from: "blue", to: "purple", deg: 45 }}
                    onClick={() => (window.location.href = "/")}
                  >
                    Discover Premium Events
                  </Button>
                  <Group gap="lg" mt="md">
                    <Group gap="xs">
                      <IconShieldCheck size={16} color="#22c55e" />
                      <Text size="xs" c="dimmed">
                        Blockchain Verified
                      </Text>
                    </Group>
                    <Group gap="xs">
                      <IconCertificate size={16} color="#8b5cf6" />
                      <Text size="xs" c="dimmed">
                        Collectible
                      </Text>
                    </Group>
                    <Group gap="xs">
                      <IconBolt size={16} color="#eab308" />
                      <Text size="xs" c="dimmed">
                        Instant Access
                      </Text>
                    </Group>
                  </Group>
                </Stack>
              </Center>
            </Card>
          ) : (
            <Card
              shadow="xl"
              padding="xl"
              radius="xl"
              style={{
                background: "rgba(255, 255, 255, 0.95)",
                backdropFilter: "blur(20px)",
                border: "1px solid rgba(255, 255, 255, 0.2)",
              }}
            >
              {/* Enhanced Tabs */}
              <Tabs value={activeTab} onChange={setActiveTab}>
                <Tabs.List
                  style={{
                    background: "rgba(59, 130, 246, 0.05)",
                    borderRadius: "12px",
                    padding: "4px",
                  }}
                >
                  <Tabs.Tab
                    value="all"
                    leftSection={<IconTicket size={16} />}
                    style={{ borderRadius: "8px" }}
                  >
                    All Tickets
                    <Badge size="sm" ml="xs" color="gray" variant="light">
                      {tickets.length}
                    </Badge>
                  </Tabs.Tab>
                  <Tabs.Tab
                    value="upcoming"
                    leftSection={<IconCalendar size={16} />}
                    style={{ borderRadius: "8px" }}
                  >
                    Upcoming
                    <Badge size="sm" ml="xs" color="green" variant="light">
                      {upcomingCount}
                    </Badge>
                  </Tabs.Tab>
                  <Tabs.Tab
                    value="past"
                    leftSection={<IconClock size={16} />}
                    style={{ borderRadius: "8px" }}
                  >
                    Past Events
                    <Badge size="sm" ml="xs" color="blue" variant="light">
                      {pastCount}
                    </Badge>
                  </Tabs.Tab>
                  <Tabs.Tab
                    value="used"
                    leftSection={<IconCheck size={16} />}
                    style={{ borderRadius: "8px" }}
                  >
                    Used
                    <Badge size="sm" ml="xs" color="orange" variant="light">
                      {usedCount}
                    </Badge>
                  </Tabs.Tab>
                </Tabs.List>

                {/* Enhanced Ticket Grid */}
                <Tabs.Panel value="all" pt="xl">
                  <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="lg">
                    {filteredTickets.map((ticket, index) => (
                      <TicketCard
                        key={ticket.id}
                        ticket={ticket}
                        onView={() => handleTicketView(ticket)}
                        onShare={() => handleShare(ticket)}
                        index={index}
                      />
                    ))}
                  </SimpleGrid>
                </Tabs.Panel>

                <Tabs.Panel value="upcoming" pt="xl">
                  {upcomingCount === 0 ? (
                    <EmptyState
                      icon={<IconCalendar size={48} />}
                      title="No upcoming events"
                      description="All your tickets are for past events or have been used"
                    />
                  ) : (
                    <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="lg">
                      {filteredTickets.map((ticket, index) => (
                        <TicketCard
                          key={ticket.id}
                          ticket={ticket}
                          onView={() => handleTicketView(ticket)}
                          onShare={() => handleShare(ticket)}
                          index={index}
                        />
                      ))}
                    </SimpleGrid>
                  )}
                </Tabs.Panel>

                <Tabs.Panel value="past" pt="xl">
                  {pastCount === 0 ? (
                    <EmptyState
                      icon={<IconClock size={48} />}
                      title="No past events"
                      description="Tickets for events that have already occurred will appear here"
                    />
                  ) : (
                    <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="lg">
                      {filteredTickets.map((ticket, index) => (
                        <TicketCard
                          key={ticket.id}
                          ticket={ticket}
                          onView={() => handleTicketView(ticket)}
                          onShare={() => handleShare(ticket)}
                          index={index}
                        />
                      ))}
                    </SimpleGrid>
                  )}
                </Tabs.Panel>

                <Tabs.Panel value="used" pt="xl">
                  {usedCount === 0 ? (
                    <EmptyState
                      icon={<IconCheck size={48} />}
                      title="No used tickets"
                      description="Tickets that have been scanned for entry will appear here"
                    />
                  ) : (
                    <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="lg">
                      {filteredTickets.map((ticket, index) => (
                        <TicketCard
                          key={ticket.id}
                          ticket={ticket}
                          onView={() => handleTicketView(ticket)}
                          onShare={() => handleShare(ticket)}
                          index={index}
                        />
                      ))}
                    </SimpleGrid>
                  )}
                </Tabs.Panel>
              </Tabs>
            </Card>
          )}
        </Stack>
      </Container>

      {/* Ticket Detail Modal */}
      <Modal
        opened={ticketModalOpened}
        onClose={closeTicketModal}
        title={
          <Group gap="md">
            <ThemeIcon
              size="lg"
              radius="xl"
              variant="gradient"
              gradient={{ from: "blue", to: "purple", deg: 45 }}
            >
              <IconTicket size={20} />
            </ThemeIcon>
            <Text fw={600}>NFT Ticket Details</Text>
          </Group>
        }
        size="lg"
        radius="xl"
      >
        {selectedTicket && (
          <TicketDetailContent
            ticket={selectedTicket}
            onClose={closeTicketModal}
          />
        )}
      </Modal>

      <style>
        {`
          @keyframes float {
            0%, 100% { transform: translateY(0px) rotate(0deg); }
            50% { transform: translateY(-15px) rotate(180deg); }
          }
          
          .hover-card:hover {
            transform: translateY(-4px) scale(1.02);
          }
          
          .ticket-card {
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          }
          
          .ticket-card:hover {
            transform: translateY(-8px) rotate(1deg);
            box-shadow: 0 20px 40px rgba(0,0,0,0.15) !important;
          }
        `}
      </style>
    </Box>
  );
};

// Enhanced Ticket Card Component
const TicketCard = ({ ticket, onView, onShare }: any) => {
  const isUpcoming = ticket.event && new Date(ticket.event.date) > new Date();
  const [miniQrCode, setMiniQrCode] = useState<string>("");
  useEffect(() => {
    const generateMiniQr = async () => {
      try {
        const qrData = ticket.nftTokenId || "NFT_TICKET";
        const qrCodeUrl = await QRCode.toDataURL(qrData, {
          width: 80,
          margin: 1,
          color: {
            dark: "#ffffff",
            light: "transparent",
          },
        });
        setMiniQrCode(qrCodeUrl);
      } catch (error) {
        console.error("Error generating mini QR code:", error);
      }
    };

    generateMiniQr();
  }, [ticket.nftTokenId]);

  const handleQuickQr = (e: React.MouseEvent) => {
    e.stopPropagation();
    onView(); // Open the full modal to show the detailed QR
  };

  return (
    <Transition
      mounted={true}
      transition="slide-up"
      duration={600}
      timingFunction="cubic-bezier(0.4, 0, 0.2, 1)"
    >
      {(styles) => (
        <Card
          className="ticket-card"
          shadow="lg"
          padding={0}
          radius="xl"
          style={{
            ...styles,
            background: ticket.isUsed
              ? "linear-gradient(135deg, rgba(156, 163, 175, 0.9) 0%, rgba(107, 114, 128, 0.9) 100%)"
              : isUpcoming
              ? "linear-gradient(135deg, rgba(34, 197, 94, 0.9) 0%, rgba(16, 185, 129, 0.9) 100%)"
              : "linear-gradient(135deg, rgba(59, 130, 246, 0.9) 0%, rgba(99, 102, 241, 0.9) 100%)",
            color: "white",
            overflow: "hidden",
            position: "relative",
          }}
        >
          {/* Ticket Header */}
          <Box p="lg">
            <Group justify="space-between" mb="md">
              <Badge
                variant="light"
                color="white"
                style={{ backgroundColor: "rgba(255,255,255,0.2)" }}
                leftSection={<IconCertificate size={12} />}
                styles={{
                  root: {
                    paddingLeft: "8px",
                    paddingRight: "12px",
                    paddingTop: "4px",
                    paddingBottom: "4px",
                  },
                  label: {
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                    paddingBottom: "1px",
                  },
                }}
              >
                NFT TICKET
              </Badge>
              <Group gap="xs">
                <ActionIcon
                  variant="light"
                  color="white"
                  size="sm"
                  radius="xl"
                  onClick={handleQuickQr}
                  title="Show QR Code"
                >
                  <IconQrcode size={14} />
                </ActionIcon>
                <ActionIcon
                  variant="light"
                  color="white"
                  size="sm"
                  radius="xl"
                  onClick={() => onShare()}
                >
                  <IconShare size={14} />
                </ActionIcon>
                {/* <ActionIcon
                  variant="light"
                  color="white"
                  size="sm"
                  radius="xl"
                  onClick={() => onView()}
                >
                  <IconEye size={14} />
                </ActionIcon> */}
              </Group>
            </Group>

            <Stack gap="sm">
              <Text
                size="lg"
                fw={700}
                style={{ textShadow: "0 2px 4px rgba(0,0,0,0.3)" }}
              >
                {ticket.event?.name || "Event Name"}
              </Text>

              <Group gap="md">
                <Group gap="xs">
                  <IconCalendar size={16} style={{ opacity: 0.9 }} />
                  <Text size="sm" style={{ opacity: 0.9 }}>
                    {ticket.event?.date
                      ? dayjs(ticket.event.date).format("MMM DD, YYYY")
                      : "TBD"}
                  </Text>
                </Group>
                {ticket.event?.location && (
                  <Group gap="xs">
                    <IconMapPin size={16} style={{ opacity: 0.9 }} />
                    <Text size="sm" style={{ opacity: 0.9 }}>
                      {ticket.event.location}
                    </Text>
                  </Group>
                )}
              </Group>

              <Group justify="space-between" align="center">
                <Group gap="xs">
                  <IconCoin size={20} style={{ opacity: 0.9 }} />
                  <Text
                    size="xl"
                    fw={900}
                    style={{ textShadow: "0 2px 4px rgba(0,0,0,0.3)" }}
                  >
                    SUI {ticket?.price || 0}
                  </Text>
                </Group>

                {/* Mini QR Code Preview */}
                {miniQrCode && (
                  <Box
                    style={{
                      width: "50px",
                      height: "50px",
                      padding: "4px",
                      background: "rgba(255,255,255,0.2)",
                      borderRadius: "8px",
                      backdropFilter: "blur(5px)",
                      cursor: "pointer",
                    }}
                    onClick={handleQuickQr}
                    title="Click to view full QR code"
                  >
                    <Image
                      src={miniQrCode}
                      alt="QR"
                      width="100%"
                      height="100%"
                    />
                  </Box>
                )}
              </Group>
            </Stack>
          </Box>

          {/* Ticket Footer */}
          <Paper
            p="md"
            style={{
              background: "rgba(0,0,0,0.1)",
              backdropFilter: "blur(10px)",
            }}
          >
            <Group justify="space-between" align="center">
              <Group gap="xs">
                <ThemeIcon size="sm" radius="xl" color="white" variant="light">
                  {ticket.isUsed ? (
                    <IconCheck size={12} />
                  ) : isUpcoming ? (
                    <IconClock size={12} />
                  ) : (
                    <IconX size={12} />
                  )}
                </ThemeIcon>
                <Text size="xs" fw={500}>
                  {ticket.isUsed
                    ? "Used"
                    : isUpcoming
                    ? "Upcoming"
                    : "Past Event"}
                </Text>
              </Group>
              <Group gap="xs">
                <IconFingerprint size={12} style={{ opacity: 0.7 }} />
                <Text size="xs" style={{ opacity: 0.8 }} ff="monospace">
                  #{ticket.nftTokenId?.slice(-8) || "NFT"}
                </Text>
              </Group>
            </Group>
          </Paper>

          {/* Decorative elements */}
          <Box
            style={{
              position: "absolute",
              top: 0,
              right: 0,
              width: "100%",
              height: "100%",
              background:
                'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.1"%3E%3Ccircle cx="3" cy="3" r="3"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
              opacity: 0.5,
              pointerEvents: "none",
            }}
          />
        </Card>
      )}
    </Transition>
  );
};

// Empty State Component
const EmptyState = ({ icon, title, description }: any) => (
  <Center py="xl">
    <Stack align="center" gap="md" ta="center">
      <ThemeIcon size={80} radius="xl" color="gray" variant="light">
        {icon}
      </ThemeIcon>
      <Text fw={500} size="lg">
        {title}
      </Text>
      <Text size="sm" c="dimmed" maw={400}>
        {description}
      </Text>
    </Stack>
  </Center>
);

// Ticket Detail Content Component
const TicketDetailContent = ({ ticket, onClose }: any) => {
  const [qrCode, setQrCode] = useState<string>("");
  const [showQrCode, setShowQrCode] = useState(false);

  useEffect(() => {
    const generateQrCode = async () => {
      try {
        // Create blockchain-focused QR data
        const qrData = JSON.stringify({
          type: "SUI_NFT_TICKET",
          nftId: ticket.nftTokenId,
          eventId: ticket.eventId,
          eventName: ticket.event?.name,
          ticketType: ticket.ticketType?.name,
          price: ticket.ticketType?.price,
          transactionHash: ticket.transactionHash,
          owner: ticket.ownerAddress,
          isUsed: ticket.isUsed,
          mintedAt: ticket.mintedAt,
          blockchain: "Sui",
          network: "testnet",
        });

        const qrCodeUrl = await QRCode.toDataURL(qrData, {
          width: 300,
          margin: 2,
          color: {
            dark: "#1e293b",
            light: "#ffffff",
          },
        });
        setQrCode(qrCodeUrl);
      } catch (error) {
        console.error("Error generating QR code:", error);
      }
    };

    generateQrCode();
  }, [ticket]);

  return (
    <Stack gap="lg">
      {/* Blockchain Timeline */}
      <Card
        p="xl"
        radius="lg"
        style={{
          background:
            "linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%)",
        }}
      >
        <Group justify="space-between" mb="lg">
          <Title order={3} size="h4">
            🔗 Blockchain Journey
          </Title>
          <Badge
            leftSection={<IconShieldCheck size={12} />}
            variant="gradient"
            gradient={{ from: "blue", to: "purple", deg: 45 }}
          >
            Sui Network
          </Badge>
        </Group>

        <Timeline active={ticket.isUsed ? 3 : 2} bulletSize={24} lineWidth={2}>
          <Timeline.Item bullet={<IconCheck size={12} />} title="NFT Minted">
            <Text c="dimmed" size="sm">
              Ticket created on Sui blockchain
            </Text>
          </Timeline.Item>
          <Timeline.Item
            bullet={<IconTicket size={12} />}
            title="Payment Confirmed"
          >
            <Text c="dimmed" size="sm">
              Purchase verified and recorded
            </Text>
          </Timeline.Item>
          <Timeline.Item
            bullet={<IconClock size={12} />}
            title="Ready for Event"
          >
            <Text c="dimmed" size="sm">
              Ticket activated for entry
            </Text>
          </Timeline.Item>
          <Timeline.Item bullet={<IconStar size={12} />} title="Event Attended">
            <Text c="dimmed" size="sm">
              {ticket.isUsed ? "Successfully used" : "Pending attendance"}
            </Text>
          </Timeline.Item>
        </Timeline>
      </Card>

      {/* Blockchain Data */}
      <Card
        p="lg"
        radius="lg"
        style={{
          background: "rgba(34, 197, 94, 0.05)",
          border: "1px solid rgba(34, 197, 94, 0.2)",
        }}
      >
        <Group justify="space-between" mb="md">
          <Group gap="xs">
            <IconFingerprint size={20} color="#059669" />
            <Text fw={600} c="#059669">
              NFT Token ID
            </Text>
          </Group>
          <CopyButton value={ticket.nftTokenId}>
            {({ copied, copy }) => (
              <ActionIcon
                color={copied ? "teal" : "gray"}
                onClick={copy}
                variant="light"
                size="sm"
              >
                {copied ? <IconCheck size={16} /> : <IconCopy size={16} />}
              </ActionIcon>
            )}
          </CopyButton>
        </Group>
        <Text size="sm" ff="monospace" style={{ wordBreak: "break-all" }}>
          {ticket.nftTokenId}
        </Text>
      </Card>

      <Card
        p="lg"
        radius="lg"
        style={{
          background: "rgba(59, 130, 246, 0.05)",
          border: "1px solid rgba(59, 130, 246, 0.2)",
        }}
      >
        <Group justify="space-between" mb="md">
          <Group gap="xs">
            <IconCertificate size={20} color="#3b82f6" />
            <Text fw={600} c="#3b82f6">
              Transaction Hash
            </Text>
          </Group>
          <CopyButton value={ticket.transactionHash}>
            {({ copied, copy }) => (
              <ActionIcon
                color={copied ? "teal" : "gray"}
                onClick={copy}
                variant="light"
                size="sm"
              >
                {copied ? <IconCheck size={16} /> : <IconCopy size={16} />}
              </ActionIcon>
            )}
          </CopyButton>
        </Group>
        <Text size="sm" ff="monospace" style={{ wordBreak: "break-all" }}>
          {ticket.transactionHash}
        </Text>
      </Card>

      {/* QR Code Section */}
      {!showQrCode ? (
        <Card
          p="lg"
          radius="lg"
          style={{
            background: "rgba(139, 92, 246, 0.05)",
            border: "1px solid rgba(139, 92, 246, 0.2)",
            cursor: "pointer",
          }}
          onClick={() => setShowQrCode(true)}
        >
          <Group justify="center" gap="md">
            <ThemeIcon
              size="xl"
              radius="xl"
              variant="gradient"
              gradient={{ from: "violet", to: "purple", deg: 45 }}
            >
              <IconQrcode size={24} />
            </ThemeIcon>
            <Stack gap={0}>
              <Text fw={600} size="lg">
                Show Blockchain QR Code
              </Text>
              <Text size="sm" c="dimmed">
                Contains full NFT verification data
              </Text>
            </Stack>
          </Group>
        </Card>
      ) : (
        <Card
          p="xl"
          radius="lg"
          style={{
            background: "rgba(139, 92, 246, 0.05)",
            border: "1px solid rgba(139, 92, 246, 0.2)",
          }}
        >
          <Stack align="center" gap="lg">
            <Group gap="md">
              <ThemeIcon
                size="lg"
                radius="xl"
                variant="gradient"
                gradient={{ from: "violet", to: "purple", deg: 45 }}
              >
                <IconQrcode size={20} />
              </ThemeIcon>
              <div>
                <Text fw={600} size="lg">
                  Blockchain Verification QR
                </Text>
                <Text size="sm" c="dimmed">
                  Scan to verify NFT ownership and authenticity
                </Text>
              </div>
            </Group>

            {qrCode && (
              <Box
                style={{
                  padding: "20px",
                  background: "white",
                  borderRadius: "12px",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                }}
              >
                <Image
                  src={qrCode}
                  alt="NFT Verification QR Code"
                  width={250}
                  height={250}
                />
              </Box>
            )}

            <Text size="xs" c="dimmed" ta="center" maw={300}>
              This QR contains encrypted NFT data including token ID,
              transaction hash, and ownership verification for Sui blockchain
              validation.
            </Text>

            <Button
              variant="light"
              size="sm"
              onClick={() => setShowQrCode(false)}
            >
              Hide QR Code
            </Button>
          </Stack>
        </Card>
      )}

      {/* Action Buttons */}
      <Group justify="center" gap="md" mt="lg">
        <Button
          leftSection={<IconDownload size={16} />}
          variant="light"
          radius="xl"
          onClick={() => {
            const link = document.createElement("a");
            link.download = `nft-ticket-${ticket.nftTokenId?.slice(-8)}.png`;
            link.href = qrCode;
            link.click();
          }}
        >
          Download QR
        </Button>
        <Button
          leftSection={<IconShare size={16} />}
          variant="light"
          radius="xl"
          onClick={() => {
            navigator.share({
              title: `NFT Ticket - ${ticket.event?.name}`,
              text: `Check out my blockchain ticket: ${ticket.nftTokenId}`,
            });
          }}
        >
          Share NFT
        </Button>
        <Button
          onClick={onClose}
          radius="xl"
          variant="gradient"
          gradient={{ from: "blue", to: "purple", deg: 45 }}
        >
          Close
        </Button>
      </Group>
    </Stack>
  );
};
