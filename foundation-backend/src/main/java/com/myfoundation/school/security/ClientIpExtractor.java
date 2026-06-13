package com.myfoundation.school.security;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.stereotype.Component;

import java.util.Set;

/**
 * Extracts the effective client IP address from an HTTP request.
 *
 * <p>Forwarded headers ({@code X-Forwarded-For}, {@code X-Real-IP}) are trusted
 * <em>only</em> when the immediate TCP peer ({@code remoteAddr}) is a known
 * private/loopback address. This prevents clients from spoofing their IP by
 * injecting arbitrary header values when connecting directly to the server.</p>
 */
@Component
public class ClientIpExtractor {

    /**
     * Private-network and loopback CIDRs. Requests whose {@code remoteAddr}
     * matches one of these prefixes are considered to come from a trusted
     * reverse-proxy, and their forwarded headers are accepted.
     */
    private static final Set<String> TRUSTED_PROXY_PREFIXES = Set.of(
            "127.", "::1", "10.", "172.16.", "172.17.", "172.18.", "172.19.",
            "172.20.", "172.21.", "172.22.", "172.23.", "172.24.", "172.25.",
            "172.26.", "172.27.", "172.28.", "172.29.", "172.30.", "172.31.",
            "192.168."
    );

    /**
     * Returns the effective client IP.
     *
     * <p>For requests arriving from a trusted proxy the first entry in
     * {@code X-Forwarded-For} is returned, falling back to {@code X-Real-IP},
     * then {@code remoteAddr}. For all other sources {@code remoteAddr} is
     * returned directly.</p>
     *
     * @param request the incoming HTTP request
     * @return the client IP address string, never {@code null}
     */
    public String extract(HttpServletRequest request) {
        String remoteAddr = request.getRemoteAddr();
        boolean fromTrustedProxy = TRUSTED_PROXY_PREFIXES.stream()
                .anyMatch(remoteAddr::startsWith);

        if (fromTrustedProxy) {
            String forwardedFor = request.getHeader("X-Forwarded-For");
            if (forwardedFor != null && !forwardedFor.isBlank()) {
                return forwardedFor.split(",")[0].trim();
            }
            String realIp = request.getHeader("X-Real-IP");
            if (realIp != null && !realIp.isBlank()) {
                return realIp.trim();
            }
        }

        return remoteAddr;
    }
}
