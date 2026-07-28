"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CategoryFilters } from "./CategoryFilters";
import { HeatAlertBar } from "./HeatAlertBar";
import { MapView } from "./MapView";
import { PlaceBottomSheet } from "./PlaceBottomSheet";
import { PlaceList } from "./PlaceList";
import { SearchBar } from "./SearchBar";
import { ViewToggle } from "./ViewToggle";
import { fetchMapMarkers, fetchPlaceDetail, fetchPlaceDetailByGooglePlaceId, fetchPlacesInBounds, recordAnalyticsEvent, recordVisit, registerExternalPlace, saveAcReport, searchPlaces } from "@/lib/api";
import { getAnonymousId } from "@/lib/anonymousId";
import { fetchGooglePlaceDetailsById, searchGooglePlacesByText, type GoogleBounds } from "@/lib/googleMaps";
import type { CategoryFilter, MapCamera, Place, ReportChoice, ViewMode } from "@/lib/types";

export function ACSpotApp() {
  const [viewMode, setViewMode] = useState<ViewMode>("map");
  const [category, setCategory] = useState<CategoryFilter>("ALL");
  const [query, setQuery] = useState("");
  const [registeredPlaces, setRegisteredPlaces] = useState<Place[]>([]);
  const [mapMarkerPlaces, setMapMarkerPlaces] = useState<Place[]>([]);
  const [areaListPlaces, setAreaListPlaces] = useState<Place[]>([]);
  const [poiPlaces, setPoiPlaces] = useState<Place[]>([]);
  const [mapBounds, setMapBounds] = useState<GoogleBounds | null>(null);
  const [mapCamera, setMapCamera] = useState<MapCamera | null>(null);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
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
    if (!anonymousId || typeof window === "undefined") {
      return;
    }

    const analyticsWindow = window as Window & { __acspotVisitLogged?: boolean };
    if (analyticsWindow.__acspotVisitLogged) {
      return;
    }

    analyticsWindow.__acspotVisitLogged = true;
    void recordVisit(anonymousId);
  }, [anonymousId]);

  const lookupCenter = useMemo(
    () => userLocation ?? (mapCamera ? { latitude: mapCamera.latitude, longitude: mapCamera.longitude } : undefined),
    [mapCamera, userLocation]
  );

  useEffect(() => {
    const controller = new AbortController();
    const normalized = query.trim();

    async function loadPrimaryPlaces() {
      setError("");
      if (!normalized) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const [registeredResults, googleResults] = await Promise.all([
          searchPlaces(normalized, lookupCenter),
          searchGooglePlacesByText(normalized, lookupCenter)
        ]);
        if (!controller.signal.aborted) {
          setRegisteredPlaces(registeredResults);
          setPoiPlaces(removeRegisteredPoiDuplicates(registeredResults, googleResults));
          setLoading(false);
        }
      } catch (apiError) {
        if (!controller.signal.aborted) {
          setError(apiError instanceof Error ? apiError.message : "Could not load places");
          setRegisteredPlaces([]);
          if (normalized) {
            setPoiPlaces([]);
          }
          setLoading(false);
        }
      }
    }

    const timeoutId = window.setTimeout(loadPrimaryPlaces, normalized ? 300 : 0);
    return () => {
      controller.abort();
      window.clearTimeout(timeoutId);
    };
  }, [query, lookupCenter]);

  useEffect(() => {
    const controller = new AbortController();

    async function loadCurrentAreaPlaces() {
      if (query.trim() || !mapBounds || !mapCamera) {
        return;
      }

      const distanceCenter = lookupCenter ?? { latitude: mapCamera.latitude, longitude: mapCamera.longitude };
      try {
        const [nextMapMarkers, nextAreaPlaces] = await Promise.all([
          viewMode === "map" ? fetchMapMarkers(mapBounds, mapCamera.zoom, distanceCenter) : Promise.resolve(null),
          fetchPlacesInBounds(mapBounds, distanceCenter)
        ]);
        if (!controller.signal.aborted) {
          if (nextMapMarkers) {
            setMapMarkerPlaces(nextMapMarkers);
            setPoiPlaces((current) => removeRegisteredPoiDuplicates(nextMapMarkers, current));
          }
          setAreaListPlaces(nextAreaPlaces);
        }
      } catch (apiError) {
        if (!controller.signal.aborted) {
          setError(apiError instanceof Error ? apiError.message : "Could not load current area places");
          if (viewMode === "map") {
            setMapMarkerPlaces([]);
          }
          setAreaListPlaces([]);
        }
      }
    }

    const timeoutId = window.setTimeout(loadCurrentAreaPlaces, 250);
    return () => {
      controller.abort();
      window.clearTimeout(timeoutId);
    };
  }, [mapBounds, mapCamera, lookupCenter, query, viewMode]);

  const handlePoiPlacesChange = useCallback(
    (places: Place[]) => {
      if (query.trim()) {
        return;
      }
      setPoiPlaces(removeRegisteredPoiDuplicates([...registeredPlaces, ...mapMarkerPlaces], places));
    },
    [mapMarkerPlaces, query, registeredPlaces]
  );

  const areaPlaces = useMemo(() => filterByCategory(areaListPlaces, category), [areaListPlaces, category]);
  const visibleMapPlaces = useMemo(() => filterByCategory(mapMarkerPlaces, category), [category, mapMarkerPlaces]);
  const knownRegisteredPlaces = useMemo(() => mergePlaces(registeredPlaces, mapMarkerPlaces, areaListPlaces), [areaListPlaces, mapMarkerPlaces, registeredPlaces]);
  const searchPlacesToShow = useMemo(() => [...registeredPlaces, ...poiPlaces], [registeredPlaces, poiPlaces]);
  const listPlaces = query.trim() ? searchPlacesToShow : areaPlaces;

  async function selectPlace(place: Place) {
    setSelectedPlace(place);
    setReportChoice(toReportChoice(place.acStatus));

    if (!place.isRegistered) {
      if (place.googlePlaceId) {
        if (anonymousId) {
          try {
            const registeredDetail = await fetchPlaceDetailByGooglePlaceId(place.googlePlaceId, anonymousId, lookupCenter);
            setSelectedPlace(registeredDetail);
            setReportChoice(toReportChoice(registeredDetail.acStatus));
            return;
          } catch {
            // Continue with Google details when the place is not registered yet.
          }
        }
        try {
          const detail = await fetchGooglePlaceDetailsById(place, lookupCenter);
          setSelectedPlace(detail);
        } catch {
          // Keep the initial Google result if details are unavailable.
        }
      }
      return;
    }

    try {
      if (!anonymousId) {
        return;
      }

      const detail = await fetchPlaceDetail(place.placeId, anonymousId, lookupCenter);
      setSelectedPlace(detail);
      setReportChoice(toReportChoice(detail.acStatus));
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
      void recordAnalyticsEvent(anonymousId, {
        eventName: "report_save",
        placeId: place.placeId,
        googlePlaceId: place.googlePlaceId,
        category: place.category,
        acStatus: reportChoice,
        metadata: {
          isRegistered: place.isRegistered,
          source: place.googlePlaceId ? "GOOGLE" : place.osmId ? "OSM" : "MANUAL"
        }
      });
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
      setMapMarkerPlaces((current) => {
        const withoutPlace = current.filter((item) => !matchesPlace(item, updatedPlace));
        return updatedPlace.acStatus === "AVAILABLE" ? [...withoutPlace, updatedPlace] : withoutPlace;
      });
      setAreaListPlaces((current) => {
        const withoutPlace = current.filter((item) => !matchesPlace(item, updatedPlace));
        return updatedPlace.acStatus === "AVAILABLE" ? [...withoutPlace, updatedPlace] : withoutPlace;
      });
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
        const [registeredResults, googleResults] = await Promise.all([
          searchPlaces(normalized, lookupCenter),
          searchGooglePlacesByText(normalized, lookupCenter)
        ]);
        setRegisteredPlaces(registeredResults);
        setPoiPlaces(removeRegisteredPoiDuplicates(registeredResults, googleResults));
        return;
      }

      if (mapBounds && mapCamera) {
        const distanceCenter = lookupCenter ?? { latitude: mapCamera.latitude, longitude: mapCamera.longitude };
        const [nextMapMarkers, nextAreaPlaces] = await Promise.all([
          fetchMapMarkers(mapBounds, mapCamera.zoom, distanceCenter),
          fetchPlacesInBounds(mapBounds, distanceCenter)
        ]);
        setMapMarkerPlaces(nextMapMarkers);
        setAreaListPlaces(nextAreaPlaces);
        setPoiPlaces((current) => removeRegisteredPoiDuplicates(nextMapMarkers, current));
        return;
      }
    } catch {
      // The optimistic update above keeps the UI responsive if refresh fails.
    }
  }

  function showToast(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(""), 1800);
  }

  const showingSearch = query.trim().length > 0;
  const listTitle = showingSearch ? "Results" : `Cool spots in this area - ${areaPlaces.length}`;

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#dbeaf2] text-acspot-text">
      <div className="relative flex h-screen w-full max-w-[390px] flex-col overflow-hidden bg-acspot-sky shadow-[0_0_30px_rgba(36,65,88,0.16)]">
        <HeatAlertBar location={userLocation} />

        <div className="z-10 bg-white px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="min-w-0 flex-1">
              <SearchBar value={query} onChange={setQuery} onBack={() => setQuery("")} />
            </div>
            {!showingSearch ? <ViewToggle value={viewMode} onChange={setViewMode} /> : null}
          </div>
        </div>

        {!showingSearch ? <CategoryFilters value={category} onChange={setCategory} /> : null}

        {!showingSearch && viewMode === "map" ? (
          <MapView
            registeredPlaces={visibleMapPlaces}
            knownRegisteredPlaces={knownRegisteredPlaces}
            poiPlaces={[]}
            selectedPlace={selectedPlace}
            initialCamera={mapCamera}
            distanceCenter={lookupCenter ?? null}
            shouldUseInitialGeolocation={!mapCamera && !initialLocationAttempted}
            onSelect={selectPlace}
            onBoundsChange={setMapBounds}
            onCameraChange={setMapCamera}
            onUserLocationChange={setUserLocation}
            onInitialGeolocationAttempt={() => setInitialLocationAttempted(true)}
            onPoiPlacesChange={handlePoiPlacesChange}
          />
        ) : loading ? (
          <StatusPanel message="Loading cool spots..." />
        ) : error ? (
          <StatusPanel message={error} />
        ) : (
          listPlaces.length ? (
            <PlaceList places={listPlaces} title={listTitle} onSelect={selectPlace} />
          ) : (
            <StatusPanel message="No results found" />
          )
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

function toReportChoice(status: Place["acStatus"]): ReportChoice | null {
  if (status === "AVAILABLE" || status === "UNKNOWN" || status === "UNAVAILABLE") {
    return status;
  }
  return null;
}

function mergePlaces(...placeGroups: Place[][]): Place[] {
  return placeGroups.flat().reduce<Place[]>((places, place) => {
    if (places.some((item) => matchesPlace(item, place))) {
      return places;
    }
    return [...places, place];
  }, []);
}

function removeRegisteredPoiDuplicates(registeredPlaces: Place[], poiPlaces: Place[]): Place[] {
  const registeredOsmIds = new Set(registeredPlaces.map((place) => place.osmId).filter(Boolean));
  const registeredGooglePlaceIds = new Set(registeredPlaces.map((place) => place.googlePlaceId).filter(Boolean));
  const registeredNames = new Set(registeredPlaces.map((place) => normalizeName(place.name)).filter(Boolean));
  return poiPlaces.filter((place) => {
    if (place.osmId && registeredOsmIds.has(place.osmId)) {
      return false;
    }
    if (place.googlePlaceId && registeredGooglePlaceIds.has(place.googlePlaceId)) {
      return false;
    }
    const normalizedName = normalizeName(place.name);
    return !normalizedName || !registeredNames.has(normalizedName);
  });
}

function normalizeName(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, "");
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
