"use client";

import { useMemo, useState } from "react";
import { CategoryFilters } from "./CategoryFilters";
import { HeatAlertBar } from "./HeatAlertBar";
import { MapView } from "./MapView";
import { PlaceBottomSheet } from "./PlaceBottomSheet";
import { PlaceList } from "./PlaceList";
import { SearchBar } from "./SearchBar";
import { ViewToggle } from "./ViewToggle";
import { mockPlaces } from "@/lib/mockPlaces";
import type { CategoryFilter, Place, ReportChoice, ViewMode } from "@/lib/types";

export function ACSpotApp() {
  const [viewMode, setViewMode] = useState<ViewMode>("map");
  const [category, setCategory] = useState<CategoryFilter>("ALL");
  const [query, setQuery] = useState("");
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [reportChoice, setReportChoice] = useState<ReportChoice | null>(null);
  const [toast, setToast] = useState("");

  const filteredPlaces = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return mockPlaces.filter((place) => {
      const categoryMatches = category === "ALL" || place.category === category;
      const queryMatches =
        !normalized ||
        place.name.toLowerCase().includes(normalized) ||
        place.address.toLowerCase().includes(normalized);
      return categoryMatches && queryMatches;
    });
  }, [category, query]);

  function selectPlace(place: Place) {
    setSelectedPlace(place);
    setReportChoice(place.acStatus === "UNAVAILABLE" ? "UNAVAILABLE" : place.acStatus === "AVAILABLE" ? "AVAILABLE" : null);
  }

  function saveReport() {
    setToast(reportChoice ? "Report saved" : "Select a status first");
    window.setTimeout(() => setToast(""), 1800);
    if (reportChoice) {
      setSelectedPlace(null);
    }
  }

  const showingSearch = query.trim().length > 0;
  const listTitle = showingSearch ? "Results" : `Cool spots nearby · ${filteredPlaces.length}`;

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

        {showingSearch || viewMode === "list" ? (
          filteredPlaces.length ? (
            <PlaceList places={filteredPlaces} title={listTitle} onSelect={selectPlace} />
          ) : (
            <div className="flex flex-1 items-center justify-center px-8 text-center text-sm font-medium text-acspot-muted">
              Search cafes, restaurants, malls...
            </div>
          )
        ) : (
          <MapView places={filteredPlaces} selectedPlace={selectedPlace} onSelect={selectPlace} />
        )}

        <PlaceBottomSheet
          place={selectedPlace}
          reportChoice={reportChoice}
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
