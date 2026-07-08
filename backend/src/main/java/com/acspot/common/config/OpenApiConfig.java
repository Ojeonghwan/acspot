package com.acspot.common.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI acspotOpenApi() {
        return new OpenAPI()
                .info(new Info()
                        .title("ACSpot API")
                        .description("Anonymous air-conditioning reports for nearby cool spots.")
                        .version("v1"));
    }
}
