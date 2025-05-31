import {
  TextInput,
  Select,
  MultiSelect,
  Group,
  Stack,
  Button,
  Box,
  Text,
  Badge,
  ActionIcon,
  Divider,
  Chip,
  Card,
  Transition,
  Flex,
} from "@mantine/core";
import {
  IconSearch,
  IconCalendar,
  IconTag,
  IconFilter,
  IconX,
  IconRefresh,
  IconChevronDown,
  IconAdjustments,
  IconSparkles,
} from "@tabler/icons-react";
import { useState } from "react";

export interface SearchFiltersData {
  query: string;
  categories: string[];
  startDate: string;
  endDate: string;
  status: string;
  organizerName: string;
}

interface SearchFiltersProps {
  filters: SearchFiltersData;
  onFiltersChange: (filters: SearchFiltersData) => void;
  onReset: () => void;
}

const categoryOptions = [
  { value: "Concert", label: "Concert", color: "pink", icon: "🎵" },
  {
    value: "Tech Conference",
    label: "Tech Conference",
    color: "blue",
    icon: "💻",
  },
  { value: "Workshop", label: "Workshop", color: "indigo", icon: "🛠️" },
  { value: "Sports", label: "Sports", color: "red", icon: "⚽" },
  {
    value: "Food & Drinks",
    label: "Food & Drinks",
    color: "orange",
    icon: "🍕",
  },
  {
    value: "Art & Culture",
    label: "Art & Culture",
    color: "violet",
    icon: "🎨",
  },
  { value: "Business", label: "Business", color: "teal", icon: "💼" },
  { value: "Networking", label: "Networking", color: "lime", icon: "🤝" },
  {
    value: "Entertainment",
    label: "Entertainment",
    color: "grape",
    icon: "🎭",
  },
  { value: "Education", label: "Education", color: "cyan", icon: "📚" },
];

const statusOptions = [
  { value: "", label: "All Events" },
  { value: "active", label: "Active" },
  { value: "upcoming", label: "Upcoming" },
  { value: "past", label: "Past" },
  { value: "cancelled", label: "Cancelled" },
];

export const SearchFilters = ({
  filters,
  onFiltersChange,
  onReset,
}: SearchFiltersProps) => {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const updateFilter = (key: keyof SearchFiltersData, value: any) => {
    const newFilters = { ...filters, [key]: value };
    onFiltersChange(newFilters);
  };

  const removeFilter = (
    key: keyof SearchFiltersData,
    specificValue?: string
  ) => {
    let newFilters = { ...filters };

    if (key === "categories" && specificValue) {
      // Remove specific category
      newFilters.categories = filters.categories.filter(
        (c) => c !== specificValue
      );
    } else if (key === "startDate" || key === "endDate") {
      // Clear both date fields when removing date range
      newFilters.startDate = "";
      newFilters.endDate = "";
    } else {
      // Clear the specific field
      if (Array.isArray(newFilters[key])) {
        newFilters[key] = [] as any;
      } else {
        newFilters[key] = "" as any;
      }
    }

    onFiltersChange(newFilters);
  };

  const hasActiveFilters = () => {
    return (
      filters.query ||
      filters.categories.length > 0 ||
      filters.startDate ||
      filters.endDate ||
      filters.status ||
      filters.organizerName
    );
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.query) count++;
    if (filters.categories.length > 0) count++;
    if (filters.startDate || filters.endDate) count++;
    if (filters.status) count++;
    if (filters.organizerName) count++;
    return count;
  };

  const getCategoryOption = (value: string) =>
    categoryOptions.find((opt) => opt.value === value);

  return (
    <Card
      shadow="sm"
      padding="lg"
      radius="lg"
      style={{
        background:
          "linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(248,250,252,0.95) 100%)",
        backdropFilter: "blur(10px)",
        border: "1px solid rgba(59, 130, 246, 0.1)",
        position: "relative",
        overflow: "visible",
      }}
    >
      {/* Compact Header */}
      <Flex justify="space-between" align="center" mb="md">
        <Group gap="sm">
          <Box
            style={{
              background: "linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)",
              borderRadius: "8px",
              padding: "6px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <IconSparkles size={16} color="white" />
          </Box>
          <Text fw={600} size="md" c="dark">
            Smart Search
          </Text>
          {hasActiveFilters() && (
            <Badge size="sm" color="blue" circle>
              {getActiveFiltersCount()}
            </Badge>
          )}
        </Group>

        <Group gap="xs">
          {hasActiveFilters() && (
            <ActionIcon
              variant="light"
              color="red"
              size="sm"
              radius="xl"
              onClick={() => {
                // Call the parent's reset function which will handle refetching
                onReset();
              }}
              title="Clear all filters"
            >
              <IconRefresh size={14} />
            </ActionIcon>
          )}

          <Button
            variant="subtle"
            size="xs"
            rightSection={
              <IconChevronDown
                size={14}
                style={{
                  transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
                  transition: "transform 0.2s ease",
                }}
              />
            }
            onClick={() => setIsExpanded(!isExpanded)}
            style={{ color: "#6b7280" }}
          >
            {isExpanded ? "Less" : "More"}
          </Button>
        </Group>
      </Flex>

      <Stack gap="md">
        {/* Main Search Bar - Always Visible */}
        <TextInput
          placeholder="What are you looking for? Try 'tech conference' or 'music festival'"
          value={filters.query}
          onChange={(e) => updateFilter("query", e.target.value)}
          leftSection={<IconSearch size={18} />}
          size="md"
          radius="xl"
          styles={{
            input: {
              fontSize: "15px",
              fontWeight: 500,
              background: "rgba(255,255,255,0.8)",
              border: "2px solid rgba(59, 130, 246, 0.1)",
              "&:focus": {
                border: "2px solid #3b82f6",
                boxShadow: "0 0 0 3px rgba(59, 130, 246, 0.1)",
              },
            },
          }}
          rightSection={
            filters.query && (
              <ActionIcon
                variant="subtle"
                color="gray"
                size="sm"
                radius="xl"
                onClick={() => removeFilter("query")}
              >
                <IconX size={14} />
              </ActionIcon>
            )
          }
        />

        {/* Collapsible Advanced Filters */}
        <Transition
          mounted={isExpanded}
          transition="slide-down"
          duration={300}
          timingFunction="ease"
        >
          {(styles) => (
            <Card
              style={{
                ...styles,
                background: "rgba(248, 250, 252, 0.5)",
                borderRadius: "12px",
                border: "1px solid rgba(59, 130, 246, 0.1)",
              }}
              p="md"
            >
              <Stack gap="md">
                {/* Quick Category Chips */}
                <Box>
                  <Text size="sm" fw={600} c="dimmed" mb="sm">
                    Popular Categories
                  </Text>
                  <Group gap="xs">
                    {categoryOptions.slice(0, 6).map((category) => (
                      <Chip
                        key={category.value}
                        checked={filters.categories.includes(category.value)}
                        onChange={(checked) => {
                          const newCategories = checked
                            ? [...filters.categories, category.value]
                            : filters.categories.filter(
                                (c) => c !== category.value
                              );
                          updateFilter("categories", newCategories);
                        }}
                        color={category.color}
                        variant="light"
                        size="sm"
                        radius="xl"
                        styles={{
                          label: {
                            display: "flex",
                            alignItems: "center",
                            gap: "4px",
                            fontWeight: 500,
                            fontSize: "12px",
                          },
                        }}
                      >
                        <span>{category.icon}</span>
                        {category.label}
                      </Chip>
                    ))}
                  </Group>
                </Box>

                {/* Advanced Options Toggle */}
                <Divider
                  label={
                    <Button
                      variant={showAdvanced ? "light" : "subtle"}
                      size="xs"
                      leftSection={<IconAdjustments size={14} />}
                      rightSection={
                        <IconChevronDown
                          size={14}
                          style={{
                            transform: showAdvanced
                              ? "rotate(180deg)"
                              : "rotate(0deg)",
                            transition: "transform 0.2s ease",
                          }}
                        />
                      }
                      onClick={() => setShowAdvanced(!showAdvanced)}
                      radius="xl"
                      style={{ border: "none", fontSize: "12px" }}
                    >
                      Advanced Options
                    </Button>
                  }
                  labelPosition="center"
                />

                {/* Advanced Filters */}
                <Transition
                  mounted={showAdvanced}
                  transition="slide-down"
                  duration={200}
                >
                  {(styles) => (
                    <Box style={styles}>
                      <Stack gap="sm">
                        {/* All Categories Selector */}
                        <MultiSelect
                          label="All Categories"
                          placeholder="Select categories..."
                          data={categoryOptions.map((opt) => ({
                            value: opt.value,
                            label: `${opt.icon} ${opt.label}`,
                          }))}
                          value={filters.categories}
                          onChange={(value) =>
                            updateFilter("categories", value)
                          }
                          maxValues={5}
                          searchable
                          clearable
                          size="sm"
                          radius="lg"
                          styles={{
                            input: {
                              background: "rgba(255,255,255,0.8)",
                              border: "1px solid rgba(59, 130, 246, 0.2)",
                            },
                            label: {
                              fontWeight: 600,
                              fontSize: "13px",
                            },
                          }}
                        />

                        {/* Date Range */}
                        <Group grow>
                          <TextInput
                            label="Start Date"
                            type="date"
                            value={filters.startDate}
                            onChange={(e) =>
                              updateFilter("startDate", e.target.value)
                            }
                            size="sm"
                            radius="lg"
                            styles={{
                              input: {
                                background: "rgba(255,255,255,0.8)",
                                border: "1px solid rgba(59, 130, 246, 0.2)",
                              },
                              label: {
                                fontWeight: 600,
                                fontSize: "13px",
                              },
                            }}
                          />
                          <TextInput
                            label="End Date"
                            type="date"
                            value={filters.endDate}
                            onChange={(e) =>
                              updateFilter("endDate", e.target.value)
                            }
                            size="sm"
                            radius="lg"
                            styles={{
                              input: {
                                background: "rgba(255,255,255,0.8)",
                                border: "1px solid rgba(59, 130, 246, 0.2)",
                              },
                              label: {
                                fontWeight: 600,
                                fontSize: "13px",
                              },
                            }}
                          />
                        </Group>

                        {/* Status and Organizer */}
                        <Group grow>
                          <Select
                            label="Event Status"
                            placeholder="All Events"
                            data={statusOptions}
                            value={filters.status}
                            onChange={(value) =>
                              updateFilter("status", value || "")
                            }
                            clearable
                            size="sm"
                            radius="lg"
                            styles={{
                              input: {
                                background: "rgba(255,255,255,0.8)",
                                border: "1px solid rgba(59, 130, 246, 0.2)",
                              },
                              label: {
                                fontWeight: 600,
                                fontSize: "13px",
                              },
                            }}
                          />
                          <TextInput
                            label="Organizer"
                            placeholder="Search by organizer name"
                            value={filters.organizerName}
                            onChange={(e) =>
                              updateFilter("organizerName", e.target.value)
                            }
                            size="sm"
                            radius="lg"
                            styles={{
                              input: {
                                background: "rgba(255,255,255,0.8)",
                                border: "1px solid rgba(59, 130, 246, 0.2)",
                              },
                              label: {
                                fontWeight: 600,
                                fontSize: "13px",
                              },
                            }}
                          />
                        </Group>
                      </Stack>
                    </Box>
                  )}
                </Transition>
              </Stack>
            </Card>
          )}
        </Transition>

        {/* Active Filters Display - Only show when filters are active */}
        {hasActiveFilters() && (
          <Box>
            <Text size="xs" fw={600} c="dimmed" mb="xs">
              Active Filters:
            </Text>
            <Group gap="xs">
              {filters.query && (
                <Badge
                  variant="gradient"
                  gradient={{ from: "blue", to: "cyan" }}
                  leftSection={<IconSearch size={10} />}
                  rightSection={
                    <ActionIcon
                      size="xs"
                      variant="transparent"
                      onClick={() => removeFilter("query")}
                    >
                      <IconX size={8} />
                    </ActionIcon>
                  }
                  radius="lg"
                  size="sm"
                >
                  "{filters.query}"
                </Badge>
              )}

              {filters.categories.map((category) => {
                const categoryOpt = getCategoryOption(category);
                return (
                  <Badge
                    key={category}
                    variant="light"
                    color={categoryOpt?.color || "blue"}
                    leftSection={
                      <span style={{ fontSize: "8px" }}>
                        {categoryOpt?.icon}
                      </span>
                    }
                    rightSection={
                      <ActionIcon
                        size="xs"
                        variant="transparent"
                        onClick={() => removeFilter("categories", category)}
                      >
                        <IconX size={8} />
                      </ActionIcon>
                    }
                    radius="lg"
                    size="sm"
                  >
                    {categoryOpt?.label || category}
                  </Badge>
                );
              })}

              {(filters.startDate || filters.endDate) && (
                <Badge
                  variant="light"
                  color="purple"
                  leftSection={<IconCalendar size={10} />}
                  rightSection={
                    <ActionIcon
                      size="xs"
                      variant="transparent"
                      onClick={() => {
                        removeFilter("startDate");
                      }}
                    >
                      <IconX size={8} />
                    </ActionIcon>
                  }
                  radius="lg"
                  size="sm"
                >
                  Date Range
                </Badge>
              )}

              {filters.status && (
                <Badge
                  variant="light"
                  color="green"
                  rightSection={
                    <ActionIcon
                      size="xs"
                      variant="transparent"
                      onClick={() => removeFilter("status")}
                    >
                      <IconX size={8} />
                    </ActionIcon>
                  }
                  radius="lg"
                  size="sm"
                >
                  {
                    statusOptions.find((opt) => opt.value === filters.status)
                      ?.label
                  }
                </Badge>
              )}

              {filters.organizerName && (
                <Badge
                  variant="light"
                  color="orange"
                  rightSection={
                    <ActionIcon
                      size="xs"
                      variant="transparent"
                      onClick={() => removeFilter("organizerName")}
                    >
                      <IconX size={8} />
                    </ActionIcon>
                  }
                  radius="lg"
                  size="sm"
                >
                  Organizer: {filters.organizerName}
                </Badge>
              )}
            </Group>
          </Box>
        )}
      </Stack>
    </Card>
  );
};
