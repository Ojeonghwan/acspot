package com.acspot.domain.place.dto;

import com.acspot.domain.place.PlaceCategory;
import com.acspot.domain.place.SourceType;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public record CreatePlaceRequest(
        @NotNull SourceType sourceType,
        String googlePlaceId,
        String osmId,
        @NotBlank String name,
        @NotNull PlaceCategory category,
        String countryCode,
        String city,
        @NotBlank String address,
        @NotNull @DecimalMin("-90.0") @DecimalMax("90.0") BigDecimal latitude,
        @NotNull @DecimalMin("-180.0") @DecimalMax("180.0") BigDecimal longitude,
        String googleMapsUrl
) {
}
