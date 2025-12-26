# Spotlight Campaign Feature - Visual Guide

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER CLICKS "DONATE NOW"                  │
└─────────────────────────────────┬───────────────────────────────┘
                                  │
                                  ▼
         ┌────────────────────────────────────────────┐
         │  FeaturedCampaignModal.tsx                 │
         │  Calls: api.getDonatePopup()               │
         └────────────────┬───────────────────────────┘
                          │
                          ▼
         ┌────────────────────────────────────────────┐
         │  GET /api/config/public/donate-popup       │
         │  PublicConfigController.java               │
         └────────────────┬───────────────────────────┘
                          │
                          ▼
         ┌────────────────────────────────────────────┐
         │  Check SiteConfig for spotlight_campaign_id│
         │  SiteConfigService.getConfigValue(...)     │
         └────────────────┬───────────────────────────┘
                          │
                ┌─────────┴──────────┐
                │                    │
                ▼                    ▼
    ┌─────────────────┐   ┌────────────────────┐
    │ Spotlight Set?  │   │ Spotlight Not Set  │
    │ Campaign Active?│   │ or Inactive        │
    └────────┬────────┘   └─────────┬──────────┘
             │                       │
             ▼                       ▼
    ┌─────────────────┐   ┌────────────────────┐
    │ Return Spotlight│   │ Find Fallback:     │
    │ mode="SPOTLIGHT"│   │ featured > urgent  │
    │                 │   │ > updatedAt DESC   │
    └────────┬────────┘   └─────────┬──────────┘
             │                       │
             └───────────┬───────────┘
                         ▼
              ┌─────────────────────┐
              │  DonatePopupResponse│
              │  {                  │
              │    campaign: {...}  │
              │    mode: "..."      │
              │    fallbackReason   │
              │  }                  │
              └──────────┬──────────┘
                         │
                         ▼
              ┌─────────────────────┐
              │  Modal displays     │
              │  campaign with:     │
              │  - Image            │
              │  - Title            │
              │  - Description      │
              │  - Progress bar     │
              │  - Badge            │
              │  - Donate/Learn CTA │
              └─────────────────────┘
```

## Admin Configuration Flow

```
┌─────────────────────────────────────────────────────────────────┐
│               ADMIN NAVIGATES TO DONATE POPUP SETTINGS           │
└─────────────────────────────────┬───────────────────────────────┘
                                  │
                                  ▼
         ┌────────────────────────────────────────────┐
         │  AdminDonatePopupSettings.tsx              │
         │  1. Fetch active campaigns                 │
         │  2. Fetch current spotlight settings       │
         └────────────────┬───────────────────────────┘
                          │
                          ▼
         ┌────────────────────────────────────────────┐
         │  Display:                                  │
         │  ┌──────────────────────────────────────┐ │
         │  │ Current Spotlight Campaign (if set)  │ │
         │  │ - Title, Status, Category            │ │
         │  └──────────────────────────────────────┘ │
         │  ┌──────────────────────────────────────┐ │
         │  │ Dropdown: Select Campaign            │ │
         │  │ - Shows only active campaigns        │ │
         │  │ - Featured (⭐) Urgent (🔥) badges   │ │
         │  └──────────────────────────────────────┘ │
         │  [Save Changes]  [Clear Spotlight]        │
         └────────────────┬───────────────────────────┘
                          │
                          ▼
         ┌────────────────────────────────────────────┐
         │  PUT /api/admin/config/donate-popup        │
         │  AdminContactController.java               │
         │  {                                         │
         │    campaignId: "..." or null               │
         │  }                                         │
         └────────────────┬───────────────────────────┘
                          │
                          ▼
         ┌────────────────────────────────────────────┐
         │  Validation:                               │
         │  1. Campaign exists?                       │
         │  2. Campaign active?                       │
         └────────────────┬───────────────────────────┘
                          │
                ┌─────────┴──────────┐
                │                    │
                ▼                    ▼
    ┌─────────────────┐   ┌────────────────────┐
    │   Valid         │   │   Invalid          │
    └────────┬────────┘   └─────────┬──────────┘
             │                       │
             ▼                       ▼
    ┌─────────────────┐   ┌────────────────────┐
    │ Update SiteConfig│   │ Return 400 Bad     │
    │ Save to DB       │   │ Request            │
    └────────┬────────┘   └─────────┬──────────┘
             │                       │
             ▼                       ▼
    ┌─────────────────┐   ┌────────────────────┐
    │ Return 200       │   │ Show error toast   │
    │ Success response │   │                    │
    └────────┬────────┘   └────────────────────┘
             │
             ▼
    ┌─────────────────┐
    │ Show success     │
    │ toast            │
    │ Reload settings  │
    └──────────────────┘
```

## Database Schema

```
┌──────────────────────────────────────────┐
│            site_config                    │
├──────────────────────────────────────────┤
│ id              VARCHAR PRIMARY KEY       │
│ config_key      VARCHAR UNIQUE            │
│ config_value    VARCHAR                   │
│ description     TEXT                      │
│ created_at      TIMESTAMP                 │
│ updated_at      TIMESTAMP                 │
└──────────────────────────────────────────┘
          │
          │ Contains row:
          │ config_key = "donate_popup.spotlight_campaign_id"
          │ config_value = "550e8400-..." or null
          │
          └──────────────────┐
                             │
                             ▼ References
┌──────────────────────────────────────────┐
│            campaigns                      │
├──────────────────────────────────────────┤
│ id              VARCHAR PRIMARY KEY       │
│ title           VARCHAR                   │
│ active          BOOLEAN                   │
│ featured        BOOLEAN                   │
│ urgent          BOOLEAN                   │
│ target_amount   BIGINT                    │
│ image_url       VARCHAR                   │
│ ...                                       │
└──────────────────────────────────────────┘
```

## UI Screenshots (Descriptions)

### Public Modal - Spotlight Campaign
```
┌───────────────────────────────────────────────────────────┐
│                           [ X ]                           │
├─────────────────────┬─────────────────────────────────────┤
│                     │  🤝 in support of                   │
│   [Campaign Image]  │  Yugal Savitri Seva                │
│                     │                                     │
│   ┌──────────────┐  │  Education for Rural Children       │
│   │ Urgent Need  │  │                                     │
│   └──────────────┘  │  🌟 We are actively working on this!│
│                     │  Your contribution will directly... │
│                     │                                     │
│                     │  Help us provide quality education  │
│                     │  to children in rural areas...      │
│                     │                                     │
│                     │  [█████████░░░░] 64%                │
│                     │  €32,000 raised  €50,000 goal       │
│                     │                                     │
│                     │  [  Donate Now  ] [ Learn More ]    │
│                     │                                     │
│                     │  Want to explore other campaigns?   │
│                     │  Browse our campaign page...        │
│                     │                                     │
│                     │  🔒 Secure donation powered by Stripe│
└─────────────────────┴─────────────────────────────────────┘
```

### Admin Settings Page
```
┌───────────────────────────────────────────────────────────┐
│  Donate Popup Settings                                    │
│  Choose which campaign appears when users click...        │
│                                                           │
│  ┌─────────────────────────────────────────────────────┐ │
│  │ 🌟 CURRENT SPOTLIGHT CAMPAIGN                       │ │
│  │                                                     │ │
│  │ Education for Rural Children                        │ │
│  │ Status: Active    Category: Education              │ │
│  └─────────────────────────────────────────────────────┘ │
│                                                           │
│  Spotlight Campaign                                       │
│  Select a campaign to feature in the Donate Now popup     │
│                                                           │
│  ┌─────────────────────────────────────────────────────┐ │
│  │ Education for Rural Children ⭐ ▼                   │ │
│  └─────────────────────────────────────────────────────┘ │
│                                                           │
│  [ Save Changes ]  [ Clear Spotlight ]                    │
│                                                           │
│  ┌─────────────────────────────────────────────────────┐ │
│  │ 💡 HOW IT WORKS                                     │ │
│  │ • When a spotlight campaign is set, it will always  │ │
│  │   appear in the Donate Now popup                    │ │
│  │ • If no spotlight is set, the system shows the most │ │
│  │   recent active campaign...                         │ │
│  └─────────────────────────────────────────────────────┘ │
└───────────────────────────────────────────────────────────┘
```

## Decision Tree

```
                    User clicks "Donate Now"
                            │
                            ▼
                 Is spotlight_campaign_id set?
                            │
                ┌───────────┴───────────┐
                │                       │
               YES                     NO
                │                       │
                ▼                       ▼
    Is spotlight campaign active?   Find best fallback
                │                   (featured > urgent
        ┌───────┴───────┐            > updatedAt DESC)
        │               │                  │
       YES             NO                  │
        │               │                  │
        ▼               └──────────────────┘
    Show spotlight                         │
    mode="SPOTLIGHT"                       │
                                          ▼
                              ┌──────────────────────┐
                              │  Any active          │
                              │  campaigns?          │
                              └──────┬───────────────┘
                                     │
                            ┌────────┴────────┐
                            │                 │
                           YES               NO
                            │                 │
                            ▼                 ▼
                      Show fallback    Show error state
                      mode="FALLBACK"  "No campaigns
                                        available"
```

## Integration Points

### With Existing Features
- **Campaign Management**: Spotlight selection from existing campaigns
- **Category System**: Category info displayed in modal
- **Donation Flow**: "Donate Now" button uses existing `/donate/{id}` route
- **Campaign Details**: "Learn More" button uses existing `/campaigns/{id}` route
- **Admin Auth**: Uses existing JWT authentication for admin endpoints

### With Future Features
- **Analytics Dashboard**: Track spotlight campaign performance
- **Email Campaigns**: Reference spotlight campaign in newsletters
- **Social Sharing**: Share spotlight campaign on social media
- **Reports**: Include spotlight data in donation reports

## State Management

### Frontend State
```typescript
// FeaturedCampaignModal
[campaign, setCampaign] = useState<CampaignPopupDto | null>(null)
[loading, setLoading] = useState(true)
[error, setError] = useState<string | null>(null)

// AdminDonatePopupSettings
[campaigns, setCampaigns] = useState<Campaign[]>([])
[settings, setSettings] = useState<DonatePopupSettingsResponse | null>(null)
[selectedCampaignId, setSelectedCampaignId] = useState<string>('')
[saving, setSaving] = useState(false)
```

### Backend State
```java
// Stored in database
SiteConfig {
  configKey: "donate_popup.spotlight_campaign_id"
  configValue: "campaign-uuid" or null
}

// Cached in memory (if implemented)
private String cachedSpotlightCampaignId;
```

## Error Handling

### Backend Errors
- Campaign not found → 400 Bad Request
- Campaign inactive → 400 Bad Request
- Database error → 500 Internal Server Error
- Authentication error → 401 Unauthorized

### Frontend Errors
- API fetch fails → Show error toast
- No campaigns available → Show friendly error message in modal
- Invalid selection → Disable save button
- Network error → Retry with exponential backoff

## Performance Metrics

### Database Queries
- Public endpoint: 1-2 queries (config + campaign)
- Admin endpoint GET: 1-2 queries (config + campaign summary)
- Admin endpoint PUT: 2-3 queries (validation + config update)

### Response Times
- Public endpoint: < 100ms (single campaign fetch)
- Admin GET: < 150ms (includes campaign details)
- Admin PUT: < 200ms (includes validation)

### Caching Strategy (Future)
- Cache spotlight campaign ID in memory
- Invalidate on admin update
- TTL: 5 minutes or event-driven

## Monitoring & Observability

### Metrics to Track
- Spotlight campaign views
- Conversion rate (popup → donation)
- Fallback usage percentage
- Error rate
- Response time

### Logs to Monitor
```
INFO: Returning spotlight campaign: {campaignId}
INFO: Spotlight campaign {id} not found or inactive, falling back
WARN: No active campaigns available for donate popup
ERROR: Failed to fetch spotlight campaign settings
```

---

**Visual Guide Version**: 1.0
**Last Updated**: 2024-12-25
