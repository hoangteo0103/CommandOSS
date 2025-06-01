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
  Card,
  SimpleGrid,
  Badge,
  ThemeIcon,
  Box,
  NumberFormatter,
  ActionIcon,
  Tooltip,
  TextInput,
  Select,
  Tabs,
  Paper,
  Image,
  Modal,
  Transition,
} from "@mantine/core";
import {
  IconShoppingCart,
  IconTrophy,
  IconRefresh,
  IconTicket,
  IconCoin,
  IconHeart,
  IconEye,
  IconCalendar,
  IconMapPin,
  IconSearch,
  IconFilter,
  IconSortAscending,
  IconCurrencyDollar,
  IconClock,
  IconCheck,
  IconStar,
  IconTrendingUp,
  IconFlame,
} from "@tabler/icons-react";
import { useWallet } from "../hooks/useWallet";
import { WalletButton } from "../components/WalletButton";
import { useDisclosure } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

// Mock marketplace data - in real app this would come from API
const mockMarketplaceListings = [
  {
    id: 1,
    nftTokenId: "0x123...abc",
    event: {
      name: "Blockchain Summit 2024",
      date: "2024-04-15T19:00:00Z",
      location: "San Francisco",
      image: "https://via.placeholder.com/400x200?text=Blockchain+Summit",
    },
    originalPrice: 150,
    listingPrice: 120,
    seller: "0xabc...123",
    listedAt: "2024-03-01T10:00:00Z",
    category: "Tech",
    isHot: true,
  },
  {
    id: 2,
    nftTokenId: "0x456...def",
    event: {
      name: "NFT Art Expo",
      date: "2024-05-20T18:00:00Z",
      location: "New York",
      image: "https://via.placeholder.com/400x200?text=NFT+Art+Expo",
    },
    originalPrice: 200,
    listingPrice: 250,
    seller: "0xdef...456",
    listedAt: "2024-03-05T14:30:00Z",
    category: "Art",
    isHot: false,
  },
  {
    id: 3,
    nftTokenId: "0x789...ghi",
    event: {
      name: "DeFi Conference",
      date: "2024-06-10T09:00:00Z",
      location: "London",
      image: "https://via.placeholder.com/400x200?text=DeFi+Conference",
    },
    originalPrice: 300,
    listingPrice: 275,
    seller: "0xghi...789",
    listedAt: "2024-03-10T16:45:00Z",
    category: "Finance",
    isHot: true,
  },
];

export const MarketplacePage = () => {
  const { isConnected } = useWallet();
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [selectedListing, setSelectedListing] = useState<any>(null);
  const [buyModalOpened, { open: openBuyModal, close: closeBuyModal }] =
    useDisclosure(false);

  // Filter and sort listings
  const filteredListings = mockMarketplaceListings
    .filter((listing) => {
      const matchesSearch = listing.event.name
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      const matchesCategory =
        categoryFilter === "all" ||
        listing.category.toLowerCase() === categoryFilter;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "price-low":
          return a.listingPrice - b.listingPrice;
        case "price-high":
          return b.listingPrice - a.listingPrice;
        case "newest":
          return (
            new Date(b.listedAt).getTime() - new Date(a.listedAt).getTime()
          );
        case "oldest":
          return (
            new Date(a.listedAt).getTime() - new Date(b.listedAt).getTime()
          );
        default:
          return 0;
      }
    });

  const handleBuyTicket = (listing: any) => {
    setSelectedListing(listing);
    openBuyModal();
  };

  const confirmPurchase = () => {
    notifications.show({
      title: "🎉 Purchase Successful!",
      message: `You've bought ${selectedListing?.event.name} for SUI ${selectedListing?.listingPrice}`,
      color: "green",
      autoClose: 5000,
    });
    closeBuyModal();
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
                  {filteredListings.length} NFT Tickets Available
                </Text>
                <Group gap="lg">
                  <Group gap="xs">
                    <IconTrendingUp size={16} color="#22c55e" />
                    <Text size="sm" c="dimmed">
                      24h Volume: SUI 1,250
                    </Text>
                  </Group>
                  <Group gap="xs">
                    <IconFlame size={16} color="#ef4444" />
                    <Text size="sm" c="dimmed">
                      {mockMarketplaceListings.filter((l) => l.isHot).length}{" "}
                      Hot Listings
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
            {filteredListings.length === 0 ? (
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
                {filteredListings.map((listing) => (
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
                  {selectedListing.event.name}
                </Text>
                <Group gap="md">
                  <Group gap="xs">
                    <IconCalendar size={16} />
                    <Text size="sm">
                      {dayjs(selectedListing.event.date).format("MMM DD, YYYY")}
                    </Text>
                  </Group>
                  <Group gap="xs">
                    <IconMapPin size={16} />
                    <Text size="sm">{selectedListing.event.location}</Text>
                  </Group>
                </Group>
                <Group justify="space-between" align="center">
                  <Text size="xl" fw={700} c="orange">
                    SUI {selectedListing.listingPrice}
                  </Text>
                  <Badge variant="light" color="gray">
                    Seller: {selectedListing.seller.slice(0, 8)}...
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
const MarketplaceListingCard = ({ listing, onBuy }: any) => {
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
                {listing.event.name}
              </Text>

              <Group gap="md">
                <Group gap="xs">
                  <IconCalendar size={14} style={{ opacity: 0.9 }} />
                  <Text size="xs" style={{ opacity: 0.9 }}>
                    {dayjs(listing.event.date).format("MMM DD")}
                  </Text>
                </Group>
                <Group gap="xs">
                  <IconMapPin size={14} style={{ opacity: 0.9 }} />
                  <Text size="xs" style={{ opacity: 0.9 }}>
                    {listing.event.location}
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
                  {listing.category}
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
                  Listed {dayjs(listing.listedAt).fromNow()}
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
