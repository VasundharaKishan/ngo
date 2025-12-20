package com.myfoundation.school.admin;

import com.myfoundation.school.campaign.Category;
import com.myfoundation.school.campaign.CategoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

@Service
@RequiredArgsConstructor
public class AdminCategoryService {
    
    private final CategoryRepository categoryRepository;
    
    @Transactional
    public Category createCategory(AdminCategoryRequest request) {
        Category category = new Category();
        category.setName(request.getName());
        category.setSlug(request.getSlug());
        category.setDescription(request.getDescription());
        category.setIcon(request.getIcon());
        category.setColor(request.getColor());
        category.setDisplayOrder(request.getDisplayOrder());
        category.setActive(request.getActive());
        category.setCreatedAt(Instant.now());
        category.setUpdatedAt(Instant.now());
        
        return categoryRepository.save(category);
    }
    
    @Transactional
    public Category updateCategory(String id, AdminCategoryRequest request) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Category not found"));
        
        category.setName(request.getName());
        category.setSlug(request.getSlug());
        category.setDescription(request.getDescription());
        category.setIcon(request.getIcon());
        category.setColor(request.getColor());
        category.setDisplayOrder(request.getDisplayOrder());
        category.setActive(request.getActive());
        category.setUpdatedAt(Instant.now());
        
        return categoryRepository.save(category);
    }
    
    @Transactional
    public void deleteCategory(String id) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Category not found"));
        categoryRepository.delete(category);
    }
}
