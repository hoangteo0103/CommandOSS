import { Routes, Route } from "react-router-dom";
import { AppShell, Group, Title, Button, Text, Box, Flex } from "@mantine/core";
import {
  IconHome,
  IconWallet,
  IconHexagon3d,
  IconSearch,
} from "@tabler/icons-react";
import { useNavigate, useLocation } from "react-router-dom";
import { WalletButton } from "./components/WalletButton";
import { HomePage } from "./pages/HomePage";
import { EventPage } from "./pages/EventPage";
import { MyTicketsPage } from "./pages/MyTicketsPage";
import { CreateEventPage } from "./pages/CreateEventPage";
import { EditEventPage } from "./pages/EditEventPage";
import { CheckInPage } from "./pages/CheckInPage";
import { TicketPurchasePage } from "./pages/TicketPurchasePage";
import { SearchPage } from "./pages/SearchPage";
import { useWallet } from "./hooks/useWallet";

function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isConnected } = useWallet();

  return (
    <AppShell
      header={{ height: 90 }}
      padding="0"
      styles={{
        header: {
          background:
            "linear-gradient(135deg, rgba(30, 58, 138, 0.1) 0%, rgba(6, 182, 212, 0.1) 100%)",
          backdropFilter: "blur(10px)",
          borderBottom: "1px solid rgba(56, 189, 248, 0.2)",
          width: "100%",
        },
        main: {
          background:
            "linear-gradient(180deg, rgba(15, 23, 42, 0.03) 0%, rgba(30, 41, 59, 0.05) 100%)",
          minHeight: "100vh",
          width: "100%",
          padding: "0",
        },
        root: {
          width: "100%",
        },
      }}
    >
      <AppShell.Header>
        <Box
          style={{
            maxWidth: "1400px",
            margin: "0 auto",
            padding: "0 2rem",
            height: "100%",
            width: "100%",
          }}
        >
          <Flex h="100%" justify="space-between" align="center">
            <Group
              gap="md"
              onClick={() => navigate("/")}
              style={{ cursor: "pointer" }}
            >
              <Box
                style={{
                  background:
                    "linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)",
                  borderRadius: "12px",
                  padding: "12px",
                  boxShadow: "0 8px 32px rgba(59, 130, 246, 0.3)",
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                <IconHexagon3d size={28} color="white" />
                <Box
                  style={{
                    position: "absolute",
                    top: "-50%",
                    left: "-50%",
                    width: "200%",
                    height: "200%",
                    background:
                      "linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.1) 50%, transparent 70%)",
                    animation: "shimmer 3s infinite",
                  }}
                />
              </Box>
              <div>
                <Title
                  order={1}
                  size="h2"
                  style={{
                    background:
                      "linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    fontWeight: 800,
                    letterSpacing: "-0.02em",
                  }}
                >
                  SuiTickets
                </Title>
                <Text
                  size="sm"
                  c="dimmed"
                  fw={500}
                  style={{ letterSpacing: "0.05em" }}
                >
                  Next-Gen NFT Ticketing
                </Text>
              </div>
            </Group>

            <Group gap="sm">
              <Button
                variant={location.pathname === "/" ? "gradient" : "subtle"}
                gradient={{ from: "blue", to: "cyan", deg: 45 }}
                leftSection={<IconHome size={16} />}
                onClick={() => navigate("/")}
                size="md"
                radius="xl"
                style={{
                  transition: "all 0.3s ease",
                  ...(location.pathname !== "/" && {
                    backgroundColor: "rgba(59, 130, 246, 0.1)",
                    border: "1px solid rgba(59, 130, 246, 0.2)",
                  }),
                }}
              >
                Discover
              </Button>

              <Button
                variant={
                  location.pathname === "/search" ? "gradient" : "subtle"
                }
                gradient={{ from: "cyan", to: "teal", deg: 45 }}
                leftSection={<IconSearch size={16} />}
                onClick={() => navigate("/search")}
                size="md"
                radius="xl"
                style={{
                  transition: "all 0.3s ease",
                  ...(location.pathname !== "/search" && {
                    backgroundColor: "rgba(6, 182, 212, 0.1)",
                    border: "1px solid rgba(6, 182, 212, 0.2)",
                  }),
                }}
              >
                Search
              </Button>

              {isConnected && (
                <Button
                  variant={
                    location.pathname === "/my-tickets" ? "gradient" : "subtle"
                  }
                  gradient={{ from: "violet", to: "purple", deg: 45 }}
                  leftSection={<IconWallet size={16} />}
                  onClick={() => navigate("/my-tickets")}
                  size="md"
                  radius="xl"
                  style={{
                    transition: "all 0.3s ease",
                    ...(location.pathname !== "/my-tickets" && {
                      backgroundColor: "rgba(139, 92, 246, 0.1)",
                      border: "1px solid rgba(139, 92, 246, 0.2)",
                    }),
                  }}
                >
                  My NFTs
                </Button>
              )}

              <WalletButton />
            </Group>
          </Flex>
        </Box>
      </AppShell.Header>

      <AppShell.Main style={{ width: "100%", marginTop: "90px" }}>
        <style>
          {`
            @keyframes shimmer {
              0% { transform: translateX(-100%) translateY(-100%) rotate(45deg); }
              100% { transform: translateX(100%) translateY(100%) rotate(45deg); }
            }
            
            @keyframes pulse-glow {
              0%, 100% { box-shadow: 0 0 20px rgba(59, 130, 246, 0.3); }
              50% { box-shadow: 0 0 40px rgba(59, 130, 246, 0.6); }
            }
            
            .futuristic-card {
              background: rgba(255, 255, 255, 0.95);
              backdrop-filter: blur(10px);
              border: 1px solid rgba(59, 130, 246, 0.1);
              transition: all 0.3s ease;
            }
            
            .futuristic-card:hover {
              transform: translateY(-4px);
              box-shadow: 0 20px 40px rgba(59, 130, 246, 0.2);
              border-color: rgba(59, 130, 246, 0.3);
            }
            
            /* Fix badge text padding globally */
            .mantine-Badge-root {
              padding-bottom: 2px !important;
            }
            
            .mantine-Badge-label {
              padding-bottom: 2px !important;
              display: flex;
              align-items: center;
              gap: 6px;
            }
            
            /* Fix for input fields with left sections (icons) */
            .mantine-TextInput-root .mantine-Input-input[data-with-left-section="true"] {
              padding-left: 50px !important;
            }
            
            .mantine-TextInput-root .mantine-Input-input {
              height: auto !important;
              min-height: 48px !important;
            }
            
            /* Button consistency */
            .mantine-Button-root {
              display: flex;
              align-items: center;
              justify-content: center;
              gap: 8px;
            }
            
            /* Ensure full width for all elements */
            html, body, #root {
              width: 100%;
              margin: 0;
              padding: 0;
            }
            
            .mantine-AppShell-root {
              width: 100% !important;
            }
            
            .mantine-AppShell-main {
              width: 100% !important;
              padding: 0 !important;
            }
          `}
        </style>

        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/events/:id" element={<EventPage />} />
          <Route path="/events/:eventId/edit" element={<EditEventPage />} />
          <Route path="/events/:eventId/check-in" element={<CheckInPage />} />
          <Route
            path="/events/:eventId/purchase/:ticketTypeId"
            element={<TicketPurchasePage />}
          />
          <Route path="/my-tickets" element={<MyTicketsPage />} />
          <Route path="/admin/create-event" element={<CreateEventPage />} />
          <Route
            path="*"
            element={
              <Box
                style={{
                  padding: "4rem 2rem",
                  width: "100%",
                  minHeight: "50vh",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Box
                  style={{
                    textAlign: "center",
                    padding: "4rem 2rem",
                    maxWidth: "600px",
                    width: "100%",
                    background:
                      "linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(139, 92, 246, 0.05) 100%)",
                    borderRadius: "24px",
                    border: "1px solid rgba(59, 130, 246, 0.1)",
                  }}
                >
                  <Title
                    order={2}
                    mb="md"
                    style={{
                      background:
                        "linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                    }}
                  >
                    Page Not Found
                  </Title>
                  <Text c="dimmed" mb="lg" size="lg">
                    The page you're looking for doesn't exist in the blockchain.
                  </Text>
                  <Button
                    onClick={() => navigate("/")}
                    gradient={{ from: "blue", to: "cyan", deg: 45 }}
                    size="lg"
                    radius="xl"
                  >
                    Return to Universe
                  </Button>
                </Box>
              </Box>
            }
          />
        </Routes>
      </AppShell.Main>
    </AppShell>
  );
}

export default App;
