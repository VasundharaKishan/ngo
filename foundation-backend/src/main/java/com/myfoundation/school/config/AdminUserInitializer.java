package com.myfoundation.school.config;

import com.myfoundation.school.auth.AuthService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class AdminUserInitializer {
    
    private final AuthService authService;
    
    @EventListener(ApplicationReadyEvent.class)
    public void ensureDefaultAdminExists() {
        try {
            log.info("Ensuring default admin user exists...");
            authService.initializeDefaultAdmin();
            log.info("Default admin user check completed");
        } catch (Exception e) {
            log.error("Failed to initialize default admin user", e);
        }
    }
}
