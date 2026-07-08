package com.acspot.domain.place.dto;

import com.acspot.domain.report.AcStatus;
import com.acspot.domain.summary.PlaceAcSummary;
import java.time.LocalDateTime;

public record AcSummaryResponse(
        AcStatus currentAcStatus,
        Integer trustScore,
        Integer availableCount,
        Integer unavailableCount,
        Integer unknownCount,
        Integer totalReportCount,
        LocalDateTime lastReportedAt
) {
    public static AcSummaryResponse empty() {
        return new AcSummaryResponse(AcStatus.UNKNOWN, 0, 0, 0, 0, 0, null);
    }

    public static AcSummaryResponse from(PlaceAcSummary summary) {
        if (summary == null) {
            return empty();
        }
        return new AcSummaryResponse(
                summary.getCurrentAcStatus(),
                summary.getTrustScore(),
                summary.getAvailableCount(),
                summary.getUnavailableCount(),
                summary.getUnknownCount(),
                summary.getTotalReportCount(),
                summary.getLastReportedAt()
        );
    }
}
