package com.acspot.domain.report;

import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AcReportRepository extends JpaRepository<AcReport, Long> {

    Optional<AcReport> findByAnonymousIdAndPlaceId(String anonymousId, Long placeId);
}
