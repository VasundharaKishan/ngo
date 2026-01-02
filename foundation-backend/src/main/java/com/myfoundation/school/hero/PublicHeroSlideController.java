package com.myfoundation.school.hero;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/public/hero-slides")
@RequiredArgsConstructor
@Slf4j
public class PublicHeroSlideController {
    
    private final HeroSlideService heroSlideService;
    
    /**
     * GET /api/public/hero-slides
     * Get all enabled hero slides ordered by sort order
     */
    @GetMapping
    public ResponseEntity<List<HeroSlide>> getEnabledSlides() {
        log.debug("Fetching enabled hero slides for public display");
        List<HeroSlide> slides = heroSlideService.getEnabledSlides();
        return ResponseEntity.ok(slides);
    }
}
