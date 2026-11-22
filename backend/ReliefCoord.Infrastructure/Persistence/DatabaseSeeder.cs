using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using ReliefCoord.Application.Services;
using ReliefCoord.Domain.Entities;
using ReliefCoord.Domain.Enums;

namespace ReliefCoord.Infrastructure.Persistence;

public static class DatabaseSeeder
{
    public static async Task EnsureCleanProductionDatabaseAsync(ReliefCoordDbContext db)
    {
        await db.Database.EnsureCreatedAsync();

        try
        {
            await db.Users.Select(u => new
            {
                u.AccountStatus,
                u.InvitedByUserName,
                u.InvitationCode,
                u.ProfilePhotoUrl,
                u.QuickUnlockEnabled,
                u.QuickUnlockMode,
                u.QuickUnlockBiometricCredentialId,
                u.QuickUnlockFailedAttempts,
                u.QuickUnlockTrustedDevicesJson
            }).FirstOrDefaultAsync();
            await db.Organisations.Select(o => new { o.PartnershipStatus, o.PartnershipProposal }).FirstOrDefaultAsync();
            await db.CampaignExpenditures.Select(e => e.Id).FirstOrDefaultAsync();
            await db.OperationalKpiSnapshots.Select(s => s.Id).FirstOrDefaultAsync();
        }
        catch
        {
            await db.Database.EnsureDeletedAsync();
            await db.Database.EnsureCreatedAsync();
        }

        var hasLegacyDemoData = await db.Users.AnyAsync(u => u.Email == "coordinator@relief.org");
        var hasLegacyPasswordHashes = await db.Users.AnyAsync(u => !u.PasswordHash.StartsWith("PBKDF2$"));

        if (hasLegacyDemoData || hasLegacyPasswordHashes)
        {
            await db.Database.EnsureDeletedAsync();
            await db.Database.EnsureCreatedAsync();
        }

        var orgUnOchaId = Guid.Parse("11111111-1111-1111-1111-111111111101");
        var orgRedCrossId = Guid.Parse("11111111-1111-1111-1111-111111111102");
        var orgDmcId = Guid.Parse("11111111-1111-1111-1111-111111111103");
        var orgMsfId = Guid.Parse("11111111-1111-1111-1111-111111111104");
        var orgSarvodayaId = Guid.Parse("11111111-1111-1111-1111-111111111105");

        var existingOrgIds = (await db.Organisations
            .Select(o => o.Id)
            .ToListAsync())
            .ToHashSet();

        var baselineOrganisations = new List<Organisation>
        {
            new()
            {
                Id = orgUnOchaId,
                Name = "UN OCHA Regional Coordination Office",
                OrganisationType = "International Agency",
                Country = "Sri Lanka / Regional",
                ContactEmail = "ops@unocha-relief.org",
                ContactPhone = "+94-11-2501234",
                IsVerified = true,
                PartnershipStatus = "Approved",
                PartnershipProposal = "Founding UN Coordination Partner"
            },
            new()
            {
                Id = orgRedCrossId,
                Name = "Sri Lanka Red Cross Society",
                OrganisationType = "National NGO",
                Country = "Sri Lanka",
                ContactEmail = "dispatch@redcross.lk",
                ContactPhone = "+94-11-2691095",
                IsVerified = true,
                PartnershipStatus = "Approved",
                PartnershipProposal = "National Humanitarian & Relief Logistics Partner"
            },
            new()
            {
                Id = orgDmcId,
                Name = "National Disaster Management Centre (DMC)",
                OrganisationType = "Government Authority",
                Country = "Sri Lanka",
                ContactEmail = "eoc@dmc.gov.lk",
                ContactPhone = "+94-11-2136136",
                IsVerified = true,
                PartnershipStatus = "Approved",
                PartnershipProposal = "National Statutory Emergency Authority"
            },
            new()
            {
                Id = orgMsfId,
                Name = "Médecins Sans Frontières (MSF Medical Rapid Team)",
                OrganisationType = "Medical INGO",
                Country = "International",
                ContactEmail = "medical-coord@msf.org",
                ContactPhone = "+94-11-2445566",
                IsVerified = true,
                PartnershipStatus = "Approved",
                PartnershipProposal = "International Rapid Medical Response Partner"
            },
            new()
            {
                Id = orgSarvodayaId,
                Name = "Sarvodaya Disaster Relief Unit",
                OrganisationType = "National Relief NGO",
                Country = "Sri Lanka",
                ContactEmail = "coord@sarvodaya-relief.lk",
                ContactPhone = "+94-11-2655255",
                IsVerified = false,
                PartnershipStatus = "Pending",
                PartnershipProposal = "Field volunteer mobilization, mobile kitchens, and community evacuation shelters across Sabaragamuwa and Western Provinces.",
                CreatedAtUtc = DateTime.UtcNow.AddHours(-3),
                UpdatedAtUtc = DateTime.UtcNow.AddHours(-3)
            }
        };

        var orgsToInsert = baselineOrganisations
            .Where(o => !existingOrgIds.Contains(o.Id))
            .ToList();

        if (orgsToInsert.Count > 0)
        {
            await db.Organisations.AddRangeAsync(orgsToInsert);
            await db.SaveChangesAsync();
        }

        var existingEmails = (await db.Users
            .Select(u => u.Email.ToLower())
            .ToListAsync())
            .ToHashSet();

        var (standardHash, standardSalt) = HumanitarianOperationsService.HashPassword("Crisync@2026");
        var (adminHash, adminSalt) = HumanitarianOperationsService.HashPassword("Admin@Crisync2026");

        var nimaliId = Guid.Parse("22222222-2222-2222-2222-222222222211");
        var arjunaId = Guid.Parse("22222222-2222-2222-2222-222222222212");
        var kasunId = Guid.Parse("22222222-2222-2222-2222-222222222213");
        var dilshanId = Guid.Parse("22222222-2222-2222-2222-222222222216");
        var elenaId = Guid.Parse("22222222-2222-2222-2222-222222222217");
        var sanjayaId = Guid.Parse("22222222-2222-2222-2222-222222222219");
        var tharushiId = Guid.Parse("22222222-2222-2222-2222-222222222220");
        var kamalId = Guid.Parse("22222222-2222-2222-2222-222222222221");
        var samanId = Guid.Parse("22222222-2222-2222-2222-222222222222");
        var malaId = Guid.Parse("22222222-2222-2222-2222-222222222223");
        var nuwanId = Guid.Parse("22222222-2222-2222-2222-222222222224");
        var pradeepId = Guid.Parse("22222222-2222-2222-2222-222222222225");

        var officialAccounts = new List<AppUser>
        {
            new()
            {
                Id = nimaliId,
                FullName = "Nimali Perera",
                Email = "citizen@crisync.org",
                PhoneNumber = "+94-77-1112233",
                PasswordHash = standardHash,
                PasswordSalt = standardSalt,
                Role = UserRole.Citizen,
                PreferredLanguage = "si",
                IsActive = true
            },
            new()
            {
                Id = arjunaId,
                FullName = "Dr. Arjuna Jayawardena",
                Email = "coordinator@crisync.org",
                PhoneNumber = "+94-77-2223344",
                PasswordHash = standardHash,
                PasswordSalt = standardSalt,
                Role = UserRole.EmergencyCoordinator,
                PreferredLanguage = "en",
                OrganisationId = orgUnOchaId,
                IsActive = true
            },
            new()
            {
                Id = kasunId,
                FullName = "Kasun Fernando",
                Email = "casemanager@crisync.org",
                PhoneNumber = "+94-77-3334455",
                PasswordHash = standardHash,
                PasswordSalt = standardSalt,
                Role = UserRole.CaseManager,
                PreferredLanguage = "en",
                OrganisationId = orgDmcId,
                IsActive = true
            },
            new()
            {
                Id = Guid.Parse("22222222-2222-2222-2222-222222222214"),
                FullName = "Roshan Silva",
                Email = "logistics@crisync.org",
                PhoneNumber = "+94-77-4445566",
                PasswordHash = standardHash,
                PasswordSalt = standardSalt,
                Role = UserRole.LogisticsManager,
                PreferredLanguage = "en",
                OrganisationId = orgRedCrossId,
                IsActive = true
            },
            new()
            {
                Id = Guid.Parse("22222222-2222-2222-2222-222222222215"),
                FullName = "Meena Selvarajah",
                Email = "shelter@crisync.org",
                PhoneNumber = "+94-77-5556677",
                PasswordHash = standardHash,
                PasswordSalt = standardSalt,
                Role = UserRole.ShelterAdmin,
                PreferredLanguage = "ta",
                OrganisationId = orgDmcId,
                IsActive = true
            },
            new()
            {
                Id = dilshanId,
                FullName = "Dilshan Bandara",
                Email = "volunteer@crisync.org",
                PhoneNumber = "+94-77-6667788",
                PasswordHash = standardHash,
                PasswordSalt = standardSalt,
                Role = UserRole.VolunteerCoordinator,
                PreferredLanguage = "en",
                OrganisationId = orgRedCrossId,
                IsActive = true
            },
            new()
            {
                Id = elenaId,
                FullName = "Elena Rostova",
                Email = "donor@crisync.org",
                PhoneNumber = "+94-77-7778899",
                PasswordHash = standardHash,
                PasswordSalt = standardSalt,
                Role = UserRole.DonorOfficer,
                PreferredLanguage = "en",
                OrganisationId = orgUnOchaId,
                IsActive = true
            },
            new()
            {
                Id = Guid.Parse("22222222-2222-2222-2222-222222222218"),
                FullName = "Dr. Tariq Al-Mansoor",
                Email = "partner@crisync.org",
                PhoneNumber = "+94-77-8889900",
                PasswordHash = standardHash,
                PasswordSalt = standardSalt,
                Role = UserRole.PartnerOfficer,
                PreferredLanguage = "ar",
                OrganisationId = orgMsfId,
                IsActive = true
            },
            new()
            {
                Id = sanjayaId,
                FullName = "Sanjaya Perera",
                Email = "publicdonor@crisync.org",
                PhoneNumber = "+94-77-9900112",
                PasswordHash = standardHash,
                PasswordSalt = standardSalt,
                Role = UserRole.Donor,
                PreferredLanguage = "en",
                IsActive = true,
                AccountStatus = "Active"
            },
            new()
            {
                Id = tharushiId,
                FullName = "Tharushi Mendis",
                Email = "fieldvolunteer@crisync.org",
                PhoneNumber = "+94-77-9900223",
                PasswordHash = standardHash,
                PasswordSalt = standardSalt,
                Role = UserRole.Volunteer,
                PreferredLanguage = "si",
                IsActive = true,
                AccountStatus = "Active"
            },
            new()
            {
                Id = kamalId,
                FullName = "Kamal Jayasuriya",
                Email = "kamal.jayasuriya@crisync.org",
                PhoneNumber = "+94-77-4128890",
                PasswordHash = standardHash,
                PasswordSalt = standardSalt,
                Role = UserRole.Citizen,
                PreferredLanguage = "si",
                IsActive = true,
                AccountStatus = "Active",
                InvitedByUserName = "Kasun Fernando (Case Manager On-Behalf)",
                CreatedAtUtc = DateTime.UtcNow.AddHours(-4),
                UpdatedAtUtc = DateTime.UtcNow.AddHours(-4)
            },
            new()
            {
                Id = samanId,
                FullName = "Saman Kumara",
                Email = "saman.kumara@crisync.org",
                PhoneNumber = "+94-77-5241108",
                PasswordHash = standardHash,
                PasswordSalt = standardSalt,
                Role = UserRole.Citizen,
                PreferredLanguage = "si",
                IsActive = true,
                AccountStatus = "Active",
                CreatedAtUtc = DateTime.UtcNow.AddHours(-3),
                UpdatedAtUtc = DateTime.UtcNow.AddHours(-3)
            },
            new()
            {
                Id = malaId,
                FullName = "Mala Wijeratne",
                Email = "mala.wijeratne@crisync.org",
                PhoneNumber = "+94-77-6394471",
                PasswordHash = standardHash,
                PasswordSalt = standardSalt,
                Role = UserRole.Citizen,
                PreferredLanguage = "en",
                IsActive = true,
                AccountStatus = "Active",
                CreatedAtUtc = DateTime.UtcNow.AddHours(-2),
                UpdatedAtUtc = DateTime.UtcNow.AddHours(-2)
            },
            new()
            {
                Id = nuwanId,
                FullName = "Nuwan Jayaweera",
                Email = "nuwan.jayaweera@crisync.org",
                PhoneNumber = "+94-77-8142290",
                PasswordHash = standardHash,
                PasswordSalt = standardSalt,
                Role = UserRole.Volunteer,
                PreferredLanguage = "si",
                IsActive = false,
                AccountStatus = "Pending",
                CreatedAtUtc = DateTime.UtcNow.AddHours(-2),
                UpdatedAtUtc = DateTime.UtcNow.AddHours(-2)
            },
            new()
            {
                Id = pradeepId,
                FullName = "Pradeep Gunasekara",
                Email = "pradeep@sarvodaya-relief.lk",
                PhoneNumber = "+94-77-3905514",
                PasswordHash = standardHash,
                PasswordSalt = standardSalt,
                Role = UserRole.PartnerOfficer,
                PreferredLanguage = "en",
                OrganisationId = orgSarvodayaId,
                IsActive = true,
                AccountStatus = "PendingPartnership",
                CreatedAtUtc = DateTime.UtcNow.AddHours(-3),
                UpdatedAtUtc = DateTime.UtcNow.AddHours(-3)
            },
            new()
            {
                Id = Guid.Parse("22222222-2222-2222-2222-222222222297"),
                FullName = "Nadia Al-Khatib",
                Email = "orgadmin@crisync.org",
                PhoneNumber = "+94-11-2000300",
                PasswordHash = adminHash,
                PasswordSalt = adminSalt,
                Role = UserRole.OrganizationAdmin,
                PreferredLanguage = "en",
                OrganisationId = orgUnOchaId,
                IsActive = true,
                AccountStatus = "Active"
            },
            new()
            {
                Id = Guid.Parse("22222222-2222-2222-2222-222222222298"),
                FullName = "Anura Senanayake",
                Email = "backup.admin@crisync.org",
                PhoneNumber = "+94-11-2000200",
                PasswordHash = adminHash,
                PasswordSalt = adminSalt,
                Role = UserRole.SystemAdmin,
                PreferredLanguage = "en",
                OrganisationId = orgUnOchaId,
                IsActive = true,
                AccountStatus = "Active"
            },
            new()
            {
                Id = Guid.Parse("22222222-2222-2222-2222-222222222299"),
                FullName = "Chaminda Wijesinghe",
                Email = "admin@crisync.org",
                PhoneNumber = "+94-11-2000100",
                PasswordHash = adminHash,
                PasswordSalt = adminSalt,
                Role = UserRole.SystemAdmin,
                PreferredLanguage = "en",
                OrganisationId = orgUnOchaId,
                IsActive = true,
                AccountStatus = "Active"
            }
        };

        var accountsToInsert = officialAccounts
            .Where(acc => !existingEmails.Contains(acc.Email.ToLowerInvariant()))
            .ToList();

        if (accountsToInsert.Count > 0)
        {
            await db.Users.AddRangeAsync(accountsToInsert);
            await db.SaveChangesAsync();
        }

        if (!await db.RolePermissions.AnyAsync())
        {
            var baselinePermissions = new List<RolePermission>
            {
                new() { Role = UserRole.SystemAdmin, PermissionCode = "ADMIN_MANAGE_ALL", Description = "Global governance, invite Donor Officers, enforce admin policy, manage integrations and roles" },
                new() { Role = UserRole.SystemAdmin, PermissionCode = "ADMIN_INVITE_DONOR_OFFICER", Description = "Exclusive authority to invite and appoint Donor / Funding Officers" },
                new() { Role = UserRole.OrganizationAdmin, PermissionCode = "ORG_ADMIN_STAFF_CONTROL", Description = "Manage organization staff accounts, approve partner requests, and view audit logs" },
                new() { Role = UserRole.EmergencyCoordinator, PermissionCode = "INVITE_OPERATIONAL_STAFF", Description = "Invite Case Managers, Shelter Admins, Logistics Managers, and Volunteer Coordinators" },
                new() { Role = UserRole.CaseManager, PermissionCode = "REGISTER_CITIZEN_ON_BEHALF", Description = "Register Citizens on their behalf during emergencies without phone or internet" },
                new() { Role = UserRole.VolunteerCoordinator, PermissionCode = "VERIFY_ACTIVATE_VOLUNTEERS", Description = "Verify self-registered Pending volunteers and activate their accounts" },
                new() { Role = UserRole.DonorOfficer, PermissionCode = "MANAGE_DONATION_FUNDS", Description = "Manage relief fundraising campaigns and approve high-value financial compliance donations" },
                new() { Role = UserRole.PartnerOfficer, PermissionCode = "SUBMIT_PARTNERSHIP_REQUEST", Description = "Submit partner organization request and coordinate shared stock once approved" },
                new() { Role = UserRole.ShelterAdmin, PermissionCode = "MANAGE_SHELTERS", Description = "Register temporary evacuation shelters and manage household allocations" },
                new() { Role = UserRole.LogisticsManager, PermissionCode = "MANAGE_LOGISTICS_DISPATCH", Description = "Manage relief warehouses, simulate allocations, and dispatch supplies" },
                new() { Role = UserRole.Volunteer, PermissionCode = "VOLUNTEER_FIELD_PARTICIPATION", Description = "Self-register and participate in verified field relief tasks" },
                new() { Role = UserRole.Donor, PermissionCode = "MAKE_DONATIONS", Description = "Self-register independently and contribute monetary or in-kind relief donations" },
                new() { Role = UserRole.Citizen, PermissionCode = "SUBMIT_ASSISTANCE_REQUEST", Description = "Self-register, manage household profile, submit requests, and track aid delivery" }
            };

            await db.RolePermissions.AddRangeAsync(baselinePermissions);
            await db.SaveChangesAsync();
        }

        if (!await db.Households.AnyAsync())
        {
            var households = new List<HouseholdProfile>
            {
                new()
                {
                    UserId = nimaliId,
                    HouseholdHeadName = "Nimali Perera",
                    TotalMembers = 6,
                    ChildrenCount = 2,
                    ElderlyCount = 1,
                    HasMobilityNeeds = true,
                    HasChronicMedicalNeeds = true,
                    MedicalNotes = "Grandmother requires daily cold-chain Insulin glargine and wheelchair evacuation support.",
                    PrimaryAddress = "42 Kalu Ganga Bank Road, Ratnapura",
                    Latitude = 6.6828,
                    Longitude = 80.3992
                },
                new()
                {
                    UserId = kamalId,
                    HouseholdHeadName = "Kamal Jayasuriya",
                    TotalMembers = 5,
                    ChildrenCount = 2,
                    ElderlyCount = 1,
                    HasMobilityNeeds = false,
                    HasChronicMedicalNeeds = true,
                    MedicalNotes = "Elderly father has minor laceration and needs clean dressings and antibiotics.",
                    PrimaryAddress = "Nivitigala Valley Road, Ratnapura",
                    Latitude = 6.6650,
                    Longitude = 80.4150
                },
                new()
                {
                    UserId = samanId,
                    HouseholdHeadName = "Saman Kumara",
                    TotalMembers = 4,
                    ChildrenCount = 1,
                    ElderlyCount = 1,
                    HasMobilityNeeds = true,
                    HasChronicMedicalNeeds = true,
                    MedicalNotes = "Father sheltering at Kalu Ganga corner clinic needs insulin refills.",
                    PrimaryAddress = "44 Kalu Ganga Bank Road, Ratnapura",
                    Latitude = 6.6830,
                    Longitude = 80.3995
                },
                new()
                {
                    UserId = malaId,
                    HouseholdHeadName = "Mala Wijeratne",
                    TotalMembers = 5,
                    ChildrenCount = 2,
                    ElderlyCount = 1,
                    HasMobilityNeeds = true,
                    HasChronicMedicalNeeds = false,
                    MedicalNotes = "Sheltering with community group at St. Luke's Parish Hall including infants and seniors.",
                    PrimaryAddress = "St. Luke Parish Road, Kalutara",
                    Latitude = 6.5854,
                    Longitude = 79.9607
                }
            };

            await db.Households.AddRangeAsync(households);
            await db.SaveChangesAsync();
        }

        var crisisFloodId = Guid.Parse("33333333-3333-3333-3333-333333333311");
        if (!await db.CrisisEvents.AnyAsync())
        {
            var crisisFlood = new CrisisEvent
            {
                Id = crisisFloodId,
                Title = "Southwest Monsoon Kalu Ganga Basin Severe Flooding & Landslides",
                CrisisType = CrisisType.Flood,
                Severity = CrisisSeverity.Critical,
                Country = "Sri Lanka",
                Region = "Sabaragamuwa & Western Provinces (Ratnapura / Kalutara)",
                Description = "Torrential monsoon rainfall exceeding 340mm in 24 hours caused major embankment breaches along Kalu Ganga and triggered slope failures in Badulla.",
                CenterLatitude = 6.6828,
                CenterLongitude = 80.3992,
                RadiusKm = 45.0,
                IsActive = true,
                LeadCoordinatorId = arjunaId,
                CreatedAtUtc = DateTime.UtcNow.AddHours(-6),
                UpdatedAtUtc = DateTime.UtcNow.AddHours(-5),
                OperationalAreas = new List<OperationalArea>
                {
                    new()
                    {
                        ZoneName = "Sector Alpha - Ratnapura Town Lowlands",
                        District = "Ratnapura",
                        Latitude = 6.6828,
                        Longitude = 80.3992,
                        CoverageRadiusKm = 15.0,
                        EstimatedAffectedPopulation = 18400,
                        RiskLevel = "Critical",
                        AssignedOrganisationId = orgDmcId
                    },
                    new()
                    {
                        ZoneName = "Sector Bravo - Kalutara River Mouth",
                        District = "Kalutara",
                        Latitude = 6.5854,
                        Longitude = 79.9607,
                        CoverageRadiusKm = 18.0,
                        EstimatedAffectedPopulation = 14200,
                        RiskLevel = "High",
                        AssignedOrganisationId = orgRedCrossId
                    },
                    new()
                    {
                        ZoneName = "Sector Charlie - Badulla Highland Slope",
                        District = "Badulla",
                        Latitude = 6.9934,
                        Longitude = 81.0550,
                        CoverageRadiusKm = 12.0,
                        EstimatedAffectedPopulation = 6900,
                        RiskLevel = "Critical",
                        AssignedOrganisationId = orgMsfId
                    }
                }
            };

            await db.CrisisEvents.AddAsync(crisisFlood);

            var alert = new PublicAlert
            {
                CrisisEventId = crisisFloodId,
                Title = "RED FLOOD EVACUATION WARNING: Kalu Ganga Basin",
                Message = "Water levels at Ratnapura gauge have exceeded major flood stage (9.8m). Residents in low-lying divisions must evacuate immediately to verified elevated shelters.",
                SeverityLevel = "Critical",
                SafetyGuidance = "Disconnect mains electricity, carry essential prescription medicines, avoid wading through moving floodwater, and proceed to Ratnapura Central Complex or Kalutara Civic Relief Centre.",
                TranslationsJson = JsonSerializer.Serialize(new Dictionary<string, string>
                {
                    ["si"] = "රතු ගංවතුර අනතුරු ඇඟවීම: කළු ගඟ ද්‍රෝණියේ ජල මට්ටම අවදානම් සීමාව ඉක්මවා ඇත. වහාම ආරක්ෂිත මධ්‍යස්ථාන වෙත යොමු වන්න.",
                    ["ta"] = "சிவப்பு வெள்ள அபாய எச்சரிக்கை: களுகங்கைப் பகுதியில் நீர்மட்டம் அபாய அளவைத் தாண்டியுள்ளது. உடனடியாக பாதுகாப்பான முகாம்களுக்குச் செல்லவும்."
                }),
                IsVerified = true,
                IssuedByUserId = arjunaId,
                CreatedAtUtc = DateTime.UtcNow.AddHours(-5),
                UpdatedAtUtc = DateTime.UtcNow.AddHours(-5)
            };

            await db.PublicAlerts.AddAsync(alert);
            await db.SaveChangesAsync();
        }
        else
        {
            var existingCrisis = await db.CrisisEvents.OrderByDescending(c => c.IsActive).FirstAsync();
            crisisFloodId = existingCrisis.Id;
        }

        if (!await db.Shelters.AnyAsync())
        {
            var shelters = new List<Shelter>
            {
                new()
                {
                    Id = Guid.Parse("44444444-4444-4444-4444-444444444411"),
                    Name = "Ratnapura Central High-Ground Relief Complex",
                    CrisisEventId = crisisFloodId,
                    Address = "Hilltop Circular Road, Ratnapura",
                    Latitude = 6.6915,
                    Longitude = 80.4080,
                    TotalCapacity = 450,
                    CurrentOccupancy = 390,
                    IsWheelchairAccessible = true,
                    HasMedicalFacility = true,
                    HasCleanWater = true,
                    HasPowerBackup = true,
                    HasChildSafeSpace = true,
                    AvailableServices = "Emergency Triage, Insulin Cold Storage, Wheelchair Ramps, Infant Nutrition",
                    Status = "Operational",
                    ManagedByOrganisationId = orgDmcId
                },
                new()
                {
                    Id = Guid.Parse("44444444-4444-4444-4444-444444444412"),
                    Name = "Kalutara North Community Evacuation Hall",
                    CrisisEventId = crisisFloodId,
                    Address = "Galle Road Junction, Kalutara",
                    Latitude = 6.5920,
                    Longitude = 79.9650,
                    TotalCapacity = 300,
                    CurrentOccupancy = 210,
                    IsWheelchairAccessible = true,
                    HasMedicalFacility = false,
                    HasCleanWater = true,
                    HasPowerBackup = true,
                    HasChildSafeSpace = true,
                    AvailableServices = "Dry Rations, Clean Water, Accessible Restrooms",
                    Status = "Operational",
                    ManagedByOrganisationId = orgRedCrossId
                },
                new()
                {
                    Id = Guid.Parse("44444444-4444-4444-4444-444444444413"),
                    Name = "Badulla Ridge School Emergency Center",
                    CrisisEventId = crisisFloodId,
                    Address = "Passara Road, Badulla",
                    Latitude = 6.9980,
                    Longitude = 81.0610,
                    TotalCapacity = 200,
                    CurrentOccupancy = 195,
                    IsWheelchairAccessible = false,
                    HasMedicalFacility = true,
                    HasCleanWater = true,
                    HasPowerBackup = false,
                    HasChildSafeSpace = false,
                    AvailableServices = "Trauma First Aid, Blankets, Hot Meals",
                    Status = "NearCapacity",
                    ManagedByOrganisationId = orgMsfId
                }
            };

            await db.Shelters.AddRangeAsync(shelters);
            await db.SaveChangesAsync();
        }

        if (!await db.Resources.AnyAsync())
        {
            var resources = new List<ResourceItem>
            {
                new()
                {
                    Id = Guid.Parse("55555555-5555-5555-5555-555555555511"),
                    Name = "Emergency Insulin & Acute Trauma Medical Kits",
                    Category = RequestCategory.Medicine,
                    Unit = "Medical Kits",
                    TotalQuantity = 80,
                    AvailableQuantity = 25,
                    AllocatedQuantity = 55,
                    ReorderThreshold = 30,
                    WarehouseName = "Ratnapura MSF Cold-Chain Depot",
                    WarehouseLatitude = 6.6890,
                    WarehouseLongitude = 80.4020,
                    SupportsColdChain = true,
                    ExpiryDateUtc = DateTime.UtcNow.AddDays(22),
                    OwningOrganisationId = orgMsfId
                },
                new()
                {
                    Id = Guid.Parse("55555555-5555-5555-5555-555555555512"),
                    Name = "Regional Reserve Medical Supplies",
                    Category = RequestCategory.Medicine,
                    Unit = "Medical Kits",
                    TotalQuantity = 150,
                    AvailableQuantity = 95,
                    AllocatedQuantity = 55,
                    ReorderThreshold = 40,
                    WarehouseName = "Colombo Central UN OCHA Logistics Hub",
                    WarehouseLatitude = 6.9271,
                    WarehouseLongitude = 79.8612,
                    SupportsColdChain = true,
                    ExpiryDateUtc = DateTime.UtcNow.AddDays(120),
                    OwningOrganisationId = orgUnOchaId
                },
                new()
                {
                    Id = Guid.Parse("55555555-5555-5555-5555-555555555513"),
                    Name = "High-Energy Flood Ration Packs (72-Hour Family Pack)",
                    Category = RequestCategory.Food,
                    Unit = "Family Packs",
                    TotalQuantity = 600,
                    AvailableQuantity = 340,
                    AllocatedQuantity = 260,
                    ReorderThreshold = 100,
                    WarehouseName = "Kalutara Red Cross Forward Depot",
                    WarehouseLatitude = 6.5880,
                    WarehouseLongitude = 79.9630,
                    SupportsColdChain = false,
                    ExpiryDateUtc = DateTime.UtcNow.AddDays(45),
                    OwningOrganisationId = orgRedCrossId
                },
                new()
                {
                    Id = Guid.Parse("55555555-5555-5555-5555-555555555514"),
                    Name = "Potable Water Purification & 20L Jerrycans",
                    Category = RequestCategory.WaterAndSanitation,
                    Unit = "Units",
                    TotalQuantity = 500,
                    AvailableQuantity = 290,
                    AllocatedQuantity = 210,
                    ReorderThreshold = 100,
                    WarehouseName = "Ratnapura DMC Logistics Yard",
                    WarehouseLatitude = 6.6850,
                    WarehouseLongitude = 80.4010,
                    SupportsColdChain = false,
                    ExpiryDateUtc = DateTime.UtcNow.AddDays(365),
                    OwningOrganisationId = orgDmcId
                },
                new()
                {
                    Id = Guid.Parse("55555555-5555-5555-5555-555555555515"),
                    Name = "All-Terrain Evacuation Wheelchairs & Mobility Aids",
                    Category = RequestCategory.AccessibilityAssistance,
                    Unit = "Sets",
                    TotalQuantity = 60,
                    AvailableQuantity = 38,
                    AllocatedQuantity = 22,
                    ReorderThreshold = 15,
                    WarehouseName = "Ratnapura DMC Logistics Yard",
                    WarehouseLatitude = 6.6850,
                    WarehouseLongitude = 80.4010,
                    SupportsColdChain = false,
                    ExpiryDateUtc = null,
                    OwningOrganisationId = orgDmcId
                }
            };

            await db.Resources.AddRangeAsync(resources);
            await db.SaveChangesAsync();
        }

        if (!await db.AssistanceRequests.AnyAsync())
        {
            var req1Id = Guid.Parse("66666666-6666-6666-6666-666666666611");
            var req2Id = Guid.Parse("66666666-6666-6666-6666-666666666612");
            var req3Id = Guid.Parse("66666666-6666-6666-6666-666666666613");
            var req4Id = Guid.Parse("66666666-6666-6666-6666-666666666614");

            var requests = new List<AssistanceRequest>
            {
                new()
                {
                    Id = req1Id,
                    ReferenceCode = "REQ-20261116-1042",
                    CitizenUserId = nimaliId,
                    CrisisEventId = crisisFloodId,
                    Category = RequestCategory.Medicine,
                    SelfReportedUrgency = UrgencyLevel.Critical,
                    FinalApprovedUrgency = UrgencyLevel.LifeThreatening,
                    PriorityScore = 94.5,
                    Title = "Urgent Insulin & Dialysis Stabilization Kits for Flooded Kalu Ganga Bank Clinic",
                    Description = "Water has entered the ground floor along Kalu Ganga Bank Road and cut off road access since 5:30 AM. My grandmother and 17 other elderly diabetic patients sheltered at the neighbourhood clinic are nearly out of refrigerated insulin and stabilization supplies. Wheelchair evacuation or medical boat dispatch is urgently needed.",
                    AffectedPeopleCount = 18,
                    RequestedQuantity = 20,
                    RequiresAccessibilitySupport = true,
                    LocationAddress = "42 Kalu Ganga Bank Road, Ratnapura",
                    Latitude = 6.6828,
                    Longitude = 80.3992,
                    SupportingEvidenceFileName = "kalu_ganga_clinic_flood.jpg",
                    SupportingEvidenceMimeType = "image/jpeg",
                    Status = RequestStatus.Escalated,
                    IsFlaggedPotentialDuplicate = false,
                    AssignedCaseManagerId = kasunId,
                    AssignedOrganisationId = orgMsfId,
                    PreferredLanguage = "si",
                    IdempotencyKey = "REQ-HASH-20261116-1042",
                    CreatedAtUtc = DateTime.UtcNow.AddHours(-4).AddMinutes(-15),
                    UpdatedAtUtc = DateTime.UtcNow.AddMinutes(-25),
                    Timeline = new List<RequestHistory>
                    {
                        new()
                        {
                            AssistanceRequestId = req1Id,
                            PreviousStatus = RequestStatus.Submitted,
                            NewStatus = RequestStatus.PendingAiReview,
                            ActionDescription = "Emergency request submitted by Nimali Perera with flood photo evidence.",
                            ChangedByUserId = nimaliId,
                            ChangedByUserName = "Nimali Perera",
                            ChangedByRole = "Citizen",
                            CreatedAtUtc = DateTime.UtcNow.AddHours(-4).AddMinutes(-15),
                            UpdatedAtUtc = DateTime.UtcNow.AddHours(-4).AddMinutes(-15)
                        },
                        new()
                        {
                            AssistanceRequestId = req1Id,
                            PreviousStatus = RequestStatus.PendingAiReview,
                            NewStatus = RequestStatus.Escalated,
                            ActionDescription = "Escalated to LifeThreatening after Ratnapura District Medical Officer confirmation.",
                            ChangedByUserId = arjunaId,
                            ChangedByUserName = "Dr. Arjuna Jayawardena",
                            ChangedByRole = "EmergencyCoordinator",
                            CreatedAtUtc = DateTime.UtcNow.AddMinutes(-25),
                            UpdatedAtUtc = DateTime.UtcNow.AddMinutes(-25)
                        }
                    }
                },
                new()
                {
                    Id = req2Id,
                    ReferenceCode = "REQ-20261116-1048",
                    CitizenUserId = kamalId,
                    CrisisEventId = crisisFloodId,
                    Category = RequestCategory.Medicine,
                    SelfReportedUrgency = UrgencyLevel.Critical,
                    FinalApprovedUrgency = UrgencyLevel.Critical,
                    PriorityScore = 88.0,
                    Title = "Emergency Trauma & First-Aid Kits for Cut-Off Families in Nivitigala Valley",
                    Description = "Mudslide debris completely blocked the Nivitigala Valley estate road overnight and electricity and mobile signal are down. Logged through Case Manager Kasun Fernando on behalf of 14 injured estate residents needing wound dressing, antibiotics, and emergency medical kits.",
                    AffectedPeopleCount = 14,
                    RequestedQuantity = 18,
                    RequiresAccessibilitySupport = false,
                    LocationAddress = "Nivitigala Valley Road, Ratnapura",
                    Latitude = 6.6650,
                    Longitude = 80.4150,
                    SupportingEvidenceFileName = "nivitigala_landslide_road.jpg",
                    SupportingEvidenceMimeType = "image/jpeg",
                    Status = RequestStatus.Prioritised,
                    IsFlaggedPotentialDuplicate = false,
                    AssignedCaseManagerId = kasunId,
                    AssignedOrganisationId = orgMsfId,
                    PreferredLanguage = "si",
                    IdempotencyKey = "REQ-HASH-20261116-1048",
                    CreatedAtUtc = DateTime.UtcNow.AddHours(-3).AddMinutes(-20),
                    UpdatedAtUtc = DateTime.UtcNow.AddHours(-2).AddMinutes(-50),
                    Timeline = new List<RequestHistory>
                    {
                        new()
                        {
                            AssistanceRequestId = req2Id,
                            PreviousStatus = RequestStatus.Submitted,
                            NewStatus = RequestStatus.Prioritised,
                            ActionDescription = "Registered on behalf of Kamal Jayasuriya by Case Manager Kasun Fernando and verified for medical dispatch.",
                            ChangedByUserId = kasunId,
                            ChangedByUserName = "Kasun Fernando",
                            ChangedByRole = "CaseManager",
                            CreatedAtUtc = DateTime.UtcNow.AddHours(-3).AddMinutes(-20),
                            UpdatedAtUtc = DateTime.UtcNow.AddHours(-3).AddMinutes(-20)
                        }
                    }
                },
                new()
                {
                    Id = req3Id,
                    ReferenceCode = "REQ-20261116-1051",
                    CitizenUserId = samanId,
                    CrisisEventId = crisisFloodId,
                    Category = RequestCategory.Medicine,
                    SelfReportedUrgency = UrgencyLevel.High,
                    FinalApprovedUrgency = UrgencyLevel.High,
                    PriorityScore = 82.5,
                    Title = "Need Cold-Chain Insulin & Medical Kits Near Kalu Ganga Bank Clinic",
                    Description = "Sending an urgent request from 44 Kalu Ganga Bank Road — rising river water around the corner clinic has trapped 18 elderly diabetic patients who need insulin and medical kits immediately.",
                    AffectedPeopleCount = 18,
                    RequestedQuantity = 20,
                    RequiresAccessibilitySupport = true,
                    LocationAddress = "44 Kalu Ganga Bank Road, Ratnapura",
                    Latitude = 6.6830,
                    Longitude = 80.3995,
                    SupportingEvidenceFileName = "ratnapura_bank_road_water_level.jpg",
                    SupportingEvidenceMimeType = "image/jpeg",
                    Status = RequestStatus.PendingAiReview,
                    IsFlaggedPotentialDuplicate = true,
                    PotentialDuplicateOfRequestId = req1Id,
                    DuplicateSimilarityScore = 0.86,
                    AssignedCaseManagerId = kasunId,
                    AssignedOrganisationId = orgDmcId,
                    PreferredLanguage = "en",
                    IdempotencyKey = "REQ-HASH-20261116-1051",
                    CreatedAtUtc = DateTime.UtcNow.AddHours(-2).AddMinutes(-40),
                    UpdatedAtUtc = DateTime.UtcNow.AddHours(-2).AddMinutes(-40),
                    Timeline = new List<RequestHistory>
                    {
                        new()
                        {
                            AssistanceRequestId = req3Id,
                            PreviousStatus = RequestStatus.Submitted,
                            NewStatus = RequestStatus.PendingAiReview,
                            ActionDescription = "Submitted by Saman Kumara; flagged as 86% similar to REQ-20261116-1042 for human coordinator verification.",
                            ChangedByUserId = samanId,
                            ChangedByUserName = "Saman Kumara",
                            ChangedByRole = "Citizen",
                            CreatedAtUtc = DateTime.UtcNow.AddHours(-2).AddMinutes(-40),
                            UpdatedAtUtc = DateTime.UtcNow.AddHours(-2).AddMinutes(-40)
                        }
                    }
                },
                new()
                {
                    Id = req4Id,
                    ReferenceCode = "REQ-20261116-1059",
                    CitizenUserId = malaId,
                    CrisisEventId = crisisFloodId,
                    Category = RequestCategory.Food,
                    SelfReportedUrgency = UrgencyLevel.High,
                    FinalApprovedUrgency = UrgencyLevel.High,
                    PriorityScore = 76.2,
                    Title = "Dry Rations, Clean Water & Infant Formula for St. Luke Parish Hall Families",
                    Description = "Our neighbourhood families (32 households, 95 people including young children and elderly grandparents) evacuated into St. Luke's Parish Hall after Kalutara floodwater rose waist-high. We urgently need 72-hour dry ration packs and infant formula until shelter kitchens stabilize.",
                    AffectedPeopleCount = 95,
                    RequestedQuantity = 45,
                    RequiresAccessibilitySupport = true,
                    LocationAddress = "St. Luke Parish Road, Kalutara",
                    Latitude = 6.5854,
                    Longitude = 79.9607,
                    SupportingEvidenceFileName = "st_luke_hall_families.jpg",
                    SupportingEvidenceMimeType = "image/jpeg",
                    Status = RequestStatus.Prioritised,
                    IsFlaggedPotentialDuplicate = false,
                    AssignedCaseManagerId = kasunId,
                    AssignedOrganisationId = orgRedCrossId,
                    PreferredLanguage = "en",
                    IdempotencyKey = "REQ-HASH-20261116-1059",
                    CreatedAtUtc = DateTime.UtcNow.AddHours(-1).AddMinutes(-35),
                    UpdatedAtUtc = DateTime.UtcNow.AddHours(-1).AddMinutes(-10),
                    Timeline = new List<RequestHistory>
                    {
                        new()
                        {
                            AssistanceRequestId = req4Id,
                            PreviousStatus = RequestStatus.Submitted,
                            NewStatus = RequestStatus.Prioritised,
                            ActionDescription = "Verified by Case Manager Kasun Fernando for Red Cross Kalutara family ration dispatch.",
                            ChangedByUserId = kasunId,
                            ChangedByUserName = "Kasun Fernando",
                            ChangedByRole = "CaseManager",
                            CreatedAtUtc = DateTime.UtcNow.AddHours(-1).AddMinutes(-10),
                            UpdatedAtUtc = DateTime.UtcNow.AddHours(-1).AddMinutes(-10)
                        }
                    }
                }
            };

            await db.AssistanceRequests.AddRangeAsync(requests);

            var rec1Id = Guid.Parse("77777777-7777-7777-7777-777777777711");
            var rec1 = new AiRecommendation
            {
                Id = rec1Id,
                AssistanceRequestId = req1Id,
                CrisisEventId = crisisFloodId,
                RecommendationType = AiRecommendationType.UrgencyScoring,
                ModelIdentifier = "AI-Priority-Classifier",
                RecommendedCategory = RequestCategory.Medicine.ToString(),
                RecommendedUrgency = UrgencyLevel.Critical,
                RecommendedPriorityScore = 89.0,
                ConfidenceScore = 0.92,
                Rationale = "Urgent medicine request for 18 elderly diabetic patients with mobility needs at flooded Kalu Ganga Bank clinic.",
                ExplainableFactorsJson = JsonSerializer.Serialize(new Dictionary<string, double>
                {
                    ["MedicalKeywordScore"] = 32.0,
                    ["PeopleCountScore"] = 25.0,
                    ["UserUrgencyScore"] = 26.0,
                    ["CategoryBaseScore"] = 18.0
                }),
                GovernanceStatus = GovernanceDecisionStatus.Modified,
                CreatedAtUtc = DateTime.UtcNow.AddHours(-4),
                UpdatedAtUtc = DateTime.UtcNow.AddMinutes(-25)
            };

            var govDec1 = new HumanGovernanceDecision
            {
                AiRecommendationId = rec1Id,
                ActionTaken = GovernanceDecisionStatus.Modified,
                OriginalAiRecommendationSummary = "Category=Medicine, Urgency=Critical, PriorityScore=89.0",
                OriginalConfidence = 0.92,
                FinalHumanDecisionSummary = "Action=Modified, FinalCategory=Medicine, FinalUrgency=LifeThreatening",
                OverrideJustification = "Upgraded from Critical to LifeThreatening after confirmation from Ratnapura District Medical Officer.",
                ResponsibleUserId = arjunaId,
                ResponsibleUserName = "Dr. Arjuna Jayawardena",
                ResponsibleUserRole = UserRole.EmergencyCoordinator.ToString(),
                DecisionTimestampUtc = DateTime.UtcNow.AddMinutes(-25)
            };

            var rec2 = new AiRecommendation
            {
                Id = Guid.Parse("77777777-7777-7777-7777-777777777712"),
                AssistanceRequestId = req3Id,
                CrisisEventId = crisisFloodId,
                RecommendationType = AiRecommendationType.DuplicateDetection,
                ModelIdentifier = "AI-Priority-Classifier",
                RecommendedCategory = RequestCategory.Medicine.ToString(),
                RecommendedUrgency = UrgencyLevel.High,
                RecommendedPriorityScore = 82.5,
                ConfidenceScore = 0.89,
                Rationale = "86% text and location overlap with REQ-20261116-1042 from Nimali Perera. Held in queue for coordinator duplicate check.",
                ExplainableFactorsJson = JsonSerializer.Serialize(new Dictionary<string, double>
                {
                    ["TextMatchScore"] = 0.81,
                    ["LocationDistanceScore"] = 0.98,
                    ["CategoryMatchScore"] = 1.00
                }),
                GovernanceStatus = GovernanceDecisionStatus.PendingReview,
                CreatedAtUtc = DateTime.UtcNow.AddHours(-2).AddMinutes(-38),
                UpdatedAtUtc = DateTime.UtcNow.AddHours(-2).AddMinutes(-38)
            };

            await db.AiRecommendations.AddRangeAsync(rec1, rec2);
            await db.GovernanceDecisions.AddAsync(govDec1);
            await db.SaveChangesAsync();
        }

        if (!await db.Volunteers.AnyAsync())
        {
            var volunteers = new List<VolunteerProfile>
            {
                new()
                {
                    Id = Guid.Parse("88888888-8888-8888-8888-888888888811"),
                    UserId = tharushiId,
                    FullName = "Tharushi Mendis",
                    SkillsCsv = "Field Medical Aid, Supply Distribution, Shelter Intake",
                    LanguagesCsv = "si,en",
                    IsVerified = true,
                    IsAvailable = true,
                    AvailabilitySchedule = "Daily 06:00-22:00 Emergency Standby",
                    CurrentLatitude = 6.6845,
                    CurrentLongitude = 80.4005,
                    CompletedTasksCount = 6
                },
                new()
                {
                    Id = Guid.Parse("88888888-8888-8888-8888-888888888812"),
                    UserId = dilshanId,
                    FullName = "Dr. Kavindi Samarasinghe",
                    SkillsCsv = "Emergency Medicine, Triage, Cold-Chain Logistics, First Aid",
                    LanguagesCsv = "en,si,ta",
                    IsVerified = true,
                    IsAvailable = true,
                    AvailabilitySchedule = "24/7 Emergency Rapid Deployment",
                    CurrentLatitude = 6.6860,
                    CurrentLongitude = 80.4030,
                    CompletedTasksCount = 14
                },
                new()
                {
                    Id = Guid.Parse("88888888-8888-8888-8888-888888888813"),
                    UserId = dilshanId,
                    FullName = "Suresh Krishnan",
                    SkillsCsv = "Swift-Water Rescue, Boat Navigation, Wheelchair Evacuation",
                    LanguagesCsv = "ta,si,en",
                    IsVerified = true,
                    IsAvailable = true,
                    AvailabilitySchedule = "Day & Night Shift",
                    CurrentLatitude = 6.5910,
                    CurrentLongitude = 79.9640,
                    CompletedTasksCount = 9
                },
                new()
                {
                    Id = Guid.Parse("88888888-8888-8888-8888-888888888814"),
                    UserId = dilshanId,
                    FullName = "Fathima Rizwan",
                    SkillsCsv = "Child Protection, Psychosocial Support, Multilingual Translation",
                    LanguagesCsv = "ta,en,ar,si",
                    IsVerified = true,
                    IsAvailable = true,
                    AvailabilitySchedule = "Shelter Shift 06:00-20:00",
                    CurrentLatitude = 6.6900,
                    CurrentLongitude = 80.4070,
                    CompletedTasksCount = 11
                },
                new()
                {
                    Id = Guid.Parse("88888888-8888-8888-8888-888888888815"),
                    UserId = nuwanId,
                    FullName = "Nuwan Jayaweera",
                    SkillsCsv = "Swift-Water Rescue, First Aid, Generator Maintenance",
                    LanguagesCsv = "si,en",
                    IsVerified = false,
                    IsAvailable = false,
                    AvailabilitySchedule = "Weekends & Evening On-Call",
                    CurrentLatitude = 6.6780,
                    CurrentLongitude = 80.3940,
                    CompletedTasksCount = 0
                }
            };

            await db.Volunteers.AddRangeAsync(volunteers);
            await db.SaveChangesAsync();
        }

        if (!await db.DonationCampaigns.AnyAsync())
        {
            var campaignId = Guid.Parse("99999999-9999-9999-9999-999999999911");
            var campaign = new DonationCampaign
            {
                Id = campaignId,
                Title = "2026 Monsoon Flood & Landslide Emergency Appeal",
                CrisisEventId = crisisFloodId,
                TargetAmountUsd = 500000m,
                CollectedAmountUsd = 185400m,
                DisbursedAmountUsd = 112000m,
                IsActive = true
            };

            await db.DonationCampaigns.AddAsync(campaign);

            var donations = new List<DonationRecord>
            {
                new()
                {
                    CampaignId = campaignId,
                    DonorUserId = sanjayaId,
                    DonorName = "Sanjaya Perera (Lanka Community Relief Trust)",
                    DonationType = "Monetary",
                    MonetaryAmountUsd = 45000m,
                    PaymentGatewayReference = "LKPAY-20261116-8841-3092",
                    AllocationPurpose = "Cold-Chain Insulin & Emergency Medical Boats",
                    IsFlaggedSuspicious = false,
                    IsReviewedByHuman = true,
                    VerificationStatus = "Verified",
                    CreatedAtUtc = DateTime.UtcNow.AddHours(-3),
                    UpdatedAtUtc = DateTime.UtcNow.AddHours(-3)
                },
                new()
                {
                    CampaignId = campaignId,
                    DonorUserId = elenaId,
                    DonorName = "Horizon Maritime Foundation",
                    DonationType = "Monetary",
                    MonetaryAmountUsd = 92000m,
                    PaymentGatewayReference = "SWIFT-LK-20261116-7740-1920",
                    AllocationPurpose = "Regional Aviation & Heavy Flood-Pump Charter",
                    IsFlaggedSuspicious = true,
                    SuspiciousReason = "High-value monetary contribution (>= $50,000 USD) flagged for mandatory Donor Officer compliance & AML verification.",
                    IsReviewedByHuman = false,
                    VerificationStatus = "FlaggedPendingHumanReview",
                    CreatedAtUtc = DateTime.UtcNow.AddHours(-1),
                    UpdatedAtUtc = DateTime.UtcNow.AddHours(-1)
                }
            };

            await db.Donations.AddRangeAsync(donations);
            await db.SaveChangesAsync();
        }

        if (!await db.AuditEvents.AnyAsync())
        {
            var audits = new List<AuditEventRecord>
            {
                new()
                {
                    EventCategory = "CrisisManagement",
                    ActionName = "CrisisEvent_Declared",
                    EntityType = nameof(CrisisEvent),
                    EntityId = crisisFloodId.ToString(),
                    ActorUserId = arjunaId,
                    ActorUserName = "Dr. Arjuna Jayawardena",
                    ActorRole = UserRole.EmergencyCoordinator.ToString(),
                    DetailsJson = JsonSerializer.Serialize(new
                    {
                        Title = "Southwest Monsoon Kalu Ganga Basin Severe Flooding & Landslides",
                        Severity = "Critical",
                        Sectors = 3
                    }),
                    CreatedAtUtc = DateTime.UtcNow.AddHours(-6),
                    UpdatedAtUtc = DateTime.UtcNow.AddHours(-6)
                },
                new()
                {
                    EventCategory = "UserOnboarding",
                    ActionName = "CitizenRegisteredOnBehalf",
                    EntityType = nameof(AppUser),
                    EntityId = kamalId.ToString(),
                    ActorUserId = kasunId,
                    ActorUserName = "Kasun Fernando",
                    ActorRole = UserRole.CaseManager.ToString(),
                    DetailsJson = JsonSerializer.Serialize(new
                    {
                        CitizenName = "Kamal Jayasuriya",
                        District = "Ratnapura / Nivitigala",
                        Reason = "Power and mobile connectivity disruption following landslide"
                    }),
                    CreatedAtUtc = DateTime.UtcNow.AddHours(-3).AddMinutes(-20),
                    UpdatedAtUtc = DateTime.UtcNow.AddHours(-3).AddMinutes(-20)
                },
                new()
                {
                    EventCategory = "AiGovernance",
                    ActionName = "AiRecommendation_Modified",
                    EntityType = nameof(AiRecommendation),
                    EntityId = Guid.Parse("77777777-7777-7777-7777-777777777711").ToString(),
                    ActorUserId = arjunaId,
                    ActorUserName = "Dr. Arjuna Jayawardena",
                    ActorRole = UserRole.EmergencyCoordinator.ToString(),
                    DetailsJson = JsonSerializer.Serialize(new
                    {
                        RequestCode = "REQ-20261116-1042",
                        OriginalAiUrgency = "Critical",
                        OverriddenUrgency = "LifeThreatening",
                        Confidence = 0.92,
                        Reason = "Confirmed acute cold-chain insulin shortage with Ratnapura District Medical Officer."
                    }),
                    CreatedAtUtc = DateTime.UtcNow.AddMinutes(-25),
                    UpdatedAtUtc = DateTime.UtcNow.AddMinutes(-25)
                }
            };

            await db.AuditEvents.AddRangeAsync(audits);
            await db.SaveChangesAsync();
        }

        if (!await db.MappingReferences.AnyAsync())
        {
            var refs = new List<MappingReference>
            {
                new()
                {
                    Label = "Ratnapura Mobile Medical Staging Point",
                    ReferenceType = "ServiceCentre",
                    Latitude = 6.6868,
                    Longitude = 80.4025,
                    GeoJsonPolygon = "{}",
                    CrisisEventId = crisisFloodId
                },
                new()
                {
                    Label = "Kalutara River Rescue Coordination Pier",
                    ReferenceType = "ServiceCentre",
                    Latitude = 6.5889,
                    Longitude = 79.9619,
                    GeoJsonPolygon = "{}",
                    CrisisEventId = crisisFloodId
                },
                new()
                {
                    Label = "Badulla Emergency Road Clearing Command",
                    ReferenceType = "ServiceCentre",
                    Latitude = 6.9951,
                    Longitude = 81.0578,
                    GeoJsonPolygon = "{}",
                    CrisisEventId = crisisFloodId
                }
            };
            await db.MappingReferences.AddRangeAsync(refs);
            await db.SaveChangesAsync();
        }

        if (!await db.CampaignExpenditures.AnyAsync())
        {
            var seedCampaignId = Guid.Parse("99999999-9999-9999-9999-999999999911");
            if (await db.DonationCampaigns.AnyAsync(c => c.Id == seedCampaignId))
            {
                var expenditures = new List<CampaignExpenditure>
                {
                    new()
                    {
                        CampaignId = seedCampaignId,
                        AmountUsd = 48000m,
                        Category = "MedicalSupplies",
                        Description = "Cold-Chain Insulin, Dialysis Consumables & Mobile Clinic Batteries (MSF Dispatch)",
                        RecordedByUserId = elenaId,
                        RecordedByUserName = "Elena Rostova",
                        ApprovedAtUtc = DateTime.UtcNow.AddHours(-2)
                    },
                    new()
                    {
                        CampaignId = seedCampaignId,
                        AmountUsd = 64000m,
                        Category = "FoodAndWaterLogistics",
                        Description = "72-Hour Family Ration Packs & Potable Water Jerrycan Convoy (Red Cross / DMC)",
                        RecordedByUserId = elenaId,
                        RecordedByUserName = "Elena Rostova",
                        ApprovedAtUtc = DateTime.UtcNow.AddHours(-1)
                    }
                };
                await db.CampaignExpenditures.AddRangeAsync(expenditures);
                await db.SaveChangesAsync();
            }
        }

        if (!await db.OperationalKpiSnapshots.AnyAsync())
        {
            await db.OperationalKpiSnapshots.AddAsync(new OperationalKpiSnapshot
            {
                TotalRequests = 4,
                UnresolvedCasesCount = 4,
                CriticalOpenCasesCount = 2,
                AverageResponseTimeMinutes = 14.5,
                ResourceUtilisationPercentage = 43.3,
                ShelterOccupancyPercentage = 83.7,
                TotalDonationsCollectedUsd = 185400m,
                CapturedAtUtc = DateTime.UtcNow.AddHours(-1)
            });
            await db.SaveChangesAsync();
        }
    }

    public static async Task SeedAsync(ReliefCoordDbContext db)
    {
        await db.Database.EnsureCreatedAsync();

        if (await db.Users.AnyAsync())
        {
            return;
        }

        var orgUnOcha = new Organisation
        {
            Id = Guid.Parse("11111111-1111-1111-1111-111111111101"),
            Name = "UN OCHA Regional Coordination Office",
            OrganisationType = "International Agency",
            Country = "Sri Lanka / Regional",
            ContactEmail = "ops@unocha-relief.org",
            ContactPhone = "+94-11-2501234",
            IsVerified = true
        };

        var orgRedCross = new Organisation
        {
            Id = Guid.Parse("11111111-1111-1111-1111-111111111102"),
            Name = "Sri Lanka Red Cross Society",
            OrganisationType = "National NGO",
            Country = "Sri Lanka",
            ContactEmail = "dispatch@redcross.lk",
            ContactPhone = "+94-11-2691095",
            IsVerified = true
        };

        var orgDmc = new Organisation
        {
            Id = Guid.Parse("11111111-1111-1111-1111-111111111103"),
            Name = "National Disaster Management Centre (DMC)",
            OrganisationType = "Government Authority",
            Country = "Sri Lanka",
            ContactEmail = "eoc@dmc.gov.lk",
            ContactPhone = "+94-11-2136136",
            IsVerified = true
        };

        var orgMsf = new Organisation
        {
            Id = Guid.Parse("11111111-1111-1111-1111-111111111104"),
            Name = "Médecins Sans Frontières (MSF Medical Rapid Team)",
            OrganisationType = "Medical INGO",
            Country = "International",
            ContactEmail = "medical-coord@msf.org",
            ContactPhone = "+94-11-2445566",
            IsVerified = true
        };

        await db.Organisations.AddRangeAsync(orgUnOcha, orgRedCross, orgDmc, orgMsf);

        var (defaultHash, defaultSalt) = HumanitarianOperationsService.HashPassword("Relief@2026");

        var users = new List<AppUser>
        {
            new()
            {
                Id = Guid.Parse("22222222-2222-2222-2222-222222222201"),
                FullName = "Nimali Perera (Affected Citizen)",
                Email = "citizen@relief.org",
                PhoneNumber = "+94-77-1112233",
                PasswordHash = defaultHash,
                PasswordSalt = defaultSalt,
                Role = UserRole.Citizen,
                PreferredLanguage = "si"
            },
            new()
            {
                Id = Guid.Parse("22222222-2222-2222-2222-222222222202"),
                FullName = "Dr. Arjuna Jayawardena (Emergency Coordinator)",
                Email = "coordinator@relief.org",
                PhoneNumber = "+94-77-2223344",
                PasswordHash = defaultHash,
                PasswordSalt = defaultSalt,
                Role = UserRole.EmergencyCoordinator,
                PreferredLanguage = "en",
                OrganisationId = orgUnOcha.Id
            },
            new()
            {
                Id = Guid.Parse("22222222-2222-2222-2222-222222222203"),
                FullName = "Kasun Fernando (Incident Case Manager)",
                Email = "casemanager@relief.org",
                PhoneNumber = "+94-77-3334455",
                PasswordHash = defaultHash,
                PasswordSalt = defaultSalt,
                Role = UserRole.CaseManager,
                PreferredLanguage = "en",
                OrganisationId = orgDmc.Id
            },
            new()
            {
                Id = Guid.Parse("22222222-2222-2222-2222-222222222204"),
                FullName = "Roshan Silva (Resource & Logistics Manager)",
                Email = "logistics@relief.org",
                PhoneNumber = "+94-77-4445566",
                PasswordHash = defaultHash,
                PasswordSalt = defaultSalt,
                Role = UserRole.LogisticsManager,
                PreferredLanguage = "en",
                OrganisationId = orgRedCross.Id
            },
            new()
            {
                Id = Guid.Parse("22222222-2222-2222-2222-222222222205"),
                FullName = "Meena Selvarajah (Shelter Administrator)",
                Email = "shelter@relief.org",
                PhoneNumber = "+94-77-5556677",
                PasswordHash = defaultHash,
                PasswordSalt = defaultSalt,
                Role = UserRole.ShelterAdmin,
                PreferredLanguage = "ta",
                OrganisationId = orgDmc.Id
            },
            new()
            {
                Id = Guid.Parse("22222222-2222-2222-2222-222222222206"),
                FullName = "Dilshan Bandara (Volunteer Coordinator)",
                Email = "volunteer@relief.org",
                PhoneNumber = "+94-77-6667788",
                PasswordHash = defaultHash,
                PasswordSalt = defaultSalt,
                Role = UserRole.VolunteerCoordinator,
                PreferredLanguage = "en",
                OrganisationId = orgRedCross.Id
            },
            new()
            {
                Id = Guid.Parse("22222222-2222-2222-2222-222222222207"),
                FullName = "Elena Rostova (Donor & Funding Officer)",
                Email = "donor@relief.org",
                PhoneNumber = "+94-77-7778899",
                PasswordHash = defaultHash,
                PasswordSalt = defaultSalt,
                Role = UserRole.DonorOfficer,
                PreferredLanguage = "en",
                OrganisationId = orgUnOcha.Id
            },
            new()
            {
                Id = Guid.Parse("22222222-2222-2222-2222-222222222208"),
                FullName = "Dr. Tariq Al-Mansoor (Partner Organisation Officer)",
                Email = "partner@relief.org",
                PhoneNumber = "+94-77-8889900",
                PasswordHash = defaultHash,
                PasswordSalt = defaultSalt,
                Role = UserRole.PartnerOfficer,
                PreferredLanguage = "ar",
                OrganisationId = orgMsf.Id
            },
            new()
            {
                Id = Guid.Parse("22222222-2222-2222-2222-222222222209"),
                FullName = "Chaminda Wijesinghe (System Administrator)",
                Email = "admin@relief.org",
                PhoneNumber = "+94-77-9990011",
                PasswordHash = defaultHash,
                PasswordSalt = defaultSalt,
                Role = UserRole.SystemAdmin,
                PreferredLanguage = "en",
                OrganisationId = orgUnOcha.Id
            }
        };

        await db.Users.AddRangeAsync(users);

        var household = new HouseholdProfile
        {
            UserId = users[0].Id,
            HouseholdHeadName = "Nimali Perera",
            TotalMembers = 6,
            ChildrenCount = 2,
            ElderlyCount = 1,
            HasMobilityNeeds = true,
            HasChronicMedicalNeeds = true,
            MedicalNotes = "Grandmother requires daily cold-chain Insulin glargine and wheelchair evacuation support.",
            PrimaryAddress = "42 Kalu Ganga Bank Road, Ratnapura",
            Latitude = 6.6828,
            Longitude = 80.3992
        };
        await db.Households.AddAsync(household);

        var crisisFlood = new CrisisEvent
        {
            Id = Guid.Parse("33333333-3333-3333-3333-333333333301"),
            Title = "Southwest Monsoon Kalu Ganga Basin Severe Flooding & Landslides",
            CrisisType = CrisisType.Flood,
            Severity = CrisisSeverity.Critical,
            Country = "Sri Lanka",
            Region = "Sabaragamuwa & Western Provinces (Ratnapura / Kalutara)",
            Description = "Torrential monsoon rainfall exceeding 340mm in 24 hours caused major embankment breaches along Kalu Ganga and triggered slope failures in Badulla.",
            CenterLatitude = 6.6828,
            CenterLongitude = 80.3992,
            RadiusKm = 45.0,
            IsActive = true,
            LeadCoordinatorId = users[1].Id,
            OperationalAreas = new List<OperationalArea>
            {
                new()
                {
                    ZoneName = "Sector Alpha - Ratnapura Town Lowlands",
                    District = "Ratnapura",
                    Latitude = 6.6828,
                    Longitude = 80.3992,
                    CoverageRadiusKm = 15.0,
                    EstimatedAffectedPopulation = 18400,
                    RiskLevel = "Critical",
                    AssignedOrganisationId = orgDmc.Id
                },
                new()
                {
                    ZoneName = "Sector Bravo - Kalutara River Mouth",
                    District = "Kalutara",
                    Latitude = 6.5854,
                    Longitude = 79.9607,
                    CoverageRadiusKm = 18.0,
                    EstimatedAffectedPopulation = 14200,
                    RiskLevel = "High",
                    AssignedOrganisationId = orgRedCross.Id
                },
                new()
                {
                    ZoneName = "Sector Charlie - Badulla Highland Slope",
                    District = "Badulla",
                    Latitude = 6.9934,
                    Longitude = 81.0550,
                    CoverageRadiusKm = 12.0,
                    EstimatedAffectedPopulation = 6900,
                    RiskLevel = "Critical",
                    AssignedOrganisationId = orgMsf.Id
                }
            }
        };
        await db.CrisisEvents.AddAsync(crisisFlood);

        var alert1 = new PublicAlert
        {
            CrisisEventId = crisisFlood.Id,
            Title = "RED FLOOD EVACUATION WARNING: Kalu Ganga Basin",
            Message = "Water levels at Ratnapura gauge have exceeded major flood stage (9.8m). Residents in low-lying divisions must evacuate immediately to verified elevated shelters.",
            SeverityLevel = "Critical",
            SafetyGuidance = "Disconnect mains electricity, carry essential prescription medicines, avoid wading through moving floodwater, and proceed to Ferguson High School or Kalutara Civic Relief Centre.",
            TranslationsJson = JsonSerializer.Serialize(new Dictionary<string, string>
            {
                ["si"] = "රතු ගංවතුර අනතුරු ඇඟවීම: කළු ගඟ ද්‍රෝණියේ ජල මට්ටම අවදානම් සීමාව ඉක්මවා ඇත. වහාම ආරක්ෂිත මධ්‍යස්ථාන වෙත යොමු වන්න.",
                ["ta"] = "சிவப்பு வெள்ள அபாய எச்சரிக்கை: களுகங்கைப் பகுதியில் நீர்மட்டம் அபாய அளவைத் தாண்டியுள்ளது. உடனடியாக பாதுகாப்பான முகாம்களுக்குச் செல்லவும்."
            }),
            IsVerified = true,
            IssuedByUserId = users[1].Id
        };
        await db.PublicAlerts.AddAsync(alert1);

        var shelters = new List<Shelter>
        {
            new()
            {
                Id = Guid.Parse("44444444-4444-4444-4444-444444444401"),
                Name = "Ratnapura Central High-Ground Relief Complex",
                CrisisEventId = crisisFlood.Id,
                Address = "Hilltop Circular Road, Ratnapura",
                Latitude = 6.6915,
                Longitude = 80.4080,
                TotalCapacity = 450,
                CurrentOccupancy = 390,
                IsWheelchairAccessible = true,
                HasMedicalFacility = true,
                HasCleanWater = true,
                HasPowerBackup = true,
                HasChildSafeSpace = true,
                AvailableServices = "Emergency Triage, Insulin Cold Storage, Wheelchair Ramps, Infant Nutrition",
                Status = "Operational",
                ManagedByOrganisationId = orgDmc.Id
            },
            new()
            {
                Id = Guid.Parse("44444444-4444-4444-4444-444444444402"),
                Name = "Kalutara North Community Evacuation Hall",
                CrisisEventId = crisisFlood.Id,
                Address = "Galle Road Junction, Kalutara",
                Latitude = 6.5920,
                Longitude = 79.9650,
                TotalCapacity = 300,
                CurrentOccupancy = 210,
                IsWheelchairAccessible = true,
                HasMedicalFacility = false,
                HasCleanWater = true,
                HasPowerBackup = true,
                HasChildSafeSpace = true,
                AvailableServices = "Dry Rations, Clean Water, Accessible Restrooms",
                Status = "Operational",
                ManagedByOrganisationId = orgRedCross.Id
            },
            new()
            {
                Id = Guid.Parse("44444444-4444-4444-4444-444444444403"),
                Name = "Badulla Ridge School Emergency Center",
                CrisisEventId = crisisFlood.Id,
                Address = "Passara Road, Badulla",
                Latitude = 6.9980,
                Longitude = 81.0610,
                TotalCapacity = 200,
                CurrentOccupancy = 195,
                IsWheelchairAccessible = false,
                HasMedicalFacility = true,
                HasCleanWater = true,
                HasPowerBackup = false,
                HasChildSafeSpace = false,
                AvailableServices = "Trauma First Aid, Blankets, Hot Meals",
                Status = "NearCapacity",
                ManagedByOrganisationId = orgMsf.Id
            }
        };
        await db.Shelters.AddRangeAsync(shelters);

        var resources = new List<ResourceItem>
        {
            new()
            {
                Id = Guid.Parse("55555555-5555-5555-5555-555555555501"),
                Name = "Emergency Insulin & Acute Trauma Medical Kits",
                Category = RequestCategory.Medicine,
                Unit = "Medical Kits",
                TotalQuantity = 80,
                AvailableQuantity = 25,
                AllocatedQuantity = 55,
                ReorderThreshold = 30,
                WarehouseName = "Ratnapura MSF Cold-Chain Depot",
                WarehouseLatitude = 6.6890,
                WarehouseLongitude = 80.4020,
                SupportsColdChain = true,
                ExpiryDateUtc = DateTime.UtcNow.AddDays(22),
                OwningOrganisationId = orgMsf.Id
            },
            new()
            {
                Id = Guid.Parse("55555555-5555-5555-5555-555555555502"),
                Name = "Regional Reserve Medical Supplies",
                Category = RequestCategory.Medicine,
                Unit = "Medical Kits",
                TotalQuantity = 150,
                AvailableQuantity = 95,
                AllocatedQuantity = 55,
                ReorderThreshold = 40,
                WarehouseName = "Colombo Central UN OCHA Logistics Hub",
                WarehouseLatitude = 6.9271,
                WarehouseLongitude = 79.8612,
                SupportsColdChain = true,
                ExpiryDateUtc = DateTime.UtcNow.AddDays(120),
                OwningOrganisationId = orgUnOcha.Id
            },
            new()
            {
                Id = Guid.Parse("55555555-5555-5555-5555-555555555503"),
                Name = "High-Energy Flood Ration Packs (72-Hour Family Pack)",
                Category = RequestCategory.Food,
                Unit = "Family Packs",
                TotalQuantity = 600,
                AvailableQuantity = 340,
                AllocatedQuantity = 260,
                ReorderThreshold = 100,
                WarehouseName = "Kalutara Red Cross Forward Depot",
                WarehouseLatitude = 6.5880,
                WarehouseLongitude = 79.9630,
                SupportsColdChain = false,
                ExpiryDateUtc = DateTime.UtcNow.AddDays(45),
                OwningOrganisationId = orgRedCross.Id
            },
            new()
            {
                Id = Guid.Parse("55555555-5555-5555-5555-555555555504"),
                Name = "Potable Water Purification & 20L Jerrycans",
                Category = RequestCategory.WaterAndSanitation,
                Unit = "Units",
                TotalQuantity = 500,
                AvailableQuantity = 290,
                AllocatedQuantity = 210,
                ReorderThreshold = 100,
                WarehouseName = "Ratnapura DMC Logistics Yard",
                WarehouseLatitude = 6.6850,
                WarehouseLongitude = 80.4010,
                SupportsColdChain = false,
                ExpiryDateUtc = DateTime.UtcNow.AddDays(365),
                OwningOrganisationId = orgDmc.Id
            },
            new()
            {
                Id = Guid.Parse("55555555-5555-5555-5555-555555555505"),
                Name = "All-Terrain Evacuation Wheelchairs & Mobility Aids",
                Category = RequestCategory.AccessibilityAssistance,
                Unit = "Sets",
                TotalQuantity = 60,
                AvailableQuantity = 38,
                AllocatedQuantity = 22,
                ReorderThreshold = 15,
                WarehouseName = "Ratnapura DMC Logistics Yard",
                WarehouseLatitude = 6.6850,
                WarehouseLongitude = 80.4010,
                SupportsColdChain = false,
                ExpiryDateUtc = null,
                OwningOrganisationId = orgDmc.Id
            }
        };
        await db.Resources.AddRangeAsync(resources);

        var req1Id = Guid.Parse("66666666-6666-6666-6666-666666666601");
        var req2Id = Guid.Parse("66666666-6666-6666-6666-666666666602");
        var req3Id = Guid.Parse("66666666-6666-6666-6666-666666666603");
        var req4Id = Guid.Parse("66666666-6666-6666-6666-666666666604");

        var requests = new List<AssistanceRequest>
        {
            new()
            {
                Id = req1Id,
                ReferenceCode = "REQ-20261023-1001",
                CitizenUserId = users[0].Id,
                CrisisEventId = crisisFlood.Id,
                Category = RequestCategory.Medicine,
                SelfReportedUrgency = UrgencyLevel.Critical,
                FinalApprovedUrgency = UrgencyLevel.LifeThreatening,
                PriorityScore = 94.5,
                Title = "Urgent Insulin & Dialysis Stabilization Kits for Flooded Clinic",
                Description = "Kalu Ganga bank clinic cut off by rising floodwaters; 18 diabetic and elderly patients require immediate cold-chain insulin and acute medical kits.",
                AffectedPeopleCount = 18,
                RequestedQuantity = 20,
                RequiresAccessibilitySupport = true,
                LocationAddress = "42 Kalu Ganga Bank Road, Ratnapura",
                Latitude = 6.6828,
                Longitude = 80.3992,
                SupportingEvidenceFileName = "ratnapura_clinic_flood_photo.jpg",
                SupportingEvidenceMimeType = "image/jpeg",
                Status = RequestStatus.Escalated,
                IsFlaggedPotentialDuplicate = false,
                AssignedCaseManagerId = users[2].Id,
                AssignedOrganisationId = orgMsf.Id,
                PreferredLanguage = "si",
                IdempotencyKey = "SEED-IDEMP-1001"
            },
            new()
            {
                Id = req2Id,
                ReferenceCode = "REQ-20261023-1002",
                CitizenUserId = users[0].Id,
                CrisisEventId = crisisFlood.Id,
                Category = RequestCategory.Medicine,
                SelfReportedUrgency = UrgencyLevel.Critical,
                FinalApprovedUrgency = UrgencyLevel.Critical,
                PriorityScore = 88.0,
                Title = "Emergency Trauma & Medical Kits for Cut-Off Plantation Families",
                Description = "Landslide debris blocked access road in Nivitigala; 14 injured residents need trauma medical kits and antibiotic supplies urgently.",
                AffectedPeopleCount = 14,
                RequestedQuantity = 18,
                RequiresAccessibilitySupport = false,
                LocationAddress = "Nivitigala Valley Road, Ratnapura",
                Latitude = 6.6650,
                Longitude = 80.4150,
                SupportingEvidenceFileName = "nivitigala_road_block.png",
                SupportingEvidenceMimeType = "image/png",
                Status = RequestStatus.Prioritised,
                IsFlaggedPotentialDuplicate = false,
                AssignedCaseManagerId = users[2].Id,
                AssignedOrganisationId = orgMsf.Id,
                PreferredLanguage = "si",
                IdempotencyKey = "SEED-IDEMP-1002"
            },
            new()
            {
                Id = req3Id,
                ReferenceCode = "REQ-20261023-1003",
                CitizenUserId = users[0].Id,
                CrisisEventId = crisisFlood.Id,
                Category = RequestCategory.Medicine,
                SelfReportedUrgency = UrgencyLevel.High,
                FinalApprovedUrgency = UrgencyLevel.High,
                PriorityScore = 82.5,
                Title = "Urgent Insulin & Medical Kits for Kalu Ganga Bank Clinic",
                Description = "Rising floodwaters around Kalu Ganga bank clinic; 18 elderly diabetic patients need immediate insulin and medical kits.",
                AffectedPeopleCount = 18,
                RequestedQuantity = 20,
                RequiresAccessibilitySupport = true,
                LocationAddress = "44 Kalu Ganga Bank Road, Ratnapura",
                Latitude = 6.6830,
                Longitude = 80.3995,
                SupportingEvidenceFileName = "duplicate_submission_clinic.jpg",
                SupportingEvidenceMimeType = "image/jpeg",
                Status = RequestStatus.PendingAiReview,
                IsFlaggedPotentialDuplicate = true,
                PotentialDuplicateOfRequestId = req1Id,
                DuplicateSimilarityScore = 0.86,
                AssignedCaseManagerId = users[2].Id,
                AssignedOrganisationId = orgDmc.Id,
                PreferredLanguage = "en",
                IdempotencyKey = "SEED-IDEMP-1003"
            },
            new()
            {
                Id = req4Id,
                ReferenceCode = "REQ-20261023-1004",
                CitizenUserId = users[0].Id,
                CrisisEventId = crisisFlood.Id,
                Category = RequestCategory.Food,
                SelfReportedUrgency = UrgencyLevel.High,
                FinalApprovedUrgency = UrgencyLevel.High,
                PriorityScore = 76.2,
                Title = "Infant Nutrition & 72-Hour Family Ration Packs for Displaced Families",
                Description = "32 displaced households gathered at St. Luke parish hall in Kalutara requiring dry rations and clean infant formula.",
                AffectedPeopleCount = 95,
                RequestedQuantity = 45,
                RequiresAccessibilitySupport = true,
                LocationAddress = "St. Luke Parish Road, Kalutara",
                Latitude = 6.5854,
                Longitude = 79.9607,
                SupportingEvidenceFileName = "kalutara_parish_families.jpg",
                SupportingEvidenceMimeType = "image/jpeg",
                Status = RequestStatus.Prioritised,
                IsFlaggedPotentialDuplicate = false,
                AssignedCaseManagerId = users[2].Id,
                AssignedOrganisationId = orgRedCross.Id,
                PreferredLanguage = "en",
                IdempotencyKey = "SEED-IDEMP-1004"
            }
        };
        await db.AssistanceRequests.AddRangeAsync(requests);

        var rec1 = new AiRecommendation
        {
            Id = Guid.Parse("77777777-7777-7777-7777-777777777701"),
            AssistanceRequestId = req1Id,
            CrisisEventId = crisisFlood.Id,
            RecommendationType = AiRecommendationType.UrgencyScoring,
            ModelIdentifier = "AI-Priority-Classifier",
            RecommendedCategory = RequestCategory.Medicine.ToString(),
            RecommendedUrgency = UrgencyLevel.Critical,
            RecommendedPriorityScore = 89.0,
            ConfidenceScore = 0.92,
            Rationale = "Urgent medicine request for 18 patients with mobility needs at flooded clinic.",
            ExplainableFactorsJson = JsonSerializer.Serialize(new Dictionary<string, double>
            {
                ["MedicalKeywordScore"] = 32.0,
                ["PeopleCountScore"] = 25.0,
                ["UserUrgencyScore"] = 26.0,
                ["CategoryBaseScore"] = 18.0
            }),
            GovernanceStatus = GovernanceDecisionStatus.Modified
        };

        var govDec1 = new HumanGovernanceDecision
        {
            AiRecommendationId = rec1.Id,
            ActionTaken = GovernanceDecisionStatus.Modified,
            OriginalAiRecommendationSummary = "Category=Medicine, Urgency=Critical, PriorityScore=89.0",
            OriginalConfidence = 0.92,
            FinalHumanDecisionSummary = "Action=Modified, FinalCategory=Medicine, FinalUrgency=LifeThreatening",
            OverrideJustification = "Upgraded from Critical to LifeThreatening after confirmation from Ratnapura District Medical Officer.",
            ResponsibleUserId = users[1].Id,
            ResponsibleUserName = users[1].FullName,
            ResponsibleUserRole = UserRole.EmergencyCoordinator.ToString(),
            DecisionTimestampUtc = DateTime.UtcNow.AddMinutes(-25)
        };

        var rec2 = new AiRecommendation
        {
            Id = Guid.Parse("77777777-7777-7777-7777-777777777702"),
            AssistanceRequestId = req3Id,
            CrisisEventId = crisisFlood.Id,
            RecommendationType = AiRecommendationType.DuplicateDetection,
            ModelIdentifier = "AI-Priority-Classifier",
            RecommendedCategory = RequestCategory.Medicine.ToString(),
            RecommendedUrgency = UrgencyLevel.High,
            RecommendedPriorityScore = 82.5,
            ConfidenceScore = 0.89,
            Rationale = "86% text and location match with REQ-20261023-1001. Flagged for coordinator review without deleting.",
            ExplainableFactorsJson = JsonSerializer.Serialize(new Dictionary<string, double>
            {
                ["TextMatchScore"] = 0.81,
                ["LocationDistanceScore"] = 0.98,
                ["CategoryMatchScore"] = 1.00
            }),
            GovernanceStatus = GovernanceDecisionStatus.PendingReview
        };

        await db.AiRecommendations.AddRangeAsync(rec1, rec2);
        await db.GovernanceDecisions.AddAsync(govDec1);

        var volunteers = new List<VolunteerProfile>
        {
            new()
            {
                Id = Guid.Parse("88888888-8888-8888-8888-888888888801"),
                UserId = users[5].Id,
                FullName = "Dr. Kavindi Samarasinghe",
                SkillsCsv = "Emergency Medicine, Triage, Cold-Chain Logistics, First Aid",
                LanguagesCsv = "en,si,ta",
                IsVerified = true,
                IsAvailable = true,
                AvailabilitySchedule = "24/7 Emergency Rapid Deployment",
                CurrentLatitude = 6.6860,
                CurrentLongitude = 80.4030,
                CompletedTasksCount = 14
            },
            new()
            {
                Id = Guid.Parse("88888888-8888-8888-8888-888888888802"),
                UserId = users[5].Id,
                FullName = "Suresh Krishnan",
                SkillsCsv = "Swift-Water Rescue, Boat Navigation, Wheelchair Evacuation",
                LanguagesCsv = "ta,si,en",
                IsVerified = true,
                IsAvailable = true,
                AvailabilitySchedule = "Day & Night Shift",
                CurrentLatitude = 6.5910,
                CurrentLongitude = 79.9640,
                CompletedTasksCount = 9
            },
            new()
            {
                Id = Guid.Parse("88888888-8888-8888-8888-888888888803"),
                UserId = users[5].Id,
                FullName = "Fathima Rizwan",
                SkillsCsv = "Child Protection, Psychosocial Support, Multilingual Translation",
                LanguagesCsv = "ta,en,ar,si",
                IsVerified = true,
                IsAvailable = true,
                AvailabilitySchedule = "Shelter Shift 06:00-20:00",
                CurrentLatitude = 6.6900,
                CurrentLongitude = 80.4070,
                CompletedTasksCount = 11
            }
        };
        await db.Volunteers.AddRangeAsync(volunteers);

        var campaign = new DonationCampaign
        {
            Id = Guid.Parse("99999999-9999-9999-9999-999999999901"),
            Title = "2026 Monsoon Flood & Landslide Emergency Appeal",
            CrisisEventId = crisisFlood.Id,
            TargetAmountUsd = 500000m,
            CollectedAmountUsd = 185400m,
            DisbursedAmountUsd = 112000m,
            IsActive = true
        };
        await db.DonationCampaigns.AddAsync(campaign);

        var donations = new List<DonationRecord>
        {
            new()
            {
                CampaignId = campaign.Id,
                DonorUserId = users[6].Id,
                DonorName = "Global Humanitarian Relief Fund",
                DonationType = "Monetary",
                MonetaryAmountUsd = 45000m,
                PaymentGatewayReference = "SANDBOX-PAY-20261023-4242-8812",
                AllocationPurpose = "Cold-Chain Insulin & Emergency Medical Boats",
                IsFlaggedSuspicious = false,
                IsReviewedByHuman = true,
                VerificationStatus = "Verified"
            },
            new()
            {
                CampaignId = campaign.Id,
                DonorUserId = users[6].Id,
                DonorName = "Unverified Offshore Shell Entity Ltd",
                DonationType = "Monetary",
                MonetaryAmountUsd = 92000m,
                PaymentGatewayReference = "SANDBOX-PAY-20261023-9999-1044",
                AllocationPurpose = "Restricted Single-Vendor Cash Transfer",
                IsFlaggedSuspicious = true,
                SuspiciousReason = "High-value monetary contribution (>= $50,000 USD) with restricted vendor routing flagged for AML/KYC human compliance review.",
                IsReviewedByHuman = false,
                VerificationStatus = "FlaggedPendingHumanReview"
            }
        };
        await db.Donations.AddRangeAsync(donations);

        await db.AuditEvents.AddAsync(new AuditEventRecord
        {
            EventCategory = "AiGovernance",
            ActionName = "AiRecommendation_Modified",
            EntityType = nameof(AiRecommendation),
            EntityId = rec1.Id.ToString(),
            ActorUserId = users[1].Id,
            ActorUserName = users[1].FullName,
            ActorRole = UserRole.EmergencyCoordinator.ToString(),
            DetailsJson = JsonSerializer.Serialize(new
            {
                RequestCode = "REQ-20261023-1001",
                OriginalAiUrgency = "Critical",
                OverriddenUrgency = "LifeThreatening",
                Confidence = 0.92,
                Reason = govDec1.OverrideJustification
            })
        });

        await db.MappingReferences.AddRangeAsync(
            new MappingReference
            {
                Label = "Ratnapura Mobile Medical Staging Point",
                ReferenceType = "ServiceCentre",
                Latitude = 6.6868,
                Longitude = 80.4025,
                GeoJsonPolygon = "{}",
                CrisisEventId = crisisFlood.Id
            },
            new MappingReference
            {
                Label = "Kalutara River Rescue Coordination Pier",
                ReferenceType = "ServiceCentre",
                Latitude = 6.5889,
                Longitude = 79.9619,
                GeoJsonPolygon = "{}",
                CrisisEventId = crisisFlood.Id
            },
            new MappingReference
            {
                Label = "Badulla Emergency Road Clearing Command",
                ReferenceType = "ServiceCentre",
                Latitude = 6.9951,
                Longitude = 81.0578,
                GeoJsonPolygon = "{}",
                CrisisEventId = crisisFlood.Id
            });

        await db.SaveChangesAsync();
    }
}
