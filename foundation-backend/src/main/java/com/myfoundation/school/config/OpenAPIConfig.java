package com.myfoundation.school.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import io.swagger.v3.oas.models.servers.Server;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

/**
 * OpenAPI/Swagger configuration for API documentation.
 * Provides interactive API documentation at /swagger-ui.html
 * API docs (JSON): /v3/api-docs
 */
@Configuration
public class OpenAPIConfig {

    @Bean
    public OpenAPI foundationOpenAPI() {
        Server devServer = new Server();
        devServer.setUrl("http://localhost:8080");
        devServer.setDescription("Development Server");
        
        Server prodServer = new Server();
        prodServer.setUrl("https://api.foundation.org");
        prodServer.setDescription("Production Server");

        Contact contact = new Contact();
        contact.setEmail("support@myfoundation.org");
        contact.setName("Foundation Support");

        License mitLicense = new License()
                .name("MIT License")
                .url("https://opensource.org/licenses/MIT");

        Info info = new Info()
                .title("School Foundation Donation API")
                .version("1.0.0")
                .contact(contact)
                .description("REST API for managing charity donations, campaigns, and foundation content. " +
                        "Includes public endpoints for donation processing via Stripe and admin endpoints for content management.")
                .license(mitLicense);

        // Define JWT security scheme
        SecurityScheme securityScheme = new SecurityScheme()
                .type(SecurityScheme.Type.HTTP)
                .scheme("bearer")
                .bearerFormat("JWT")
                .description("JWT authentication token. Obtain from /api/auth/login endpoint.");

        return new OpenAPI()
                .info(info)
                .servers(List.of(devServer, prodServer))
                .addSecurityItem(new SecurityRequirement().addList("bearerAuth"))
                .components(new io.swagger.v3.oas.models.Components()
                        .addSecuritySchemes("bearerAuth", securityScheme));
    }
}
