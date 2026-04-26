package com.myfoundation.school.config;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

/**
 * Forwards all non-API, non-file-extension routes to index.html so that
 * React Router can handle client-side navigation on direct URL access or refresh.
 *
 * Static assets (.js, .css, .ico, etc.) are served by Spring Boot's default
 * static resource handler before this controller is ever reached.
 */
@Controller
public class SpaFallbackController {

    @GetMapping(value = {"/{path:[^\\.]*}", "/{path:[^\\.]*}/**"})
    public String forward() {
        return "forward:/index.html";
    }
}
