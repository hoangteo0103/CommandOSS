import { useState } from "react";
import { Button, Group, Menu, Box } from "@mantine/core";
import {
  IconWallet,
  IconLogout,
  IconUser,
  IconExternalLink,
} from "@tabler/icons-react";
import {
  useCurrentAccount,
  ConnectButton,
  useDisconnectWallet,
} from "@mysten/dapp-kit";
import { WalletConnectionModal } from "./WalletConnectionModal";

export const WalletButton = () => {
  const currentAccount = useCurrentAccount();
  const { mutate: disconnect } = useDisconnectWallet();
  const [modalOpened, setModalOpened] = useState(false);

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // If wallet is connected, show account info with disconnect option
  if (currentAccount) {
    return (
      <Menu shadow="md" width={200} position="bottom-end">
        <Menu.Target>
          <Button
            variant="light"
            color="blue"
            leftSection={<IconUser size={16} />}
            size="md"
            radius="xl"
            style={{
              background: "rgba(255, 255, 255, 0.95)",
              border: "1px solid rgba(59, 130, 246, 0.2)",
            }}
          >
            {formatAddress(currentAccount.address)}
          </Button>
        </Menu.Target>

        <Menu.Dropdown>
          <Menu.Label>Wallet</Menu.Label>
          <Menu.Item
            component="a"
            href={`https://explorer.sui.io/address/${currentAccount.address}?network=testnet`}
            target="_blank"
            leftSection={<IconExternalLink size={16} />}
          >
            View on Explorer
          </Menu.Item>
          <Menu.Divider />
          <Menu.Item
            color="red"
            leftSection={<IconLogout size={16} />}
            onClick={() => disconnect()}
          >
            Disconnect
          </Menu.Item>
        </Menu.Dropdown>
      </Menu>
    );
  }

  // If wallet is not connected, show connect options
  return (
    <Group gap="md">
      {/* Direct Connect Button */}
      <Box
        style={{
          background: "linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)",
          padding: "4px",
          borderRadius: "12px",
        }}
      >
        <ConnectButton />
      </Box>

      <Button
        leftSection={<IconWallet size={20} />}
        onClick={() => setModalOpened(true)}
        variant="light"
        color="blue"
        size="lg"
        radius="xl"
        style={{
          fontWeight: 600,
          padding: "16px 24px",
        }}
      >
        Setup Guide
      </Button>

      <WalletConnectionModal
        opened={modalOpened}
        onClose={() => setModalOpened(false)}
      />
    </Group>
  );
};
