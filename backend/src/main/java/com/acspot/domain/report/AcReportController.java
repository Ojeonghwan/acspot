package com.acspot.domain.report;

import com.acspot.domain.report.dto.AcReportRequest;
import com.acspot.domain.report.dto.AcReportResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "AC Reports")
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/places/{placeId}/ac-report")
public class AcReportController {

    private final AcReportService acReportService;

    @Operation(summary = "Create or update an anonymous AC report")
    @PutMapping
    public AcReportResponse upsert(
            @PathVariable Long placeId,
            @Valid @RequestBody AcReportRequest request
    ) {
        return acReportService.upsert(placeId, request);
    }
}
