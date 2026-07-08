package com.acspot.domain.report;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface AcReportRepository extends JpaRepository<AcReport, Long> {

    Optional<AcReport> findByAnonymousIdAndPlace_Id(String anonymousId, Long placeId);

    @Query("""
            select r.acStatus as acStatus, count(r) as reportCount, max(r.updatedAt) as lastReportedAt
            from AcReport r
            where r.place.id = :placeId
            group by r.acStatus
            """)
    List<AcReportCountProjection> countReportsByStatus(@Param("placeId") Long placeId);

    interface AcReportCountProjection {
        AcStatus getAcStatus();

        Long getReportCount();

        LocalDateTime getLastReportedAt();
    }
}
