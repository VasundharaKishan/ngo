package com.myfoundation.school.contact.dto;

import jakarta.validation.constraints.Size;

/** Admin adds or clears a note on a contact submission. */
public record ContactSubmissionNoteRequest(
        @Size(max = 4000, message = "Note must not exceed 4000 characters")
        String note
) {}
