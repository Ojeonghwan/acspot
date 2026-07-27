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
@Table(name = "analytics_events")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class AnalyticsEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "anonymous_id", nullable = false, length = 100)
    private String anonymousId;

    @Column(name = "event_name", nullable = false, length = 50)
    private String eventName;

    @Column(name = "path", length = 255)
    private String path;

    @Column(name = "place_id")
    private Long placeId;

    @Column(name = "google_place_id", length = 255)
    private String googlePlaceId;

    @Column(name = "category", length = 30)
    private String category;

    @Column(name = "ac_status", length = 20)
    private String acStatus;

    @Column(name = "metadata_json", columnDefinition = "TEXT")
    private String metadataJson;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    public static AnalyticsEvent create(
            String anonymousId,
            String eventName,
            String path,
            Long placeId,
            String googlePlaceId,
            String category,
            String acStatus,
            String metadataJson
    ) {
        AnalyticsEvent event = new AnalyticsEvent();
        event.anonymousId = anonymousId;
        event.eventName = eventName;
        event.path = path;
        event.placeId = placeId;
        event.googlePlaceId = googlePlaceId;
        event.category = category;
        event.acStatus = acStatus;
        event.metadataJson = metadataJson;
        return event;
    }
}
