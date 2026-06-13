package com.myfoundation.school.audit;

import com.myfoundation.school.security.ClientIpExtractor;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.time.Instant;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuditLogService {

    private final AuditLogRepository repository;
    private final ClientIpExtractor clientIpExtractor;

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void log(AuditAction action, String entityType, String entityId,
                    String actorUsername, String details) {
        if (actorUsername == null) {
            try {
                actorUsername = SecurityContextHolder.getContext()
                    .getAuthentication().getName();
            } catch (Exception e) {
                actorUsername = "system";
            }
        }

        AuditLog auditLog = AuditLog.builder()
            .action(action)
            .entityType(entityType)
            .entityId(entityId)
            .actorUsername(actorUsername)
            .details(details)
            .ipAddress(getClientIpAddress())
            .timestamp(Instant.now())
            .build();
        repository.save(auditLog);
        log.debug("Audit: {} by {} on {}/{}", action, actorUsername, entityType, entityId);
    }

    private String getClientIpAddress() {
        try {
            ServletRequestAttributes attrs =
                (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
            if (attrs != null) {
                // Use the shared ClientIpExtractor which only trusts X-Forwarded-For
                // from known private-network proxies, preventing audit-log IP spoofing
                // by authenticated admins who could otherwise inject arbitrary header values.
                return clientIpExtractor.extract(attrs.getRequest());
            }
        } catch (Exception e) {
            log.trace("Could not resolve client IP", e);
        }
        return null;
    }
}
