package com.myfoundation.school.admin;

import com.myfoundation.school.audit.AuditAction;
import com.myfoundation.school.audit.AuditLogService;
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
    private final AuditLogService auditLogService;
    
    @Transactional
    public Category createCategory(AdminCategoryRequest request) {
        Category category = new Category();
        category.setName(request.getName());
        category.setSlug(request.getSlug());
        category.setDescription(request.getDescription());
        category.setIcon(request.getIcon());
        category.setColor(request.getColor());
        category.setImageUrl(request.getImageUrl());
        category.setDisplayOrder(request.getDisplayOrder());
        category.setActive(request.getActive());
        category.setCreatedAt(Instant.now());
        category.setUpdatedAt(Instant.now());

        Category saved = categoryRepository.save(category);
        auditLogService.log(AuditAction.CATEGORY_CREATED, "Category", saved.getId(), null, "Name: " + saved.getName());
        return saved;
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
        category.setImageUrl(request.getImageUrl());
        category.setDisplayOrder(request.getDisplayOrder());
        category.setActive(request.getActive());
        category.setUpdatedAt(Instant.now());

        Category saved = categoryRepository.save(category);
        auditLogService.log(AuditAction.CATEGORY_UPDATED, "Category", id, null, "Name: " + saved.getName());
        return saved;
    }

    @Transactional
    public void deleteCategory(String id) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Category not found"));
        categoryRepository.delete(category);
        auditLogService.log(AuditAction.CATEGORY_DELETED, "Category", id, null, "Name: " + category.getName());
    }
}
