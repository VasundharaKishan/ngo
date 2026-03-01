package com.myfoundation.school.config;

import com.myfoundation.school.auth.AuthService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class AdminUserInitializer {

    private final AuthService authService;

    /** Set to false in production once the first admin has been created. */
    @Value("${app.allow-admin-bootstrap:true}")
    private boolean allowAdminBootstrap;

    @EventListener(ApplicationReadyEvent.class)
    public void ensureDefaultAdminExists() {
        if (!allowAdminBootstrap) {
            log.info("Admin bootstrap disabled (app.allow-admin-bootstrap=false) — skipping default admin creation");
            return;
        }
        try {
            log.info("Ensuring default admin user exists...");
            authService.initializeDefaultAdmin();
            log.info("Default admin user check completed");
        } catch (Exception e) {
            log.error("Failed to initialize default admin user", e);
        }
    }
}
