package com.myfoundation.school.cms;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.List;

/**
 * Admin controller for managing CMS content
 * Provides CRUD operations for testimonials, stats, social media links, and carousel images
 */
@RestController
@RequestMapping("/api/admin/cms")
@RequiredArgsConstructor
@Slf4j
public class AdminCMSController {
    
    private final TestimonialRepository testimonialRepository;
    private final HomepageStatRepository homepageStatRepository;
    private final SocialMediaRepository socialMediaRepository;
    private final CarouselImageRepository carouselImageRepository;
    private final CMSContentRepository cmsContentRepository;
    
    // ===== Testimonials Management =====
    
    @GetMapping("/testimonials")
    public ResponseEntity<List<Testimonial>> getAllTestimonials() {
        log.info("GET /api/admin/cms/testimonials - Fetching all testimonials");
        List<Testimonial> testimonials = testimonialRepository.findAll();
        return ResponseEntity.ok(testimonials);
    }
    
    @GetMapping("/testimonials/{id}")
    public ResponseEntity<Testimonial> getTestimonial(@PathVariable String id) {
        log.info("GET /api/admin/cms/testimonials/{} - Fetching testimonial", id);
        return testimonialRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    
    @PostMapping("/testimonials")
    public ResponseEntity<Testimonial> createTestimonial(@Valid @RequestBody TestimonialRequest request) {
        log.info("POST /api/admin/cms/testimonials - Creating testimonial for {}", request.authorName());
        
        Testimonial testimonial = Testimonial.builder()
                .authorName(request.authorName())
                .authorTitle(request.authorTitle())
                .testimonialText(request.testimonialText())
                .displayOrder(request.displayOrder() != null ? request.displayOrder() : 0)
                .active(request.active() != null ? request.active() : true)
                .build();
        
        Testimonial saved = testimonialRepository.save(testimonial);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }
    
    @PutMapping("/testimonials/{id}")
    public ResponseEntity<Testimonial> updateTestimonial(
            @PathVariable String id,
            @Valid @RequestBody TestimonialRequest request) {
        log.info("PUT /api/admin/cms/testimonials/{} - Updating testimonial", id);
        
        return testimonialRepository.findById(id)
                .map(testimonial -> {
                    testimonial.setAuthorName(request.authorName());
                    testimonial.setAuthorTitle(request.authorTitle());
                    testimonial.setTestimonialText(request.testimonialText());
                    if (request.displayOrder() != null) {
                        testimonial.setDisplayOrder(request.displayOrder());
                    }
                    if (request.active() != null) {
                        testimonial.setActive(request.active());
                    }
                    Testimonial updated = testimonialRepository.save(testimonial);
                    return ResponseEntity.ok(updated);
                })
                .orElse(ResponseEntity.notFound().build());
    }
    
    @DeleteMapping("/testimonials/{id}")
    public ResponseEntity<Void> deleteTestimonial(@PathVariable String id) {
        log.info("DELETE /api/admin/cms/testimonials/{} - Deleting testimonial", id);
        
        if (!testimonialRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        
        testimonialRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
    
    // ===== Homepage Stats Management =====
    
    @GetMapping("/stats")
    public ResponseEntity<List<HomepageStat>> getAllStats() {
        log.info("GET /api/admin/cms/stats - Fetching all stats");
        List<HomepageStat> stats = homepageStatRepository.findAll();
        return ResponseEntity.ok(stats);
    }
    
    @GetMapping("/stats/{id}")
    public ResponseEntity<HomepageStat> getStat(@PathVariable String id) {
        log.info("GET /api/admin/cms/stats/{} - Fetching stat", id);
        return homepageStatRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    
    @PostMapping("/stats")
    public ResponseEntity<HomepageStat> createStat(@Valid @RequestBody HomepageStatRequest request) {
        log.info("POST /api/admin/cms/stats - Creating stat {}", request.statLabel());
        
        HomepageStat stat = HomepageStat.builder()
                .statLabel(request.statLabel())
                .statValue(request.statValue())
                .icon(request.icon())
                .displayOrder(request.displayOrder() != null ? request.displayOrder() : 0)
                .active(request.active() != null ? request.active() : true)
                .build();
        
        HomepageStat saved = homepageStatRepository.save(stat);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }
    
    @PutMapping("/stats/{id}")
    public ResponseEntity<HomepageStat> updateStat(
            @PathVariable String id,
            @Valid @RequestBody HomepageStatRequest request) {
        log.info("PUT /api/admin/cms/stats/{} - Updating stat", id);
        
        return homepageStatRepository.findById(id)
                .map(stat -> {
                    stat.setStatLabel(request.statLabel());
                    stat.setStatValue(request.statValue());
                    stat.setIcon(request.icon());
                    if (request.displayOrder() != null) {
                        stat.setDisplayOrder(request.displayOrder());
                    }
                    if (request.active() != null) {
                        stat.setActive(request.active());
                    }
                    HomepageStat updated = homepageStatRepository.save(stat);
                    return ResponseEntity.ok(updated);
                })
                .orElse(ResponseEntity.notFound().build());
    }
    
    @DeleteMapping("/stats/{id}")
    public ResponseEntity<Void> deleteStat(@PathVariable String id) {
        log.info("DELETE /api/admin/cms/stats/{} - Deleting stat", id);
        
        if (!homepageStatRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        
        homepageStatRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
    
    // ===== Social Media Management =====
    
    @GetMapping("/social-media")
    public ResponseEntity<List<SocialMedia>> getAllSocialMedia() {
        log.info("GET /api/admin/cms/social-media - Fetching all social media links");
        List<SocialMedia> socialMedia = socialMediaRepository.findAll();
        return ResponseEntity.ok(socialMedia);
    }
    
    @GetMapping("/social-media/{id}")
    public ResponseEntity<SocialMedia> getSocialMedia(@PathVariable String id) {
        log.info("GET /api/admin/cms/social-media/{} - Fetching social media", id);
        return socialMediaRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    
    @PostMapping("/social-media")
    public ResponseEntity<SocialMedia> createSocialMedia(@Valid @RequestBody SocialMediaRequest request) {
        log.info("POST /api/admin/cms/social-media - Creating social media link for {}", request.platform());
        
        SocialMedia socialMedia = SocialMedia.builder()
                .platform(request.platform())
                .url(request.url())
                .icon(request.icon())
                .displayOrder(request.displayOrder() != null ? request.displayOrder() : 0)
                .active(request.active() != null ? request.active() : true)
                .build();
        
        SocialMedia saved = socialMediaRepository.save(socialMedia);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }
    
    @PutMapping("/social-media/{id}")
    public ResponseEntity<SocialMedia> updateSocialMedia(
            @PathVariable String id,
            @Valid @RequestBody SocialMediaRequest request) {
        log.info("PUT /api/admin/cms/social-media/{} - Updating social media", id);
        
        return socialMediaRepository.findById(id)
                .map(socialMedia -> {
                    socialMedia.setPlatform(request.platform());
                    socialMedia.setUrl(request.url());
                    socialMedia.setIcon(request.icon());
                    if (request.displayOrder() != null) {
                        socialMedia.setDisplayOrder(request.displayOrder());
                    }
                    if (request.active() != null) {
                        socialMedia.setActive(request.active());
                    }
                    SocialMedia updated = socialMediaRepository.save(socialMedia);
                    return ResponseEntity.ok(updated);
                })
                .orElse(ResponseEntity.notFound().build());
    }
    
    @DeleteMapping("/social-media/{id}")
    public ResponseEntity<Void> deleteSocialMedia(@PathVariable String id) {
        log.info("DELETE /api/admin/cms/social-media/{} - Deleting social media", id);
        
        if (!socialMediaRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        
        socialMediaRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
    
    // ===== Carousel Images Management =====
    
    @GetMapping("/carousel")
    public ResponseEntity<List<CarouselImage>> getAllCarouselImages() {
        log.info("GET /api/admin/cms/carousel - Fetching all carousel images");
        List<CarouselImage> images = carouselImageRepository.findAll();
        return ResponseEntity.ok(images);
    }
    
    @GetMapping("/carousel/{id}")
    public ResponseEntity<CarouselImage> getCarouselImage(@PathVariable String id) {
        log.info("GET /api/admin/cms/carousel/{} - Fetching carousel image", id);
        return carouselImageRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    
    @PostMapping("/carousel")
    public ResponseEntity<CarouselImage> createCarouselImage(@Valid @RequestBody CarouselImageRequest request) {
        log.info("POST /api/admin/cms/carousel - Creating carousel image");
        
        CarouselImage image = CarouselImage.builder()
                .imageUrl(request.imageUrl())
                .altText(request.altText())
                .displayOrder(request.displayOrder() != null ? request.displayOrder() : 0)
                .active(request.active() != null ? request.active() : true)
                .build();
        
        CarouselImage saved = carouselImageRepository.save(image);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }
    
    @PutMapping("/carousel/{id}")
    public ResponseEntity<CarouselImage> updateCarouselImage(
            @PathVariable String id,
            @Valid @RequestBody CarouselImageRequest request) {
        log.info("PUT /api/admin/cms/carousel/{} - Updating carousel image", id);
        
        return carouselImageRepository.findById(id)
                .map(image -> {
                    image.setImageUrl(request.imageUrl());
                    image.setAltText(request.altText());
                    if (request.displayOrder() != null) {
                        image.setDisplayOrder(request.displayOrder());
                    }
                    if (request.active() != null) {
                        image.setActive(request.active());
                    }
                    CarouselImage updated = carouselImageRepository.save(image);
                    return ResponseEntity.ok(updated);
                })
                .orElse(ResponseEntity.notFound().build());
    }
    
    @DeleteMapping("/carousel/{id}")
    public ResponseEntity<Void> deleteCarouselImage(@PathVariable String id) {
        log.info("DELETE /api/admin/cms/carousel/{} - Deleting carousel image", id);
        
        if (!carouselImageRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        
        carouselImageRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
    
    // ===== CMS Content Management =====
    
    @GetMapping("/content")
    public ResponseEntity<List<CMSContent>> getAllContent() {
        log.info("GET /api/admin/cms/content - Fetching all CMS content");
        List<CMSContent> content = cmsContentRepository.findAll();
        return ResponseEntity.ok(content);
    }
    
    @GetMapping("/content/section/{section}")
    public ResponseEntity<List<CMSContent>> getContentBySection(@PathVariable String section) {
        log.info("GET /api/admin/cms/content/section/{} - Fetching CMS content", section);
        List<CMSContent> content = cmsContentRepository.findBySectionAndActiveTrue(section);
        return ResponseEntity.ok(content);
    }
    
    @GetMapping("/content/{id}")
    public ResponseEntity<CMSContent> getContent(@PathVariable String id) {
        log.info("GET /api/admin/cms/content/{} - Fetching CMS content", id);
        return cmsContentRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    
    @PostMapping("/content")
    public ResponseEntity<CMSContent> createContent(@Valid @RequestBody CMSContentRequest request) {
        log.info("POST /api/admin/cms/content - Creating CMS content for section {}", request.section());
        
        CMSContent content = CMSContent.builder()
                .section(request.section())
                .contentKey(request.contentKey())
                .contentType(request.contentType())
                .contentValue(request.contentValue())
                .displayOrder(request.displayOrder() != null ? request.displayOrder() : 0)
                .active(request.active() != null ? request.active() : true)
                .build();
        
        CMSContent saved = cmsContentRepository.save(content);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }
    
    @PutMapping("/content/{id}")
    public ResponseEntity<CMSContent> updateContent(
            @PathVariable String id,
            @Valid @RequestBody CMSContentRequest request) {
        log.info("PUT /api/admin/cms/content/{} - Updating CMS content", id);
        
        return cmsContentRepository.findById(id)
                .map(content -> {
                    content.setSection(request.section());
                    content.setContentKey(request.contentKey());
                    content.setContentType(request.contentType());
                    content.setContentValue(request.contentValue());
                    if (request.displayOrder() != null) {
                        content.setDisplayOrder(request.displayOrder());
                    }
                    if (request.active() != null) {
                        content.setActive(request.active());
                    }
                    CMSContent updated = cmsContentRepository.save(content);
                    return ResponseEntity.ok(updated);
                })
                .orElse(ResponseEntity.notFound().build());
    }
    
    @DeleteMapping("/content/{id}")
    public ResponseEntity<Void> deleteContent(@PathVariable String id) {
        log.info("DELETE /api/admin/cms/content/{} - Deleting CMS content", id);
        
        if (!cmsContentRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        
        cmsContentRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}

// ===== Request DTOs =====

record TestimonialRequest(
    String authorName,
    String authorTitle,
    String testimonialText,
    Integer displayOrder,
    Boolean active
) {}

record HomepageStatRequest(
    String statLabel,
    String statValue,
    String icon,
    Integer displayOrder,
    Boolean active
) {}

record SocialMediaRequest(
    String platform,
    String url,
    String icon,
    Integer displayOrder,
    Boolean active
) {}

record CarouselImageRequest(
    String imageUrl,
    String altText,
    Integer displayOrder,
    Boolean active
) {}

record CMSContentRequest(
    String section,
    String contentKey,
    String contentType,
    String contentValue,
    Integer displayOrder,
    Boolean active
) {}
