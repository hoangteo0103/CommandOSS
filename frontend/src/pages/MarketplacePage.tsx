import { useState } from "react";
import {
  Container,
  Title,
  Text,
  Stack,
  Group,
  Button,
  Center,
  Card,
  SimpleGrid,
  Badge,
  ThemeIcon,
  Box,
  ActionIcon,
  Tooltip,
  TextInput,
  Select,
  Paper,
  Modal,
  Transition,
} from "@mantine/core";
import {
  IconShoppingCart,
  IconTrophy,
  IconRefresh,
  IconTicket,
  IconCalendar,
  IconMapPin,
  IconSearch,
  IconFilter,
  IconSortAscending,
  IconCurrencyDollar,
  IconTrendingUp,
  IconFlame,
} from "@tabler/icons-react";
import { useWallet } from "../hooks/useWallet";
import { WalletButton } from "../components/WalletButton";
import { useDisclosure } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { marketplaceApi } from "../services/marketplace";
import type {
  MarketplaceListing,
  MarketplaceQueryDto,
  BuyListingDto,
} from "../services/marketplace";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

dayjs.extend(relativeTime);

export const MarketplacePage = () => {
  const { isConnected, address } = useWallet();
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [selectedListing, setSelectedListing] =
    useState<MarketplaceListing | null>(null);
  const [buyModalOpened, { open: openBuyModal, close: closeBuyModal }] =
    useDisclosure(false);

  const queryClient = useQueryClient();

  // Fetch marketplace listings
  const {
    data: listingsResponse,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["marketplace-listings", searchQuery, categoryFilter, sortBy],
    queryFn: () => {
      const params: MarketplaceQueryDto = {
        search: searchQuery || undefined,
        category: categoryFilter === "all" ? undefined : categoryFilter,
        sortBy: sortBy as any,
        limit: 50,
      };
      return marketplaceApi.getListings(params);
    },
    staleTime: 1000 * 30, // 30 seconds
  });

  console.log(listingsResponse);

  // Fetch marketplace stats
  const { data: statsResponse } = useQuery({
    queryKey: ["marketplace-stats"],
    queryFn: () => marketplaceApi.getStats(),
    staleTime: 1000 * 60, // 1 minute
  });

  // Buy listing mutation
  const buyListingMutation = useMutation({
    mutationFn: ({
      listingId,
      buyerData,
    }: {
      listingId: string;
      buyerData: BuyListingDto;
    }) => marketplaceApi.buyListing(listingId, buyerData),
    onSuccess: () => {
      notifications.show({
        title: "🎉 Purchase Successful!",
        message: `You've successfully purchased the ticket!`,
        color: "green",
        autoClose: 5000,
      });
      closeBuyModal();
      queryClient.invalidateQueries({ queryKey: ["marketplace-listings"] });
      queryClient.invalidateQueries({ queryKey: ["marketplace-stats"] });
      queryClient.invalidateQueries({ queryKey: ["my-tickets"] });
    },
    onError: (error: any) => {
      notifications.show({
        title: "❌ Purchase Failed",
        message: error.response?.data?.message || "Failed to purchase ticket",
        color: "red",
        autoClose: 5000,
      });
    },
  });

  const listings = listingsResponse?.data?.data || [];
  const stats = statsResponse?.data;

  const handleBuyTicket = (listing: MarketplaceListing) => {
    if (!address) {
      notifications.show({
        title: "⚠️ Wallet Required",
        message: "Please connect your wallet to purchase tickets",
        color: "orange",
        autoClose: 3000,
      });
      return;
    }
    setSelectedListing(listing);
    openBuyModal();
  };

  const confirmPurchase = () => {
    if (!selectedListing || !address) return;

    const buyerData: BuyListingDto = {
      buyerAddress: address,
      // In a real implementation, this would come from the blockchain transaction
      transactionHash: `mock_tx_${Date.now()}`,
    };

    buyListingMutation.mutate({
      listingId: selectedListing.id,
      buyerData,
    });
  };

  if (!isConnected) {
    return (
      <Box
        style={{
          background:
            "linear-gradient(135deg, #f59e0b 0%, #ef4444 50%, #ec4899 100%)",
          minHeight: "100vh",
          position: "relative",
          overflow: "hidden",
        }}
      >
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
                  gradient={{ from: "orange", to: "red", deg: 45 }}
                >
                  <IconShoppingCart size={60} />
                </ThemeIcon>
                <Title order={1} c="dark">
                  NFT Marketplace
                </Title>
                <Text size="lg" c="dimmed" ta="center" maw={400}>
                  Connect your wallet to buy and sell exclusive NFT tickets in
                  our decentralized marketplace.
                </Text>
                <WalletButton />
              </Stack>
            </Card>
          </Center>
        </Container>
      </Box>
    );
  }

  return (
    <Box
      style={{
        background:
          "linear-gradient(135deg, #f59e0b 0%, #ef4444 50%, #ec4899 100%)",
        minHeight: "100vh",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <Container size="xl" py="xl" style={{ position: "relative", zIndex: 1 }}>
        <Stack gap="xl">
          {/* Header */}
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
            <Group justify="space-between" align="flex-start">
              <Stack gap="xs">
                <Group gap="md">
                  <ThemeIcon
                    size={60}
                    radius="xl"
                    variant="gradient"
                    gradient={{ from: "orange", to: "red", deg: 45 }}
                  >
                    <IconTrophy size={30} />
                  </ThemeIcon>
                  <div>
                    <Title order={1} size="h1" c="dark">
                      NFT Marketplace
                    </Title>
                    <Text size="lg" c="dimmed">
                      Buy & sell exclusive ticket NFTs
                    </Text>
                  </div>
                </Group>
              </Stack>

              <Group>
                <Tooltip label="Refresh marketplace">
                  <ActionIcon
                    size="lg"
                    variant="light"
                    color="orange"
                    radius="xl"
                  >
                    <IconRefresh size={18} />
                  </ActionIcon>
                </Tooltip>
                <WalletButton />
              </Group>
            </Group>
          </Card>

          {/* Coming Soon */}
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
            <Stack gap="lg">
              {/* Search and Filters */}
              <Group align="flex-end" gap="md">
                <TextInput
                  placeholder="Search events..."
                  leftSection={<IconSearch size={16} />}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ flex: 1 }}
                  radius="lg"
                />
                <Select
                  placeholder="Category"
                  data={[
                    { value: "all", label: "All Categories" },
                    { value: "tech", label: "Technology" },
                    { value: "art", label: "Art & Culture" },
                    { value: "finance", label: "Finance" },
                    { value: "music", label: "Music" },
                  ]}
                  value={categoryFilter}
                  onChange={(value) => setCategoryFilter(value || "all")}
                  leftSection={<IconFilter size={16} />}
                  radius="lg"
                />
                <Select
                  placeholder="Sort by"
                  data={[
                    { value: "newest", label: "Newest First" },
                    { value: "oldest", label: "Oldest First" },
                    { value: "price-low", label: "Price: Low to High" },
                    { value: "price-high", label: "Price: High to Low" },
                  ]}
                  value={sortBy}
                  onChange={(value) => setSortBy(value || "newest")}
                  leftSection={<IconSortAscending size={16} />}
                  radius="lg"
                />
              </Group>

              {/* Stats */}
              <Group justify="space-between">
                <Text size="lg" fw={600} c="dark">
                  {listings.length} NFT Tickets Available
                </Text>
                <Group gap="lg">
                  <Group gap="xs">
                    <IconTrendingUp size={16} color="#22c55e" />
                    <Text size="sm" c="dimmed">
                      24h Volume: SUI {stats?.totalVolume || "Loading..."}
                    </Text>
                  </Group>
                  <Group gap="xs">
                    <IconFlame size={16} color="#ef4444" />
                    <Text size="sm" c="dimmed">
                      {stats?.hotListings || "Loading..."} Hot Listings
                    </Text>
                  </Group>
                </Group>
              </Group>
            </Stack>
          </Card>

          {/* Marketplace Listings */}
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
            {listings.length === 0 ? (
              <Center py="xl">
                <Stack align="center" gap="md" ta="center">
                  <ThemeIcon
                    size={80}
                    radius="xl"
                    variant="gradient"
                    gradient={{ from: "orange", to: "red", deg: 45 }}
                  >
                    <IconShoppingCart size={40} />
                  </ThemeIcon>
                  <Text fw={500} size="lg">
                    No listings found
                  </Text>
                  <Text size="sm" c="dimmed" maw={400}>
                    Try adjusting your search or filters to find more tickets
                  </Text>
                </Stack>
              </Center>
            ) : (
              <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="lg">
                {listings.map((listing) => (
                  <MarketplaceListingCard
                    key={listing.id}
                    listing={listing}
                    onBuy={() => handleBuyTicket(listing)}
                  />
                ))}
              </SimpleGrid>
            )}
          </Card>
        </Stack>
      </Container>

      {/* Buy Confirmation Modal */}
      <Modal
        opened={buyModalOpened}
        onClose={closeBuyModal}
        title={
          <Group gap="md">
            <ThemeIcon
              size="lg"
              radius="xl"
              variant="gradient"
              gradient={{ from: "orange", to: "red", deg: 45 }}
            >
              <IconShoppingCart size={20} />
            </ThemeIcon>
            <Text fw={600}>Confirm Purchase</Text>
          </Group>
        }
        size="md"
        radius="xl"
      >
        {selectedListing && (
          <Stack gap="lg">
            <Card
              p="lg"
              radius="lg"
              style={{ background: "rgba(251, 146, 60, 0.05)" }}
            >
              <Stack gap="sm">
                <Text fw={600} size="lg">
                  {selectedListing.ticket?.event?.name || "Event Name"}
                </Text>
                <Group gap="md">
                  <Group gap="xs">
                    <IconCalendar size={16} />
                    <Text size="sm">
                      {selectedListing.ticket?.event?.date
                        ? dayjs(selectedListing.ticket.event.date).format(
                            "MMM DD, YYYY"
                          )
                        : "TBD"}
                    </Text>
                  </Group>
                  <Group gap="xs">
                    <IconMapPin size={16} />
                    <Text size="sm">
                      {selectedListing.ticket?.event?.location || "TBD"}
                    </Text>
                  </Group>
                </Group>
                <Group justify="space-between" align="center">
                  <Text size="xl" fw={700} c="orange">
                    SUI {selectedListing.listingPrice}
                  </Text>
                  <Badge variant="light" color="gray">
                    Seller: {selectedListing.sellerAddress.slice(0, 8)}...
                  </Badge>
                </Group>
              </Stack>
            </Card>
            <Group justify="center" gap="md">
              <Button variant="light" onClick={closeBuyModal}>
                Cancel
              </Button>
              <Button
                variant="gradient"
                gradient={{ from: "orange", to: "red", deg: 45 }}
                onClick={confirmPurchase}
              >
                Confirm Purchase
              </Button>
            </Group>
          </Stack>
        )}
      </Modal>
    </Box>
  );
};

// Marketplace Listing Card Component
const MarketplaceListingCard = ({
  listing,
  onBuy,
}: {
  listing: MarketplaceListing;
  onBuy: () => void;
}) => {
  return (
    <Transition mounted={true} transition="slide-up" duration={400}>
      {(styles) => (
        <Card
          shadow="lg"
          padding={0}
          radius="xl"
          style={{
            ...styles,
            background:
              "linear-gradient(135deg, rgba(251, 146, 60, 0.9) 0%, rgba(239, 68, 68, 0.9) 100%)",
            color: "white",
            overflow: "hidden",
            position: "relative",
            cursor: "pointer",
            transition: "all 0.3s ease",
          }}
          className="marketplace-card"
        >
          {/* Hot Badge */}
          {listing.isHot && (
            <Badge
              style={{
                position: "absolute",
                top: "12px",
                right: "12px",
                zIndex: 2,
                background: "rgba(239, 68, 68, 0.9)",
                color: "white",
              }}
              leftSection={<IconFlame size={12} />}
            >
              HOT
            </Badge>
          )}

          {/* Event Image */}
          <Box style={{ height: "150px", background: "rgba(255,255,255,0.1)" }}>
            <Center h="100%">
              <IconTicket size={40} style={{ opacity: 0.7 }} />
            </Center>
          </Box>

          {/* Content */}
          <Box p="lg">
            <Stack gap="sm">
              <Text
                size="lg"
                fw={700}
                style={{ textShadow: "0 2px 4px rgba(0,0,0,0.3)" }}
              >
                {listing.ticket?.event?.name || "Event Name"}
              </Text>

              <Group gap="md">
                <Group gap="xs">
                  <IconCalendar size={14} style={{ opacity: 0.9 }} />
                  <Text size="xs" style={{ opacity: 0.9 }}>
                    {listing.ticket?.event?.date
                      ? dayjs(listing.ticket.event.date).format("MMM DD")
                      : "TBD"}
                  </Text>
                </Group>
                <Group gap="xs">
                  <IconMapPin size={14} style={{ opacity: 0.9 }} />
                  <Text size="xs" style={{ opacity: 0.9 }}>
                    {listing.ticket?.event?.location || "TBD"}
                  </Text>
                </Group>
              </Group>

              <Group justify="space-between" align="center">
                <div>
                  <Text size="xs" style={{ opacity: 0.8 }}>
                    Original: SUI {listing.originalPrice}
                  </Text>
                  <Group gap="xs">
                    <IconCurrencyDollar size={16} />
                    <Text size="lg" fw={900}>
                      SUI {listing.listingPrice}
                    </Text>
                  </Group>
                </div>
                <Badge
                  variant="light"
                  color="white"
                  style={{ backgroundColor: "rgba(255,255,255,0.2)" }}
                >
                  {listing.category || "Other"}
                </Badge>
              </Group>
            </Stack>
          </Box>

          {/* Footer */}
          <Paper
            p="md"
            style={{
              background: "rgba(0,0,0,0.2)",
              backdropFilter: "blur(10px)",
            }}
          >
            <Group justify="space-between" align="center">
              <Group gap="xs">
                <Text size="xs" style={{ opacity: 0.8 }}>
                  Listed {dayjs(listing.createdAt).fromNow()}
                </Text>
              </Group>
              <Button
                size="sm"
                variant="white"
                color="dark"
                radius="xl"
                onClick={(e) => {
                  e.stopPropagation();
                  onBuy();
                }}
              >
                Buy Now
              </Button>
            </Group>
          </Paper>
        </Card>
      )}
    </Transition>
  );
};
