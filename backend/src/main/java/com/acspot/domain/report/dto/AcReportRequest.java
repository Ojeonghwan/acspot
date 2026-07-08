package com.acspot.domain.report.dto;

import com.acspot.domain.report.AcStatus;
import com.acspot.domain.report.CoolingLevel;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record AcReportRequest(
        @NotBlank String anonymousId,
        @NotNull AcStatus acStatus,
        CoolingLevel coolingLevel
) {
    public CoolingLevel normalizedCoolingLevel() {
        return coolingLevel == null ? CoolingLevel.UNKNOWN : coolingLevel;
    }
}
