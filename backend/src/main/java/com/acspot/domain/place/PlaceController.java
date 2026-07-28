package com.acspot.domain.place;

import com.acspot.domain.place.dto.CreatePlaceRequest;
import com.acspot.domain.place.dto.CreatePlaceResponse;
import com.acspot.domain.place.dto.NearbyPlacesResponse;
import com.acspot.domain.place.dto.PlaceDetailResponse;
import com.acspot.domain.place.dto.PlaceSearchResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "Places")
@Validated
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/places")
public class PlaceController {

    private final PlaceService placeService;

    @Operation(summary = "Find nearby places")
    @GetMapping("/nearby")
    public NearbyPlacesResponse nearby(
            @RequestParam @NotNull @DecimalMin("-90.0") @DecimalMax("90.0") BigDecimal lat,
            @RequestParam @NotNull @DecimalMin("-180.0") @DecimalMax("180.0") BigDecimal lng,
            @RequestParam(required = false) Integer radius
    ) {
        return placeService.findNearby(lat, lng, radius);
    }

    @Operation(summary = "Find map markers in current bounds")
    @GetMapping("/map-markers")
    public NearbyPlacesResponse mapMarkers(
            @RequestParam @NotNull @DecimalMin("-90.0") @DecimalMax("90.0") BigDecimal south,
            @RequestParam @NotNull @DecimalMin("-180.0") @DecimalMax("180.0") BigDecimal west,
            @RequestParam @NotNull @DecimalMin("-90.0") @DecimalMax("90.0") BigDecimal north,
            @RequestParam @NotNull @DecimalMin("-180.0") @DecimalMax("180.0") BigDecimal east,
            @RequestParam @NotNull @DecimalMin("-90.0") @DecimalMax("90.0") BigDecimal centerLat,
            @RequestParam @NotNull @DecimalMin("-180.0") @DecimalMax("180.0") BigDecimal centerLng,
            @RequestParam(required = false) Integer zoom,
            @RequestParam(required = false) Integer limit
    ) {
        return placeService.findMapMarkers(south, west, north, east, centerLat, centerLng, zoom, limit);
    }

    @Operation(summary = "Get place detail")
    @GetMapping("/{placeId}")
    public PlaceDetailResponse detail(
            @PathVariable Long placeId,
            @RequestParam(required = false) String anonymousId
    ) {
        return placeService.findDetail(placeId, anonymousId);
    }

    @Operation(summary = "Search registered places")
    @GetMapping("/search")
    public PlaceSearchResponse search(@RequestParam String keyword) {
        return placeService.search(keyword);
    }

    @Operation(summary = "Get registered Google place detail")
    @GetMapping("/by-google-place-id")
    public PlaceDetailResponse detailByGooglePlaceId(
            @RequestParam String googlePlaceId,
            @RequestParam(required = false) String anonymousId
    ) {
        return placeService.findDetailByGooglePlaceId(googlePlaceId, anonymousId);
    }

    @Operation(summary = "Register a place")
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public CreatePlaceResponse create(@Valid @RequestBody CreatePlaceRequest request) {
        return placeService.create(request);
    }
}
