package com.acspot.domain.analytics;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

@Getter
@Entity
@Table(name = "analytics_visits")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class AnalyticsVisit {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "anonymous_id", nullable = false, length = 100)
    private String anonymousId;

    @Column(name = "path", length = 255)
    private String path;

    @Column(name = "user_agent", columnDefinition = "TEXT")
    private String userAgent;

    @Column(name = "language", length = 50)
    private String language;

    @Column(name = "device_type", length = 20)
    private String deviceType;

    @Column(name = "referrer", columnDefinition = "TEXT")
    private String referrer;

    @CreationTimestamp
    @Column(name = "visited_at", nullable = false, updatable = false)
    private LocalDateTime visitedAt;

    public static AnalyticsVisit create(
            String anonymousId,
            String path,
            String userAgent,
            String language,
            String deviceType,
            String referrer
    ) {
        AnalyticsVisit visit = new AnalyticsVisit();
        visit.anonymousId = anonymousId;
        visit.path = path;
        visit.userAgent = userAgent;
        visit.language = language;
        visit.deviceType = deviceType;
        visit.referrer = referrer;
        return visit;
    }
}
