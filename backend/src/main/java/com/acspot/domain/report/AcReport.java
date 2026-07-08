package com.acspot.domain.report;

import com.acspot.domain.place.Place;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import java.time.LocalDateTime;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

@Getter
@Entity
@Table(
        name = "ac_reports",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_ac_reports_anonymous_place", columnNames = {"anonymous_id", "place_id"})
        }
)
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class AcReport {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "anonymous_id", nullable = false, length = 100)
    private String anonymousId;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "place_id", nullable = false)
    private Place place;

    @Enumerated(EnumType.STRING)
    @Column(name = "ac_status", nullable = false, length = 20)
    private AcStatus acStatus;

    @Enumerated(EnumType.STRING)
    @Column(name = "cooling_level", nullable = false, length = 20)
    private CoolingLevel coolingLevel = CoolingLevel.UNKNOWN;

    @CreationTimestamp
    @Column(name = "reported_at", nullable = false, updatable = false)
    private LocalDateTime reportedAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    public static AcReport create(String anonymousId, Place place, AcStatus acStatus, CoolingLevel coolingLevel) {
        AcReport report = new AcReport();
        report.anonymousId = anonymousId;
        report.place = place;
        report.acStatus = acStatus;
        report.coolingLevel = coolingLevel;
        return report;
    }

    public void update(AcStatus acStatus, CoolingLevel coolingLevel) {
        this.acStatus = acStatus;
        this.coolingLevel = coolingLevel;
    }
}
