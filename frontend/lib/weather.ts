import { DEFAULT_CENTER } from "./geo";

export type WeatherLocation = {
  latitude: number;
  longitude: number;
};

type OpenMeteoCurrentWeatherResponse = {
  current?: {
    temperature_2m?: number;
  };
};

export type TemperatureBanner = {
  temperatureCelsius: number;
  label: string;
};

export async function fetchCurrentTemperature(location: WeatherLocation = DEFAULT_CENTER): Promise<TemperatureBanner> {
  const params = new URLSearchParams({
    latitude: String(location.latitude),
    longitude: String(location.longitude),
    current: "temperature_2m",
    temperature_unit: "celsius"
  });

  const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params.toString()}`, {
    headers: {
      Accept: "application/json"
    }
  });

  if (!response.ok) {
    throw new Error("Could not load weather");
  }

  const data = (await response.json()) as OpenMeteoCurrentWeatherResponse;
  const temperature = data.current?.temperature_2m;

  if (typeof temperature !== "number") {
    throw new Error("Weather response did not include temperature");
  }

  const roundedTemperature = Math.round(temperature);
  return {
    temperatureCelsius: roundedTemperature,
    label: getHeatLabel(roundedTemperature)
  };
}

export function getHeatLabel(temperatureCelsius: number): string {
  if (temperatureCelsius >= 35) {
    return "Extreme heat";
  }
  if (temperatureCelsius >= 30) {
    return "Heat alert";
  }
  if (temperatureCelsius >= 26) {
    return "Hot outside";
  }
  return "Mild outside";
}
