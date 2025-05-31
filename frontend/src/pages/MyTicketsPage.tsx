import { useState } from "react";
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
} from "@mantine/core";
import { IconTicket, IconAlertCircle, IconRefresh } from "@tabler/icons-react";
import { useQuery } from "@tanstack/react-query";
import { TicketList } from "../components/TicketList";
import { WalletButton } from "../components/WalletButton";
import { useWallet } from "../hooks/useWallet";
import { ticketsApi } from "../services/api";

export const MyTicketsPage = () => {
  const { isConnected, address } = useWallet();
  const [activeTab, setActiveTab] = useState<string | null>("all");

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

  if (!isConnected) {
    return (
      <Container size="xl" py="xl">
        <Center py="xl">
          <Stack align="center" gap="md" ta="center">
            <IconTicket size={64} color="var(--mantine-color-gray-5)" />
            <Title order={2}>Connect Your Wallet</Title>
            <Text c="dimmed" maw={400}>
              Connect your Sui wallet to view your NFT tickets and manage your
              event attendance.
            </Text>
            <WalletButton />
          </Stack>
        </Center>
      </Container>
    );
  }

  return (
    <Container size="xl" py="xl">
      <Stack gap="xl">
        {/* Header */}
        <Group justify="space-between" align="flex-end">
          <div>
            <Title order={1} size="h1" mb="xs">
              My Tickets
            </Title>
            <Text size="lg" c="dimmed">
              Your NFT tickets and event history
            </Text>
          </div>

          <Group>
            <Button
              variant="light"
              leftSection={<IconRefresh size={16} />}
              onClick={() => refetch()}
              loading={isLoading}
            >
              Refresh
            </Button>
            <WalletButton />
          </Group>
        </Group>

        {/* Wallet Info */}
        <Alert color="blue" variant="light">
          <Group justify="space-between">
            <Text size="sm">
              Connected Wallet: {address?.slice(0, 8)}...{address?.slice(-6)}
            </Text>
            <Text size="sm" fw={500}>
              {tickets.length} ticket{tickets.length !== 1 ? "s" : ""} found
            </Text>
          </Group>
        </Alert>

        {/* Content */}
        {isLoading ? (
          <Center py="xl">
            <Stack align="center" gap="md">
              <Loader size="lg" />
              <Text>Loading your tickets...</Text>
            </Stack>
          </Center>
        ) : error ? (
          <Alert icon={<IconAlertCircle size={16} />} color="red">
            Failed to load your tickets. Please try again later.
          </Alert>
        ) : tickets.length === 0 ? (
          <Center py="xl">
            <Stack align="center" gap="md" ta="center">
              <IconTicket size={64} color="var(--mantine-color-gray-5)" />
              <Title order={3}>No tickets found</Title>
              <Text c="dimmed" maw={400}>
                You haven't purchased any tickets yet. When you buy tickets,
                they'll appear here as NFTs in your wallet.
              </Text>
              <Button onClick={() => (window.location.href = "/")}>
                Browse Events
              </Button>
            </Stack>
          </Center>
        ) : (
          <>
            {/* Tabs */}
            <Tabs value={activeTab} onChange={setActiveTab}>
              <Tabs.List>
                <Tabs.Tab value="all">
                  All Tickets
                  <Badge size="sm" ml="xs" color="gray" variant="light">
                    {tickets.length}
                  </Badge>
                </Tabs.Tab>
                <Tabs.Tab value="upcoming">
                  Upcoming
                  <Badge size="sm" ml="xs" color="green" variant="light">
                    {upcomingCount}
                  </Badge>
                </Tabs.Tab>
                <Tabs.Tab value="past">
                  Past Events
                  <Badge size="sm" ml="xs" color="blue" variant="light">
                    {pastCount}
                  </Badge>
                </Tabs.Tab>
                <Tabs.Tab value="used">
                  Used
                  <Badge size="sm" ml="xs" color="orange" variant="light">
                    {usedCount}
                  </Badge>
                </Tabs.Tab>
              </Tabs.List>

              <Tabs.Panel value="all" pt="lg">
                <TicketList tickets={filteredTickets} />
              </Tabs.Panel>

              <Tabs.Panel value="upcoming" pt="lg">
                {upcomingCount === 0 ? (
                  <Center py="xl">
                    <Stack align="center" gap="md" ta="center">
                      <IconTicket
                        size={48}
                        color="var(--mantine-color-gray-5)"
                      />
                      <Text fw={500}>No upcoming events</Text>
                      <Text size="sm" c="dimmed">
                        All your tickets are for past events or have been used
                      </Text>
                    </Stack>
                  </Center>
                ) : (
                  <TicketList tickets={filteredTickets} />
                )}
              </Tabs.Panel>

              <Tabs.Panel value="past" pt="lg">
                {pastCount === 0 ? (
                  <Center py="xl">
                    <Stack align="center" gap="md" ta="center">
                      <IconTicket
                        size={48}
                        color="var(--mantine-color-gray-5)"
                      />
                      <Text fw={500}>No past events</Text>
                      <Text size="sm" c="dimmed">
                        Tickets for events that have already occurred will
                        appear here
                      </Text>
                    </Stack>
                  </Center>
                ) : (
                  <TicketList tickets={filteredTickets} />
                )}
              </Tabs.Panel>

              <Tabs.Panel value="used" pt="lg">
                {usedCount === 0 ? (
                  <Center py="xl">
                    <Stack align="center" gap="md" ta="center">
                      <IconTicket
                        size={48}
                        color="var(--mantine-color-gray-5)"
                      />
                      <Text fw={500}>No used tickets</Text>
                      <Text size="sm" c="dimmed">
                        Tickets that have been scanned for entry will appear
                        here
                      </Text>
                    </Stack>
                  </Center>
                ) : (
                  <TicketList tickets={filteredTickets} />
                )}
              </Tabs.Panel>
            </Tabs>
          </>
        )}

        {/* Quick Stats */}
        {tickets.length > 0 && (
          <Alert color="blue" variant="light">
            <Group justify="space-around" ta="center">
              <div>
                <Text size="lg" fw={700}>
                  {tickets.length}
                </Text>
                <Text size="xs" c="dimmed">
                  Total Tickets
                </Text>
              </div>
              <div>
                <Text size="lg" fw={700}>
                  {upcomingCount}
                </Text>
                <Text size="xs" c="dimmed">
                  Upcoming
                </Text>
              </div>
              <div>
                <Text size="lg" fw={700}>
                  $
                  {tickets
                    .reduce(
                      (sum, ticket) => sum + (ticket.ticketType?.price || 0),
                      0
                    )
                    .toFixed(2)}
                </Text>
                <Text size="xs" c="dimmed">
                  Total Value
                </Text>
              </div>
              <div>
                <Text size="lg" fw={700}>
                  {new Set(tickets.map((t) => t.eventId)).size}
                </Text>
                <Text size="xs" c="dimmed">
                  Events Attended
                </Text>
              </div>
            </Group>
          </Alert>
        )}
      </Stack>
    </Container>
  );
};
