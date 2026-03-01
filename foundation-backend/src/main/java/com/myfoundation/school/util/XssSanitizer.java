package com.myfoundation.school.util;

import java.util.regex.Pattern;

/**
 * Utility to strip common XSS payloads from user-supplied text before persistence.
 *
 * Removes:
 *  - {@code <script>…</script>} blocks (case-insensitive, multi-line)
 *  - Inline event-handler attributes (e.g. {@code onclick="…"})
 *  - {@code javascript:} and {@code vbscript:} protocol references
 *
 * This is a lightweight defence-in-depth layer.  The primary XSS protection is
 * the Content-Security-Policy header set in SecurityConfig; this sanitiser
 * prevents raw payloads from ever reaching the database.
 */
public final class XssSanitizer {

    private static final Pattern SCRIPT_TAG = Pattern.compile(
            "<script[^>]*>[\\s\\S]*?</script>", Pattern.CASE_INSENSITIVE);

    private static final Pattern EVENT_ATTR = Pattern.compile(
            "\\s+on[a-z]+\\s*=\\s*(?:\"[^\"]*\"|'[^']*'|[^\\s>]+)",
            Pattern.CASE_INSENSITIVE);

    private static final Pattern JAVASCRIPT_PROTO = Pattern.compile(
            "javascript\\s*:", Pattern.CASE_INSENSITIVE);

    private static final Pattern VBSCRIPT_PROTO = Pattern.compile(
            "vbscript\\s*:", Pattern.CASE_INSENSITIVE);

    private XssSanitizer() {
        // utility class
    }

    /**
     * Sanitize a single string field.  Returns {@code null} unchanged.
     */
    public static String sanitize(String input) {
        if (input == null) return null;
        String s = SCRIPT_TAG.matcher(input).replaceAll("");
        s = EVENT_ATTR.matcher(s).replaceAll("");
        s = JAVASCRIPT_PROTO.matcher(s).replaceAll("removed:");
        s = VBSCRIPT_PROTO.matcher(s).replaceAll("removed:");
        return s;
    }
}
