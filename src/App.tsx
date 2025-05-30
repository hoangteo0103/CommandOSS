import React from "react";
import { Routes, Route } from "react-router-dom";
import { AppShell, Header, Title, Group, Button } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { ConnectButton } from "@mysten/dapp-kit";

import { HomePage } from "./pages/HomePage";
import { EventPage } from "./pages/EventPage";
import { MyTicketsPage } from "./pages/MyTicketsPage";
import { useWallet } from "./hooks/useWallet";

function App() {
  const { isConnected, address } = useWallet();

  return (
    <AppShell header={{ height: 70 }} padding="md">
      <Header p="md">
        <Group justify="space-between">
          <Title order={2} c="blue">
            🎫 Ticket System
          </Title>

          <Group>
            <Button component="a" href="/" variant="subtle">
              Events
            </Button>

            {isConnected && (
              <Button component="a" href="/my-tickets" variant="subtle">
                My Tickets
              </Button>
            )}

            <ConnectButton />
          </Group>
        </Group>
      </Header>

      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/events/:id" element={<EventPage />} />
        <Route path="/my-tickets" element={<MyTicketsPage />} />
      </Routes>
    </AppShell>
  );
}

export default App;
