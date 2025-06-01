import { Box } from "@mantine/core";
import type { Event } from "../types";
import { IconMapPin } from "@tabler/icons-react";

export const CustomMarker = ({
  event,
  isSelected,
  onClick,
}: {
  event: Event;
  isSelected: boolean;
  onClick: () => void;
}) => {
  return (
    <Box
      onClick={onClick}
      style={{
        position: "absolute",
        cursor: "pointer",
        transform: "translate(-50%, -100%)",
        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        zIndex: isSelected ? 1000 : 100,
      }}
    >
      {/* Main Marker Container */}
      <Box
        style={{
          position: "relative",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        {/* Price Badge (if event has price info) */}
        {event.availableTickets !== undefined && (
          <Box
            style={{
              position: "absolute",
              top: "-12px",
              right: "-12px",
              backgroundColor:
                event.availableTickets > 0 ? "#10b981" : "#ef4444",
              color: "white",
              padding: "2px 6px",
              borderRadius: "8px",
              fontSize: "10px",
              fontWeight: 700,
              boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
              border: "1px solid white",
              zIndex: 10,
            }}
          >
            {event.availableTickets > 0 ? "OPEN" : "FULL"}
          </Box>
        )}

        {/* Main Marker Pin */}
        <Box
          style={{
            width: isSelected ? "56px" : "48px",
            height: isSelected ? "56px" : "48px",
            borderRadius: "50%",
            background: isSelected
              ? "linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #ec4899 100%)"
              : "linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: isSelected
              ? "0 12px 40px rgba(99, 102, 241, 0.4), 0 0 0 4px rgba(99, 102, 241, 0.1), inset 0 1px 2px rgba(255,255,255,0.3)"
              : "0 8px 25px rgba(59, 130, 246, 0.25), 0 0 0 2px rgba(59, 130, 246, 0.1), inset 0 1px 2px rgba(255,255,255,0.3)",
            border: "3px solid white",
            position: "relative",
            transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
            transform: isSelected ? "scale(1.1)" : "scale(1)",
          }}
        >
          <IconMapPin
            size={isSelected ? 28 : 24}
            color="white"
            style={{
              filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.2))",
            }}
          />

          {/* Ripple effect for selected marker */}
          {isSelected && (
            <>
              <Box
                style={{
                  position: "absolute",
                  top: "-6px",
                  left: "-6px",
                  right: "-6px",
                  bottom: "-6px",
                  border: "2px solid rgba(99, 102, 241, 0.4)",
                  borderRadius: "50%",
                  animation: "pulse 2s infinite",
                }}
              />
              <Box
                style={{
                  position: "absolute",
                  top: "-12px",
                  left: "-12px",
                  right: "-12px",
                  bottom: "-12px",
                  border: "1px solid rgba(99, 102, 241, 0.2)",
                  borderRadius: "50%",
                  animation: "pulse 2s infinite 0.5s",
                }}
              />
            </>
          )}
        </Box>

        {/* Pin Stem */}
        <Box
          style={{
            width: "4px",
            height: "16px",
            backgroundColor: isSelected ? "#6366f1" : "#3b82f6",
            marginTop: "-2px",
            borderRadius: "0 0 2px 2px",
            boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
          }}
        />

        {/* Pin Point */}
        <Box
          style={{
            width: "8px",
            height: "8px",
            backgroundColor: isSelected ? "#6366f1" : "#3b82f6",
            borderRadius: "50% 50% 50% 0",
            transform: "rotate(45deg)",
            marginTop: "-4px",
            boxShadow: "0 2px 4px rgba(0,0,0,0.15)",
          }}
        />
      </Box>
    </Box>
  );
};
