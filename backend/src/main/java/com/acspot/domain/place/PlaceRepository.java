package com.acspot.domain.place;

import com.acspot.domain.report.AcStatus;
import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface PlaceRepository extends JpaRepository<Place, Long> {

    Optional<Place> findBySourceTypeAndGooglePlaceId(SourceType sourceType, String googlePlaceId);

    Optional<Place> findBySourceTypeAndOsmId(SourceType sourceType, String osmId);

    List<Place> findByStatus(PlaceStatus status);

    List<Place> findTop10ByStatusAndNameContainingIgnoreCaseOrderByNameAsc(PlaceStatus status, String name);

    @Query("""
            select p
            from Place p
            join PlaceAcSummary s on s.placeId = p.id
            where p.status = :status
              and s.currentAcStatus = :acStatus
              and p.latitude between :south and :north
              and p.longitude between :west and :east
            order by s.trustScore desc, s.lastReportedAt desc, p.id asc
            """)
    List<Place> findMapMarkers(
            @Param("status") PlaceStatus status,
            @Param("acStatus") AcStatus acStatus,
            @Param("south") BigDecimal south,
            @Param("west") BigDecimal west,
            @Param("north") BigDecimal north,
            @Param("east") BigDecimal east,
            Pageable pageable
    );

    @Query("""
            select p
            from Place p
            join PlaceAcSummary s on s.placeId = p.id
            where p.status = :status
              and s.currentAcStatus = :acStatus
              and p.latitude between :south and :north
              and p.longitude between :west and :east
            order by s.trustScore desc, s.lastReportedAt desc, p.id asc
            """)
    List<Place> findPlacesInBounds(
            @Param("status") PlaceStatus status,
            @Param("acStatus") AcStatus acStatus,
            @Param("south") BigDecimal south,
            @Param("west") BigDecimal west,
            @Param("north") BigDecimal north,
            @Param("east") BigDecimal east
    );
}
