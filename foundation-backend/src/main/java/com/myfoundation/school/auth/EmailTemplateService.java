package com.myfoundation.school.auth;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.thymeleaf.context.Context;
import org.thymeleaf.spring6.SpringTemplateEngine;

import java.util.Map;

/**
 * Renders Thymeleaf email templates into HTML strings.
 * Keeps template rendering separate from mail-sending logic.
 */
@Service
@RequiredArgsConstructor
public class EmailTemplateService {

    private final SpringTemplateEngine templateEngine;

    /**
     * Render the given template with the supplied variables.
     *
     * @param templateName template path relative to {@code templates/email/}
     *                     (without the {@code .html} suffix)
     * @param variables    model variables available in the template via {@code ${key}}
     * @return fully rendered HTML string
     */
    public String render(String templateName, Map<String, Object> variables) {
        Context context = new Context();
        context.setVariables(variables);
        return templateEngine.process("email/" + templateName, context);
    }
}
