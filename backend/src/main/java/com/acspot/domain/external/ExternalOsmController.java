package com.acspot.domain.external;

import java.math.BigDecimal;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/external/osm")
@RequiredArgsConstructor
public class ExternalOsmController {

    private final ExternalOsmService externalOsmService;

    @GetMapping(value = "/places", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<String> findPlaces(
            @RequestParam BigDecimal south,
            @RequestParam BigDecimal west,
            @RequestParam BigDecimal north,
            @RequestParam BigDecimal east,
            @RequestParam(defaultValue = "40") int limit
    ) {
        return ResponseEntity.ok(externalOsmService.findPlaces(south, west, north, east, limit));
    }
}