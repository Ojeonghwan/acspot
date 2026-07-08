package com.acspot.domain.place;

import com.acspot.common.exception.BusinessException;
import com.acspot.domain.place.dto.AcSummaryResponse;
import com.acspot.domain.place.dto.CreatePlaceRequest;
import com.acspot.domain.place.dto.CreatePlaceResponse;
import com.acspot.domain.place.dto.MyReportResponse;
import com.acspot.domain.place.dto.NearbyPlaceItem;
import com.acspot.domain.place.dto.NearbyPlacesResponse;
import com.acspot.domain.place.dto.PlaceDetailResponse;
import com.acspot.domain.place.dto.PlaceSearchItem;
import com.acspot.domain.place.dto.PlaceSearchResponse;
import com.acspot.domain.report.AcReportRepository;
import com.acspot.domain.summary.PlaceAcSummary;
import com.acspot.domain.summary.PlaceAcSummaryRepository;
import java.math.BigDecimal;
import java.util.Comparator;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PlaceService {

    private static final int DEFAULT_RADIUS_METERS = 1_000;
    private static final int MAX_RADIUS_METERS = 10_000;
    private static final double EARTH_RADIUS_METERS = 6_371_000;

    private final PlaceRepository placeRepository;
    private final PlaceAcSummaryRepository summaryRepository;
    private final AcReportRepository acReportRepository;

    public NearbyPlacesResponse findNearby(BigDecimal latitude, BigDecimal longitude, Integer radius) {
        int radiusMeters = normalizeRadius(radius);
        List<NearbyPlaceItem> places = placeRepository.findByStatus(PlaceStatus.ACTIVE).stream()
                .map(place -> toNearbyItem(place, latitude, longitude))
                .filter(item -> item.distanceMeters() <= radiusMeters)
                .sorted(Comparator.comparing(NearbyPlaceItem::distanceMeters))
                .toList();
        return new NearbyPlacesResponse(places);
    }

    public PlaceDetailResponse findDetail(Long placeId, String anonymousId) {
        Place place = findActivePlace(placeId);
        PlaceAcSummary summary = summaryRepository.findById(placeId).orElse(null);
        MyReportResponse myReport = null;
        if (StringUtils.hasText(anonymousId)) {
            myReport = acReportRepository.findByAnonymousIdAndPlace_Id(anonymousId, placeId)
                    .map(MyReportResponse::from)
                    .orElse(null);
        }
        return PlaceDetailResponse.from(place, AcSummaryResponse.from(summary), myReport);
    }

    public PlaceSearchResponse search(String keyword) {
        if (!StringUtils.hasText(keyword)) {
            return new PlaceSearchResponse(List.of());
        }
        List<PlaceSearchItem> places = placeRepository
                .findTop10ByStatusAndNameContainingIgnoreCaseOrderByNameAsc(PlaceStatus.ACTIVE, keyword.trim())
                .stream()
                .map(place -> PlaceSearchItem.from(place, summaryRepository.findById(place.getId()).orElse(null)))
                .toList();
        return new PlaceSearchResponse(places);
    }

    @Transactional
    public CreatePlaceResponse create(CreatePlaceRequest request) {
        if (request.sourceType() == SourceType.GOOGLE && StringUtils.hasText(request.googlePlaceId())) {
            return placeRepository.findBySourceTypeAndGooglePlaceId(SourceType.GOOGLE, request.googlePlaceId())
                    .map(place -> new CreatePlaceResponse(place.getId()))
                    .orElseGet(() -> saveNewPlace(request));
        }
        if (request.sourceType() == SourceType.OSM && StringUtils.hasText(request.osmId())) {
            return placeRepository.findBySourceTypeAndOsmId(SourceType.OSM, request.osmId())
                    .map(place -> new CreatePlaceResponse(place.getId()))
                    .orElseGet(() -> saveNewPlace(request));
        }
        return saveNewPlace(request);
    }

    public Place findActivePlace(Long placeId) {
        Place place = placeRepository.findById(placeId)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Place not found"));
        if (place.getStatus() != PlaceStatus.ACTIVE) {
            throw new BusinessException(HttpStatus.NOT_FOUND, "Place not found");
        }
        return place;
    }

    private CreatePlaceResponse saveNewPlace(CreatePlaceRequest request) {
        Place place = Place.create(
                request.sourceType(),
                request.googlePlaceId(),
                request.osmId(),
                request.name(),
                request.category(),
                request.countryCode(),
                request.city(),
                request.address(),
                request.latitude(),
                request.longitude(),
                request.googleMapsUrl()
        );
        Place saved = placeRepository.save(place);
        return new CreatePlaceResponse(saved.getId());
    }

    private NearbyPlaceItem toNearbyItem(Place place, BigDecimal latitude, BigDecimal longitude) {
        int distanceMeters = calculateDistanceMeters(
                latitude.doubleValue(),
                longitude.doubleValue(),
                place.getLatitude().doubleValue(),
                place.getLongitude().doubleValue()
        );
        PlaceAcSummary summary = summaryRepository.findById(place.getId()).orElse(null);
        return NearbyPlaceItem.from(place, summary, distanceMeters);
    }

    private int normalizeRadius(Integer radius) {
        if (radius == null) {
            return DEFAULT_RADIUS_METERS;
        }
        if (radius <= 0) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "radius must be greater than 0");
        }
        return Math.min(radius, MAX_RADIUS_METERS);
    }

    private int calculateDistanceMeters(double lat1, double lng1, double lat2, double lng2) {
        double dLat = Math.toRadians(lat2 - lat1);
        double dLng = Math.toRadians(lng2 - lng1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(dLng / 2) * Math.sin(dLng / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return (int) Math.round(EARTH_RADIUS_METERS * c);
    }
}
