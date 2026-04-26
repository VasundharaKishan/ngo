package com.myfoundation.school.announcementbar;

/**
 * Visual style variants for the public announcement bar.
 *
 * <p>Admin picks one of these; the frontend maps it to a colour/iconography theme.
 * Values must match the CHECK constraint in {@code V28__create_announcement_bar_table.sql}.</p>
 */
public enum AnnouncementStyle {
    /** Neutral blue — default for routine updates. */
    INFO,
    /** Green — milestone reached, goal met, good news. */
    SUCCESS,
    /** Amber — soft alert (office closed, deadline approaching). */
    WARNING,
    /** Red — urgent (service outage, donation cut-off, compliance notice). */
    CRITICAL
}
