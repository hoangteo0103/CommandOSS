import {
  Stack,
  TextInput,
  NumberInput,
  Paper,
  Group,
  Button,
  ActionIcon,
  Alert,
  Text,
  Badge,
  SimpleGrid,
  Card,
  Box,
  Divider,
} from "@mantine/core";
import {
  IconPlus,
  IconTrash,
  IconTicket,
  IconInfoCircle,
  IconCoin,
  IconUsers,
} from "@tabler/icons-react";

interface TicketType {
  name: string;
  price: number;
  supply: number;
  description: string;
}

interface TicketConfigurationStepProps {
  form: any;
  addTicketType: () => void;
  removeTicketType: (index: number) => void;
  updateTicketType: (
    index: number,
    field: keyof TicketType,
    value: any
  ) => void;
}

export const TicketConfigurationStep: React.FC<
  TicketConfigurationStepProps
> = ({ form, addTicketType, removeTicketType, updateTicketType }) => {
  return (
    <Stack gap="xl">
      {/* Header */}
      <Card
        shadow="sm"
        padding="xl"
        radius="xl"
        style={{
          background:
            "linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(59, 130, 246, 0.1) 100%)",
          border: "2px solid rgba(139, 92, 246, 0.3)",
        }}
      >
        <Group justify="space-between" align="flex-start">
          <Box>
            <Text size="xl" fw={700} c="violet" mb="xs">
              🎫 NFT Ticket Configuration
            </Text>
            <Text c="dimmed" size="lg">
              Design your blockchain ticket experience
            </Text>
          </Box>
          <Button
            leftSection={<IconPlus size={18} />}
            onClick={addTicketType}
            variant="gradient"
            gradient={{ from: "violet", to: "blue", deg: 45 }}
            radius="xl"
            size="lg"
            style={{ fontWeight: 600 }}
          >
            Add Ticket Type
          </Button>
        </Group>
      </Card>

      {/* Info Alert */}
      <Alert
        icon={<IconInfoCircle size={24} />}
        color="blue"
        radius="xl"
        p="lg"
        style={{
          background: "rgba(59, 130, 246, 0.08)",
          border: "2px solid rgba(59, 130, 246, 0.2)",
          fontSize: "1rem",
        }}
      >
        <Text fw={600} mb="xs" size="lg">
          ⚡ Blockchain-Powered Tickets
        </Text>
        <Text>
          Each ticket type becomes a unique NFT collection on the Sui
          blockchain. Supply limits are permanent and cannot be increased after
          creation.
        </Text>
      </Alert>

      {/* Ticket Types */}
      <Stack gap="lg">
        {form.values.ticketTypes.map((ticket: TicketType, index: number) => (
          <Card
            key={index}
            shadow="lg"
            p="xl"
            radius="xl"
            style={{
              background: `linear-gradient(135deg, 
                ${
                  index % 3 === 0
                    ? "rgba(139, 92, 246, 0.05)"
                    : index % 3 === 1
                    ? "rgba(16, 185, 129, 0.05)"
                    : "rgba(245, 158, 11, 0.05)"
                } 0%, 
                rgba(59, 130, 246, 0.03) 100%)`,
              border: `2px solid ${
                index % 3 === 0
                  ? "rgba(139, 92, 246, 0.2)"
                  : index % 3 === 1
                  ? "rgba(16, 185, 129, 0.2)"
                  : "rgba(245, 158, 11, 0.2)"
              }`,
              transition: "all 0.3s ease",
              "&:hover": {
                transform: "translateY(-2px)",
                boxShadow: "0 20px 40px rgba(0, 0, 0, 0.1)",
              },
            }}
          >
            <Group justify="space-between" mb="lg">
              <Badge
                variant="gradient"
                gradient={{
                  from:
                    index % 3 === 0
                      ? "violet"
                      : index % 3 === 1
                      ? "teal"
                      : "orange",
                  to: "blue",
                  deg: 45,
                }}
                leftSection={<IconTicket size={16} />}
                size="xl"
                style={{ padding: "12px 20px" }}
              >
                Ticket Type {index + 1}
              </Badge>
              {form.values.ticketTypes.length > 1 && (
                <ActionIcon
                  color="red"
                  variant="light"
                  onClick={() => removeTicketType(index)}
                  radius="xl"
                  size="lg"
                  style={{
                    "&:hover": {
                      transform: "scale(1.1)",
                    },
                  }}
                >
                  <IconTrash size={18} />
                </ActionIcon>
              )}
            </Group>

            <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="lg" mb="lg">
              <TextInput
                label="Ticket Name"
                placeholder="VIP, Early Bird, General..."
                value={ticket.name}
                onChange={(e) =>
                  updateTicketType(index, "name", e.currentTarget.value)
                }
                size="lg"
                radius="xl"
                leftSection={<IconTicket size={18} color="#6366f1" />}
                styles={{
                  label: {
                    fontSize: "1rem",
                    fontWeight: 600,
                    marginBottom: "8px",
                  },
                  input: {
                    border: "2px solid rgba(99, 102, 241, 0.2)",
                    background: "rgba(255, 255, 255, 0.95)",
                    paddingLeft: "52px",
                    "&:focus": {
                      borderColor: "#6366f1",
                      boxShadow: "0 0 0 3px rgba(99, 102, 241, 0.1)",
                    },
                  },
                }}
              />

              <NumberInput
                label="Price (SUI)"
                placeholder="0.00"
                value={ticket.price}
                onChange={(value) =>
                  updateTicketType(index, "price", value || 0)
                }
                min={0}
                step={0.01}
                decimalScale={2}
                size="lg"
                radius="xl"
                leftSection={<IconCoin size={18} color="#10b981" />}
                styles={{
                  label: {
                    fontSize: "1rem",
                    fontWeight: 600,
                    marginBottom: "8px",
                  },
                  input: {
                    border: "2px solid rgba(16, 185, 129, 0.2)",
                    background: "rgba(255, 255, 255, 0.95)",
                    paddingLeft: "52px",
                    "&:focus": {
                      borderColor: "#10b981",
                      boxShadow: "0 0 0 3px rgba(16, 185, 129, 0.1)",
                    },
                  },
                }}
              />

              <NumberInput
                label="Max Supply"
                placeholder="100"
                value={ticket.supply}
                onChange={(value) =>
                  updateTicketType(index, "supply", value || 1)
                }
                min={1}
                size="lg"
                radius="xl"
                leftSection={<IconUsers size={18} color="#f59e0b" />}
                styles={{
                  label: {
                    fontSize: "1rem",
                    fontWeight: 600,
                    marginBottom: "8px",
                  },
                  input: {
                    border: "2px solid rgba(245, 158, 11, 0.2)",
                    background: "rgba(255, 255, 255, 0.95)",
                    paddingLeft: "52px",
                    "&:focus": {
                      borderColor: "#f59e0b",
                      boxShadow: "0 0 0 3px rgba(245, 158, 11, 0.1)",
                    },
                  },
                }}
              />
            </SimpleGrid>

            <TextInput
              label="Perks & Benefits (Optional)"
              placeholder="Describe special access, perks, or benefits included..."
              value={ticket.description}
              onChange={(e) =>
                updateTicketType(index, "description", e.currentTarget.value)
              }
              size="lg"
              radius="xl"
              styles={{
                label: {
                  fontSize: "1rem",
                  fontWeight: 600,
                  marginBottom: "8px",
                },
                input: {
                  border: "2px solid rgba(139, 92, 246, 0.2)",
                  background: "rgba(255, 255, 255, 0.95)",
                  "&:focus": {
                    borderColor: "#8b5cf6",
                    boxShadow: "0 0 0 3px rgba(139, 92, 246, 0.1)",
                  },
                },
              }}
            />

            {/* Ticket Summary */}
            <Divider my="md" />
            <Group justify="center">
              <Box ta="center">
                <Text size="sm" c="dimmed" mb={4}>
                  Total Revenue Potential
                </Text>
                <Text size="lg" fw={700} c="green">
                  {(ticket.price * ticket.supply).toFixed(2)} SUI
                </Text>
              </Box>
            </Group>
          </Card>
        ))}
      </Stack>

      {/* Summary Card */}
      <Card
        shadow="sm"
        padding="xl"
        radius="xl"
        style={{
          background:
            "linear-gradient(135deg, rgba(34, 197, 94, 0.05) 0%, rgba(59, 130, 246, 0.05) 100%)",
          border: "2px solid rgba(34, 197, 94, 0.2)",
        }}
      >
        <Text size="lg" fw={700} mb="md" c="green">
          💰 Event Summary
        </Text>
        <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="lg">
          <Box ta="center">
            <Text size="sm" c="dimmed" mb={4}>
              Total Ticket Types
            </Text>
            <Text size="xl" fw={700} c="blue">
              {form.values.ticketTypes.length}
            </Text>
          </Box>
          <Box ta="center">
            <Text size="sm" c="dimmed" mb={4}>
              Total Supply
            </Text>
            <Text size="xl" fw={700} c="violet">
              {form.values.ticketTypes.reduce(
                (acc: number, ticket: TicketType) => acc + ticket.supply,
                0
              )}
            </Text>
          </Box>
          <Box ta="center">
            <Text size="sm" c="dimmed" mb={4}>
              Max Revenue
            </Text>
            <Text size="xl" fw={700} c="green">
              {form.values.ticketTypes
                .reduce(
                  (acc: number, ticket: TicketType) =>
                    acc + ticket.price * ticket.supply,
                  0
                )
                .toFixed(2)}{" "}
              SUI
            </Text>
          </Box>
        </SimpleGrid>
      </Card>
    </Stack>
  );
};
