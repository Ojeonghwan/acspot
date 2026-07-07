package com.acspot.domain.report;

import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "AC Reports")
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/places/{placeId}/ac-report")
public class AcReportController {

    private final AcReportService acReportService;
}
