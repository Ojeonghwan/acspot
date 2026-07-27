package com.acspot.domain.analytics;

import com.acspot.domain.analytics.dto.AnalyticsEventRequest;
import com.acspot.domain.analytics.dto.AnalyticsVisitRequest;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "Analytics")
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/analytics")
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    @Operation(summary = "Record an anonymous visit")
    @PostMapping("/visits")
    public ResponseEntity<Void> recordVisit(
            @Valid @RequestBody AnalyticsVisitRequest request,
            HttpServletRequest httpRequest
    ) {
        analyticsService.recordVisit(request, httpRequest.getHeader("User-Agent"));
        return ResponseEntity.noContent().build();
    }

    @Operation(summary = "Record an anonymous event")
    @PostMapping("/events")
    public ResponseEntity<Void> recordEvent(@Valid @RequestBody AnalyticsEventRequest request) {
        analyticsService.recordEvent(request);
        return ResponseEntity.noContent().build();
    }
}
