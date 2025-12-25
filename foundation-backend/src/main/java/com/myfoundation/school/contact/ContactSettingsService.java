package com.myfoundation.school.contact;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
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
        
        return response;
    }
    
    @Transactional
    public ContactInfoResponse updateContactInfo(ContactInfoRequest request) {
        ContactSettings settings = contactSettingsRepository.findAll()
                .stream()
                .findFirst()
                .orElse(new ContactSettings());
        
        settings.setEmail(request.getEmail());
        settings.setLocationsJson(serializeLocations(request.getLocations()));
        
        if (settings.getId() == null) {
            settings.setCreatedAt(Instant.now());
        }
        settings.setUpdatedAt(Instant.now());
        
        contactSettingsRepository.save(settings);
        
        log.info("Contact settings updated successfully");
        
        ContactInfoResponse response = new ContactInfoResponse();
        response.setEmail(settings.getEmail());
        response.setLocations(request.getLocations());
        
        return response;
    }
    
    @Transactional
    public void initializeDefaultSettings() {
        if (contactSettingsRepository.count() == 0) {
            ContactSettings settings = new ContactSettings();
            settings.setEmail("hopefoundationysv@gmail.com");
            
            List<ContactLocation> defaultLocations = new ArrayList<>();
            
            ContactLocation ireland = new ContactLocation();
            ireland.setLabel("Ireland");
            ireland.setLines(Arrays.asList("4 Sorrel Green", "Sorrel Woods", "Blessington", "Ireland"));
            ireland.setPostalLabel("Eircode");
            ireland.setPostalCode("W91PR6F");
            ireland.setMobile("+353 899540707");
            defaultLocations.add(ireland);
            
            ContactLocation india = new ContactLocation();
            india.setLabel("India");
            india.setLines(Arrays.asList("Yugal Savitri Bhavan", "Building Number 88", "Hazaribagh", "Jharkhand", "India"));
            india.setPostalLabel("Pincode");
            india.setPostalCode("829301");
            india.setMobile("+91 9987379321");
            defaultLocations.add(india);
            
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
        
        List<ContactLocation> defaultLocations = new ArrayList<>();
        
        ContactLocation ireland = new ContactLocation();
        ireland.setLabel("Ireland");
        ireland.setLines(Arrays.asList("4 Sorrel Green", "Sorrel Woods", "Blessington", "Ireland"));
        ireland.setPostalLabel("Eircode");
        ireland.setPostalCode("W91PR6F");
        ireland.setMobile("+353 899540707");
        defaultLocations.add(ireland);
        
        ContactLocation india = new ContactLocation();
        india.setLabel("India");
        india.setLines(Arrays.asList("Yugal Savitri Bhavan", "Building Number 88", "Hazaribagh", "Jharkhand", "India"));
        india.setPostalLabel("Pincode");
        india.setPostalCode("829301");
        india.setMobile("+91 9987379321");
        defaultLocations.add(india);
        
        response.setLocations(defaultLocations);
        
        return response;
    }
    
    private String serializeLocations(List<ContactLocation> locations) {
        try {
            return objectMapper.writeValueAsString(locations);
        } catch (JsonProcessingException e) {
            log.error("Error serializing locations", e);
            return "[]";
        }
    }
    
    private List<ContactLocation> deserializeLocations(String json) {
        try {
            return objectMapper.readValue(json, new TypeReference<List<ContactLocation>>() {});
        } catch (JsonProcessingException e) {
            log.error("Error deserializing locations", e);
            return new ArrayList<>();
        }
    }
}
