"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CategoryFilters } from "./CategoryFilters";
import { HeatAlertBar } from "./HeatAlertBar";
import { MapView } from "./MapView";
import { PlaceBottomSheet } from "./PlaceBottomSheet";
import { PlaceList } from "./PlaceList";
import { SearchBar } from "./SearchBar";
import { ViewToggle } from "./ViewToggle";
import { fetchNearbyPlaces, fetchPlaceDetail, registerExternalPlace, saveAcReport, searchPlaces } from "@/lib/api";
import { getAnonymousId } from "@/lib/anonymousId";
import { GOOGLE_PLACES_BOUNDS, type GoogleBounds } from "@/lib/googleMaps";
import type { CategoryFilter, MapCamera, Place, ReportChoice, ViewMode } from "@/lib/types";

export function ACSpotApp() {
  const [viewMode, setViewMode] = useState<ViewMode>("map");
  const [category, setCategory] = useState<CategoryFilter>("ALL");
  const [query, setQuery] = useState("");
  const [registeredPlaces, setRegisteredPlaces] = useState<Place[]>([]);
  const [poiPlaces, setPoiPlaces] = useState<Place[]>([]);
  const [, setMapBounds] = useState<GoogleBounds>(GOOGLE_PLACES_BOUNDS);
  const [mapCamera, setMapCamera] = useState<MapCamera | null>(null);
  const [initialLocationAttempted, setInitialLocationAttempted] = useState(false);
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

    async function loadPrimaryPlaces() {
      const isInitialLoad = registeredPlaces.length === 0 && poiPlaces.length === 0;
      if (normalized || isInitialLoad) {
        setLoading(true);
      }
      setError("");
      try {
        if (normalized) {
          const registeredResults = await searchPlaces(normalized);
          if (!controller.signal.aborted) {
            setRegisteredPlaces(registeredResults);
            setPoiPlaces([]);
            setLoading(false);
          }
          return;
        }

        const nextRegisteredPlaces = await fetchNearbyPlaces(mapCamera?.latitude, mapCamera?.longitude);
        if (!controller.signal.aborted) {
          setRegisteredPlaces(nextRegisteredPlaces);
          setPoiPlaces((current) => removeRegisteredPoiDuplicates(nextRegisteredPlaces, current));
          setLoading(false);
        }
      } catch (apiError) {
        if (!controller.signal.aborted) {
          setError(apiError instanceof Error ? apiError.message : "Could not load places");
          setRegisteredPlaces([]);
          setPoiPlaces([]);
          setLoading(false);
        }
      }
    }

    const timeoutId = window.setTimeout(loadPrimaryPlaces, normalized ? 300 : 0);
    return () => {
      controller.abort();
      window.clearTimeout(timeoutId);
    };
  }, [query, mapCamera]);

  const handlePoiPlacesChange = useCallback(
    (places: Place[]) => {
      if (query.trim()) {
        return;
      }
      setPoiPlaces(removeRegisteredPoiDuplicates(registeredPlaces, places));
    },
    [query, registeredPlaces]
  );

  const filteredRegisteredPlaces = useMemo(() => filterByCategory(registeredPlaces, category), [category, registeredPlaces]);
  const filteredPoiPlaces = useMemo(() => filterByCategory(poiPlaces, category), [category, poiPlaces]);
  const filteredMapPlaces = useMemo(() => [...filteredRegisteredPlaces, ...filteredPoiPlaces], [filteredRegisteredPlaces, filteredPoiPlaces]);
  const listPlaces = query.trim() ? filteredMapPlaces : filteredRegisteredPlaces;

  async function selectPlace(place: Place) {
    setSelectedPlace(place);
    setReportChoice(place.acStatus === "UNAVAILABLE" ? "UNAVAILABLE" : place.acStatus === "AVAILABLE" ? "AVAILABLE" : null);

    if (!place.isRegistered) {
      return;
    }

    try {
      if (!anonymousId) {
        return;
      }

      const detail = await fetchPlaceDetail(place.placeId, anonymousId);
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
      const updatedPlace: Place = {
        ...place,
        isRegistered: true,
        acStatus: reportChoice,
        totalReportCount: Math.max(place.totalReportCount, 1),
        lastReportedAt: "0min ago"
      };

      showToast("Report saved");
      setSelectedPlace(null);
      setRegisteredPlaces((current) => [...current.filter((item) => !matchesPlace(item, updatedPlace)), updatedPlace]);
      setPoiPlaces((current) => current.filter((item) => !matchesPlace(item, updatedPlace)));
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
      if (normalized) {
        const registeredResults = await searchPlaces(normalized);
        setRegisteredPlaces(registeredResults);
        setPoiPlaces([]);
        return;
      }

      const nextRegisteredPlaces = await fetchNearbyPlaces(mapCamera?.latitude, mapCamera?.longitude);
      setRegisteredPlaces(nextRegisteredPlaces);
      setPoiPlaces((current) => removeRegisteredPoiDuplicates(nextRegisteredPlaces, current));
    } catch {
      // The optimistic update above keeps the UI responsive if refresh fails.
    }
  }

  function showToast(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(""), 1800);
  }

  const showingSearch = query.trim().length > 0;
  const listTitle = showingSearch ? "Results" : `Cool spots nearby - ${filteredRegisteredPlaces.length}`;

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
          listPlaces.length ? (
            <PlaceList places={listPlaces} title={listTitle} onSelect={selectPlace} />
          ) : (
            <StatusPanel message="No results found" />
          )
        ) : (
          <MapView
            registeredPlaces={filteredRegisteredPlaces}
            poiPlaces={filteredPoiPlaces}
            selectedPlace={selectedPlace}
            initialCamera={mapCamera}
            shouldUseInitialGeolocation={!mapCamera && !initialLocationAttempted}
            onSelect={selectPlace}
            onBoundsChange={setMapBounds}
            onCameraChange={setMapCamera}
            onInitialGeolocationAttempt={() => setInitialLocationAttempted(true)}
            onPoiPlacesChange={handlePoiPlacesChange}
          />
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

function filterByCategory(places: Place[], category: CategoryFilter): Place[] {
  return places.filter((place) => category === "ALL" || place.category === category);
}

function removeRegisteredPoiDuplicates(registeredPlaces: Place[], poiPlaces: Place[]): Place[] {
  const registeredOsmIds = new Set(registeredPlaces.map((place) => place.osmId).filter(Boolean));
  const registeredGooglePlaceIds = new Set(registeredPlaces.map((place) => place.googlePlaceId).filter(Boolean));
  const registeredNames = new Set(registeredPlaces.map((place) => normalizeName(place.name)));
  return poiPlaces.filter((place) => {
    if (place.osmId && registeredOsmIds.has(place.osmId)) {
      return false;
    }
    if (place.googlePlaceId && registeredGooglePlaceIds.has(place.googlePlaceId)) {
      return false;
    }
    return !registeredNames.has(normalizeName(place.name));
  });
}

function normalizeName(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
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
