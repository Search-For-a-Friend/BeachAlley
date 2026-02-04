# 🌴 Beach Alley - Game Data Model Specification
## Schema Reference Document
### Version 1.1 | February 2026

---

# 📖 Overview

This document specifies the **data model architecture** for Beach Alley. All game entities are defined as interconnected schemas that the game engine uses to instantiate and simulate the beach resort.

## Design Principles

1. **Schema-Only**: This specification defines models, not instances
2. **Composable**: Complex entities are built from smaller, reusable models
3. **Typed**: All properties have explicit types with constraints
4. **Relational**: Models reference each other through typed relationships
5. **Extensible**: New establishment types inherit from base models
6. **Data-Driven Economy**: Supply chains, resources, and B2B relationships are first-class citizens

## Type Notation

```
"property": "type"                    - Required property
"property": "?type"                   - Optional property (nullable)
"property": ["type"]                  - Array of type
"property": "type:constraint"         - Type with constraint (e.g., "number:0-100")
"property": "enum:a|b|c"              - Enumeration
"property": "Type1|Type2"             - Union type
"_extends": "ParentModel"             - Inheritance
"_abstract": true                     - Cannot be instantiated directly
"_description": "..."                 - Model documentation
```

---

# 🔷 Core Models

## Entity (Base)

All game objects inherit from Entity:

```
Entity
├── id: string                        - Unique identifier
├── createdAt: timestamp              - Creation time
└── updatedAt: timestamp              - Last modified
```

## Position & Bounds

```
Position
├── x: number
└── y: number

Bounds
├── width: number
├── height: number
└── rotation: number
```

## Time Models

```
TimeRange
├── start: string:HH:mm
└── end: string:HH:mm

DateRange
├── start: GameDate
└── end: GameDate

DaySchedule
├── isOpen: boolean
├── openTime: string:HH:mm
├── closeTime: string:HH:mm
└── breaks: [TimeRange]

WeeklySchedule
├── monday: DaySchedule
├── tuesday: DaySchedule
├── wednesday: DaySchedule
├── thursday: DaySchedule
├── friday: DaySchedule
├── saturday: DaySchedule
└── sunday: DaySchedule
```

---

# 🏗️ Building Models

## Building (Base)

```
Building extends Entity
├── name: string
├── position: Position
├── bounds: Bounds
├── constructionCost: number
├── maintenanceCost: number
├── condition: number:0-100
└── style: string
```

## Residence

```
Residence extends Building
├── owner: ?Individual
├── residents: [Individual]
├── maxOccupants: number
├── monthlyRent: number
├── propertyValue: number
├── amenities: [ResidenceAmenity]
├── privacyLevel: number:1-5
├── viewQuality: number:0-100
└── beachAccess: boolean

ResidenceAmenity extends Entity
├── name: string
├── installCost: number
├── maintenanceCost: number
├── satisfactionBonus: number
└── propertyValueBonus: number
```

## Facility & Road

```
Facility extends Building
├── publicAccess: boolean
├── serviceRadius: number
├── capacityPerHour: number
└── operatingCost: number

Road extends Facility
├── lanes: number
├── speedLimit: number
├── pedestrianOnly: boolean
├── surfaceQuality: number:0-100
└── connectedRoads: [Road]
```

---

# 📦 Resource & Supply Chain System

The supply chain system enables B2B commerce between establishments. Suppliers (fishers, farmers, wholesalers) provide resources to establishments that transform them into products.

## Resource (Base)

```
Resource extends Entity
├── name: string
├── category: ResourceCategory
├── unit: string
├── basePrice: number
├── priceVolatility: number:0-100     - How much price fluctuates
├── perishable: boolean
├── shelfLife: ?number:days
├── storageRequirements: StorageRequirements
├── seasonalAvailability: ?SeasonalAvailability
└── qualityGrades: [QualityGrade]

ResourceCategory extends Entity
├── name: string
├── parentCategory: ?ResourceCategory  - Hierarchy support
├── storageType: enum:ambient|refrigerated|frozen|live|dry
└── handlingRequirements: string

QualityGrade extends Entity
├── name: string
├── tier: number:1-5
├── priceMultiplier: number
└── shelfLifeMultiplier: number

StorageRequirements
├── temperatureRange: ?PriceRange
├── humidity: ?PriceRange
└── specialConditions: [string]

SeasonalAvailability
├── peakMonths: [number:1-12]
├── availableMonths: [number:1-12]
├── peakPriceMultiplier: number
└── offSeasonPriceMultiplier: number
```

## Inventory Management

```
Inventory extends Entity
├── owner: Establishment
├── stocks: [ResourceStock]
├── storageCapacity: StorageCapacity
└── reorderRules: [ReorderRule]

ResourceStock extends Entity
├── resource: Resource
├── quantity: number
├── qualityGrade: QualityGrade
├── purchasePrice: number
├── purchaseDate: timestamp
├── expiryDate: ?timestamp
└── supplier: ?Supplier

StorageCapacity
├── ambient: number
├── refrigerated: number
├── frozen: number
└── live: number

ReorderRule
├── resource: Resource
├── minimumStock: number
├── reorderQuantity: number
├── preferredSupplier: ?Supplier
├── maxPrice: ?number
└── autoOrder: boolean
```

## Supplier Establishments

```
Supplier extends Establishment [ABSTRACT]
├── suppliedResources: [SuppliedResource]
├── deliverySchedule: WeeklySchedule
├── deliveryRadius: number
├── minimumOrderValue: number
├── paymentTerms: PaymentTerms
├── reliabilityRating: number:0-100
└── contracts: [SupplyContract]

SuppliedResource
├── resource: Resource
├── availableGrades: [QualityGrade]
├── pricePerUnit: number
├── minOrderQuantity: number
├── maxDailyCapacity: number
└── leadTime: number:hours

PaymentTerms
├── type: enum:prepaid|on_delivery|net_7|net_15|net_30
├── creditLimit: ?number
└── earlyPaymentDiscount: ?number
```

### Fisher

```
Fisher extends Supplier
├── boatType: BoatType
├── fishingMethod: FishingMethod
├── catchCapacity: number:kg_per_day
├── operatingZone: string
├── weatherDependency: WeatherDependency
├── certifications: [string]
└── sustainabilityRating: number:0-100

BoatType extends Entity
├── name: string
├── capacity: number
├── range: number:km
├── fuelCost: number:per_day
└── crewRequired: number

FishingMethod extends Entity
├── name: string
├── targetSpecies: [Resource]
├── bycatchRisk: number:0-100
└── sustainabilityImpact: number:-100-100
```

### Farmer

```
Farmer extends Supplier
├── farmType: enum:produce|dairy|livestock|mixed
├── landSize: number:hectares
├── irrigated: boolean
├── organic: boolean
├── certifications: [string]
└── harvestSchedule: [HarvestPeriod]

HarvestPeriod
├── resource: Resource
├── startMonth: number:1-12
├── endMonth: number:1-12
└── peakWeeks: [number:1-52]
```

### Wholesaler & Artisan

```
Wholesaler extends Supplier
├── warehouseCapacity: StorageCapacity
├── sourcingRegions: [string]
├── importCapability: boolean
└── coldChainCertified: boolean

Artisan extends Supplier
├── specialty: string                  - Baker, butcher, etc.
├── productionCapacity: number:units_per_day
├── customOrdersAccepted: boolean
└── leadTimeForCustom: number:days
```

## Supply Contracts (B2B)

```
SupplyContract extends Entity
├── supplier: Supplier
├── buyer: Establishment
├── resources: [ContractedResource]
├── startDate: GameDate
├── endDate: ?GameDate
├── status: enum:pending|active|suspended|terminated
├── exclusivity: boolean
├── volumeCommitment: ?VolumeCommitment
└── priceAgreement: PriceAgreement

ContractedResource
├── resource: Resource
├── qualityGrade: QualityGrade
├── agreedPrice: number
└── deliveryFrequency: enum:daily|twice_weekly|weekly|on_demand

VolumeCommitment
├── minimumWeekly: number
├── maximumWeekly: number
└── penaltyForUnderOrder: number

PriceAgreement
├── type: enum:fixed|market_linked|seasonal_adjusted
├── basePrice: number
├── marketLinkPercentage: ?number
└── reviewFrequency: ?string

SupplyOrder extends Entity
├── contract: ?SupplyContract
├── supplier: Supplier
├── buyer: Establishment
├── items: [OrderItem]
├── status: enum:placed|confirmed|in_transit|delivered|cancelled
├── orderDate: timestamp
├── expectedDelivery: timestamp
├── actualDelivery: ?timestamp
├── totalCost: number
└── qualityOnDelivery: ?number:0-100

OrderItem
├── resource: Resource
├── quantity: number
├── qualityGrade: QualityGrade
└── unitPrice: number
```

---

# 🏪 Market Establishment

Markets are where suppliers can sell directly to consumers and other establishments.

## Market

```
Market extends Establishment
├── marketType: MarketType
├── stalls: [MarketStall]
├── operatingDays: [number:0-6]
├── stallRentalFee: number:per_day
├── visitorCapacity: number
├── parkingSpaces: number
└── amenities: [MarketAmenity]

MarketType extends Entity
├── name: string
├── frequency: enum:daily|weekly|monthly|seasonal|special
├── primaryGoods: [ResourceCategory]
├── atmosphere: string
└── touristAppeal: number:0-100

MarketStall extends Entity
├── location: Position
├── size: enum:small|medium|large
├── covered: boolean
├── hasRefrigeration: boolean
├── hasPower: boolean
├── rentalPrice: number:per_day
├── currentVendor: ?MarketVendor
└── reservations: [StallReservation]

MarketVendor extends Entity
├── supplier: ?Supplier                - Link to supplier establishment
├── individual: ?Individual
├── vendorType: enum:producer|reseller|artisan|food_stall
├── offerings: [VendorOffering]
├── reputation: Reputation
├── regularStall: ?MarketStall
└── priceNegotiable: boolean

VendorOffering
├── resource: Resource
├── qualityGrade: QualityGrade
├── pricePerUnit: number
├── availableQuantity: number
├── isOrganic: boolean
└── isLocal: boolean

StallReservation extends Entity
├── stall: MarketStall
├── vendor: MarketVendor
├── date: GameDate
├── paid: boolean
└── status: enum:reserved|confirmed|cancelled|no_show

MarketAmenity extends Entity
├── name: string
├── type: enum:seating|restroom|atm|info_booth|entertainment|food_court
└── capacity: ?number
```

## Caravan (Mobile Market)

```
Caravan extends Establishment
├── vehicleType: VehicleType
├── route: [CaravanStop]
├── offerings: [VendorOffering]
├── operatingSchedule: WeeklySchedule
└── socialMediaPresence: SocialPresence

VehicleType extends Entity
├── name: string
├── capacity: number
├── hasRefrigeration: boolean
├── hasCookingFacility: boolean
├── fuelCost: number:per_km
└── maintenanceCost: number:per_month

CaravanStop
├── location: Position
├── zone: string
├── arrivalTime: string:HH:mm
├── departureTime: string:HH:mm
├── daysOfWeek: [number:0-6]
├── permitRequired: boolean
└── permitCost: ?number
```

---

# 🏪 Establishment System

## Base Establishment

All commercial entities inherit from this abstract model:

```
Establishment extends Building [ABSTRACT]
├── brandName: string
├── description: string
├── foundedDate: timestamp
├── status: enum:closed|open|renovating|peak
├── schedule: WeeklySchedule
├── capacity: Capacity
├── staff: [StaffAssignment]
├── priceLevel: number:1-5
├── features: [EstablishmentFeature]
├── restrictions: [EstablishmentRestriction]
├── reputation: Reputation
├── financials: EstablishmentFinancials
├── inventory: ?Inventory             - Link to supply chain
├── supplyContracts: [SupplyContract] - B2B relationships
└── socialPresence: ?SocialPresence   - Link to social system

Capacity
├── total: number
├── seated: number
├── standing: number
├── outdoor: number
└── current: number

Reputation
├── averageRating: number:0-5
├── totalReviews: number
├── trendingScore: number:0-100
├── categoryRank: number
├── socialBuzz: number:0-100          - Social media activity
└── mediaExposure: number:0-100       - Press coverage

EstablishmentFinancials
├── dailyRevenue: number
├── dailyCosts: number
├── profitMargin: number
└── supplyCosts: number               - Supply chain costs

SocialPresence
├── handles: [SocialHandle]
├── totalFollowers: number
├── engagementRate: number:0-100
├── postFrequency: enum:never|rare|weekly|daily|multiple_daily
├── responseTime: enum:none|slow|moderate|fast|instant
└── verifiedAccount: boolean

SocialHandle
├── platform: SocialPlatform
├── handle: string
├── followers: number
└── verified: boolean
```

## Features & Restrictions

```
EstablishmentFeature extends Entity
├── name: string
├── installCost: number
├── maintenanceCost: number
├── attractivenessBonus: number
└── targetDemographics: [PeopleCategory]

EstablishmentRestriction extends Entity
├── name: string
├── minimumAge: ?number
├── requiresReservation: boolean
├── requiresMembership: boolean
└── dressCode: ?string
```

---

# 🍽️ Restaurant Model

```
Restaurant extends Establishment
├── cuisineType: CuisineType
├── menu: Menu
├── averageMealDuration: number:minutes
├── turnoverRate: number
├── kitchenCapacity: number
├── hasWaiterService: boolean
├── hasBarArea: boolean
├── hasTerrace: boolean
├── healthRating: string:A|B|C
├── happyHour: ?HappyHour
└── chefProfile: ?ChefProfile

ChefProfile extends Entity
├── name: string
├── specialty: CuisineType
├── experience: number:years
├── awards: [Award]
├── mediaAppearances: number
├── socialFollowing: number
└── signatureDishes: [MenuItem]

Award extends Entity
├── name: string
├── organization: string
├── year: number
└── prestige: number:1-5
```

### Cuisine & Menu

```
CuisineType extends Entity
├── name: string
├── originRegion: string
├── typicalResources: [Resource]      - Links to supply chain
├── priceMultiplier: number
└── preparationComplexity: number:1-5

Menu extends Entity
├── sections: [MenuSection]
├── lastUpdated: timestamp
└── seasonalRotation: boolean

MenuSection extends Entity
├── name: string
├── displayOrder: number
├── availableHours: ?TimeRange
└── items: [MenuItem]
```

### Menu Items & Recipes

```
MenuItem extends Entity
├── name: string
├── description: string
├── price: number
├── recipe: Recipe                    - Links to resources
├── preparationTime: number:minutes
├── dietary: [DietaryTag]
├── allergens: [string]
├── popularity: number:0-100
├── isSignature: boolean
├── isAvailable: boolean
└── photoUrl: ?string

Recipe extends Entity
├── ingredients: [RecipeIngredient]
├── productionCost: number            - Calculated from ingredients
├── skillRequired: number:1-5
└── equipmentRequired: [string]

RecipeIngredient
├── resource: Resource                - Direct link to supply chain
├── quantity: number
├── qualityMinimum: QualityGrade
└── substitutes: [Resource]

DietaryTag extends Entity
├── name: string
├── icon: string
└── description: string

HappyHour
├── enabled: boolean
├── days: [number:0-6]
├── timeRange: TimeRange
├── discountPercent: number
└── applicableCategories: [MenuSection]
```

---

# 🎭 Event System

Events, concerts, and festivals drive tourist interest and create economic opportunities.

## Event (Base)

```
Event extends Entity [ABSTRACT]
├── name: string
├── description: string
├── dateRange: DateRange
├── schedule: EventSchedule
├── venue: Venue
├── organizer: EventOrganizer
├── capacity: number
├── ticketing: ?TicketingInfo
├── status: enum:announced|tickets_on_sale|sold_out|ongoing|completed|cancelled
├── targetAudience: [PeopleCategory]
├── marketing: EventMarketing
└── impact: EventImpact

EventSchedule
├── setupDate: GameDate
├── openingDate: GameDate
├── closingDate: GameDate
├── teardownDate: GameDate
├── dailySchedule: ?WeeklySchedule
└── keyMoments: [ScheduledMoment]

ScheduledMoment
├── name: string
├── dateTime: timestamp
├── duration: number:minutes
└── description: string

EventImpact
├── expectedAttendance: number
├── actualAttendance: ?number
├── touristMultiplier: number
├── revenueImpact: number
├── reputationImpact: number
├── mediaReach: number
└── socialMentions: number
```

## Venue

```
Venue extends Entity
├── name: string
├── type: VenueType
├── location: Position
├── capacity: VenueCapacity
├── facilities: [VenueFacility]
├── technicalSpecs: TechnicalSpecs
├── rentalCost: number:per_day
├── availabilityCalendar: [VenueBooking]
└── reputation: Reputation

VenueType extends Entity
├── name: string
├── indoor: boolean
├── weatherDependent: boolean
├── acoustics: number:1-5
└── suitableEvents: [string]

VenueCapacity
├── standing: number
├── seated: number
├── vip: number
└── backstage: number

VenueFacility extends Entity
├── name: string
├── type: enum:stage|bar|vip_area|restroom|parking|green_room|technical_booth
└── capacity: ?number

TechnicalSpecs
├── stageSize: Bounds
├── soundSystem: string
├── lightingRig: string
├── powerCapacity: number:kw
├── hasProjection: boolean
└── hasLedWalls: boolean

VenueBooking extends Entity
├── venue: Venue
├── event: ?Event
├── dateRange: DateRange
├── status: enum:hold|confirmed|cancelled
└── cost: number
```

## Event Organizer & Ticketing

```
EventOrganizer extends Entity
├── name: string
├── type: enum:resort|external|artist_management|sponsor|municipal
├── contact: Contact
├── pastEvents: [Event]
└── reputation: number:0-100

Contact
├── email: string
├── phone: string
└── website: ?string

TicketingInfo
├── tiers: [TicketTier]
├── salesStartDate: GameDate
├── salesEndDate: GameDate
├── soldCount: number
└── revenueGenerated: number

TicketTier extends Entity
├── name: string
├── price: number
├── quantity: number
├── soldCount: number
├── perks: [string]
├── transferable: boolean
└── refundable: boolean
```

## Concert

```
Concert extends Event
├── performers: [PerformerBooking]
├── genre: MusicGenre
├── setlist: ?Setlist
├── openingActs: [PerformerBooking]
└── afterParty: ?Event

PerformerBooking
├── performer: Performer
├── fee: number
├── requirements: PerformerRequirements
├── setDuration: number:minutes
├── slot: TimeRange
└── confirmed: boolean
```

## Performer

```
Performer extends Entity
├── name: string
├── type: enum:solo_artist|band|dj|comedian|dancer|other
├── genre: [MusicGenre]
├── popularity: PerformerPopularity
├── bookingFee: PriceRange
├── requirements: PerformerRequirements
├── socialPresence: SocialPresence
├── management: ?Contact
├── pastPerformances: [Event]
└── upcomingReleases: [MediaRelease]

PerformerPopularity
├── localFame: number:0-100
├── nationalFame: number:0-100
├── internationalFame: number:0-100
├── currentTrend: enum:rising|stable|declining|comeback
├── monthlyListeners: number
└── chartPositions: [ChartPosition]

ChartPosition
├── chart: string
├── position: number
├── date: GameDate
└── track: string

PerformerRequirements
├── technicalRider: TechnicalRider
├── hospitalityRider: HospitalityRider
└── securityLevel: enum:minimal|standard|high|vip

TechnicalRider
├── stageSize: Bounds
├── soundRequirements: [string]
├── lightingRequirements: [string]
├── backlineProvided: boolean
└── specialEffects: [string]

HospitalityRider
├── accommodationType: string
├── transportRequired: boolean
├── cateringRequirements: [string]
├── greenRoomRequirements: [string]
└── guestListSize: number

Setlist
├── songs: [SetlistItem]
├── totalDuration: number:minutes
└── encoreIncluded: boolean

SetlistItem
├── title: string
├── duration: number:minutes
├── isNew: boolean
└── isHit: boolean

MediaRelease extends Entity
├── type: enum:single|album|ep|music_video|documentary
├── title: string
├── releaseDate: GameDate
├── anticipation: number:0-100
└── marketingPush: number:0-100
```

## Festival

```
Festival extends Event
├── festivalType: FestivalType
├── stages: [FestivalStage]
├── lineup: [PerformerBooking]
├── vendors: [FestivalVendor]
├── campingAvailable: boolean
└── dayPasses: boolean

FestivalType extends Entity
├── name: string
├── primaryGenre: ?MusicGenre
├── focus: enum:music|food|art|cultural|sports|mixed
├── atmosphere: string
└── typicalDuration: number:days

FestivalStage
├── name: string
├── capacity: number
├── technicalSpecs: TechnicalSpecs
└── schedule: [PerformerBooking]

FestivalVendor
├── vendor: MarketVendor|Establishment
├── location: Position
├── boothSize: Bounds
├── fee: number
└── category: enum:food|drink|merchandise|sponsor|service
```

---

# 📱 Social Media & News System

The social system drives word-of-mouth, trends, and the player-managed resort news page.

## Social Platform

```
SocialPlatform extends Entity
├── name: string
├── type: enum:microblog|photo|video|review|news|forum
├── userBase: number
├── primaryDemographic: PriceRange
├── engagementMultiplier: number
└── viralPotential: number:0-100
```

## Social Posts

```
SocialPost extends Entity
├── author: SocialAccount
├── platform: SocialPlatform
├── type: enum:text|photo|video|story|review|check_in|live
├── content: PostContent
├── mentions: [SocialMention]
├── hashtags: [Hashtag]
├── location: ?Position
├── taggedEstablishment: ?Establishment
├── engagement: PostEngagement
├── reach: PostReach
├── sentiment: enum:very_negative|negative|neutral|positive|very_positive
├── isSponsored: boolean
└── sponsorDeal: ?InfluencerDeal

PostContent
├── text: ?string
├── mediaUrls: [string]
├── mediaType: ?enum:photo|video|carousel|gif
├── caption: ?string
└── altText: ?string

SocialMention
├── account: SocialAccount
└── mentionType: enum:tag|reply|quote|collaboration

Hashtag extends Entity
├── tag: string
├── category: enum:location|event|trend|brand|generic
├── usageCount: number
├── trendingScore: number:0-100
└── relatedHashtags: [Hashtag]

PostEngagement
├── likes: number
├── comments: number
├── shares: number
├── saves: number
├── clicks: number
└── engagementRate: number:percentage

PostReach
├── impressions: number
├── uniqueReach: number
├── viralCoefficient: number
└── peakHour: number:0-23
```

## Social Accounts & Influencers

```
SocialAccount extends Entity
├── owner: Individual|Establishment|Performer|EventOrganizer
├── platform: SocialPlatform
├── handle: string
├── displayName: string
├── bio: string
├── followers: number
├── following: number
├── posts: [SocialPost]
├── verified: boolean
├── accountType: enum:personal|business|creator|official
├── metrics: AccountMetrics
└── influencerTier: ?InfluencerTier

AccountMetrics
├── avgEngagementRate: number:percentage
├── avgReach: number
├── postFrequency: number:per_week
├── followerGrowthRate: number:per_month
└── audienceQuality: number:0-100

InfluencerTier extends Entity
├── name: string
├── followerRange: PriceRange
├── avgEngagement: PriceRange
├── typicalFee: PriceRange
└── reachMultiplier: number

InfluencerDeal extends Entity
├── influencer: SocialAccount
├── client: Establishment|Event|EventOrganizer
├── dealType: DealType
├── compensation: Compensation
├── deliverables: [Deliverable]
├── dateRange: DateRange
├── status: enum:negotiating|agreed|in_progress|completed|cancelled
└── performance: ?DealPerformance

DealType extends Entity
├── name: string
├── description: string
├── typicalDeliverables: [string]
└── exclusivityRequired: boolean

Deliverable
├── type: enum:post|story|reel|video|review|appearance|mention
├── quantity: number
├── platform: SocialPlatform
├── dueDate: GameDate
├── approvalRequired: boolean
├── completed: boolean
└── resultingPost: ?SocialPost

DealPerformance
├── totalReach: number
├── totalEngagement: number
├── estimatedValue: number
├── conversionRate: ?number
└── roi: number
```

## Trends

```
Trend extends Entity
├── topic: string
├── type: enum:hashtag|topic|event|controversy|viral_content
├── platforms: [SocialPlatform]
├── relatedEntities: [Entity]
├── sentiment: TrendSentiment
├── lifecycle: TrendLifecycle
└── impact: TrendImpact

TrendSentiment
├── overall: number:-100-100
├── positiveRatio: number:percentage
├── negativeRatio: number:percentage
└── controversyLevel: number:0-100

TrendLifecycle
├── startDate: timestamp
├── peakDate: ?timestamp
├── endDate: ?timestamp
├── currentPhase: enum:emerging|growing|peak|declining|dead
├── velocity: number
└── mentions: number

TrendImpact
├── touristInterest: number:-100-100
├── establishmentTraffic: number:-100-100
├── reputationEffect: number:-100-100
└── revenueEffect: number
```

---

# 📰 News & PR System (Player-Managed)

The player manages the resort's official news feed and PR campaigns.

## News Feed

```
NewsFeed extends Entity
├── name: string
├── owner: string:resort              - Player-owned
├── followers: number
├── credibility: number:0-100
├── articles: [NewsArticle]
├── announcements: [Announcement]
├── schedule: PublishingSchedule
├── editorial: EditorialPolicy
└── analytics: FeedAnalytics

PublishingSchedule
├── postsPerDay: number
├── peakHours: [number:0-23]
└── contentMix: ContentMix

ContentMix
├── newsPercent: number
├── eventsPercent: number
├── promotionsPercent: number
├── communityPercent: number
└── entertainmentPercent: number

EditorialPolicy
├── tone: enum:formal|casual|fun|luxury|community
├── responseToNegative: enum:ignore|address|apologize|defend
├── promotionFrequency: enum:never|rare|moderate|frequent|aggressive
└── communityEngagement: enum:none|minimal|active|highly_engaged

FeedAnalytics
├── totalReach: number
├── avgEngagement: number
├── followerGrowth: number:per_week
├── topPerformingContent: [NewsArticle|Announcement]
└── audienceInsights: AudienceInsights

AudienceInsights
├── demographics: CategoryDemographics
├── peakActivityHours: [number:0-23]
├── topInterests: [Interest]
└── locationBreakdown: object
```

## News Articles & Announcements

```
NewsArticle extends Entity
├── headline: string
├── subheadline: ?string
├── body: string
├── author: ?StaffMember
├── category: NewsCategory
├── featuredImage: ?string
├── relatedEntities: [Entity]
├── publishDate: timestamp
├── status: enum:draft|scheduled|published|archived
├── engagement: PostEngagement
├── seoKeywords: [string]
└── isPinned: boolean

NewsCategory extends Entity
├── name: string
├── icon: string
├── color: string
└── priority: number

Announcement extends Entity
├── title: string
├── message: string
├── type: AnnouncementType
├── urgency: enum:low|medium|high|critical
├── targetAudience: [PeopleCategory]
├── displayLocations: [enum:feed|banner|push|email|sms]
├── dateRange: DateRange
├── callToAction: ?CallToAction
└── engagement: PostEngagement

AnnouncementType extends Entity
├── name: string
├── template: string
├── icon: string
└── color: string

CallToAction
├── text: string
├── url: ?string
├── action: enum:book|visit|buy|learn_more|rsvp|contact
├── targetEntity: ?Entity
├── clicks: number
└── conversions: number
```

## Press & Marketing

```
PressRelease extends Entity
├── title: string
├── body: string
├── subject: Entity
├── releaseDate: timestamp
├── embargo: ?timestamp
├── mediaKit: ?MediaKit
├── distribution: [MediaOutlet]
└── coverage: [MediaCoverage]

MediaKit
├── photos: [string]
├── videos: [string]
├── logos: [string]
├── factSheet: string
└── contactInfo: Contact

MediaOutlet extends Entity
├── name: string
├── type: enum:newspaper|magazine|tv|radio|blog|podcast|social
├── reach: number
├── relevance: number:0-100
├── sentiment: enum:friendly|neutral|critical
└── contacts: [Contact]

MediaCoverage extends Entity
├── outlet: MediaOutlet
├── headline: string
├── sentiment: enum:very_negative|negative|neutral|positive|very_positive
├── reach: number
├── publishDate: timestamp
└── url: ?string

MarketingCampaign extends Entity
├── name: string
├── objective: CampaignObjective
├── budget: number
├── spent: number
├── dateRange: DateRange
├── channels: [MarketingChannel]
├── targetAudience: [PeopleCategory]
├── creatives: [Creative]
├── performance: CampaignPerformance
└── status: enum:planning|active|paused|completed

CampaignObjective extends Entity
├── type: enum:awareness|traffic|engagement|conversions|loyalty
├── targetMetric: string
├── targetValue: number
└── currentValue: number

MarketingChannel extends Entity
├── name: string
├── type: enum:social|search|display|email|sms|print|outdoor|radio|tv
├── costModel: enum:cpm|cpc|cpa|flat_rate
├── baseCost: number
├── reach: number
└── effectiveness: number:0-100

Creative extends Entity
├── name: string
├── type: enum:image|video|text|audio|interactive
├── content: PostContent
├── variants: [CreativeVariant]
└── approvalStatus: enum:pending|approved|rejected

CreativeVariant
├── name: string
├── content: PostContent
└── performance: ?CreativePerformance

CreativePerformance
├── impressions: number
├── clicks: number
├── conversions: number
├── ctr: number:percentage
└── conversionRate: number:percentage

CampaignPerformance
├── impressions: number
├── reach: number
├── clicks: number
├── conversions: number
├── costPerResult: number
├── roi: number
└── brandLift: ?number
```

---

# 👥 People System

## Individual

```
Individual extends Entity
├── firstName: string
├── lastName: string
├── age: number
├── gender: enum:male|female|other
├── nationality: string
├── languages: [string]
├── wealth: WealthProfile
├── personality: PersonalityProfile
├── preferences: Preferences
├── needs: NeedsState
├── socialAccounts: [SocialAccount]   - Link to social system
└── location: ?Location
```

### Profile Components

```
WealthProfile
├── class: enum:budget|economy|moderate|comfortable|affluent|wealthy|ultra_wealthy
├── monthlyIncome: number
├── dailyBudget: number
├── priceFlexibility: number:0-100
└── tippingBehavior: enum:never|poor|standard|generous

PersonalityProfile
├── openness: number:0-100
├── conscientiousness: number:0-100
├── extraversion: number:0-100
├── agreeableness: number:0-100
├── neuroticism: number:0-100
├── impulsiveness: number:0-100
├── patience: number:0-100
└── adventurousness: number:0-100

NeedsState
├── mood: number:-100-100
├── energy: number:0-100
├── hunger: number:0-100
├── thirst: number:0-100
├── bladder: number:0-100
├── socialNeed: number:0-100
├── entertainment: number:0-100
└── fomo: number:0-100               - Fear of missing out (events, trends)

Preferences
├── cuisines: [CuisineType]
├── dietary: [DietaryTag]
├── alcoholPreference: enum:none|light|moderate|heavy
├── activityLevel: enum:sedentary|light|moderate|active|athletic
├── waterComfort: enum:none|shallow|swimmer|advanced
├── crowdPreference: enum:quiet|moderate|lively|party
├── musicPreferences: [MusicGenre]
├── nightlifeInterest: number:0-100
├── interests: [Interest]
├── followedAccounts: [SocialAccount] - Influencer following
└── newsConsumption: enum:none|headlines|moderate|heavy

Interest extends Entity
├── name: string
├── category: enum:water|beach|sports|entertainment|culture|relaxation|food|shopping|social
├── energyRequired: number:1-5
├── socialLevel: number:1-5
├── typicalDuration: number:minutes
└── relatedEstablishments: [string:establishment_type]
```

## Group

```
Group extends Entity
├── members: [Individual]
├── type: GroupType
├── leader: ?Individual
├── dynamics: GroupDynamics
├── budget: GroupBudget
├── schedule: GroupSchedule
├── state: GroupState
└── satisfaction: number:0-100

GroupType extends Entity
├── name: string
├── sizeRange: PriceRange
├── typicalAgeRange: PriceRange
├── hasChildren: boolean
├── hasElderly: boolean
└── defaultDynamics: GroupDynamics

GroupDynamics
├── cohesion: number:0-100
├── conflictLevel: number:0-100
├── canSplit: boolean
├── requiresConsensus: boolean
└── leadershipStyle: enum:democratic|single_leader|rotating|chaotic

GroupBudget
├── combined: number
├── spent: number
└── spendingStyle: enum:frugal|balanced|generous|lavish
```

### Group Schedule & State

```
GroupSchedule
├── arrivalTime: timestamp
├── departureTime: timestamp
├── plannedActivities: [ScheduledActivity]
└── completedActivities: [ScheduledActivity]

ScheduledActivity
├── timeSlot: TimeRange
├── activityType: ActivityType
├── establishment: ?Establishment
├── event: ?Event                     - Can attend events
├── priority: enum:flexible|preferred|essential
├── budgetAllocation: number:percentage
├── completed: boolean
└── satisfaction: ?number:0-100

ActivityType extends Entity
├── name: string
├── category: enum:arrive|meal|activity|rest|entertainment|shopping|event|depart
├── typicalDuration: number:minutes
├── energyCost: number
├── needsSatisfied: [string]
└── relatedEstablishments: [string:establishment_type]

GroupState
├── current: enum:arriving|exploring|deciding|traveling|queuing|visiting|resting|at_event|departing|departed
├── currentLocation: ?Location
├── targetLocation: ?Location
├── mood: number:-100-100
└── energy: number:0-100
```

## People Category (Archetype)

```
PeopleCategory extends Entity
├── name: string
├── description: string
├── demographics: CategoryDemographics
├── behavior: CategoryBehavior
├── routine: RoutineTemplate
└── mediaConsumption: MediaConsumption

CategoryDemographics
├── ageRange: PriceRange
├── groupSizeRange: PriceRange
├── typicalGroupTypes: [GroupType]
├── wealthClasses: [string]
└── dailyBudgetRange: PriceRange

CategoryBehavior
├── primaryInterests: [Interest]
├── secondaryInterests: [Interest]
├── preferredEstablishments: [string:establishment_type]
├── avoidedEstablishments: [string:establishment_type]
├── peakSeasons: [string]
├── avoidedSeasons: [string]
├── reviewLikelihood: number:0-100
├── socialMediaActivity: number:0-100
├── loyaltyTendency: number:0-100
├── complainingTendency: number:0-100
└── eventInterest: number:0-100

MediaConsumption
├── preferredPlatforms: [SocialPlatform]
├── newsConsumption: enum:none|headlines|moderate|avid
├── influencerSusceptibility: number:0-100
├── trendFollowing: number:0-100
└── contentCreation: number:0-100

RoutineTemplate
├── arrivalTimeRange: TimeRange
├── departureTimeRange: TimeRange
├── averageStayDuration: number:hours
└── activities: [RoutineActivity]

RoutineActivity
├── timeSlot: TimeRange
├── activityType: ActivityType
├── probability: number:0-100
├── preferredCategories: [string:establishment_type]
└── budgetAllocation: number:percentage
```

---

# 👔 Staff System

## Staff Member

```
StaffMember extends Entity
├── firstName: string
├── lastName: string
├── age: number
├── nationality: string
├── languages: [string]
├── role: StaffRole
├── employer: Establishment
├── employment: EmploymentDetails
├── schedule: WeeklySchedule
├── compensation: Compensation
├── skills: [StaffSkill]
├── certifications: [string]
├── performance: PerformanceMetrics
├── state: StaffState
└── socialAccounts: [SocialAccount]   - Staff can have social presence
```

### Roles & Skills

```
StaffRole extends Entity
├── name: string
├── category: enum:management|kitchen|service|bar|hotel|beach|entertainment|activities|retail|support|marketing|pr
├── baseSalary: number
├── requiredSkills: [SkillRequirement]
├── requiredCertifications: [string]
└── supervisesRoles: [StaffRole]

SkillRequirement
├── skill: Skill
└── minimumLevel: number:1-5

Skill extends Entity
├── name: string
├── category: string
├── maxLevel: number
├── trainingCost: number
└── trainingDuration: number:hours

StaffSkill
├── skill: Skill
├── level: number:1-5
└── experience: number:hours
```

### Employment & Compensation

```
EmploymentDetails
├── type: enum:full_time|part_time|seasonal|temp|contractor
├── hireDate: timestamp
├── contractEndDate: ?timestamp
├── hoursPerWeek: number
└── overtimeAllowed: boolean

Compensation
├── baseSalary: number
├── hourlyRate: ?number
├── tips: number
├── bonuses: [Bonus]
└── totalCompensation: number

Bonus
├── type: enum:performance|holiday|signing|referral
├── amount: number
├── date: timestamp
└── reason: string
```

### Performance & State

```
PerformanceMetrics
├── rating: number:0-100
├── customerRating: number:0-5
├── efficiency: number:0-100
├── reliability: number:0-100
├── tasksCompleted: number
├── customersServed: number
└── incidents: number

StaffState
├── current: enum:off_duty|commuting|clocked_in|on_break|working|training|sick_leave|vacation
├── morale: number:0-100
├── fatigue: number:0-100
└── currentShift: ?ShiftInfo

ShiftInfo
├── startTime: timestamp
├── endTime: timestamp
├── breaksTaken: number
└── tasksCompleted: number
```

---

# ⭐ Review System

## Review

```
Review extends Entity
├── author: Individual
├── establishment: Establishment
├── visit: Visit
├── ratings: ReviewRatings
├── content: ReviewContent
├── engagement: ReviewEngagement
├── impact: ReviewImpact
├── response: ?OwnerResponse
└── linkedSocialPost: ?SocialPost     - Cross-posted to social

Visit extends Entity
├── visitor: Individual|Group
├── establishment: Establishment
├── event: ?Event                     - Can review events too
├── arrivalTime: timestamp
├── departureTime: timestamp
├── spending: number
├── satisfaction: number:0-100
├── itemsConsumed: [MenuItem|DrinkItem|Product]
├── staffInteractions: [StaffMember]
└── socialPosts: [SocialPost]         - Social activity during visit
```

### Ratings & Content

```
ReviewRatings
├── overall: number:1-5
├── food: ?number:1-5
├── drinks: ?number:1-5
├── service: ?number:1-5
├── atmosphere: ?number:1-5
├── value: ?number:1-5
├── cleanliness: ?number:1-5
└── facilities: ?number:1-5

ReviewContent
├── title: ?string
├── body: string
├── language: string
├── sentiment: enum:very_negative|negative|neutral|positive|very_positive
├── keywords: [string]
├── topics: [ReviewTopic]
└── photos: [ReviewPhoto]

ReviewTopic extends Entity
├── name: string
├── category: enum:food|service|atmosphere|value|cleanliness|location|experience
└── sentimentWeight: number

ReviewPhoto extends Entity
├── url: string
├── caption: ?string
├── category: enum:food|drink|interior|exterior|view|other
└── likes: number
```

### Engagement & Impact

```
ReviewEngagement
├── platform: enum:in_game|google|tripadvisor|instagram|facebook
├── isVerified: boolean
├── helpfulVotes: number
├── unhelpfulVotes: number
├── reportCount: number
├── reach: number
└── sharedToSocial: boolean

ReviewImpact
├── viralScore: number:0-100
├── ratingImpact: number
├── revenueImpact: number
├── wasInfluential: boolean
└── triggeredTrend: ?Trend            - Can spark trends

OwnerResponse
├── responder: StaffMember
├── responseDate: timestamp
├── content: string
├── sentiment: enum:apologetic|thankful|defensive|professional
└── publicReaction: ?PostEngagement

ReviewerProfile
├── individual: Individual
├── reviewCount: number
├── averageRating: number
├── helpfulVotes: number
├── level: enum:newcomer|contributor|regular|expert|master|influencer
├── badges: [ReviewerBadge]
└── credibilityScore: number:0-100

ReviewerBadge extends Entity
├── name: string
├── description: string
├── icon: string
└── requirement: string
```

---

# 💰 Economy System

## Transaction

```
Transaction extends Entity
├── customer: Individual|Group
├── establishment: Establishment
├── staff: ?StaffMember
├── items: [TransactionItem]
├── amounts: TransactionAmounts
├── paymentMethod: enum:cash|card|mobile|crypto
├── status: enum:pending|completed|refunded|disputed
└── timestamp: timestamp

TransactionItem
├── item: MenuItem|DrinkItem|Product|RentalInventory|LessonOffering|TicketTier
├── quantity: number
├── unitPrice: number
└── totalPrice: number

TransactionAmounts
├── subtotal: number
├── tax: number
├── tip: number
├── discount: number
└── total: number
```

## Pricing

```
PricingStrategy extends Entity
├── basePrice: number
├── demandMultipliers: DemandPricing
├── seasonalMultipliers: [SeasonalRate]
├── timeOfDayMultipliers: [TimeOfDayPricing]
└── eventMultipliers: [EventPricing]

DemandPricing
├── lowOccupancy: number
├── mediumOccupancy: number
├── highOccupancy: number
└── peakOccupancy: number

TimeOfDayPricing
├── timeRange: TimeRange
└── multiplier: number

EventPricing
├── eventType: string
└── multiplier: number
```

---

# ⏰ Time & Weather

## Calendar

```
GameDate
├── year: number
├── month: number:1-12
├── day: number:1-31
├── hour: number:0-23
├── minute: number:0-59
├── dayOfWeek: number:0-6
└── season: Season

Season extends Entity
├── name: string
├── months: [number:1-12]
├── touristMultiplier: number
├── weatherProfile: SeasonWeather
└── typicalEvents: [string]

SeasonWeather
├── temperatureRange: PriceRange
├── rainProbability: number:0-100
├── stormProbability: number:0-100
└── sunnyDaysProbability: number:0-100
```

## Weather

```
Weather
├── condition: WeatherCondition
├── temperature: number
├── humidity: number:0-100
├── windSpeed: number
├── uvIndex: number:0-11
├── waveHeight: number
└── visibility: number

WeatherCondition extends Entity
├── name: string
├── icon: string
├── touristModifier: number
├── outdoorActivityModifier: number
├── waterActivityModifier: number
└── eventImpact: number

Holiday extends Entity
├── name: string
├── month: number:1-12
├── day: number:1-31
├── isPublic: boolean
├── touristImpact: number
├── closedEstablishments: [string:establishment_type]
└── typicalEvents: [string]
```

---

# ⚙️ Configuration Models

```
EconomyConfig
├── startingCapital: number
├── loanInterestRate: number
├── maxLoanMultiplier: number
├── taxRate: number
└── inflationRate: number

AttendanceConfig
├── baseCapacity: number
├── weatherModifiers: object
├── dayOfWeekModifiers: object
├── seasonModifiers: object
└── eventModifiers: object

ReviewConfig
├── baseReviewChance: number
├── satisfactionModifier: number
├── influencerBoost: number
├── badExperienceBoost: number
├── viralThreshold: number
└── ratingDecayDays: number

SocialConfig
├── trendLifespanDays: number
├── viralThreshold: number
├── influencerImpactMultiplier: number
├── negativePRDamage: number
└── positivePRBoost: number

EventConfig
├── maxConcurrentEvents: number
├── bookingLeadTimeDays: number
├── cancellationPenalty: number
└── weatherCancellationThreshold: string

SupplyConfig
├── defaultLeadTimeDays: number
├── spoilageRate: number
├── priceFluctuationRange: PriceRange
└── localSupplierBonus: number

StaffConfig
├── baseMorale: number
├── moraleDecayPerHour: number
├── overworkThreshold: number
├── trainingEffectiveness: number
└── turnoverBaseChance: number

SimulationConfig
├── ticksPerGameMinute: number
├── realSecondsPerGameHour: number
├── maxEntitiesPerTick: number
└── needDecayRates: NeedDecayRates

NeedDecayRates
├── hunger: number:per_hour
├── thirst: number:per_hour
├── energy: number:per_hour
├── bladder: number:per_hour
├── entertainment: number:per_hour
└── fomo: number:per_hour
```

---

# 📊 System Interconnections

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            SUPPLY CHAIN                                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐                     │
│  │  Fisher  │  │  Farmer  │  │Wholesaler│  │ Artisan  │                     │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘                     │
│       │             │             │             │                            │
│       └─────────────┴─────────────┴─────────────┘                            │
│                           │                                                  │
│                    SupplyContract                                            │
│                           │                                                  │
│                           ▼                                                  │
│  ┌──────────────────────────────────────────────────────────┐               │
│  │                    ESTABLISHMENTS                         │               │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │               │
│  │  │Restaurant│  │  Market  │  │   Bar    │  │  Hotel   │  │               │
│  │  │    │     │  │    │     │  │    │     │  │    │     │  │               │
│  │  │  Menu    │  │  Stalls  │  │DrinkMenu │  │  Rooms   │  │               │
│  │  │    │     │  │    │     │  │    │     │  │    │     │  │               │
│  │  │ Recipe ◄─┼──┼─Resource─┼──┼─ Recipe  │  └──────────┘  │               │
│  │  └──────────┘  └──────────┘  └──────────┘                │               │
│  └──────────────────────────────────────────────────────────┘               │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              EVENTS                                          │
│  ┌──────────┐       ┌──────────┐       ┌──────────┐                         │
│  │ Concert  │◄──────│Performer │───────│  Venue   │                         │
│  └────┬─────┘       │    │     │       └──────────┘                         │
│       │             │Popularity│                                             │
│  ┌────▼─────┐       │ SocialPres│                                            │
│  │ Festival │       └──────────┘                                             │
│  │    │     │                                                                │
│  │  Stages  │◄──────────────────────────────────────────┐                   │
│  │ Vendors  │                                           │                   │
│  └──────────┘                                           │                   │
└──────────────────────────────────────────────────────────│───────────────────┘
                                    │                      │
                                    ▼                      │
┌─────────────────────────────────────────────────────────────────────────────┐
│                          SOCIAL & NEWS                                       │
│  ┌──────────┐       ┌──────────┐       ┌──────────┐                         │
│  │SocialPost│◄──────│SocialAcct│───────│Influencer│                         │
│  │    │     │       │    │     │       │   Deal   │                         │
│  │ Hashtag  │       │  Metrics │       └──────────┘                         │
│  │ Mentions │       └──────────┘                                             │
│  └────┬─────┘             │                                                  │
│       │                   │                                                  │
│  ┌────▼─────┐       ┌─────▼────┐       ┌──────────┐                         │
│  │  Trend   │───────│ NewsFeed │◄──────│Marketing │                         │
│  │    │     │       │ (Player) │       │ Campaign │                         │
│  │ Impact   │       │    │     │       └──────────┘                         │
│  └──────────┘       │ Articles │                                             │
│                     │Announce- │                                             │
│                     │  ments   │                                             │
│                     └──────────┘                                             │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                            PEOPLE                                            │
│  ┌──────────┐       ┌──────────┐       ┌──────────┐                         │
│  │Individual│◄──────│  Group   │───────│GroupType │                         │
│  │    │     │       │    │     │       └──────────┘                         │
│  │ Social   │       │ Schedule │                                             │
│  │ Accounts │       │   │      │                                             │
│  │    │     │       │ Events   │◄───── Can attend events                    │
│  │ Follows  │       └──────────┘                                             │
│  │Influencer│                                                                │
│  └──────────┘                                                                │
│       │                                                                      │
│       ▼                                                                      │
│  ┌──────────┐       ┌──────────┐                                            │
│  │ Category │───────│ Routine  │                                            │
│  │    │     │       └──────────┘                                            │
│  │ Media    │                                                                │
│  │Consumpt- │◄───── Influenced by social/news/trends                        │
│  │  ion     │                                                                │
│  └──────────┘                                                                │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

# 🎯 Key Gameplay Loops

## Supply Chain Loop
```
Fisher/Farmer → SupplyContract → Restaurant/Market → Menu/VendorOffering → Customer
     │                              │
     └── Seasonal Availability ──────┴── Price Fluctuation
```

## Event Marketing Loop
```
Event → Marketing Campaign → Social Posts → Trend → Tourist Interest → Attendance
  │          │                   │
  │          │                   ▼
  │          └── Influencer Deal → Viral Content
  │
  └── News Feed Announcement → Credibility Boost
```

## Social Virality Loop
```
Visitor → Social Post → Hashtag → Trending → Tourist Interest
   │          │           │
   │          │           └── Media Coverage
   │          │
   │          └── Review → Reputation Impact
   │
   └── Influencer Post → Deal Performance → ROI
```

## News/PR Management Loop
```
Player → NewsFeed → Article/Announcement → Engagement Analytics
  │                        │
  │                        └── Call to Action → Conversion
  │
  └── Press Release → Media Coverage → Reputation
```

---

*Schema Reference Document for Beach Alley*
*Last updated: February 2026*
