package com.myfoundation.school.contact;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.myfoundation.school.exception.ValidationException;
import com.myfoundation.school.validation.ValidationUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class ContactSettingsService {
    
    private final ContactSettingsRepository contactSettingsRepository;
    private final ObjectMapper objectMapper;
    
    @Transactional(readOnly = true)
    public ContactInfoResponse getContactInfo() {
        ContactSettings settings = contactSettingsRepository.findAll()
                .stream()
                .findFirst()
                .orElse(null);
        
        if (settings == null) {
            return getDefaultContactInfo();
        }
        
        ContactInfoResponse response = new ContactInfoResponse();
        response.setEmail(settings.getEmail());
        response.setLocations(deserializeLocations(settings.getLocationsJson()));
        response.setShowInFooter(settings.getShowInFooter());
        
        return response;
    }
    
    @Transactional
    public ContactInfoResponse updateContactInfo(ContactInfoRequest request) {
        // Issue 7: Email validation
        String email = request.getEmail();
        if (ValidationUtils.isNotBlank(email) && !ValidationUtils.isValidEmail(email)) {
            throw new ValidationException("Invalid email format: " + email);
        }
        
        // Issue 8: Phone number validation for all locations
        if (request.getLocations() != null) {
            for (ContactLocation location : request.getLocations()) {
                if (location.getMobile() != null && !location.getMobile().isEmpty()) {
                    if (!ValidationUtils.isValidPhoneNumber(location.getMobile())) {
                        throw new ValidationException(
                            "Invalid phone number format for " + location.getLabel() + ": " + location.getMobile()
                        );
                    }
                }
            }
        }
        
        ContactSettings settings = contactSettingsRepository.findAll()
                .stream()
                .findFirst()
                .orElse(new ContactSettings());
        
        settings.setEmail(email);
        settings.setLocationsJson(serializeLocations(request.getLocations()));
        settings.setShowInFooter(request.getShowInFooter() != null ? request.getShowInFooter() : true);
        
        if (settings.getId() == null) {
            settings.setCreatedAt(Instant.now());
        }
        settings.setUpdatedAt(Instant.now());
        
        contactSettingsRepository.save(settings);
        
        log.info("Contact settings updated successfully");
        
        ContactInfoResponse response = new ContactInfoResponse();
        response.setEmail(settings.getEmail());
        response.setLocations(request.getLocations());
        response.setShowInFooter(settings.getShowInFooter());
        
        return response;
    }
    
    @Transactional
    public void initializeDefaultSettings() {
        if (contactSettingsRepository.count() == 0) {
            ContactSettings settings = new ContactSettings();
            settings.setEmail("hopefoundationysv@gmail.com");
            
            // Issue 9: DRY - Use helper method to avoid duplicate code
            List<ContactLocation> defaultLocations = createDefaultLocations();
            
            settings.setLocationsJson(serializeLocations(defaultLocations));
            settings.setCreatedAt(Instant.now());
            settings.setUpdatedAt(Instant.now());
            
            contactSettingsRepository.save(settings);
            log.info("Initialized default contact settings");
        }
    }
    
    private ContactInfoResponse getDefaultContactInfo() {
        ContactInfoResponse response = new ContactInfoResponse();
        response.setEmail("hopefoundationysv@gmail.com");
        
        // Issue 9: DRY - Use helper method to avoid duplicate code
        response.setLocations(createDefaultLocations());
        response.setShowInFooter(true);
        
        return response;
    }
    
    // Issue 9: DRY - Extract common default locations creation
    private List<ContactLocation> createDefaultLocations() {
        List<ContactLocation> locations = new ArrayList<>();
        
        ContactLocation ireland = new ContactLocation();
        ireland.setLabel("Ireland");
        ireland.setLines(Arrays.asList("4 Sorrel Green", "Sorrel Woods", "Blessington", "Ireland"));
        ireland.setPostalLabel("Eircode");
        ireland.setPostalCode("W91PR6F");
        ireland.setMobile("+353 899540707");
        locations.add(ireland);
        
        ContactLocation india = new ContactLocation();
        india.setLabel("India");
        india.setLines(Arrays.asList("Yugal Savitri Bhavan", "Building Number 88", "Hazaribagh", "Jharkhand", "India"));
        india.setPostalLabel("Pincode");
        india.setPostalCode("829301");
        india.setMobile("+91 9987379321");
        locations.add(india);
        
        return locations;
    }
    
    private String serializeLocations(List<ContactLocation> locations) {
        try {
            return objectMapper.writeValueAsString(locations);
        } catch (JsonProcessingException e) {
            log.error("Error serializing locations", e);
            // Issue 10: Throw exception instead of silently returning empty array
            throw new ValidationException("Failed to serialize contact locations: " + e.getMessage());
        }
    }
    
    private List<ContactLocation> deserializeLocations(String json) {
        try {
            return objectMapper.readValue(json, new TypeReference<List<ContactLocation>>() {});
        } catch (JsonProcessingException e) {
            log.error("Error deserializing locations", e);
            // Issue 10: Throw exception instead of silently returning empty list
            throw new ValidationException("Failed to deserialize contact locations from database: " + e.getMessage());
        }
    }
}
