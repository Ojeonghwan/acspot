package com.acspot.domain.analytics;

import com.acspot.domain.analytics.dto.AnalyticsEventRequest;
import com.acspot.domain.analytics.dto.AnalyticsVisitRequest;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional
public class AnalyticsService {

    private final AnalyticsVisitRepository visitRepository;
    private final AnalyticsEventRepository eventRepository;
    private final ObjectMapper objectMapper;

    public void recordVisit(AnalyticsVisitRequest request, String userAgent) {
        visitRepository.save(AnalyticsVisit.create(
                request.anonymousId(),
                request.path(),
                userAgent,
                request.language(),
                request.deviceType(),
                request.referrer()
        ));
    }

    public void recordEvent(AnalyticsEventRequest request) {
        eventRepository.save(AnalyticsEvent.create(
                request.anonymousId(),
                request.eventName(),
                request.path(),
                request.placeId(),
                request.googlePlaceId(),
                request.category(),
                request.acStatus(),
                toJson(request.metadata())
        ));
    }

    private String toJson(Object value) {
        if (value == null) {
            return null;
        }
        try {
            return objectMapper.writeValueAsString(value);
        } catch (JsonProcessingException exception) {
            return null;
        }
    }
}
