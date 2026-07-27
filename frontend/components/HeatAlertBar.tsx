"use client";

import { Flame } from "lucide-react";
import { useEffect, useState } from "react";
import { fetchCurrentTemperature, type TemperatureBanner, type WeatherLocation } from "@/lib/weather";

type HeatAlertBarProps = {
  location?: WeatherLocation | null;
};

export function HeatAlertBar({ location }: HeatAlertBarProps) {
  const [weather, setWeather] = useState<TemperatureBanner | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadWeather() {
      try {
        setFailed(false);
        const nextWeather = await fetchCurrentTemperature(location ?? undefined);
        if (!cancelled) {
          setWeather(nextWeather);
        }
      } catch {
        if (!cancelled) {
          setFailed(true);
        }
      }
    }

    void loadWeather();
    return () => {
      cancelled = true;
    };
  }, [location?.latitude, location?.longitude]);

  const message = weather ? `Now ${weather.temperatureCelsius}°C - ${weather.label}` : failed ? "Weather unavailable" : "Loading weather...";

  return (
    <div className="flex h-11 items-center gap-2 bg-acspot-alert px-4 text-sm font-semibold text-white">
      <Flame aria-hidden="true" size={16} strokeWidth={2.4} />
      <span>{message}</span>
    </div>
  );
}
