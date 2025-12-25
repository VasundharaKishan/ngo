package com.myfoundation.school.cms;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/cms")
@RequiredArgsConstructor
@Slf4j
public class CMSController {
    
    private final CMSContentRepository cmsContentRepository;
    private final TestimonialRepository testimonialRepository;
    private final HomepageStatRepository homepageStatRepository;
    private final SocialMediaRepository socialMediaRepository;
    private final CarouselImageRepository carouselImageRepository;
    
    @GetMapping("/content/{section}")
    public ResponseEntity<Map<String, String>> getContentBySection(@PathVariable String section) {
        log.info("GET /api/cms/content/{} - Fetching CMS content", section);
        List<CMSContent> content = cmsContentRepository.findBySectionAndActiveTrue(section);
        
        Map<String, String> contentMap = content.stream()
                .collect(Collectors.toMap(
                        CMSContent::getContentKey,
                        CMSContent::getContentValue
                ));
        
        return ResponseEntity.ok(contentMap);
    }
    
    @GetMapping("/testimonials")
    public ResponseEntity<List<Testimonial>> getTestimonials() {
        log.info("GET /api/cms/testimonials - Fetching testimonials");
        List<Testimonial> testimonials = testimonialRepository.findByActiveTrueOrderByDisplayOrderAsc();
        return ResponseEntity.ok(testimonials);
    }
    
    @GetMapping("/stats")
    public ResponseEntity<List<HomepageStat>> getStats() {
        log.info("GET /api/cms/stats - Fetching homepage stats");
        List<HomepageStat> stats = homepageStatRepository.findByActiveTrueOrderByDisplayOrderAsc();
        return ResponseEntity.ok(stats);
    }
    
    @GetMapping("/social-media")
    public ResponseEntity<List<SocialMedia>> getSocialMedia() {
        log.info("GET /api/cms/social-media - Fetching social media links");
        List<SocialMedia> socialMedia = socialMediaRepository.findByActiveTrueOrderByDisplayOrderAsc();
        return ResponseEntity.ok(socialMedia);
    }
    
    @GetMapping("/carousel")
    public ResponseEntity<List<CarouselImage>> getCarouselImages() {
        log.info("GET /api/cms/carousel - Fetching carousel images");
        List<CarouselImage> images = carouselImageRepository.findByActiveTrueOrderByDisplayOrderAsc();
        return ResponseEntity.ok(images);
    }
}
