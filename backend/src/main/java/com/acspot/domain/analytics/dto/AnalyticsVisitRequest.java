package com.acspot.domain.analytics.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record AnalyticsVisitRequest(
        @NotBlank
        @Size(max = 100)
        String anonymousId,

        @Size(max = 255)
        String path,

        @Size(max = 50)
        String language,

        @Size(max = 20)
        String deviceType,

        String referrer
) {
}
