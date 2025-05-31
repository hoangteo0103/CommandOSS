import { useState } from "react";
import {
  Modal,
  Button,
  Text,
  Group,
  Stack,
  Card,
  Badge,
  Box,
  Alert,
  Stepper,
  ActionIcon,
  Paper,
} from "@mantine/core";
import {
  IconWallet,
  IconDownload,
  IconCheck,
  IconExternalLink,
  IconAlertCircle,
  IconShield,
  IconBolt,
  IconHexagon3d,
  IconX,
} from "@tabler/icons-react";
import { ConnectButton } from "@mysten/dapp-kit";

interface WalletConnectionModalProps {
  opened: boolean;
  onClose: () => void;
}

export const WalletConnectionModal: React.FC<WalletConnectionModalProps> = ({
  opened,
  onClose,
}) => {
  const [step, setStep] = useState(0);

  const walletSteps = [
    {
      title: "Install Slush Wallet",
      description:
        "Download and install the official Sui wallet by Mysten Labs",
      icon: <IconDownload size={24} />,
    },
    {
      title: "Create or Import Wallet",
      description: "Set up your Sui wallet with social login or seed phrase",
      icon: <IconShield size={24} />,
    },
    {
      title: "Connect to SuiTickets",
      description: "Authorize the connection to start using NFT tickets",
      icon: <IconBolt size={24} />,
    },
  ];

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      size="lg"
      radius="xl"
      padding={0}
      zIndex={1000}
      styles={{
        content: {
          background: "rgba(255, 255, 255, 0.98)",
          backdropFilter: "blur(20px)",
          border: "2px solid rgba(59, 130, 246, 0.3)",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
          zIndex: 1001,
        },
        header: {
          background: "transparent",
          borderBottom: "none",
        },
        overlay: {
          background: "rgba(0, 0, 0, 0.7)",
          backdropFilter: "blur(8px)",
          zIndex: 1000,
        },
      }}
      withCloseButton={false}
    >
      <Box p="xl" style={{ background: "rgba(255, 255, 255, 0.95)" }}>
        {/* Header */}
        <Group justify="space-between" mb="xl">
          <Group>
            <Box
              style={{
                background: "linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)",
                borderRadius: "16px",
                padding: "16px",
                boxShadow: "0 8px 32px rgba(59, 130, 246, 0.3)",
              }}
            >
              <IconHexagon3d size={32} color="white" />
            </Box>
            <Box>
              <Text
                size="xl"
                fw={700}
                style={{
                  background:
                    "linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                Connect Your Wallet
              </Text>
              <Text c="dimmed" size="md">
                Access the future of event ticketing
              </Text>
            </Box>
          </Group>
          <ActionIcon
            variant="light"
            size="lg"
            radius="xl"
            onClick={onClose}
            style={{
              background: "rgba(107, 114, 128, 0.1)",
              border: "1px solid rgba(107, 114, 128, 0.2)",
            }}
          >
            <IconX size={20} />
          </ActionIcon>
        </Group>

        <Stack gap="md">
          <Text fw={600} mb="xs">
            Why Connect Your Wallet?
          </Text>
          <Group grow>
            <Card
              radius="xl"
              p="md"
              style={{
                background: "rgba(59, 130, 246, 0.08)",
                border: "1px solid rgba(59, 130, 246, 0.2)",
              }}
            >
              <Group>
                <IconWallet size={20} color="#3b82f6" />
                <Box>
                  <Text size="sm" fw={500}>
                    Buy NFT Tickets
                  </Text>
                  <Text size="xs" c="dimmed">
                    Purchase event tickets as NFTs
                  </Text>
                </Box>
              </Group>
            </Card>

            <Card
              radius="xl"
              p="md"
              style={{
                background: "rgba(34, 197, 94, 0.08)",
                border: "1px solid rgba(34, 197, 94, 0.2)",
              }}
            >
              <Group>
                <IconCheck size={20} color="#22c55e" />
                <Box>
                  <Text size="sm" fw={500}>
                    True Ownership
                  </Text>
                  <Text size="xs" c="dimmed">
                    Own your tickets forever
                  </Text>
                </Box>
              </Group>
            </Card>

            <Card
              radius="xl"
              p="md"
              style={{
                background: "rgba(139, 92, 246, 0.08)",
                border: "1px solid rgba(139, 92, 246, 0.2)",
              }}
            >
              <Group>
                <IconBolt size={20} color="#8b5cf6" />
                <Box>
                  <Text size="sm" fw={500}>
                    Create Events
                  </Text>
                  <Text size="xs" c="dimmed">
                    Launch your own events
                  </Text>
                </Box>
              </Group>
            </Card>
          </Group>
        </Stack>

        {/* Wallet Guide */}
        <Card
          shadow="lg"
          radius="xl"
          p="xl"
          mb="xl"
          style={{
            background: "rgba(255, 255, 255, 0.95)",
            backdropFilter: "blur(10px)",
            border: "1px solid rgba(59, 130, 246, 0.2)",
          }}
        >
          <Group justify="space-between" mb="lg">
            <Box>
              <Text size="lg" fw={600} mb="xs">
                Recommended: Slush Wallet
              </Text>
              <Text c="dimmed">The official Sui wallet by Mysten Labs</Text>
            </Box>
            <Badge
              variant="gradient"
              gradient={{ from: "blue", to: "cyan", deg: 45 }}
              size="lg"
              leftSection={<IconCheck size={16} />}
            >
              OFFICIAL
            </Badge>
          </Group>

          <Stepper
            active={step}
            onStepClick={setStep}
            size="sm"
            radius="xl"
            styles={{
              step: {
                "&[data-completed]": {
                  background:
                    "linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)",
                },
                "&[data-progress]": {
                  background:
                    "linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)",
                },
              },
            }}
          >
            {walletSteps.map((stepData, index) => (
              <Stepper.Step
                key={index}
                label={stepData.title}
                description={stepData.description}
                icon={stepData.icon}
              />
            ))}
          </Stepper>

          {step === 0 && (
            <Paper
              p="lg"
              radius="xl"
              mt="lg"
              style={{ background: "rgba(59, 130, 246, 0.05)" }}
            >
              <Group>
                <Box
                  style={{
                    background:
                      "linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)",
                    borderRadius: "12px",
                    padding: "12px",
                    width: "48px",
                    height: "48px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text size="lg" fw={700} c="white">
                    S
                  </Text>
                </Box>
                <Box style={{ flex: 1 }}>
                  <Text fw={600} mb="xs">
                    Install Slush Browser Extension
                  </Text>
                  <Text size="sm" c="dimmed" mb="md">
                    Official Sui wallet - Available for Chrome, Firefox, and
                    Edge
                  </Text>
                  <Button
                    component="a"
                    href="https://chromewebstore.google.com/detail/slush-%E2%80%94-a-sui-wallet/opcgpfmipidbgpenhmajoajpbobppdil"
                    target="_blank"
                    leftSection={<IconDownload size={16} />}
                    rightSection={<IconExternalLink size={16} />}
                    variant="gradient"
                    gradient={{ from: "blue", to: "cyan", deg: 45 }}
                    radius="xl"
                    size="md"
                    onClick={() => setStep(1)}
                  >
                    Install Slush Wallet
                  </Button>
                </Box>
              </Group>
            </Paper>
          )}

          {step === 1 && (
            <Paper
              p="lg"
              radius="xl"
              mt="lg"
              style={{ background: "rgba(34, 197, 94, 0.05)" }}
            >
              <Stack gap="md">
                <Group>
                  <IconShield size={24} color="#22c55e" />
                  <Text fw={600}>Set Up Your Slush Wallet</Text>
                </Group>
                <Text size="sm" c="dimmed">
                  After installing Slush, you can create a new wallet using your
                  Google account (easiest) or import an existing one with your
                  seed phrase.
                </Text>
                <Alert
                  icon={<IconAlertCircle size={16} />}
                  color="blue"
                  radius="xl"
                  style={{ background: "rgba(59, 130, 246, 0.1)" }}
                >
                  <Text fw={500} size="sm">
                    💡 Pro Tip: Slush supports social login (Google, Twitch) -
                    no seed phrase needed!
                  </Text>
                </Alert>
                <Button
                  onClick={() => setStep(2)}
                  variant="light"
                  color="green"
                  radius="xl"
                  size="md"
                >
                  Wallet Ready, Continue
                </Button>
              </Stack>
            </Paper>
          )}

          {step === 2 && (
            <Paper
              p="lg"
              radius="xl"
              mt="lg"
              style={{
                background: "rgba(139, 92, 246, 0.08)",
                border: "1px solid rgba(139, 92, 246, 0.2)",
              }}
            >
              <Stack gap="md" align="center">
                <Group>
                  <IconBolt size={24} color="#8b5cf6" />
                  <Text fw={600}>Connect to SuiTickets</Text>
                </Group>
                <Text size="sm" c="dimmed" ta="center">
                  Click the button below to connect your Slush wallet and start
                  purchasing NFT tickets!
                </Text>

                <Box
                  style={{
                    background: "white",
                    padding: "20px",
                    borderRadius: "16px",
                    border: "2px solid rgba(139, 92, 246, 0.2)",
                    width: "100%",
                    textAlign: "center",
                  }}
                >
                  <Box
                    style={{
                      background:
                        "linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)",
                      padding: "4px",
                      borderRadius: "12px",
                      display: "inline-block",
                    }}
                  >
                    <ConnectButton />
                  </Box>
                </Box>

                <Text size="xs" c="dimmed" ta="center">
                  Supports Slush, Suiet, Sui Wallet, Ethos, and other Sui
                  wallets
                </Text>
              </Stack>
            </Paper>
          )}
        </Card>

        {/* Quick Connect Option
        <Box
          mt="xl"
          pt="lg"
          style={{ borderTop: "1px solid rgba(59, 130, 246, 0.2)" }}
        >
          <Text size="sm" fw={500} ta="center" mb="md">
            Quick Connect (All Wallets)
          </Text>
          <Center>
            <Box
              style={{
                background: "white",
                padding: "16px",
                borderRadius: "12px",
                border: "2px solid rgba(59, 130, 246, 0.3)",
              }}
            >
              <ConnectButton />
            </Box>
          </Center>
        </Box> */}
      </Box>
    </Modal>
  );
};
