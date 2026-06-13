package com.myfoundation.school.config;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

/**
 * Forwards React Router client-side routes to index.html so that direct URL
 * access and browser refresh work correctly.
 *
 * Each path variable uses [^\\.]*  — "no dots allowed in this segment" — so
 * actual static assets (.js, .css, .ico, etc.) are never intercepted:
 *   /admin             → captured by depth-1 pattern  → index.html ✓
 *   /admin/donations   → captured by depth-2 pattern  → index.html ✓
 *   /donate/123/success→ captured by depth-3 pattern  → index.html ✓
 *   /assets/app.js     → "app.js" contains a dot      → falls through to static handler ✓
 *   /favicon.ico       → "favicon.ico" contains a dot → falls through to static handler ✓
 */
@Controller
public class SpaFallbackController {

    @GetMapping(value = {
        "/{p1:[^\\.]*}",
        "/{p1:[^\\.]*}/{p2:[^\\.]*}",
        "/{p1:[^\\.]*}/{p2:[^\\.]*}/{p3:[^\\.]*}"
    })
    public String forward() {
        return "forward:/index.html";
    }
}
