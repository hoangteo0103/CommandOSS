import React, { useEffect, useRef, useState } from "react";
import { TextInput, type TextInputProps } from "@mantine/core";
import { Loader } from "@googlemaps/js-api-loader";

interface PlaceDetails {
  name: string;
  formattedAddress: string;
  latitude: number;
  longitude: number;
  placeId: string;
  addressComponents: google.maps.GeocoderAddressComponent[];
}

interface GooglePlacesAutocompleteProps
  extends Omit<TextInputProps, "onChange"> {
  onPlaceSelect: (place: PlaceDetails) => void;
  onChange?: (value: string) => void;
  value?: string;
  apiKey: string;
}

export const GooglePlacesAutocomplete: React.FC<
  GooglePlacesAutocompleteProps
> = ({ onPlaceSelect, onChange, value, apiKey, ...textInputProps }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [inputValue, setInputValue] = useState(value || "");

  useEffect(() => {
    if (value !== undefined) {
      setInputValue(value);
    }
  }, [value]);

  useEffect(() => {
    const initializeAutocomplete = async () => {
      if (!apiKey) {
        console.error("Google Maps API key is required");
        setIsLoading(false);
        return;
      }

      try {
        const loader = new Loader({
          apiKey,
          version: "weekly",
          libraries: ["places"],
        });

        await loader.load();

        if (inputRef.current && window.google) {
          autocompleteRef.current = new window.google.maps.places.Autocomplete(
            inputRef.current,
            {
              types: ["establishment", "geocode"],
              fields: [
                "name",
                "formatted_address",
                "geometry.location",
                "place_id",
                "address_components",
              ],
            }
          );

          autocompleteRef.current.addListener("place_changed", () => {
            const place = autocompleteRef.current?.getPlace();

            if (place && place.geometry && place.geometry.location) {
              const placeDetails: PlaceDetails = {
                name: place.name || "",
                formattedAddress: place.formatted_address || "",
                latitude: place.geometry.location.lat(),
                longitude: place.geometry.location.lng(),
                placeId: place.place_id || "",
                addressComponents: place.address_components || [],
              };

              setInputValue(place.name || place.formatted_address || "");
              onPlaceSelect(placeDetails);
            }
          });
        }
        setIsLoading(false);
      } catch (error) {
        console.error("Error loading Google Maps API:", error);
        setIsLoading(false);
      }
    };

    initializeAutocomplete();

    return () => {
      if (autocompleteRef.current && window.google) {
        window.google.maps.event.clearInstanceListeners(
          autocompleteRef.current
        );
      }
    };
  }, [apiKey, onPlaceSelect]);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = event.target.value;
    setInputValue(newValue);
    onChange?.(newValue);
  };

  return (
    <TextInput
      {...textInputProps}
      ref={inputRef}
      value={inputValue}
      onChange={handleInputChange}
      rightSection={
        isLoading ? (
          <div style={{ fontSize: "12px" }}>Loading...</div>
        ) : undefined
      }
      disabled={isLoading || textInputProps.disabled}
    />
  );
};
