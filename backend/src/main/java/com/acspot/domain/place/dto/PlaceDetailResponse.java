package com.acspot.domain.place.dto;

import com.acspot.domain.place.Place;
import com.acspot.domain.place.PlaceCategory;
import java.math.BigDecimal;

public record PlaceDetailResponse(
        Long placeId,
        String name,
        PlaceCategory category,
        String address,
        BigDecimal latitude,
        BigDecimal longitude,
        String googleMapsUrl,
        String osmId,
        AcSummaryResponse acSummary,
        MyReportResponse myReport
) {
    public static PlaceDetailResponse from(Place place, AcSummaryResponse summary, MyReportResponse myReport) {
        return new PlaceDetailResponse(
                place.getId(),
                place.getName(),
                place.getCategory(),
                place.getAddress(),
                place.getLatitude(),
                place.getLongitude(),
                place.getGoogleMapsUrl(),
                place.getOsmId(),
                summary,
                myReport
        );
    }
}