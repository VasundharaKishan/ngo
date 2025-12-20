package com.myfoundation.school.campaign;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/categories")
@RequiredArgsConstructor
@Tag(name = "Categories", description = "Campaign category management")
public class CategoryController {
    
    private final CategoryRepository categoryRepository;
    
    @GetMapping
    @Operation(summary = "Get all active categories")
    public ResponseEntity<List<Category>> getAllCategories() {
        List<Category> categories = categoryRepository.findByActiveOrderByDisplayOrder(true);
        return ResponseEntity.ok(categories);
    }
    
    @GetMapping("/{slug}")
    @Operation(summary = "Get category by slug")
    public ResponseEntity<Category> getCategoryBySlug(@PathVariable String slug) {
        return categoryRepository.findBySlug(slug)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}
