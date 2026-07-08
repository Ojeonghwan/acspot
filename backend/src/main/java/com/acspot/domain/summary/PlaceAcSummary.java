package com.acspot.domain.summary;

import com.acspot.domain.report.AcStatus;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.UpdateTimestamp;

@Getter
@Entity
@Table(name = "place_ac_summaries")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class PlaceAcSummary {

    @Id
    @Column(name = "place_id")
    private Long placeId;

    @Enumerated(EnumType.STRING)
    @Column(name = "current_ac_status", nullable = false, length = 20)
    private AcStatus currentAcStatus = AcStatus.UNKNOWN;

    @Column(name = "trust_score", nullable = false)
    private Integer trustScore = 0;

    @Column(name = "available_count", nullable = false)
    private Integer availableCount = 0;

    @Column(name = "unavailable_count", nullable = false)
    private Integer unavailableCount = 0;

    @Column(name = "unknown_count", nullable = false)
    private Integer unknownCount = 0;

    @Column(name = "total_report_count", nullable = false)
    private Integer totalReportCount = 0;

    @Column(name = "last_reported_at")
    private LocalDateTime lastReportedAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    public static PlaceAcSummary empty(Long placeId) {
        PlaceAcSummary summary = new PlaceAcSummary();
        summary.placeId = placeId;
        summary.currentAcStatus = AcStatus.UNKNOWN;
        return summary;
    }

    public void refresh(
            int availableCount,
            int unavailableCount,
            int unknownCount,
            LocalDateTime lastReportedAt
    ) {
        this.availableCount = availableCount;
        this.unavailableCount = unavailableCount;
        this.unknownCount = unknownCount;
        this.totalReportCount = availableCount + unavailableCount + unknownCount;
        this.currentAcStatus = resolveCurrentStatus(availableCount, unavailableCount, unknownCount);
        this.trustScore = Math.min(100, this.totalReportCount * 10);
        this.lastReportedAt = lastReportedAt;
    }

    private AcStatus resolveCurrentStatus(int availableCount, int unavailableCount, int unknownCount) {
        if (availableCount > unavailableCount && availableCount > unknownCount) {
            return AcStatus.AVAILABLE;
        }
        if (unavailableCount > availableCount && unavailableCount > unknownCount) {
            return AcStatus.UNAVAILABLE;
        }
        return AcStatus.UNKNOWN;
    }
}
