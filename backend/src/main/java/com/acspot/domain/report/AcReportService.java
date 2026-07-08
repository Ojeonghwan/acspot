package com.acspot.domain.report;

import com.acspot.domain.place.Place;
import com.acspot.domain.place.PlaceService;
import com.acspot.domain.report.dto.AcReportRequest;
import com.acspot.domain.report.dto.AcReportResponse;
import com.acspot.domain.summary.PlaceAcSummary;
import com.acspot.domain.summary.PlaceAcSummaryRepository;
import java.time.LocalDateTime;
import java.util.EnumMap;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional
public class AcReportService {

    private final AcReportRepository acReportRepository;
    private final PlaceAcSummaryRepository summaryRepository;
    private final PlaceService placeService;

    public AcReportResponse upsert(Long placeId, AcReportRequest request) {
        Place place = placeService.findActivePlace(placeId);
        acReportRepository.findByAnonymousIdAndPlace_Id(request.anonymousId(), placeId)
                .ifPresentOrElse(
                        report -> report.update(request.acStatus(), request.normalizedCoolingLevel()),
                        () -> acReportRepository.save(AcReport.create(
                                request.anonymousId(),
                                place,
                                request.acStatus(),
                                request.normalizedCoolingLevel()
                        ))
                );

        PlaceAcSummary summary = refreshSummary(place);
        return AcReportResponse.from(summary);
    }

    private PlaceAcSummary refreshSummary(Place place) {
        Map<AcStatus, Long> counts = new EnumMap<>(AcStatus.class);
        for (AcStatus status : AcStatus.values()) {
            counts.put(status, 0L);
        }

        LocalDateTime lastReportedAt = null;
        for (AcReportRepository.AcReportCountProjection projection : acReportRepository.countReportsByStatus(place.getId())) {
            counts.put(projection.getAcStatus(), projection.getReportCount());
            if (projection.getLastReportedAt() != null
                    && (lastReportedAt == null || projection.getLastReportedAt().isAfter(lastReportedAt))) {
                lastReportedAt = projection.getLastReportedAt();
            }
        }

        PlaceAcSummary summary = summaryRepository.findById(place.getId())
                .orElseGet(() -> PlaceAcSummary.empty(place.getId()));
        summary.refresh(
                counts.get(AcStatus.AVAILABLE).intValue(),
                counts.get(AcStatus.UNAVAILABLE).intValue(),
                counts.get(AcStatus.UNKNOWN).intValue(),
                lastReportedAt
        );
        return summaryRepository.save(summary);
    }
}
