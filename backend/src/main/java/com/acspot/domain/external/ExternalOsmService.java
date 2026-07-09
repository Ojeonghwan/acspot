package com.acspot.domain.external;

import com.acspot.common.exception.BusinessException;
import java.io.IOException;
import java.math.BigDecimal;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

@Service
public class ExternalOsmService {

    private static final String OVERPASS_ENDPOINT = "https://overpass-api.de/api/interpreter";
    private static final int MAX_LIMIT = 80;

    private final HttpClient httpClient = HttpClient.newHttpClient();

    public String findPlaces(BigDecimal south, BigDecimal west, BigDecimal north, BigDecimal east, int limit) {
        int normalizedLimit = Math.min(Math.max(limit, 1), MAX_LIMIT);
        String bbox = south + "," + west + "," + north + "," + east;
        String query = """
                [out:json][timeout:8];
                (
                  node["name"]["amenity"~"cafe|restaurant|fast_food|library|community_centre|townhall"](%s);
                  way["name"]["amenity"~"cafe|restaurant|fast_food|library|community_centre|townhall"](%s);
                  relation["name"]["amenity"~"cafe|restaurant|fast_food|library|community_centre|townhall"](%s);
                  node["name"]["shop"~"mall|department_store|supermarket|convenience"](%s);
                  way["name"]["shop"~"mall|department_store|supermarket|convenience"](%s);
                  relation["name"]["shop"~"mall|department_store|supermarket|convenience"](%s);
                  node["name"]["tourism"~"hotel|museum"](%s);
                  way["name"]["tourism"~"hotel|museum"](%s);
                  relation["name"]["tourism"~"hotel|museum"](%s);
                );
                out center qt %d;
                """.formatted(bbox, bbox, bbox, bbox, bbox, bbox, bbox, bbox, bbox, normalizedLimit);

        String body = "data=" + URLEncoder.encode(query, StandardCharsets.UTF_8);
        HttpRequest request = HttpRequest.newBuilder(URI.create(OVERPASS_ENDPOINT))
                .header("Accept", "application/json")
                .header("Content-Type", "application/x-www-form-urlencoded;charset=UTF-8")
                .POST(HttpRequest.BodyPublishers.ofString(body))
                .build();

        try {
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() >= 400) {
                throw new BusinessException(HttpStatus.BAD_GATEWAY, "OpenStreetMap place lookup failed");
            }
            return response.body();
        } catch (IOException exception) {
            throw new BusinessException(HttpStatus.BAD_GATEWAY, "OpenStreetMap place lookup failed");
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            throw new BusinessException(HttpStatus.BAD_GATEWAY, "OpenStreetMap place lookup interrupted");
        }
    }
}