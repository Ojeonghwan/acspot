package com.acspot.domain.analytics.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.util.Map;

public record AnalyticsEventRequest(
        @NotBlank
        @Size(max = 100)
        String anonymousId,

        @NotBlank
        @Size(max = 50)
        String eventName,

        @Size(max = 255)
        String path,

        Long placeId,

        @Size(max = 255)
        String googlePlaceId,

        @Size(max = 30)
        String category,

        @Size(max = 20)
        String acStatus,

        Map<String, Object> metadata
) {
}
