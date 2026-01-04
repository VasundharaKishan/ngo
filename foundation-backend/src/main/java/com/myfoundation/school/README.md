# Backend Services

This directory contains service layer classes that implement business logic for the application.

## Services

### `CampaignService.java`
Handles campaign-related business logic and data retrieval.

**Key Methods:**
- `getCampaigns(categoryId, featured, urgent)` - Get campaigns with filters
- `getAllActiveCampaigns()` - Get all active campaigns
- `getCampaignById(id)` - Get single campaign by ID
- `getCampaignForPopup(campaignId)` - Get campaign for donate popup
- `getFallbackCampaignForPopup()` - Get fallback campaign (newest, featured, urgent)
- `getCampaignSummary(campaignId)` - Get campaign summary (for admin)

**Features:**
- Filters by category, featured flag, urgent flag
- Calculates donation progress percentage
- Provides DTOs for different use cases (full, popup, summary)
- Transactions with `@Transactional(readOnly = true)`

**Business Logic:**
- Progress calculation: `(currentAmount / targetAmount) * 100`
- Fallback campaign selection: featured > urgent > newest active
- Badge text logic: "Urgent Need" for urgent campaigns, "Active Campaign" otherwise

### `DonationService.java`
Handles donation processing and Stripe integration.

**Key Methods:**
- `createStripeCheckoutSession(request)` - Create Stripe checkout session
- `handleStripeWebhook(payload, signature)` - Process Stripe webhook events
- `getDonations(filters, pageable)` - Get paginated donations with filters
- `getDonationById(id)` - Get single donation
- `getDonationStats()` - Get donation statistics (total amount, count, etc.)

**Features:**
- Stripe Checkout Session creation
- Webhook event processing (payment success, failure)
- Pagination and filtering (status, campaign, date range)
- Transaction management with `@Transactional`
- Email notifications (TODO - not yet implemented)

**Business Logic:**
- Donation status workflow: PENDING → COMPLETED (on success) or FAILED (on failure)
- Amount validation: must be positive
- Campaign validation: must exist and be active
- Stripe session metadata includes donationId and campaignId

**Webhook Events Handled:**
- `checkout.session.completed` - Payment succeeded, mark donation as COMPLETED
- `checkout.session.expired` - Session expired, mark donation as FAILED
- `checkout.session.async_payment_failed` - Payment failed, mark donation as FAILED

### `CategoryService.java`
Manages campaign categories.

**Key Methods:**
- `getAllCategories()` - Get all categories
- `getCategoryById(id)` - Get category by ID
- `createCategory(request)` - Create new category
- `updateCategory(id, request)` - Update existing category
- `deleteCategory(id)` - Delete category (if no campaigns using it)

**Features:**
- CRUD operations for categories
- Validation (name required, icon optional)
- Cascade protection (can't delete category with campaigns)

**Business Logic:**
- Category names must be unique
- Soft delete or prevent deletion if campaigns exist
- Icon field is optional (for displaying category badges)

### `SiteConfigService.java`
Manages site-wide configuration settings.

**Key Methods:**
- `getSiteConfig()` - Get current site configuration
- `updateSiteConfig(request)` - Update site configuration
- `getConfigValue(key)` - Get specific config value
- `setConfigValue(key, value)` - Set specific config value

**Features:**
- Key-value configuration storage
- Default values for missing keys
- Validation for numeric values (featuredCampaignsCount, itemsPerPage)

**Configuration Keys:**
- `site.name` - Site name (default: "Foundation")
- `site.logo` - Logo URL
- `site.featuredCampaignsCount` - Number of featured campaigns on homepage (default: 3)
- `site.itemsPerPage` - Items per page in listings (default: 12)

### `ContactSettingsService.java`
Manages contact information displayed on the website.

**Key Methods:**
- `getContactSettings()` - Get current contact info
- `updateContactSettings(request)` - Update contact info
- `getPublicContactInfo()` - Get contact info for public display

**Features:**
- Email, phone, address storage
- Validation (email format, phone format)
- Public vs admin views (all fields vs display-only fields)

**Business Logic:**
- Email must be valid format
- Phone number must be valid format
- Address can be multiline (stored as text)

### `AdminUserService.java`
Handles admin user management and authentication.

**Key Methods:**
- `sendOtp(email)` - Generate and send OTP to admin email
- `verifyOtp(email, otp)` - Verify OTP and generate JWT token
- `getAllAdminUsers()` - Get all admin users
- `createAdminUser(request)` - Create new admin user
- `deleteAdminUser(id)` - Delete admin user
- `setupPassword(token, password)` - Setup password for new admin user

**Features:**
- OTP-based authentication (no passwords stored)
- JWT token generation (stored in httpOnly cookie)
- Role-based access (ADMIN, OPERATOR)
- Email notifications for OTP

**Business Logic:**
- OTP expires after 10 minutes
- OTP is 6 digits
- JWT token expires after 24 hours
- Max 5 failed OTP attempts before lockout
- Password must be at least 8 characters (if password auth is enabled)

## Common Patterns

### Transaction Management
```java
@Transactional(readOnly = true)  // For read-only operations (optimization)
public List<Entity> getAll() {
    return repository.findAll();
}

@Transactional  // For write operations (default)
public Entity create(Request request) {
    Entity entity = new Entity();
    // Set properties
    return repository.save(entity);
}
```

### DTO Mapping
```java
private EntityResponse toDto(Entity entity) {
    return EntityResponse.builder()
            .id(entity.getId())
            .name(entity.getName())
            .build();
}
```

### Error Handling
```java
public Entity getById(String id) {
    return repository.findById(id)
            .orElseThrow(() -> new RuntimeException("Entity not found with id: " + id));
}
```

### Logging
```java
@Slf4j  // Lombok annotation
public class MyService {
    public void method() {
        log.info("Operation started");
        log.debug("Details: {}", details);
        log.error("Error occurred", exception);
    }
}
```

## Best Practices

### Service Layer Responsibilities
- Business logic implementation
- Data validation
- Transaction management
- DTO mapping
- Error handling
- Logging

### What NOT to do in Services
- Direct HTTP request/response handling (that's in controllers)
- HTML rendering (use REST APIs)
- Database queries (use repositories)
- Complex SQL (use JPA/Hibernate)

### Naming Conventions
- Service class: `EntityService` (e.g., `CampaignService`)
- Method names: `getEntity`, `createEntity`, `updateEntity`, `deleteEntity`
- Boolean methods: `isValid`, `hasPermission`, `canDelete`
- Query methods: `findByName`, `searchByKeyword`

### Documentation
- Add JavaDoc for all public methods
- Document business rules
- Explain complex logic
- Add @param and @return tags

Example:
```java
/**
 * Calculate donation progress percentage.
 * 
 * Business Logic:
 * - Progress = (currentAmount / targetAmount) * 100
 * - Capped at 100% even if over-funded
 * - Returns 0 if targetAmount is 0 or null
 * 
 * @param currentAmount The total amount donated so far (in cents)
 * @param targetAmount The target fundraising goal (in cents)
 * @return Progress percentage (0-100)
 */
private int calculateProgress(Long currentAmount, Long targetAmount) {
    if (targetAmount == null || targetAmount == 0) return 0;
    if (currentAmount == null) return 0;
    int progress = (int) ((currentAmount * 100) / targetAmount);
    return Math.min(progress, 100);  // Cap at 100%
}
```

## Testing

Services should have unit tests:

```java
@SpringBootTest
class CampaignServiceTest {
    @Autowired
    private CampaignService campaignService;
    
    @MockBean
    private CampaignRepository campaignRepository;
    
    @Test
    void getCampaignById_Success() {
        // Arrange
        Campaign campaign = new Campaign();
        campaign.setId("1");
        when(campaignRepository.findById("1")).thenReturn(Optional.of(campaign));
        
        // Act
        CampaignResponse response = campaignService.getCampaignById("1");
        
        // Assert
        assertNotNull(response);
        assertEquals("1", response.getId());
    }
}
```

Run tests:
```bash
mvn test
```

## Dependencies

Services depend on:
- Spring Framework (`@Service`, `@Transactional`)
- JPA Repositories (data access)
- DTOs (data transfer)
- Entities (domain models)
- External APIs (Stripe, email service)

## Adding New Services

1. Create service class in appropriate package
2. Add `@Service` annotation
3. Add `@Slf4j` for logging
4. Add `@RequiredArgsConstructor` for constructor injection
5. Add `@Transactional` annotations
6. Implement business logic methods
7. Add comprehensive JavaDoc
8. Write unit tests
9. Update this README

## Security Considerations

- Validate all inputs
- Check permissions before operations
- Don't expose sensitive data in logs
- Use parameterized queries (JPA does this)
- Sanitize user inputs
- Implement rate limiting for authentication
