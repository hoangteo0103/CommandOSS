import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Container,
  Title,
  Text,
  Grid,
  Stack,
  Group,
  Badge,
  Button,
  Card,
  Center,
  Loader,
  Alert,
  ActionIcon,
  Box,
  NumberInput,
  Divider,
  Progress,
  Paper,
  ThemeIcon,
  Timeline,
  Stepper,
  Avatar,
  Tooltip,
  Image,
  Transition,
  Flex,
  RingProgress,
} from "@mantine/core";
import {
  IconArrowLeft,
  IconAlertCircle,
  IconTicket,
  IconCreditCard,
  IconClock,
  IconSparkles,
  IconShieldCheck,
  IconRocket,
  IconTrophy,
  IconBolt,
  IconDiamond,
  IconStar,
  IconHeart,
  IconChevronRight,
  IconCheck,
  IconWallet,
  IconQrcode,
  IconGift,
} from "@tabler/icons-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import dayjs from "dayjs";
import { eventsApi, bookingApi } from "../services/api";
import { useWallet } from "../hooks/useWallet";
import { WalletButton } from "../components/WalletButton";

export const TicketPurchasePage = () => {
  const { eventId, ticketTypeId } = useParams<{
    eventId: string;
    ticketTypeId: string;
  }>();
  const navigate = useNavigate();
  const { isConnected, address, signAndExecuteTransaction } = useWallet();
  const queryClient = useQueryClient();
  const [isProcessing, setIsProcessing] = useState(false);
  const [reservationTime, setReservationTime] = useState<Date | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);

  const {
    data: eventData,
    isLoading: eventLoading,
    error: eventError,
  } = useQuery({
    queryKey: ["event", eventId],
    queryFn: () => eventsApi.getEvent(eventId!),
    enabled: !!eventId,
  });

  const event = eventData?.data;
  const ticketType = event?.ticketTypes?.find((tt) => tt.id === ticketTypeId);

  const form = useForm({
    initialValues: {
      quantity: 1,
    },
    validate: {
      quantity: (value) => {
        if (value < 1) return "Quantity must be at least 1";
        if (ticketType && value > ticketType.availableSupply)
          return "Not enough tickets available";
        if (value > 5) return "Maximum 5 tickets per purchase";
        return null;
      },
    },
  });

  // Reservation timer effect
  useEffect(() => {
    if (!reservationTime) return;

    const interval = setInterval(() => {
      const now = new Date();
      const diff = reservationTime.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeLeft(0);
        setReservationTime(null);
        setCurrentStep(0);
        notifications.show({
          title: "⏰ Reservation Expired",
          message: "Your ticket reservation has expired. Please try again.",
          color: "orange",
          autoClose: 7000,
        });
        navigate(`/events/${eventId}`);
      } else {
        setTimeLeft(Math.floor(diff / 1000));
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [reservationTime, navigate, eventId]);

  const reserveMutation = useMutation({
    mutationFn: bookingApi.reserveTickets,
    onSuccess: (data) => {
      if (data.success && data.data) {
        const expireTime = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
        setReservationTime(expireTime);
        setCurrentStep(1);

        notifications.show({
          title: "🎯 Tickets Reserved!",
          message: "You have 15 minutes to complete your purchase",
          color: "blue",
          autoClose: 5000,
        });
      }
      setIsProcessing(false);
    },
    onError: (error) => {
      notifications.show({
        title: "❌ Reservation Failed",
        message:
          error instanceof Error ? error.message : "Failed to reserve tickets",
        color: "red",
        autoClose: 7000,
      });
      setIsProcessing(false);
    },
  });

  const purchaseMutation = useMutation({
    mutationFn: bookingApi.purchaseTickets,
    onSuccess: (data) => {
      if (data.success) {
        setCurrentStep(2);
        setShowConfetti(true);

        notifications.show({
          title: "🎉 Purchase Successful!",
          message: "Your NFT tickets have been minted and added to your wallet",
          color: "green",
          autoClose: 10000,
        });

        queryClient.invalidateQueries({ queryKey: ["event", eventId] });
        queryClient.invalidateQueries({ queryKey: ["my-tickets"] });

        setTimeout(() => {
          navigate(`/events/${eventId}`, {
            state: { purchaseSuccess: true },
          });
        }, 3000);
      }
      setIsProcessing(false);
    },
    onError: (error) => {
      console.error("❌ BACKEND PURCHASE NOTIFICATION FAILED:", error);

      notifications.show({
        title: "❌ Purchase Failed",
        message:
          error instanceof Error
            ? error.message
            : "Failed to complete purchase",
        color: "red",
        autoClose: 7000,
      });
      setIsProcessing(false);
    },
  });

  const handleReserveTickets = (values: { quantity: number }) => {
    if (!isConnected || !address) {
      notifications.show({
        title: "🔗 Wallet Required",
        message: "Please connect your wallet to purchase tickets",
        color: "orange",
        autoClose: 5000,
      });
      return;
    }

    setIsProcessing(true);
    reserveMutation.mutate({
      eventId: eventId!,
      ticketTypeId: ticketTypeId!,
      quantity: values.quantity,
      buyerAddress: address,
    });
  };

  const handleCompletePurchase = async () => {
    if (!reserveMutation.data?.data) return;

    try {
      setIsProcessing(true);

      // Get reservation data
      const reservation = reserveMutation.data.data;
      const totalPriceInSui = reservation.totalPrice; // Assuming price is in SUI

      // Show initial processing notification
      notifications.show({
        id: "payment-processing",
        title: "🔄 Processing Payment",
        message: `Preparing to pay ${totalPriceInSui} SUI...`,
        color: "blue",
        autoClose: false,
        loading: true,
      });

      // Create a Sui transaction for payment
      const { Transaction } = await import("@mysten/sui/transactions");
      const transaction = new Transaction();

      // Add a transfer coin transaction to the backend's wallet address
      // This simulates payment - in production you'd transfer to the event organizer
      const backendWalletAddress =
        "0x41e5467b71a5c1e12a596edb89b5ba9d335be6494c3d47a527c8c021f821ef9d"; // Your backend wallet

      // Convert SUI to MIST (1 SUI = 1_000_000_000 MIST)
      const amountInMist = Math.floor(totalPriceInSui * 1_000_000_000);

      transaction.transferObjects(
        [transaction.splitCoins(transaction.gas, [amountInMist])],
        backendWalletAddress
      );

      // Update notification for wallet interaction
      notifications.update({
        id: "payment-processing",
        title: "💳 Wallet Interaction Required",
        message: "Please confirm the payment in your wallet...",
        color: "orange",
        autoClose: false,
        loading: true,
      });

      // Sign and execute the transaction
      const result = await signAndExecuteTransaction(transaction);

      // Close processing notification
      notifications.hide("payment-processing");

      notifications.show({
        title: "💳 Payment Successful!",
        message: `Paid ${totalPriceInSui} SUI - Transaction: ${result.digest?.slice(
          0,
          10
        )}...`,
        color: "blue",
        autoClose: 5000,
      });

      // Log the purchase notification being sent to backend
      console.log("🚀 SENDING PURCHASE NOTIFICATION TO BACKEND:");
      console.log("📦 Order ID:", reservation.id);
      console.log("🔐 Payment Signature:", result.signature || result.digest);
      console.log("💰 Transaction Digest:", result.digest);
      console.log("⏰ Timestamp:", new Date().toISOString());

      // Now complete the purchase with the real transaction signature
      purchaseMutation.mutate({
        orderId: reservation.id,
        paymentSignature: result.signature || result.digest, // Use real transaction signature
      });
    } catch (error) {
      setIsProcessing(false);
      notifications.hide("payment-processing");

      let errorMessage = "Failed to process payment";
      if (error instanceof Error) {
        if (error.message.includes("Insufficient")) {
          errorMessage = "Insufficient SUI balance in your wallet";
        } else if (error.message.includes("rejected")) {
          errorMessage = "Payment was rejected by user";
        } else {
          errorMessage = error.message;
        }
      }

      notifications.show({
        title: "❌ Payment Failed",
        message: errorMessage,
        color: "red",
        autoClose: 7000,
      });
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  const getTimeProgress = () => {
    return ((15 * 60 - timeLeft) / (15 * 60)) * 100;
  };

  if (eventLoading) {
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
        {/* Animated background elements */}
        <Box
          style={{
            position: "absolute",
            top: "10%",
            left: "10%",
            width: "100px",
            height: "100px",
            background: "rgba(255, 255, 255, 0.1)",
            borderRadius: "50%",
            animation: "float 6s ease-in-out infinite",
          }}
        />
        <Box
          style={{
            position: "absolute",
            top: "60%",
            right: "15%",
            width: "150px",
            height: "150px",
            background: "rgba(255, 255, 255, 0.05)",
            borderRadius: "50%",
            animation: "float 8s ease-in-out infinite reverse",
          }}
        />

        <Container size="xl" py="xl">
          <Center style={{ minHeight: "70vh" }}>
            <Stack align="center" gap="xl">
              <Box
                style={{
                  position: "relative",
                  background: "rgba(255, 255, 255, 0.15)",
                  backdropFilter: "blur(20px)",
                  borderRadius: "50%",
                  padding: "40px",
                  border: "2px solid rgba(255, 255, 255, 0.2)",
                }}
              >
                <Loader size="xl" color="white" />
                <Box
                  style={{
                    position: "absolute",
                    inset: 0,
                    borderRadius: "50%",
                    background:
                      "conic-gradient(from 0deg, transparent, rgba(255,255,255,0.3), transparent)",
                    animation: "spin 2s linear infinite",
                  }}
                />
              </Box>
              <Text
                size="xl"
                fw={600}
                c="white"
                style={{
                  textShadow: "0 2px 10px rgba(0,0,0,0.3)",
                  animation: "pulse 2s ease-in-out infinite",
                }}
              >
                Loading your premium experience...
              </Text>
            </Stack>
          </Center>
        </Container>

        <style>
          {`
            @keyframes float {
              0%, 100% { transform: translateY(0px) rotate(0deg); }
              50% { transform: translateY(-20px) rotate(180deg); }
            }
            @keyframes spin {
              from { transform: rotate(0deg); }
              to { transform: rotate(360deg); }
            }
            @keyframes pulse {
              0%, 100% { opacity: 1; }
              50% { opacity: 0.7; }
            }
          `}
        </style>
      </Box>
    );
  }

  if (eventError || !event || !ticketType) {
    return (
      <Box
        style={{
          background: "linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%)",
          minHeight: "100vh",
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
              <Stack align="center" gap="lg">
                <ThemeIcon size={80} radius="xl" color="red">
                  <IconAlertCircle size={40} />
                </ThemeIcon>
                <Title order={2} c="red">
                  Oops! Something went wrong
                </Title>
                <Text c="dimmed" size="lg">
                  The ticket you're looking for seems to have vanished into the
                  digital void.
                </Text>
                <Button
                  size="lg"
                  radius="xl"
                  onClick={() => navigate(`/events/${eventId || ""}`)}
                  leftSection={<IconArrowLeft size={20} />}
                >
                  Return to Event
                </Button>
              </Stack>
            </Card>
          </Center>
        </Container>
      </Box>
    );
  }

  const totalPrice = form.values.quantity * ticketType.price;
  const saleStartDate = ticketType.saleStartDate
    ? dayjs(ticketType.saleStartDate)
    : null;
  const saleEndDate = ticketType.saleEndDate
    ? dayjs(ticketType.saleEndDate)
    : null;
  const now = dayjs();

  const saleStarted =
    !saleStartDate || !saleStartDate.isValid() || saleStartDate.isBefore(now);
  const saleEnded =
    saleEndDate && saleEndDate.isValid() && saleEndDate.isBefore(now);
  const isAvailable =
    ticketType.availableSupply > 0 && saleStarted && !saleEnded;

  return (
    <Box
      style={{
        background:
          currentStep === 2
            ? "linear-gradient(135deg, #11998e 0%, #38ef7d 100%)"
            : reservationTime
            ? "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
            : "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
        minHeight: "100vh",
        position: "relative",
        overflow: "hidden",
        transition: "all 0.8s ease-in-out",
      }}
    >
      {/* Confetti Effect */}
      {showConfetti && (
        <Box
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            pointerEvents: "none",
            zIndex: 1000,
          }}
        >
          {Array.from({ length: 50 }).map((_, i) => (
            <Box
              key={i}
              style={{
                position: "absolute",
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: "3s",
                animationName: "confetti",
                animationTimingFunction: "linear",
                animationIterationCount: "infinite",
              }}
            >
              🎉
            </Box>
          ))}
        </Box>
      )}

      {/* Floating background elements */}
      <Box
        style={{
          position: "absolute",
          top: "20%",
          left: "5%",
          width: "200px",
          height: "200px",
          background: "rgba(255, 255, 255, 0.1)",
          borderRadius: "50%",
          animation: "float 10s ease-in-out infinite",
        }}
      />
      <Box
        style={{
          position: "absolute",
          bottom: "10%",
          right: "10%",
          width: "300px",
          height: "300px",
          background: "rgba(255, 255, 255, 0.05)",
          borderRadius: "50%",
          animation: "float 12s ease-in-out infinite reverse",
        }}
      />

      <Container size="xl" py="xl" style={{ position: "relative", zIndex: 1 }}>
        <Stack gap="xl">
          {/* Header with Back Navigation */}
          <Group>
            <ActionIcon
              variant="white"
              size="xl"
              onClick={() => navigate(`/events/${eventId}`)}
              radius="xl"
              style={{
                boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
                transition: "all 0.3s ease",
              }}
            >
              <IconArrowLeft size={24} />
            </ActionIcon>
            <Stack gap={0}>
              <Text
                size="lg"
                fw={600}
                c="white"
                style={{ textShadow: "0 2px 10px rgba(0,0,0,0.3)" }}
              >
                Back to Event
              </Text>
              <Text size="sm" c="rgba(255,255,255,0.8)">
                {event.name}
              </Text>
            </Stack>
          </Group>

          {/* Progress Stepper */}
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
            <Stepper
              active={currentStep}
              color="blue"
              size="lg"
              styles={{
                step: {
                  transition: "all 0.3s ease",
                },
                stepIcon: {
                  borderWidth: "3px",
                },
              }}
            >
              <Stepper.Step
                icon={<IconTicket size={20} />}
                label="Select Tickets"
                description="Choose quantity"
              />
              <Stepper.Step
                icon={<IconClock size={20} />}
                label="Reserved"
                description="15 min hold"
              />
              <Stepper.Step
                icon={<IconTrophy size={20} />}
                label="Complete"
                description="NFTs minted!"
              />
            </Stepper>
          </Card>

          {/* Reservation Timer */}
          <Transition
            mounted={!!reservationTime && timeLeft > 0}
            transition="slide-down"
          >
            {(styles) => (
              <Alert
                style={{
                  ...styles,
                  background: "rgba(255, 255, 255, 0.95)",
                  backdropFilter: "blur(20px)",
                  border: "2px solid rgba(59, 130, 246, 0.3)",
                  borderRadius: "16px",
                  boxShadow: "0 8px 32px rgba(59, 130, 246, 0.2)",
                }}
                icon={<IconClock size={20} />}
                color="blue"
              >
                <Flex justify="space-between" align="center">
                  <Stack gap={4}>
                    <Text fw={600} size="lg">
                      🎯 Tickets Reserved
                    </Text>
                    <Text size="sm" c="dimmed">
                      Complete your purchase before time runs out!
                    </Text>
                  </Stack>
                  <Group gap="lg">
                    <RingProgress
                      size={80}
                      thickness={6}
                      sections={[
                        {
                          value: 100 - getTimeProgress(),
                          color:
                            timeLeft < 180
                              ? "red"
                              : timeLeft < 300
                              ? "orange"
                              : "blue",
                        },
                      ]}
                      label={
                        <Center>
                          <Text
                            fw={700}
                            size="xs"
                            c={timeLeft < 180 ? "red" : "blue"}
                          >
                            {formatTime(timeLeft)}
                          </Text>
                        </Center>
                      }
                    />
                  </Group>
                </Flex>
              </Alert>
            )}
          </Transition>

          <Grid gutter="xl">
            {/* Ticket Preview Card */}
            <Grid.Col span={{ base: 12, md: 5 }}>
              <Card
                shadow="xl"
                padding={0}
                radius="xl"
                style={{
                  background: "rgba(255, 255, 255, 0.95)",
                  backdropFilter: "blur(20px)",
                  border: "1px solid rgba(255, 255, 255, 0.2)",
                  overflow: "hidden",
                  transform: "perspective(1000px) rotateY(-5deg)",
                  transition: "all 0.3s ease",
                }}
              >
                {/* Ticket Header */}
                <Box
                  style={{
                    background:
                      "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                    padding: "24px",
                    position: "relative",
                    overflow: "hidden",
                  }}
                >
                  <Group justify="space-between" align="flex-start">
                    <Stack gap="xs">
                      <Badge
                        size="lg"
                        variant="light"
                        color="white"
                        style={{ backgroundColor: "rgba(255,255,255,0.2)" }}
                      >
                        NFT TICKET
                      </Badge>
                      <Title order={2} c="white" fw={700}>
                        {ticketType.name}
                      </Title>
                      <Text c="rgba(255,255,255,0.9)" size="lg" fw={500}>
                        ${ticketType.price}
                      </Text>
                    </Stack>
                    <ThemeIcon
                      size={60}
                      radius="xl"
                      variant="light"
                      color="white"
                    >
                      <IconDiamond size={30} />
                    </ThemeIcon>
                  </Group>

                  {/* Decorative elements */}
                  <Box
                    style={{
                      position: "absolute",
                      top: 0,
                      right: 0,
                      width: "100%",
                      height: "100%",
                      background:
                        'url(\'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grain" width="100" height="100" patternUnits="userSpaceOnUse"><circle cx="20" cy="20" r="1" fill="%23ffffff" opacity="0.1"/><circle cx="80" cy="40" r="1" fill="%23ffffff" opacity="0.1"/><circle cx="40" cy="80" r="1" fill="%23ffffff" opacity="0.1"/></pattern></defs><rect width="100" height="100" fill="url(%23grain)"/></svg>\')',
                      opacity: 0.3,
                    }}
                  />
                </Box>

                <Stack gap="lg" p="xl">
                  <Group>
                    <ThemeIcon
                      size={40}
                      radius="xl"
                      color="blue"
                      variant="light"
                    >
                      <IconSparkles size={20} />
                    </ThemeIcon>
                    <div>
                      <Text fw={600} size="md">
                        Premium Features
                      </Text>
                      <Text size="sm" c="dimmed">
                        Blockchain verified authenticity
                      </Text>
                    </div>
                  </Group>

                  {ticketType.description && (
                    <Text size="md" style={{ lineHeight: 1.6 }}>
                      {ticketType.description}
                    </Text>
                  )}

                  <Divider />

                  <Group justify="space-between">
                    <Text fw={500}>Available Supply</Text>
                    <Badge color="green" variant="light" size="lg">
                      {ticketType.availableSupply} of {ticketType.supply}
                    </Badge>
                  </Group>

                  {saleStartDate && saleStartDate.isValid() && (
                    <Group justify="space-between">
                      <Text fw={500}>Sale Period</Text>
                      <Text size="sm" c="dimmed">
                        {saleStartDate.format("MMM DD")} -{" "}
                        {saleEndDate?.format("MMM DD") || "Ongoing"}
                      </Text>
                    </Group>
                  )}

                  {/* Features list */}
                  <Stack gap="xs">
                    <Group gap="xs">
                      <IconShieldCheck size={16} color="#22c55e" />
                      <Text size="sm">Fraud-proof NFT technology</Text>
                    </Group>
                    <Group gap="xs">
                      <IconQrcode size={16} color="#3b82f6" />
                      <Text size="sm">Instant QR code verification</Text>
                    </Group>
                    <Group gap="xs">
                      <IconGift size={16} color="#8b5cf6" />
                      <Text size="sm">Collectible memorabilia</Text>
                    </Group>
                  </Stack>
                </Stack>
              </Card>
            </Grid.Col>

            {/* Purchase Form */}
            <Grid.Col span={{ base: 12, md: 7 }}>
              <Card
                shadow="xl"
                padding="xl"
                radius="xl"
                style={{
                  background: "rgba(255, 255, 255, 0.95)",
                  backdropFilter: "blur(20px)",
                  border: "1px solid rgba(255, 255, 255, 0.2)",
                  minHeight: "600px",
                }}
              >
                {currentStep === 2 ? (
                  // Success State
                  <Stack align="center" justify="center" h="100%" gap="xl">
                    <ThemeIcon size={120} radius="xl" color="green">
                      <IconTrophy size={60} />
                    </ThemeIcon>
                    <Title order={1} ta="center" c="green">
                      🎉 Purchase Complete!
                    </Title>
                    <Text size="xl" ta="center" c="dimmed">
                      Your NFT tickets have been successfully minted and added
                      to your wallet!
                    </Text>
                    <Group gap="lg">
                      <Button
                        size="lg"
                        leftSection={<IconWallet size={20} />}
                        onClick={() => navigate("/my-tickets")}
                        variant="light"
                        color="green"
                        radius="xl"
                      >
                        View My NFTs
                      </Button>
                      <Button
                        size="lg"
                        leftSection={<IconArrowLeft size={20} />}
                        onClick={() => navigate(`/events/${eventId}`)}
                        radius="xl"
                      >
                        Back to Event
                      </Button>
                    </Group>
                  </Stack>
                ) : !reservationTime ? (
                  // Initial Purchase Form
                  <form onSubmit={form.onSubmit(handleReserveTickets)}>
                    <Stack gap="xl">
                      <Group justify="space-between" align="flex-start">
                        <Stack gap="xs">
                          <Title order={1} fw={700}>
                            🎫 Reserve Your Tickets
                          </Title>
                          <Text size="lg" c="dimmed">
                            Secure your spot with blockchain technology
                          </Text>
                        </Stack>
                        <Badge
                          size="xl"
                          color={isAvailable ? "green" : "red"}
                          variant="gradient"
                          gradient={
                            isAvailable
                              ? { from: "green", to: "teal", deg: 45 }
                              : { from: "red", to: "pink", deg: 45 }
                          }
                          leftSection={<IconSparkles size={16} />}
                          style={{ padding: "12px 20px" }}
                        >
                          {isAvailable ? "✨ AVAILABLE" : "❌ UNAVAILABLE"}
                        </Badge>
                      </Group>

                      <Paper
                        p="xl"
                        radius="xl"
                        style={{ background: "rgba(59, 130, 246, 0.05)" }}
                      >
                        <NumberInput
                          label={
                            <Group gap="xs" mb="xs">
                              <IconTicket size={20} color="#3b82f6" />
                              <Text fw={600} size="lg">
                                Select Quantity
                              </Text>
                            </Group>
                          }
                          placeholder="How many tickets?"
                          min={1}
                          max={Math.min(ticketType.availableSupply, 5)}
                          {...form.getInputProps("quantity")}
                          size="xl"
                          radius="xl"
                          styles={{
                            input: {
                              fontSize: "24px",
                              fontWeight: 600,
                              textAlign: "center",
                              border: "2px solid rgba(59, 130, 246, 0.2)",
                            },
                          }}
                        />
                      </Paper>

                      <Card
                        p="xl"
                        radius="xl"
                        style={{
                          background:
                            "linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%)",
                        }}
                      >
                        <Group justify="space-between" align="center">
                          <Stack gap="xs">
                            <Text size="md" c="dimmed">
                              Total Amount
                            </Text>
                            <Text
                              size="48px"
                              fw={900}
                              c="blue"
                              style={{ lineHeight: 1 }}
                            >
                              ${totalPrice.toFixed(2)}
                            </Text>
                          </Stack>
                          <ThemeIcon
                            size={80}
                            radius="xl"
                            color="blue"
                            variant="light"
                          >
                            <IconBolt size={40} />
                          </ThemeIcon>
                        </Group>
                      </Card>

                      {!isConnected ? (
                        <Paper
                          p="xl"
                          radius="xl"
                          style={{
                            background: "rgba(245, 158, 11, 0.1)",
                            border: "2px dashed rgba(245, 158, 11, 0.3)",
                          }}
                        >
                          <Stack align="center" gap="lg">
                            <ThemeIcon size={60} radius="xl" color="orange">
                              <IconWallet size={30} />
                            </ThemeIcon>
                            <Text size="lg" fw={600} ta="center">
                              Connect your wallet to continue
                            </Text>
                            <WalletButton />
                          </Stack>
                        </Paper>
                      ) : (
                        <Button
                          type="submit"
                          fullWidth
                          size="xl"
                          leftSection={<IconRocket size={24} />}
                          rightSection={<IconChevronRight size={20} />}
                          loading={isProcessing}
                          disabled={!form.isValid() || !isAvailable}
                          radius="xl"
                          style={{
                            background:
                              "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                            border: "none",
                            fontSize: "18px",
                            fontWeight: 700,
                            padding: "20px",
                            boxShadow: "0 8px 32px rgba(102, 126, 234, 0.4)",
                            transition: "all 0.3s ease",
                          }}
                        >
                          🚀 Reserve Tickets (15 min hold)
                        </Button>
                      )}

                      {/* Trust indicators */}
                      <Group justify="center" gap="xl">
                        <Tooltip label="Blockchain Secured">
                          <Group gap="xs">
                            <IconShieldCheck size={16} color="#22c55e" />
                            <Text size="xs" c="dimmed">
                              Secured
                            </Text>
                          </Group>
                        </Tooltip>
                        <Tooltip label="Instant Verification">
                          <Group gap="xs">
                            <IconBolt size={16} color="#eab308" />
                            <Text size="xs" c="dimmed">
                              Instant
                            </Text>
                          </Group>
                        </Tooltip>
                        <Tooltip label="NFT Technology">
                          <Group gap="xs">
                            <IconStar size={16} color="#8b5cf6" />
                            <Text size="xs" c="dimmed">
                              NFT Powered
                            </Text>
                          </Group>
                        </Tooltip>
                      </Group>
                    </Stack>
                  </form>
                ) : (
                  // Payment Form
                  <Stack gap="xl">
                    <Group justify="space-between" align="flex-start">
                      <Stack gap="xs">
                        <Title order={1} fw={700} c="green">
                          💳 Complete Purchase
                        </Title>
                        <Text size="lg" c="dimmed">
                          Your tickets are reserved. Complete payment to mint
                          your NFTs!
                        </Text>
                      </Stack>
                    </Group>

                    <Paper
                      p="xl"
                      radius="xl"
                      style={{ background: "rgba(34, 197, 94, 0.1)" }}
                    >
                      <Timeline active={1} bulletSize={24} lineWidth={2}>
                        <Timeline.Item
                          bullet={<IconCheck size={12} />}
                          title="Tickets Reserved"
                        >
                          <Text c="dimmed" size="sm">
                            {form.values.quantity} × {ticketType.name}
                          </Text>
                        </Timeline.Item>
                        <Timeline.Item
                          bullet={<IconCreditCard size={12} />}
                          title="Payment Processing"
                        >
                          <Text c="dimmed" size="sm">
                            Complete your purchase to mint NFT tickets
                          </Text>
                        </Timeline.Item>
                        <Timeline.Item
                          bullet={<IconGift size={12} />}
                          title="NFT Minting"
                        >
                          <Text c="dimmed" size="sm">
                            Your tickets will be added to your wallet
                          </Text>
                        </Timeline.Item>
                      </Timeline>
                    </Paper>

                    <Card
                      p="xl"
                      radius="xl"
                      style={{
                        background:
                          "linear-gradient(135deg, rgba(34, 197, 94, 0.1) 0%, rgba(16, 185, 129, 0.1) 100%)",
                      }}
                    >
                      <Group justify="space-between" align="center">
                        <Stack gap="xs">
                          <Text size="md" c="dimmed">
                            Final Amount
                          </Text>
                          <Text
                            size="48px"
                            fw={900}
                            c="green"
                            style={{ lineHeight: 1 }}
                          >
                            ${totalPrice.toFixed(2)}
                          </Text>
                        </Stack>
                        <ThemeIcon
                          size={80}
                          radius="xl"
                          color="green"
                          variant="light"
                        >
                          <IconStar size={40} />
                        </ThemeIcon>
                      </Group>
                    </Card>

                    <Button
                      fullWidth
                      size="xl"
                      leftSection={<IconCreditCard size={24} />}
                      rightSection={<IconHeart size={20} />}
                      loading={isProcessing}
                      onClick={handleCompletePurchase}
                      radius="xl"
                      style={{
                        background:
                          "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)",
                        border: "none",
                        fontSize: "18px",
                        fontWeight: 700,
                        padding: "20px",
                        boxShadow: "0 8px 32px rgba(34, 197, 94, 0.4)",
                        transition: "all 0.3s ease",
                      }}
                    >
                      {isProcessing
                        ? "🔄 Processing Payment..."
                        : `💫 Pay ${totalPrice.toFixed(2)} SUI & Mint NFTs`}
                    </Button>
                  </Stack>
                )}
              </Card>
            </Grid.Col>
          </Grid>
        </Stack>
      </Container>

      <style>
        {`
          @keyframes float {
            0%, 100% { transform: translateY(0px) rotate(0deg); }
            50% { transform: translateY(-30px) rotate(180deg); }
          }
          @keyframes confetti {
            0% { transform: translateY(-100vh) rotate(0deg); opacity: 1; }
            100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
          }
          @keyframes pulse {
            0%, 100% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.8; transform: scale(1.05); }
          }
          
          .mantine-Button-root:hover {
            transform: translateY(-2px);
            box-shadow: 0 12px 40px rgba(0,0,0,0.2) !important;
          }
          
          .mantine-Card-root {
            transition: all 0.3s ease;
          }
          
          .mantine-Card-root:hover {
            transform: translateY(-2px);
          }
        `}
      </style>
    </Box>
  );
};
