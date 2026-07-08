package com.acspot.domain.place.dto;

import com.acspot.domain.place.Place;
import com.acspot.domain.place.PlaceCategory;
import com.acspot.domain.report.AcStatus;
import com.acspot.domain.summary.PlaceAcSummary;
import java.math.BigDecimal;
import java.time.LocalDateTime;

public record PlaceSearchItem(
        Long placeId,
        String name,
        PlaceCategory category,
        String address,
        BigDecimal latitude,
        BigDecimal longitude,
        String googlePlaceId,
        String osmId,
        boolean alreadyRegistered,
        AcStatus acStatus,
        Integer trustScore,
        Integer totalReportCount,
        LocalDateTime lastReportedAt
) {
    public static PlaceSearchItem from(Place place, PlaceAcSummary summary) {
        return new PlaceSearchItem(
                place.getId(),
                place.getName(),
                place.getCategory(),
                place.getAddress(),
                place.getLatitude(),
                place.getLongitude(),
                place.getGooglePlaceId(),
                place.getOsmId(),
                true,
                summary == null ? AcStatus.UNKNOWN : summary.getCurrentAcStatus(),
                summary == null ? 0 : summary.getTrustScore(),
                summary == null ? 0 : summary.getTotalReportCount(),
                summary == null ? null : summary.getLastReportedAt()
        );
    }
}