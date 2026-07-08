package com.acspot.domain.place.dto;

import com.acspot.domain.report.AcReport;
import com.acspot.domain.report.AcStatus;
import com.acspot.domain.report.CoolingLevel;
import java.time.LocalDateTime;

public record MyReportResponse(
        AcStatus acStatus,
        CoolingLevel coolingLevel,
        LocalDateTime updatedAt
) {
    public static MyReportResponse from(AcReport report) {
        if (report == null) {
            return null;
        }
        return new MyReportResponse(report.getAcStatus(), report.getCoolingLevel(), report.getUpdatedAt());
    }
}
