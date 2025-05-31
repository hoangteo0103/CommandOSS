import { Button, Group, Text, Badge } from "@mantine/core";
import { IconWallet, IconCircleCheck } from "@tabler/icons-react";
import { ConnectButton, useCurrentAccount } from "@mysten/dapp-kit";

interface WalletButtonProps {
  fullWidth?: boolean;
  variant?: string;
}

export const WalletButton = ({
  fullWidth = false,
  variant = "filled",
}: WalletButtonProps) => {
  const account = useCurrentAccount();

  if (account) {
    return (
      <ConnectButton connectText="Connect Wallet">
        <Group gap="xs">
          <Badge
            leftSection={<IconCircleCheck size={12} />}
            color="green"
            variant="light"
            size="lg"
          >
            <Text size="sm" fw={500}>
              {account.address.slice(0, 6)}...{account.address.slice(-4)}
            </Text>
          </Badge>
        </Group>
      </ConnectButton>
    );
  }

  return (
    <ConnectButton connectText="Connect Wallet">
      <Button
        fullWidth={fullWidth}
        variant={variant}
        leftSection={<IconWallet size={16} />}
        gradient={{ from: "blue", to: "cyan", deg: 45 }}
        size="md"
      >
        Connect Sui Wallet
      </Button>
    </ConnectButton>
  );
};
