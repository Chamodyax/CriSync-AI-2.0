CREATE DATABASE HumanitarianCrisisPlatformDb;
GO
USE HumanitarianCrisisPlatformDb;
GO

CREATE TABLE Organisations (
    Id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY,
    Name NVARCHAR(200) NOT NULL,
    OrganisationType NVARCHAR(100) NOT NULL,
    Country NVARCHAR(100) NOT NULL,
    ContactEmail NVARCHAR(150) NOT NULL,
    ContactPhone NVARCHAR(50) NOT NULL,
    IsVerified BIT NOT NULL DEFAULT 1,
    PartnershipStatus NVARCHAR(50) NOT NULL DEFAULT 'Approved',
    PartnershipProposal NVARCHAR(1000) NOT NULL DEFAULT '',
    CreatedAtUtc DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    UpdatedAtUtc DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
);

CREATE TABLE Users (
    Id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY,
    FullName NVARCHAR(200) NOT NULL,
    Email NVARCHAR(150) NOT NULL UNIQUE,
    PhoneNumber NVARCHAR(50) NOT NULL,
    PasswordHash NVARCHAR(256) NOT NULL,
    PasswordSalt NVARCHAR(128) NOT NULL,
    Role NVARCHAR(50) NOT NULL,
    PreferredLanguage NVARCHAR(10) NOT NULL DEFAULT 'en',
    OrganisationId UNIQUEIDENTIFIER NULL REFERENCES Organisations(Id),
    IsActive BIT NOT NULL DEFAULT 1,
    AccountStatus NVARCHAR(50) NOT NULL DEFAULT 'Active',
    InvitedByUserName NVARCHAR(200) NOT NULL DEFAULT '',
    InvitationCode NVARCHAR(100) NOT NULL DEFAULT '',
    ProfilePhotoUrl NVARCHAR(MAX) NOT NULL DEFAULT '',
    QuickUnlockEnabled BIT NOT NULL DEFAULT 0,
    QuickUnlockMode NVARCHAR(30) NOT NULL DEFAULT '',
    QuickUnlockSecretHash NVARCHAR(256) NOT NULL DEFAULT '',
    QuickUnlockSecretSalt NVARCHAR(128) NOT NULL DEFAULT '',
    QuickUnlockDeviceTokenHash NVARCHAR(256) NOT NULL DEFAULT '',
    QuickUnlockDeviceTokenSalt NVARCHAR(128) NOT NULL DEFAULT '',
    QuickUnlockBiometricCredentialId NVARCHAR(512) NOT NULL DEFAULT '',
    QuickUnlockFailedAttempts INT NOT NULL DEFAULT 0,
    QuickUnlockTrustedDevicesJson NVARCHAR(MAX) NOT NULL DEFAULT '[]',
    CreatedAtUtc DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    UpdatedAtUtc DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
);

CREATE TABLE RolePermissions (
    Id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY,
    Role NVARCHAR(50) NOT NULL,
    PermissionCode NVARCHAR(100) NOT NULL,
    Description NVARCHAR(300) NOT NULL,
    CreatedAtUtc DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    UpdatedAtUtc DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
);

CREATE TABLE Households (
    Id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY,
    UserId UNIQUEIDENTIFIER NOT NULL REFERENCES Users(Id),
    HouseholdHeadName NVARCHAR(200) NOT NULL,
    TotalMembers INT NOT NULL DEFAULT 1,
    ChildrenCount INT NOT NULL DEFAULT 0,
    ElderlyCount INT NOT NULL DEFAULT 0,
    HasMobilityNeeds BIT NOT NULL DEFAULT 0,
    HasChronicMedicalNeeds BIT NOT NULL DEFAULT 0,
    MedicalNotes NVARCHAR(1000) NOT NULL,
    PrimaryAddress NVARCHAR(300) NOT NULL,
    Latitude FLOAT NOT NULL,
    Longitude FLOAT NOT NULL,
    CreatedAtUtc DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    UpdatedAtUtc DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
);

CREATE TABLE CrisisEvents (
    Id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY,
    Title NVARCHAR(250) NOT NULL,
    CrisisType NVARCHAR(50) NOT NULL,
    Severity NVARCHAR(50) NOT NULL,
    Country NVARCHAR(100) NOT NULL,
    Region NVARCHAR(200) NOT NULL,
    Description NVARCHAR(2000) NOT NULL,
    CenterLatitude FLOAT NOT NULL,
    CenterLongitude FLOAT NOT NULL,
    RadiusKm FLOAT NOT NULL DEFAULT 25.0,
    IsActive BIT NOT NULL DEFAULT 1,
    LeadCoordinatorId UNIQUEIDENTIFIER NULL,
    CreatedAtUtc DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    UpdatedAtUtc DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
);

CREATE TABLE OperationalAreas (
    Id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY,
    CrisisEventId UNIQUEIDENTIFIER NOT NULL REFERENCES CrisisEvents(Id) ON DELETE CASCADE,
    ZoneName NVARCHAR(200) NOT NULL,
    District NVARCHAR(100) NOT NULL,
    Latitude FLOAT NOT NULL,
    Longitude FLOAT NOT NULL,
    CoverageRadiusKm FLOAT NOT NULL,
    EstimatedAffectedPopulation INT NOT NULL,
    RiskLevel NVARCHAR(50) NOT NULL,
    AssignedOrganisationId UNIQUEIDENTIFIER NULL,
    CreatedAtUtc DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    UpdatedAtUtc DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
);

CREATE TABLE PublicAlerts (
    Id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY,
    CrisisEventId UNIQUEIDENTIFIER NOT NULL REFERENCES CrisisEvents(Id),
    Title NVARCHAR(250) NOT NULL,
    Message NVARCHAR(2000) NOT NULL,
    SeverityLevel NVARCHAR(50) NOT NULL,
    SafetyGuidance NVARCHAR(2000) NOT NULL,
    TranslationsJson NVARCHAR(MAX) NOT NULL,
    IsVerified BIT NOT NULL DEFAULT 1,
    IssuedByUserId UNIQUEIDENTIFIER NOT NULL,
    CreatedAtUtc DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    UpdatedAtUtc DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
);

CREATE TABLE AssistanceRequests (
    Id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY,
    ReferenceCode NVARCHAR(50) NOT NULL,
    CitizenUserId UNIQUEIDENTIFIER NOT NULL,
    CrisisEventId UNIQUEIDENTIFIER NOT NULL REFERENCES CrisisEvents(Id),
    Category NVARCHAR(50) NOT NULL,
    SelfReportedUrgency NVARCHAR(50) NOT NULL,
    FinalApprovedUrgency NVARCHAR(50) NOT NULL,
    PriorityScore FLOAT NOT NULL,
    Title NVARCHAR(250) NOT NULL,
    Description NVARCHAR(2000) NOT NULL,
    AffectedPeopleCount INT NOT NULL,
    RequestedQuantity INT NOT NULL,
    RequiresAccessibilitySupport BIT NOT NULL DEFAULT 0,
    LocationAddress NVARCHAR(300) NOT NULL,
    Latitude FLOAT NOT NULL,
    Longitude FLOAT NOT NULL,
    SupportingEvidenceFileName NVARCHAR(260) NOT NULL,
    SupportingEvidenceMimeType NVARCHAR(100) NOT NULL,
    Status NVARCHAR(50) NOT NULL,
    IsFlaggedPotentialDuplicate BIT NOT NULL DEFAULT 0,
    PotentialDuplicateOfRequestId UNIQUEIDENTIFIER NULL,
    DuplicateSimilarityScore FLOAT NOT NULL DEFAULT 0,
    IsFlaggedSuspicious BIT NOT NULL DEFAULT 0,
    SuspiciousReason NVARCHAR(500) NOT NULL,
    AssignedCaseManagerId UNIQUEIDENTIFIER NULL,
    AssignedOrganisationId UNIQUEIDENTIFIER NULL,
    PreferredLanguage NVARCHAR(10) NOT NULL DEFAULT 'en',
    IdempotencyKey NVARCHAR(100) NOT NULL,
    CreatedAtUtc DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    UpdatedAtUtc DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
);

CREATE INDEX IX_AssistanceRequests_ReferenceCode ON AssistanceRequests(ReferenceCode);

CREATE TABLE RequestHistories (
    Id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY,
    AssistanceRequestId UNIQUEIDENTIFIER NOT NULL REFERENCES AssistanceRequests(Id) ON DELETE CASCADE,
    PreviousStatus NVARCHAR(50) NOT NULL,
    NewStatus NVARCHAR(50) NOT NULL,
    ActionDescription NVARCHAR(1000) NOT NULL,
    ChangedByUserId UNIQUEIDENTIFIER NOT NULL,
    ChangedByUserName NVARCHAR(200) NOT NULL,
    ChangedByRole NVARCHAR(50) NOT NULL,
    CreatedAtUtc DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    UpdatedAtUtc DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
);

CREATE TABLE RequestFeedbacks (
    Id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY,
    AssistanceRequestId UNIQUEIDENTIFIER NOT NULL REFERENCES AssistanceRequests(Id),
    CitizenUserId UNIQUEIDENTIFIER NOT NULL,
    Rating INT NOT NULL,
    Comments NVARCHAR(1000) NOT NULL,
    WasAidTimely BIT NOT NULL,
    WasQuantitySufficient BIT NOT NULL,
    CreatedAtUtc DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    UpdatedAtUtc DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
);

CREATE TABLE AiRecommendations (
    Id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY,
    AssistanceRequestId UNIQUEIDENTIFIER NULL REFERENCES AssistanceRequests(Id) ON DELETE CASCADE,
    CrisisEventId UNIQUEIDENTIFIER NULL,
    RecommendationType NVARCHAR(50) NOT NULL,
    ModelIdentifier NVARCHAR(100) NOT NULL,
    RecommendedCategory NVARCHAR(50) NOT NULL,
    RecommendedUrgency NVARCHAR(50) NOT NULL,
    RecommendedPriorityScore FLOAT NOT NULL,
    ConfidenceScore FLOAT NOT NULL,
    Rationale NVARCHAR(2000) NOT NULL,
    ExplainableFactorsJson NVARCHAR(MAX) NOT NULL,
    SuggestedPayloadJson NVARCHAR(MAX) NOT NULL,
    GovernanceStatus NVARCHAR(50) NOT NULL,
    CreatedAtUtc DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    UpdatedAtUtc DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
);

CREATE TABLE GovernanceDecisions (
    Id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY,
    AiRecommendationId UNIQUEIDENTIFIER NOT NULL UNIQUE REFERENCES AiRecommendations(Id) ON DELETE CASCADE,
    ActionTaken NVARCHAR(50) NOT NULL,
    OriginalAiRecommendationSummary NVARCHAR(500) NOT NULL,
    OriginalConfidence FLOAT NOT NULL,
    FinalHumanDecisionSummary NVARCHAR(500) NOT NULL,
    OverrideJustification NVARCHAR(1000) NOT NULL,
    ResponsibleUserId UNIQUEIDENTIFIER NOT NULL,
    ResponsibleUserName NVARCHAR(200) NOT NULL,
    ResponsibleUserRole NVARCHAR(50) NOT NULL,
    DecisionTimestampUtc DATETIME2 NOT NULL,
    CreatedAtUtc DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    UpdatedAtUtc DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
);

CREATE TABLE Shelters (
    Id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY,
    Name NVARCHAR(200) NOT NULL,
    CrisisEventId UNIQUEIDENTIFIER NOT NULL REFERENCES CrisisEvents(Id),
    Address NVARCHAR(300) NOT NULL,
    Latitude FLOAT NOT NULL,
    Longitude FLOAT NOT NULL,
    TotalCapacity INT NOT NULL,
    CurrentOccupancy INT NOT NULL,
    IsWheelchairAccessible BIT NOT NULL,
    HasMedicalFacility BIT NOT NULL,
    HasCleanWater BIT NOT NULL,
    HasPowerBackup BIT NOT NULL,
    HasChildSafeSpace BIT NOT NULL,
    AvailableServices NVARCHAR(500) NOT NULL,
    Status NVARCHAR(50) NOT NULL,
    ManagedByOrganisationId UNIQUEIDENTIFIER NULL,
    CreatedAtUtc DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    UpdatedAtUtc DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
);

CREATE TABLE ShelterAllocations (
    Id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY,
    ShelterId UNIQUEIDENTIFIER NOT NULL REFERENCES Shelters(Id),
    AssistanceRequestId UNIQUEIDENTIFIER NULL,
    CitizenUserId UNIQUEIDENTIFIER NOT NULL,
    HouseholdName NVARCHAR(200) NOT NULL,
    AllocatedMembersCount INT NOT NULL,
    RequiresAccessibility BIT NOT NULL,
    AllocationStatus NVARCHAR(50) NOT NULL,
    ApprovedByUserId UNIQUEIDENTIFIER NOT NULL,
    CreatedAtUtc DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    UpdatedAtUtc DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
);

CREATE TABLE Resources (
    Id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY,
    Name NVARCHAR(200) NOT NULL,
    Category NVARCHAR(50) NOT NULL,
    Unit NVARCHAR(50) NOT NULL,
    TotalQuantity INT NOT NULL,
    AvailableQuantity INT NOT NULL,
    AllocatedQuantity INT NOT NULL,
    ReorderThreshold INT NOT NULL,
    WarehouseName NVARCHAR(200) NOT NULL,
    WarehouseLatitude FLOAT NOT NULL,
    WarehouseLongitude FLOAT NOT NULL,
    SupportsColdChain BIT NOT NULL,
    ExpiryDateUtc DATETIME2 NULL,
    OwningOrganisationId UNIQUEIDENTIFIER NULL,
    CreatedAtUtc DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    UpdatedAtUtc DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
);

CREATE TABLE ResourceAllocations (
    Id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY,
    ResourceItemId UNIQUEIDENTIFIER NOT NULL REFERENCES Resources(Id),
    AssistanceRequestId UNIQUEIDENTIFIER NOT NULL REFERENCES AssistanceRequests(Id),
    RequestedQuantity INT NOT NULL,
    AllocatedQuantity INT NOT NULL,
    IsPartialShortageAllocation BIT NOT NULL,
    AllocationStrategyUsed NVARCHAR(100) NOT NULL,
    ConstraintMatchScore FLOAT NOT NULL,
    EstimatedDistanceKm FLOAT NOT NULL,
    AlternativeRecommendation NVARCHAR(1000) NOT NULL,
    Status NVARCHAR(50) NOT NULL,
    ApprovedByUserId UNIQUEIDENTIFIER NOT NULL,
    CreatedAtUtc DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    UpdatedAtUtc DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
);

CREATE TABLE DispatchRecords (
    Id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY,
    ResourceAllocationId UNIQUEIDENTIFIER NOT NULL REFERENCES ResourceAllocations(Id),
    VehicleRegistration NVARCHAR(50) NOT NULL,
    DriverName NVARCHAR(150) NOT NULL,
    RouteSummary NVARCHAR(500) NOT NULL,
    DistanceKm FLOAT NOT NULL,
    EstimatedTravelMinutes INT NOT NULL,
    DispatchStatus NVARCHAR(50) NOT NULL,
    DispatchedAtUtc DATETIME2 NOT NULL,
    DeliveredAtUtc DATETIME2 NULL,
    CreatedAtUtc DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    UpdatedAtUtc DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
);

CREATE TABLE PartnerAidRequests (
    Id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY,
    RequestingOrganisationId UNIQUEIDENTIFIER NOT NULL,
    TargetPartnerOrganisationId UNIQUEIDENTIFIER NULL,
    NeededCategory NVARCHAR(50) NOT NULL,
    ResourceName NVARCHAR(200) NOT NULL,
    QuantityNeeded INT NOT NULL,
    Justification NVARCHAR(1000) NOT NULL,
    Status NVARCHAR(50) NOT NULL,
    CreatedAtUtc DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    UpdatedAtUtc DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
);

CREATE TABLE Volunteers (
    Id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY,
    UserId UNIQUEIDENTIFIER NOT NULL,
    FullName NVARCHAR(200) NOT NULL,
    SkillsCsv NVARCHAR(500) NOT NULL,
    LanguagesCsv NVARCHAR(100) NOT NULL,
    IsVerified BIT NOT NULL,
    IsAvailable BIT NOT NULL,
    AvailabilitySchedule NVARCHAR(200) NOT NULL,
    CurrentLatitude FLOAT NOT NULL,
    CurrentLongitude FLOAT NOT NULL,
    CompletedTasksCount INT NOT NULL,
    CreatedAtUtc DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    UpdatedAtUtc DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
);

CREATE TABLE VolunteerAssignments (
    Id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY,
    VolunteerProfileId UNIQUEIDENTIFIER NOT NULL REFERENCES Volunteers(Id),
    AssistanceRequestId UNIQUEIDENTIFIER NULL,
    TaskTitle NVARCHAR(250) NOT NULL,
    RequiredSkill NVARCHAR(100) NOT NULL,
    AiMatchScore FLOAT NOT NULL,
    DistanceKm FLOAT NOT NULL,
    Status NVARCHAR(50) NOT NULL,
    CompletionNotes NVARCHAR(1000) NOT NULL,
    CompletedAtUtc DATETIME2 NULL,
    CreatedAtUtc DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    UpdatedAtUtc DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
);

CREATE TABLE DonationCampaigns (
    Id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY,
    Title NVARCHAR(250) NOT NULL,
    CrisisEventId UNIQUEIDENTIFIER NOT NULL REFERENCES CrisisEvents(Id),
    TargetAmountUsd DECIMAL(18, 2) NOT NULL,
    CollectedAmountUsd DECIMAL(18, 2) NOT NULL,
    DisbursedAmountUsd DECIMAL(18, 2) NOT NULL,
    IsActive BIT NOT NULL,
    CreatedAtUtc DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    UpdatedAtUtc DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
);

CREATE TABLE Donations (
    Id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY,
    CampaignId UNIQUEIDENTIFIER NOT NULL REFERENCES DonationCampaigns(Id),
    DonorUserId UNIQUEIDENTIFIER NULL,
    DonorName NVARCHAR(200) NOT NULL,
    DonationType NVARCHAR(50) NOT NULL,
    MonetaryAmountUsd DECIMAL(18, 2) NOT NULL,
    MaterialDescription NVARCHAR(500) NOT NULL,
    MaterialQuantity INT NOT NULL,
    PaymentGatewayReference NVARCHAR(150) NOT NULL,
    AllocationPurpose NVARCHAR(300) NOT NULL,
    IsFlaggedSuspicious BIT NOT NULL,
    SuspiciousReason NVARCHAR(500) NOT NULL,
    IsReviewedByHuman BIT NOT NULL,
    VerificationStatus NVARCHAR(50) NOT NULL,
    CreatedAtUtc DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    UpdatedAtUtc DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
);

CREATE TABLE Notifications (
    Id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY,
    RecipientUserId UNIQUEIDENTIFIER NOT NULL,
    RecipientContact NVARCHAR(200) NOT NULL,
    Channel NVARCHAR(50) NOT NULL,
    LanguageCode NVARCHAR(10) NOT NULL,
    Subject NVARCHAR(250) NOT NULL,
    MessageBody NVARCHAR(2000) NOT NULL,
    IdempotencyKey NVARCHAR(150) NOT NULL,
    DeliveryStatus NVARCHAR(50) NOT NULL,
    RetryAttempts INT NOT NULL,
    ProviderResponse NVARCHAR(500) NOT NULL,
    CreatedAtUtc DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    UpdatedAtUtc DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
);

CREATE INDEX IX_Notifications_IdempotencyKey ON Notifications(IdempotencyKey);

CREATE TABLE MappingReferences (
    Id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY,
    Label NVARCHAR(200) NOT NULL,
    ReferenceType NVARCHAR(50) NOT NULL,
    Latitude FLOAT NOT NULL,
    Longitude FLOAT NOT NULL,
    GeoJsonPolygon NVARCHAR(MAX) NOT NULL,
    CrisisEventId UNIQUEIDENTIFIER NOT NULL,
    CreatedAtUtc DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    UpdatedAtUtc DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
);

CREATE TABLE AuditEvents (
    Id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY,
    EventCategory NVARCHAR(100) NOT NULL,
    ActionName NVARCHAR(150) NOT NULL,
    EntityType NVARCHAR(100) NOT NULL,
    EntityId NVARCHAR(150) NOT NULL,
    ActorUserId UNIQUEIDENTIFIER NULL,
    ActorUserName NVARCHAR(200) NOT NULL,
    ActorRole NVARCHAR(50) NOT NULL,
    DetailsJson NVARCHAR(MAX) NOT NULL,
    IpAddress NVARCHAR(50) NOT NULL,
    CreatedAtUtc DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    UpdatedAtUtc DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
);

CREATE TABLE CampaignExpenditures (
    Id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY,
    CampaignId UNIQUEIDENTIFIER NOT NULL REFERENCES DonationCampaigns(Id),
    AmountUsd DECIMAL(18, 2) NOT NULL,
    Category NVARCHAR(100) NOT NULL,
    Description NVARCHAR(500) NOT NULL,
    RecordedByUserId UNIQUEIDENTIFIER NOT NULL,
    RecordedByUserName NVARCHAR(200) NOT NULL,
    ApprovedAtUtc DATETIME2 NOT NULL,
    CreatedAtUtc DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    UpdatedAtUtc DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
);

CREATE TABLE OperationalKpiSnapshots (
    Id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY,
    TotalRequests INT NOT NULL,
    UnresolvedCasesCount INT NOT NULL,
    CriticalOpenCasesCount INT NOT NULL,
    AverageResponseTimeMinutes FLOAT NOT NULL,
    ResourceUtilisationPercentage FLOAT NOT NULL,
    ShelterOccupancyPercentage FLOAT NOT NULL,
    TotalDonationsCollectedUsd DECIMAL(18, 2) NOT NULL,
    CapturedAtUtc DATETIME2 NOT NULL,
    CreatedAtUtc DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    UpdatedAtUtc DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
);
GO
