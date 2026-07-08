package com.acspot.domain.report.dto;

import com.acspot.domain.report.AcStatus;
import com.acspot.domain.summary.PlaceAcSummary;
import java.time.LocalDateTime;

public record AcReportResponse(
        Long placeId,
        AcStatus acStatus,
        Integer trustScore,
        Integer totalReportCount,
        LocalDateTime lastReportedAt
) {
    public static AcReportResponse from(PlaceAcSummary summary) {
        return new AcReportResponse(
                summary.getPlaceId(),
                summary.getCurrentAcStatus(),
                summary.getTrustScore(),
                summary.getTotalReportCount(),
                summary.getLastReportedAt()
        );
    }
}
