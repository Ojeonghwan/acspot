package com.acspot.domain.place;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PlaceRepository extends JpaRepository<Place, Long> {

    Optional<Place> findBySourceTypeAndGooglePlaceId(SourceType sourceType, String googlePlaceId);

    Optional<Place> findBySourceTypeAndOsmId(SourceType sourceType, String osmId);

    List<Place> findByStatus(PlaceStatus status);

    List<Place> findTop10ByStatusAndNameContainingIgnoreCaseOrderByNameAsc(PlaceStatus status, String name);
}