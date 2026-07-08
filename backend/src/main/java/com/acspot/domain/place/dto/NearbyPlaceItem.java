package com.acspot.domain.place.dto;

import com.acspot.domain.place.Place;
import com.acspot.domain.place.PlaceCategory;
import com.acspot.domain.report.AcStatus;
import com.acspot.domain.summary.PlaceAcSummary;
import java.math.BigDecimal;
import java.time.LocalDateTime;

public record NearbyPlaceItem(
        Long placeId,
        String name,
        PlaceCategory category,
        String address,
        BigDecimal latitude,
        BigDecimal longitude,
        String osmId,
        Integer distanceMeters,
        AcStatus acStatus,
        Integer trustScore,
        Integer totalReportCount,
        LocalDateTime lastReportedAt
) {
    public static NearbyPlaceItem from(Place place, PlaceAcSummary summary, int distanceMeters) {
        return new NearbyPlaceItem(
                place.getId(),
                place.getName(),
                place.getCategory(),
                place.getAddress(),
                place.getLatitude(),
                place.getLongitude(),
                place.getOsmId(),
                distanceMeters,
                summary == null ? AcStatus.UNKNOWN : summary.getCurrentAcStatus(),
                summary == null ? 0 : summary.getTrustScore(),
                summary == null ? 0 : summary.getTotalReportCount(),
                summary == null ? null : summary.getLastReportedAt()
        );
    }
}