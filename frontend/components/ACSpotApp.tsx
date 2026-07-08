"use client";

import { useEffect, useMemo, useState } from "react";
import { CategoryFilters } from "./CategoryFilters";
import { HeatAlertBar } from "./HeatAlertBar";
import { MapView } from "./MapView";
import { PlaceBottomSheet } from "./PlaceBottomSheet";
import { PlaceList } from "./PlaceList";
import { SearchBar } from "./SearchBar";
import { ViewToggle } from "./ViewToggle";
import { fetchNearbyPlaces, fetchPlaceDetail, registerExternalPlace, saveAcReport, searchPlaces } from "@/lib/api";
import { getAnonymousId } from "@/lib/anonymousId";
import { searchOpenStreetMapPlaces } from "@/lib/osm";
import type { CategoryFilter, Place, ReportChoice, ViewMode } from "@/lib/types";

export function ACSpotApp() {
  const [viewMode, setViewMode] = useState<ViewMode>("map");
  const [category, setCategory] = useState<CategoryFilter>("ALL");
  const [query, setQuery] = useState("");
  const [places, setPlaces] = useState<Place[]>([]);
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [reportChoice, setReportChoice] = useState<ReportChoice | null>(null);
  const [anonymousId, setAnonymousId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");

  useEffect(() => {
    setAnonymousId(getAnonymousId());
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const normalized = query.trim();

    async function loadPlaces() {
      setLoading(true);
      setError("");
      try {
        const nextPlaces = normalized ? await searchAllPlaces(normalized) : await fetchNearbyPlaces();
        if (!controller.signal.aborted) {
          setPlaces(nextPlaces);
        }
      } catch (apiError) {
        if (!controller.signal.aborted) {
          setError(apiError instanceof Error ? apiError.message : "Could not load places");
          setPlaces([]);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    const timeoutId = window.setTimeout(loadPlaces, normalized ? 300 : 0);
    return () => {
      controller.abort();
      window.clearTimeout(timeoutId);
    };
  }, [query]);

  const filteredPlaces = useMemo(() => {
    return places.filter((place) => category === "ALL" || place.category === category);
  }, [category, places]);

  async function selectPlace(place: Place) {
    setSelectedPlace(place);
    setReportChoice(place.acStatus === "UNAVAILABLE" ? "UNAVAILABLE" : place.acStatus === "AVAILABLE" ? "AVAILABLE" : null);

    try {
      const registeredPlace = place.isRegistered ? place : await registerCandidatePlace(place);
      if (!anonymousId) {
        setSelectedPlace(registeredPlace);
        return;
      }

      const detail = await fetchPlaceDetail(registeredPlace.placeId, anonymousId);
      setSelectedPlace(detail);
      setReportChoice(detail.acStatus === "UNAVAILABLE" ? "UNAVAILABLE" : detail.acStatus === "AVAILABLE" ? "AVAILABLE" : null);
    } catch (apiError) {
      showToast(apiError instanceof Error ? apiError.message : "Could not load place detail");
    }
  }

  async function saveReport() {
    if (!selectedPlace) {
      return;
    }
    if (!reportChoice) {
      showToast("Select a status first");
      return;
    }
    if (!anonymousId) {
      showToast("Anonymous ID is not ready");
      return;
    }

    setSaving(true);
    try {
      const place = selectedPlace.isRegistered ? selectedPlace : await registerCandidatePlace(selectedPlace);
      await saveAcReport(place.placeId, anonymousId, reportChoice);
      showToast("Report saved");
      setSelectedPlace(null);
      setPlaces((current) =>
        current.map((item) =>
          matchesPlace(item, place)
            ? {
                ...item,
                placeId: place.placeId,
                isRegistered: true,
                acStatus: reportChoice,
                totalReportCount: Math.max(item.totalReportCount, 1),
                lastReportedAt: "0min ago"
              }
            : item
        )
      );
      refreshCurrentList();
    } catch (apiError) {
      showToast(apiError instanceof Error ? apiError.message : "Could not save report");
    } finally {
      setSaving(false);
    }
  }

  async function registerCandidatePlace(place: Place): Promise<Place> {
    if (place.isRegistered) {
      return place;
    }
    const placeId = await registerExternalPlace(place);
    const registered = { ...place, placeId, isRegistered: true };
    setSelectedPlace(registered);
    showToast("Place registered");
    return registered;
  }

  async function refreshCurrentList() {
    try {
      const normalized = query.trim();
      const nextPlaces = normalized ? await searchAllPlaces(normalized) : await fetchNearbyPlaces();
      setPlaces(nextPlaces);
    } catch {
      // The optimistic update above keeps the UI responsive if refresh fails.
    }
  }

  function showToast(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(""), 1800);
  }

  const showingSearch = query.trim().length > 0;
  const listTitle = showingSearch ? "Results" : `Cool spots nearby - ${filteredPlaces.length}`;

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#dbeaf2] text-acspot-text">
      <div className="relative flex h-screen w-full max-w-[390px] flex-col overflow-hidden bg-acspot-sky shadow-[0_0_30px_rgba(36,65,88,0.16)]">
        <HeatAlertBar />

        <div className="z-10 bg-white px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="min-w-0 flex-1">
              <SearchBar value={query} onChange={setQuery} onBack={() => setQuery("")} />
            </div>
            {!showingSearch ? <ViewToggle value={viewMode} onChange={setViewMode} /> : null}
          </div>
        </div>

        {!showingSearch ? <CategoryFilters value={category} onChange={setCategory} /> : null}

        {loading ? (
          <StatusPanel message="Loading cool spots..." />
        ) : error ? (
          <StatusPanel message={error} />
        ) : showingSearch || viewMode === "list" ? (
          filteredPlaces.length ? (
            <PlaceList places={filteredPlaces} title={listTitle} onSelect={selectPlace} />
          ) : (
            <StatusPanel message="No results found" />
          )
        ) : filteredPlaces.length ? (
          <MapView places={filteredPlaces} selectedPlace={selectedPlace} onSelect={selectPlace} />
        ) : (
          <StatusPanel message="No cool spots nearby yet" />
        )}

        <PlaceBottomSheet
          place={selectedPlace}
          reportChoice={reportChoice}
          saving={saving}
          onReportChange={setReportChoice}
          onClose={() => setSelectedPlace(null)}
          onSave={saveReport}
        />

        {toast ? (
          <div className="absolute bottom-5 left-1/2 z-30 -translate-x-1/2 rounded-full bg-acspot-text px-4 py-2 text-sm font-bold text-white shadow-lg">
            {toast}
          </div>
        ) : null}
      </div>
    </main>
  );
}

async function searchAllPlaces(keyword: string): Promise<Place[]> {
  const registeredPlaces = await searchPlaces(keyword);
  const osmPlaces = await searchOpenStreetMapPlaces(keyword);
  const registeredOsmIds = new Set(registeredPlaces.map((place) => place.osmId).filter(Boolean));
  const newOsmPlaces = osmPlaces.filter((place) => !place.osmId || !registeredOsmIds.has(place.osmId));
  return [...registeredPlaces, ...newOsmPlaces];
}

function matchesPlace(a: Place, b: Place): boolean {
  if (a.placeId > 0 && b.placeId > 0) {
    return a.placeId === b.placeId;
  }
  return Boolean((a.osmId && a.osmId === b.osmId) || (a.googlePlaceId && a.googlePlaceId === b.googlePlaceId));
}

function StatusPanel({ message }: { message: string }) {
  return (
    <div className="flex flex-1 items-center justify-center px-8 text-center text-sm font-medium text-acspot-muted">
      {message}
    </div>
  );
}