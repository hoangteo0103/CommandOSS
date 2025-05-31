import { useState, useRef, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Box,
  Container,
  Paper,
  Title,
  Text,
  TextInput,
  Button,
  Group,
  Stack,
  Card,
  Badge,
  Alert,
  ActionIcon,
  Divider,
  ThemeIcon,
  Timeline,
  Modal,
  SimpleGrid,
  Center,
} from "@mantine/core";
import {
  IconTicket,
  IconCheck,
  IconX,
  IconAlertCircle,
  IconArrowLeft,
  IconUser,
  IconClock,
  IconShieldCheck,
  IconSearch,
  IconQrcode,
  IconCamera,
  IconCertificate,
} from "@tabler/icons-react";
import { notifications } from "@mantine/notifications";
import { useMutation, useQuery } from "@tanstack/react-query";
import { eventsApi } from "../services/api";
import { useWallet } from "../hooks/useWallet";
import QrScanner from "qr-scanner";

interface TicketInfo {
  id: string;
  eventId?: string;
  ticketType?: string;
  owner?: string;
  used?: boolean;
  mintedAt?: string;
  eventName?: string;
  attendeeName?: string;
}

interface CheckInResult {
  success: boolean;
  ticket: TicketInfo;
  message: string;
  timestamp: string;
}

export const CheckInPage = () => {
  const navigate = useNavigate();
  const { eventId } = useParams();
  const { isConnected } = useWallet();
  const [ticketId, setTicketId] = useState("");
  const [checkInHistory, setCheckInHistory] = useState<CheckInResult[]>([]);
  const [currentTicket, setCurrentTicket] = useState<TicketInfo | null>(null);
  const [qrScannerOpen, setQrScannerOpen] = useState(false);
  const [scannedQrInfo, setScannedQrInfo] = useState<any>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const qrScannerRef = useRef<QrScanner | null>(null);

  const { data: event, isLoading: eventLoading } = useQuery({
    queryKey: ["event", eventId],
    queryFn: () => eventsApi.getEvent(eventId!),
    enabled: !!eventId,
  });

  const checkInMutation = useMutation({
    mutationFn: (ticketId: string) => eventsApi.checkInTicket(ticketId),
    onSuccess: (result) => {
      const checkInResult: CheckInResult = {
        success: true,
        ticket: result.ticket,
        message: "Ticket successfully checked in!",
        timestamp: new Date().toISOString(),
      };
      setCheckInHistory([checkInResult, ...checkInHistory]);
      setCurrentTicket(result.ticket);
      setTicketId("");
      setScannedQrInfo(null);
      notifications.show({
        title: "✅ Check-in Successful!",
        message: `Welcome to ${event?.data?.name || "the event"}!`,
        color: "green",
        icon: <IconCheck size={16} />,
      });
    },
    onError: (error: any) => {
      const checkInResult: CheckInResult = {
        success: false,
        ticket: {
          id: ticketId || "Unknown",
          eventId: eventId || "Unknown",
          ticketType: "Unknown",
          owner: "Unknown",
          used: false,
          mintedAt: new Date().toISOString(),
        },
        message: error.message || "Check-in failed",
        timestamp: new Date().toISOString(),
      };
      setCheckInHistory([checkInResult, ...checkInHistory]);
      notifications.show({
        title: "❌ Check-in Failed",
        message: error.message || "Invalid or already used ticket",
        color: "red",
        icon: <IconX size={16} />,
      });
    },
  });

  const verifyTicketMutation = useMutation({
    mutationFn: (ticketId: string) => eventsApi.getTicketInfo(ticketId),
    onSuccess: (ticketInfo) => {
      setCurrentTicket(ticketInfo);
    },
    onError: (error: any) => {
      notifications.show({
        title: "Ticket Verification Failed",
        message: error.message || "Could not verify ticket",
        color: "orange",
        icon: <IconAlertCircle size={16} />,
      });
    },
  });

  const startQrScanner = async () => {
    setQrScannerOpen(true);
    // Wait for modal to fully open before starting camera
    setTimeout(async () => {
      try {
        if (videoRef.current) {
          // Check for camera permissions first
          const stream = await navigator.mediaDevices.getUserMedia({
            video: true,
          });
          stream.getTracks().forEach((track) => track.stop()); // Stop the test stream

          qrScannerRef.current = new QrScanner(
            videoRef.current,
            (result) => {
              console.log("QR Code detected:", result);

              let ticketId = result.data;

              // Check if the QR data is our blockchain JSON format
              try {
                const qrData = JSON.parse(result.data);
                if (qrData.type === "SUI_NFT_TICKET" && qrData.nftId) {
                  ticketId = qrData.nftId;
                  setScannedQrInfo(qrData);
                  console.log(
                    "Blockchain QR detected, extracted NFT ID:",
                    ticketId
                  );

                  notifications.show({
                    title: "🔗 Blockchain QR Scanned!",
                    message: `Sui NFT Ticket detected for ${
                      qrData.eventName || "event"
                    }`,
                    color: "blue",
                    autoClose: 3000,
                  });
                } else {
                  setScannedQrInfo(null);
                }
              } catch (error) {
                // If it's not JSON, treat as regular ticket ID
                setScannedQrInfo(null);
                console.log("Regular ticket ID scanned:", ticketId);
              }

              setTicketId(ticketId);
              stopQrScanner();

              // Auto-verify the scanned ticket
              verifyTicketMutation.mutate(ticketId);

              notifications.show({
                title: "✅ QR Code Processed!",
                message: "Ticket ID captured and verifying...",
                color: "green",
                autoClose: 2000,
              });
            },
            {
              highlightScanRegion: true,
              highlightCodeOutline: true,
              preferredCamera: "environment", // Use back camera on mobile
            }
          );

          await qrScannerRef.current.start();
          console.log("QR Scanner started successfully");
        }
      } catch (error: any) {
        console.error("QR Scanner error:", error);

        let errorMessage = "Could not access camera for QR scanning";
        if (error?.name === "NotAllowedError") {
          errorMessage =
            "Camera permission denied. Please allow camera access and try again.";
        } else if (error?.name === "NotFoundError") {
          errorMessage = "No camera found on this device.";
        } else if (error?.name === "NotSupportedError") {
          errorMessage = "Camera not supported in this browser.";
        }

        notifications.show({
          title: "Camera Error",
          message: errorMessage,
          color: "red",
          autoClose: 5000,
        });
        setQrScannerOpen(false);
      }
    }, 300); // Give modal time to render
  };

  const stopQrScanner = () => {
    if (qrScannerRef.current) {
      try {
        qrScannerRef.current.stop();
        qrScannerRef.current.destroy();
        qrScannerRef.current = null;
      } catch (error) {
        console.error("Error stopping QR scanner:", error);
      }
    }
    setQrScannerOpen(false);
  };

  const handleCheckIn = () => {
    if (!ticketId.trim()) {
      notifications.show({
        title: "Invalid Input",
        message: "Please enter a valid ticket ID",
        color: "orange",
      });
      return;
    }
    checkInMutation.mutate(ticketId.trim());
  };

  const handleVerifyTicket = () => {
    if (!ticketId.trim()) {
      notifications.show({
        title: "Invalid Input",
        message: "Please enter a valid ticket ID",
        color: "orange",
      });
      return;
    }
    verifyTicketMutation.mutate(ticketId.trim());
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === "Enter") {
      handleCheckIn();
    }
  };

  const successfulCheckIns = checkInHistory.filter((h) => h.success).length;
  const totalAttempts = checkInHistory.length;

  // Cleanup QR scanner on unmount
  useEffect(() => {
    return () => {
      if (qrScannerRef.current) {
        qrScannerRef.current.stop();
        qrScannerRef.current.destroy();
      }
    };
  }, []);

  if (!isConnected) {
    return (
      <Box
        style={{
          background:
            "linear-gradient(180deg, rgba(59, 130, 246, 0.02) 0%, rgba(139, 92, 246, 0.02) 100%)",
          minHeight: "100vh",
          width: "100%",
          paddingTop: "110px",
        }}
      >
        <Container size="lg">
          <Alert
            icon={<IconAlertCircle size={20} />}
            color="orange"
            radius="xl"
            style={{
              background: "rgba(251, 146, 60, 0.1)",
              border: "1px solid rgba(251, 146, 60, 0.2)",
              padding: "20px",
              fontSize: "1.1rem",
            }}
          >
            Please connect your wallet to access the check-in system
          </Alert>
        </Container>
      </Box>
    );
  }

  return (
    <Box
      style={{
        background:
          "linear-gradient(180deg, rgba(59, 130, 246, 0.02) 0%, rgba(139, 92, 246, 0.02) 100%)",
        minHeight: "100vh",
        width: "100%",
        paddingTop: "110px",
        paddingBottom: "2rem",
      }}
    >
      <Container size="xl">
        {/* Header */}
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
                onClick={() => navigate(eventId ? `/events/${eventId}` : "/")}
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
                      "linear-gradient(135deg, #3b82f6 0%, #22c55e 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    fontWeight: 900,
                  }}
                >
                  Event Check-In
                </Title>
                <Text c="dimmed" size="lg" fw={500}>
                  {eventLoading
                    ? "Loading event details..."
                    : event?.data?.name ||
                      "Verify NFT tickets and check in attendees"}
                </Text>
              </Box>
            </Group>

            <Group>
              <Badge
                leftSection={<IconShieldCheck size={16} />}
                variant="gradient"
                gradient={{ from: "green", to: "teal", deg: 45 }}
                size="xl"
                styles={{
                  root: {
                    paddingLeft: "16px",
                    paddingRight: "24px",
                    paddingTop: "12px",
                    paddingBottom: "12px",
                  },
                  label: {
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    paddingBottom: "2px",
                  },
                }}
              >
                SECURE CHECK-IN
              </Badge>
              {totalAttempts > 0 && (
                <Badge
                  variant="light"
                  color="blue"
                  size="lg"
                  styles={{
                    root: {
                      paddingLeft: "12px",
                      paddingRight: "16px",
                      paddingTop: "8px",
                      paddingBottom: "8px",
                    },
                    label: {
                      paddingBottom: "2px",
                    },
                  }}
                >
                  {successfulCheckIns}/{totalAttempts} Success
                </Badge>
              )}
            </Group>
          </Group>

          {/* Quick Stats */}
          {event?.data && (
            <Card
              padding="lg"
              radius="xl"
              style={{
                background: "rgba(59, 130, 246, 0.05)",
                border: "1px solid rgba(59, 130, 246, 0.1)",
              }}
            >
              <Group justify="space-around">
                <Box ta="center">
                  <Text
                    size="2rem"
                    fw={900}
                    style={{
                      background:
                        "linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                    }}
                  >
                    {event.data.totalTickets}
                  </Text>
                  <Text size="sm" c="dimmed" fw={500} tt="uppercase">
                    Total Tickets
                  </Text>
                </Box>
                <Box ta="center">
                  <Text
                    size="2rem"
                    fw={900}
                    style={{
                      background:
                        "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                    }}
                  >
                    {successfulCheckIns}
                  </Text>
                  <Text size="sm" c="dimmed" fw={500} tt="uppercase">
                    Checked In
                  </Text>
                </Box>
                <Box ta="center">
                  <Text
                    size="2rem"
                    fw={900}
                    style={{
                      background:
                        "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                    }}
                  >
                    {Math.round(
                      (successfulCheckIns / (event.data.totalTickets || 1)) *
                        100
                    )}
                    %
                  </Text>
                  <Text size="sm" c="dimmed" fw={500} tt="uppercase">
                    Attendance
                  </Text>
                </Box>
              </Group>
            </Card>
          )}
        </Paper>

        <Group align="flex-start" gap="xl">
          {/* Check-in Interface */}
          <Box flex={1}>
            <Paper
              shadow="xl"
              radius="xl"
              p="xl"
              style={{
                background: "rgba(255, 255, 255, 0.95)",
                backdropFilter: "blur(20px)",
                border: "1px solid rgba(59, 130, 246, 0.2)",
              }}
            >
              <Stack gap="lg">
                <Group justify="space-between">
                  <Box>
                    <Title order={2} fw={700} mb="xs">
                      Scan or Enter Ticket
                    </Title>
                    <Text c="dimmed" size="md">
                      Enter the NFT object ID or scan QR code
                    </Text>
                  </Box>
                  <ThemeIcon
                    size="xl"
                    radius="xl"
                    variant="gradient"
                    gradient={{ from: "blue", to: "cyan", deg: 45 }}
                  >
                    <IconQrcode size={28} />
                  </ThemeIcon>
                </Group>

                <Group gap="sm">
                  <Box flex={1}>
                    <TextInput
                      placeholder="Enter ticket ID (e.g., 0x123...)"
                      value={ticketId}
                      onChange={(e) => {
                        setTicketId(e.currentTarget.value);
                        setScannedQrInfo(null); // Clear QR info when manually typing
                      }}
                      onKeyPress={handleKeyPress}
                      leftSection={<IconTicket size={20} />}
                      size="xl"
                      radius="xl"
                      styles={{
                        input: {
                          border: "2px solid rgba(59, 130, 246, 0.2)",
                          background: "rgba(255, 255, 255, 0.9)",
                          fontSize: "1.1rem",
                          paddingLeft: "50px", // Account for icon
                          paddingRight: "20px",
                          paddingTop: "16px",
                          paddingBottom: "16px",
                          height: "auto",
                        },
                      }}
                    />
                  </Box>
                  <Button
                    leftSection={<IconCamera size={20} />}
                    onClick={startQrScanner}
                    size="xl"
                    radius="xl"
                    variant="outline"
                    style={{
                      fontWeight: 600,
                      paddingLeft: "20px",
                      paddingRight: "20px",
                      paddingTop: "16px",
                      paddingBottom: "16px",
                      height: "auto",
                    }}
                  >
                    Scan QR
                  </Button>
                </Group>

                <Group>
                  <Button
                    leftSection={<IconCheck size={20} />}
                    onClick={handleCheckIn}
                    loading={checkInMutation.isPending}
                    disabled={!ticketId.trim()}
                    size="xl"
                    radius="xl"
                    variant="gradient"
                    gradient={{ from: "green", to: "teal", deg: 45 }}
                    style={{
                      flex: 1,
                      fontWeight: 600,
                      paddingLeft: "32px",
                      paddingRight: "32px",
                      paddingTop: "16px",
                      paddingBottom: "16px",
                    }}
                  >
                    {checkInMutation.isPending ? "Checking In..." : "Check In"}
                  </Button>

                  <Button
                    leftSection={<IconSearch size={20} />}
                    onClick={handleVerifyTicket}
                    loading={verifyTicketMutation.isPending}
                    disabled={!ticketId.trim()}
                    size="xl"
                    radius="xl"
                    variant="outline"
                    style={{
                      fontWeight: 600,
                      paddingLeft: "32px",
                      paddingRight: "32px",
                      paddingTop: "16px",
                      paddingBottom: "16px",
                    }}
                  >
                    Verify Only
                  </Button>
                </Group>

                {/* Scanned Blockchain QR Info */}
                {scannedQrInfo && (
                  <>
                    <Divider my="md" />
                    <Card
                      padding="lg"
                      radius="xl"
                      style={{
                        background: "rgba(59, 130, 246, 0.05)",
                        border: "2px solid rgba(59, 130, 246, 0.2)",
                      }}
                    >
                      <Group justify="space-between" mb="md">
                        <Group gap="xs">
                          <IconShieldCheck size={20} color="#3b82f6" />
                          <Text fw={600} c="#3b82f6">
                            Blockchain QR Detected
                          </Text>
                        </Group>
                        <Badge
                          variant="gradient"
                          gradient={{ from: "blue", to: "cyan", deg: 45 }}
                          leftSection={<IconCertificate size={12} />}
                        >
                          Sui Network
                        </Badge>
                      </Group>

                      <SimpleGrid cols={2} spacing="sm">
                        <Box>
                          <Text size="xs" c="dimmed" tt="uppercase" fw={500}>
                            Event
                          </Text>
                          <Text size="sm" fw={500}>
                            {scannedQrInfo.eventName}
                          </Text>
                        </Box>
                        <Box>
                          <Text size="xs" c="dimmed" tt="uppercase" fw={500}>
                            Ticket Type
                          </Text>
                          <Text size="sm" fw={500}>
                            {scannedQrInfo.ticketType || "Standard"}
                          </Text>
                        </Box>
                        <Box>
                          <Text size="xs" c="dimmed" tt="uppercase" fw={500}>
                            Status
                          </Text>
                          <Badge
                            size="sm"
                            color={scannedQrInfo.isUsed ? "red" : "green"}
                            variant="light"
                          >
                            {scannedQrInfo.isUsed ? "Already Used" : "Valid"}
                          </Badge>
                        </Box>
                        <Box>
                          <Text size="xs" c="dimmed" tt="uppercase" fw={500}>
                            Network
                          </Text>
                          <Text size="sm" fw={500} tt="capitalize">
                            {scannedQrInfo.network}
                          </Text>
                        </Box>
                      </SimpleGrid>

                      <Group
                        justify="space-between"
                        mt="md"
                        pt="md"
                        style={{
                          borderTop: "1px solid rgba(59, 130, 246, 0.1)",
                        }}
                      >
                        <Text size="xs" c="dimmed" ff="monospace">
                          NFT: {scannedQrInfo.nftId?.slice(0, 12)}...
                          {scannedQrInfo.nftId?.slice(-8)}
                        </Text>
                        <Text size="xs" c="dimmed">
                          Minted:{" "}
                          {scannedQrInfo.mintedAt
                            ? new Date(
                                scannedQrInfo.mintedAt
                              ).toLocaleDateString()
                            : "N/A"}
                        </Text>
                      </Group>
                    </Card>
                  </>
                )}

                {/* Current Ticket Display */}
                {currentTicket && (
                  <>
                    <Divider my="md" />
                    <Card
                      padding="lg"
                      radius="xl"
                      style={{
                        background:
                          currentTicket.used ?? false
                            ? "rgba(239, 68, 68, 0.05)"
                            : "rgba(34, 197, 94, 0.05)",
                        border: `2px solid ${
                          currentTicket.used ?? false
                            ? "rgba(239, 68, 68, 0.2)"
                            : "rgba(34, 197, 94, 0.2)"
                        }`,
                      }}
                    >
                      <Group justify="space-between" mb="md">
                        <Title order={3} fw={600}>
                          Ticket Details
                        </Title>
                        <Badge
                          color={currentTicket.used ?? false ? "red" : "green"}
                          variant="light"
                          size="lg"
                          leftSection={
                            currentTicket.used ?? false ? (
                              <IconX size={16} />
                            ) : (
                              <IconCheck size={16} />
                            )
                          }
                          styles={{
                            root: {
                              paddingLeft: "12px",
                              paddingRight: "16px",
                              paddingTop: "8px",
                              paddingBottom: "8px",
                            },
                            label: {
                              display: "flex",
                              alignItems: "center",
                              gap: "6px",
                              paddingBottom: "2px",
                            },
                          }}
                        >
                          {currentTicket.used ?? false
                            ? "Already Used"
                            : "Valid"}
                        </Badge>
                      </Group>

                      <Stack gap="sm">
                        <Group>
                          <IconTicket size={18} color="#6b7280" />
                          <Text size="sm" c="dimmed">
                            Ticket ID:
                          </Text>
                          <Text
                            size="sm"
                            fw={500}
                            style={{ fontFamily: "monospace" }}
                          >
                            {currentTicket.id?.slice(0, 20) || "N/A"}...
                          </Text>
                        </Group>
                        <Group>
                          <IconUser size={18} color="#6b7280" />
                          <Text size="sm" c="dimmed">
                            Owner:
                          </Text>
                          <Text
                            size="sm"
                            fw={500}
                            style={{ fontFamily: "monospace" }}
                          >
                            {currentTicket.owner?.slice(0, 20) || "N/A"}...
                          </Text>
                        </Group>
                        <Group>
                          <IconClock size={18} color="#6b7280" />
                          <Text size="sm" c="dimmed">
                            Minted:
                          </Text>
                          <Text size="sm" fw={500}>
                            {currentTicket.mintedAt
                              ? new Date(
                                  currentTicket.mintedAt
                                ).toLocaleString()
                              : "N/A"}
                          </Text>
                        </Group>
                      </Stack>
                    </Card>
                  </>
                )}
              </Stack>
            </Paper>
          </Box>

          {/* Check-in History */}
          <Box w={400}>
            <Paper
              shadow="xl"
              radius="xl"
              p="xl"
              style={{
                background: "rgba(255, 255, 255, 0.95)",
                backdropFilter: "blur(20px)",
                border: "1px solid rgba(59, 130, 246, 0.2)",
                maxHeight: "600px",
                overflow: "auto",
              }}
            >
              <Title order={2} fw={700} mb="lg">
                Recent Check-ins
              </Title>

              {checkInHistory.length === 0 ? (
                <Center py="xl">
                  <Stack align="center" gap="md">
                    <ThemeIcon
                      size="xl"
                      radius="xl"
                      variant="light"
                      color="gray"
                    >
                      <IconClock size={32} />
                    </ThemeIcon>
                    <Text c="dimmed" ta="center">
                      No check-ins yet
                      <br />
                      Start scanning tickets!
                    </Text>
                  </Stack>
                </Center>
              ) : (
                <Timeline bulletSize={24} lineWidth={2}>
                  {checkInHistory.map((checkIn, index) => (
                    <Timeline.Item
                      key={index}
                      bullet={
                        checkIn.success ? (
                          <IconCheck size={16} />
                        ) : (
                          <IconX size={16} />
                        )
                      }
                      color={checkIn.success ? "green" : "red"}
                    >
                      <Card
                        padding="md"
                        radius="lg"
                        style={{
                          background: checkIn.success
                            ? "rgba(34, 197, 94, 0.05)"
                            : "rgba(239, 68, 68, 0.05)",
                          border: `1px solid ${
                            checkIn.success
                              ? "rgba(34, 197, 94, 0.2)"
                              : "rgba(239, 68, 68, 0.2)"
                          }`,
                        }}
                      >
                        <Text size="sm" fw={500} mb="xs">
                          {checkIn.message}
                        </Text>
                        <Text
                          size="xs"
                          c="dimmed"
                          style={{ fontFamily: "monospace" }}
                        >
                          {checkIn.ticket.id?.slice(0, 20) || "N/A"}...
                        </Text>
                        <Text size="xs" c="dimmed">
                          {new Date(checkIn.timestamp).toLocaleTimeString()}
                        </Text>
                      </Card>
                    </Timeline.Item>
                  ))}
                </Timeline>
              )}
            </Paper>
          </Box>
        </Group>

        {/* QR Scanner Modal */}
        <Modal
          opened={qrScannerOpen}
          onClose={stopQrScanner}
          title="Scan QR Code"
          size="lg"
          centered
          styles={{
            header: {
              background: "linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)",
              color: "white",
            },
            title: {
              color: "white",
              fontWeight: 700,
              fontSize: "1.2rem",
            },
          }}
        >
          <Stack gap="lg">
            <Box
              style={{
                position: "relative",
                width: "100%",
                height: "400px",
                borderRadius: "12px",
                overflow: "hidden",
                background: "#000",
              }}
            >
              <video
                ref={videoRef}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }}
              />
            </Box>
            <Text ta="center" c="dimmed">
              Position the QR code within the camera view to scan
            </Text>
            <Group justify="center">
              <Button
                variant="outline"
                onClick={stopQrScanner}
                leftSection={<IconX size={18} />}
              >
                Cancel
              </Button>
            </Group>
          </Stack>
        </Modal>
      </Container>
    </Box>
  );
};
