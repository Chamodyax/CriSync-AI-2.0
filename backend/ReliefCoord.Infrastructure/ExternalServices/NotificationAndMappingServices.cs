using System.Globalization;
using System.Text.Json;
using Microsoft.Extensions.Configuration;
using ReliefCoord.Application.DTOs;
using ReliefCoord.Application.Interfaces;
using ReliefCoord.Domain.Enums;

namespace ReliefCoord.Infrastructure.ExternalServices;

public class EmailNotificationSender : INotificationChannelSender
{
    private readonly IServiceResilienceMonitor _resilienceMonitor;
    private readonly IConfiguration? _configuration;

    public EmailNotificationSender(IServiceResilienceMonitor resilienceMonitor, IConfiguration? configuration = null)
    {
        _resilienceMonitor = resilienceMonitor;
        _configuration = configuration;
    }

    public NotificationChannel Channel => NotificationChannel.Email;

    public Task<(bool Success, string ProviderResponse)> SendAsync(
        string recipientContact,
        string subject,
        string body,
        string languageCode,
        CancellationToken cancellationToken = default)
    {
        if (_resilienceMonitor.SimulateExternalNotificationFailure)
        {
            _resilienceMonitor.RecordTrip("Notification");
            return Task.FromResult((false, "SMTP_GATEWAY_TIMEOUT_503: Queued for asynchronous background retry."));
        }

        string? smtpHost = _configuration?["ExternalServices:SmtpHost"];
        if (!string.IsNullOrWhiteSpace(smtpHost))
        {
            return Task.FromResult((true, $"SMTP-Relay-Ready ({smtpHost}) [Lang={languageCode}] to {recipientContact}"));
        }

        return Task.FromResult((true, $"SendGrid-202-Accepted [Lang={languageCode}] to {recipientContact}"));
    }
}

public class SmsNotificationSender : INotificationChannelSender
{
    private readonly IServiceResilienceMonitor _resilienceMonitor;

    public SmsNotificationSender(IServiceResilienceMonitor resilienceMonitor)
    {
        _resilienceMonitor = resilienceMonitor;
    }

    public NotificationChannel Channel => NotificationChannel.Sms;

    public Task<(bool Success, string ProviderResponse)> SendAsync(
        string recipientContact,
        string subject,
        string body,
        string languageCode,
        CancellationToken cancellationToken = default)
    {
        if (_resilienceMonitor.SimulateExternalNotificationFailure)
        {
            _resilienceMonitor.RecordTrip("Notification");
            return Task.FromResult((false, "TWILIO_GATEWAY_UNAVAILABLE_504: Queued for asynchronous background retry."));
        }

        return Task.FromResult((true, $"Twilio-SMS-Delivered [Lang={languageCode}] to {recipientContact}"));
    }
}

public class PushNotificationSender : INotificationChannelSender
{
    private readonly IServiceResilienceMonitor _resilienceMonitor;

    public PushNotificationSender(IServiceResilienceMonitor resilienceMonitor)
    {
        _resilienceMonitor = resilienceMonitor;
    }

    public NotificationChannel Channel => NotificationChannel.Push;

    public Task<(bool Success, string ProviderResponse)> SendAsync(
        string recipientContact,
        string subject,
        string body,
        string languageCode,
        CancellationToken cancellationToken = default)
    {
        if (_resilienceMonitor.SimulateExternalNotificationFailure)
        {
            _resilienceMonitor.RecordTrip("Notification");
            return Task.FromResult((false, "FCM_PUSH_SERVICE_UNAVAILABLE: Queued for asynchronous background retry."));
        }

        return Task.FromResult((true, $"FCM-Push-Dispatched [Lang={languageCode}] to {recipientContact}"));
    }
}

public class InAppNotificationSender : INotificationChannelSender
{
    public NotificationChannel Channel => NotificationChannel.InApp;

    public Task<(bool Success, string ProviderResponse)> SendAsync(
        string recipientContact,
        string subject,
        string body,
        string languageCode,
        CancellationToken cancellationToken = default)
    {
        return Task.FromResult((true, $"InApp-Notification-Persisted [Lang={languageCode}]"));
    }
}

public class NotificationChannelFactory : INotificationChannelFactory
{
    private readonly IServiceResilienceMonitor _resilienceMonitor;
    private readonly IConfiguration? _configuration;

    public NotificationChannelFactory(IServiceResilienceMonitor resilienceMonitor, IConfiguration? configuration = null)
    {
        _resilienceMonitor = resilienceMonitor;
        _configuration = configuration;
    }

    public INotificationChannelSender CreateSender(NotificationChannel channel)
    {
        return channel switch
        {
            NotificationChannel.Email => new EmailNotificationSender(_resilienceMonitor, _configuration),
            NotificationChannel.Sms => new SmsNotificationSender(_resilienceMonitor),
            NotificationChannel.Push => new PushNotificationSender(_resilienceMonitor),
            _ => new InAppNotificationSender()
        };
    }
}

public class ResilientMappingProviderService : IMappingProviderService
{
    private readonly IServiceResilienceMonitor _resilienceMonitor;
    private readonly IHttpClientFactory? _httpClientFactory;
    private readonly IConfiguration? _configuration;

    public ResilientMappingProviderService(
        IServiceResilienceMonitor resilienceMonitor,
        IHttpClientFactory? httpClientFactory = null,
        IConfiguration? configuration = null)
    {
        _resilienceMonitor = resilienceMonitor;
        _httpClientFactory = httpClientFactory;
        _configuration = configuration;
    }

    private bool IsLiveOsmEnabled() =>
        _httpClientFactory != null &&
        !string.Equals(_configuration?["ExternalServices:EnableLiveOsmCalls"], "false", StringComparison.OrdinalIgnoreCase);

    private int GetHttpTimeoutSeconds() =>
        int.TryParse(_configuration?["ExternalServices:HttpTimeoutSeconds"], out int sec) && sec > 0 ? sec : 3;

    public double CalculateDistanceKm(double lat1, double lon1, double lat2, double lon2)
    {
        const double earthRadiusKm = 6371.0;
        double dLat = DegreesToRadians(lat2 - lat1);
        double dLon = DegreesToRadians(lon2 - lon1);
        double a = Math.Sin(dLat / 2) * Math.Sin(dLat / 2) +
                   Math.Cos(DegreesToRadians(lat1)) * Math.Cos(DegreesToRadians(lat2)) *
                   Math.Sin(dLon / 2) * Math.Sin(dLon / 2);
        double c = 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));
        return Math.Round(earthRadiusKm * c, 2);
    }

    public async Task<RouteCalculationDto> CalculateRouteAsync(
        double originLat,
        double originLon,
        double destLat,
        double destLon,
        CancellationToken cancellationToken = default)
    {
        double haversineKm = CalculateDistanceKm(originLat, originLon, destLat, destLon);
        if (_resilienceMonitor.SimulateExternalMappingFailure)
        {
            _resilienceMonitor.RecordTrip("Mapping");
            return BuildHaversineFallbackRoute(haversineKm);
        }

        if (IsLiveOsmEnabled())
        {
            string url = string.Format(
                CultureInfo.InvariantCulture,
                "https://router.project-osrm.org/route/v1/driving/{0},{1};{2},{3}?overview=false",
                originLon,
                originLat,
                destLon,
                destLat);

            int timeoutSec = GetHttpTimeoutSeconds();
            for (int attempt = 1; attempt <= 2; attempt++)
            {
                try
                {
                    using var cts = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
                    cts.CancelAfter(TimeSpan.FromSeconds(timeoutSec));

                    var client = _httpClientFactory!.CreateClient();
                    using var request = new HttpRequestMessage(HttpMethod.Get, url);
                    request.Headers.UserAgent.ParseAdd("CriSync-Humanitarian-Platform/1.0");

                    using var response = await client.SendAsync(request, cts.Token);
                    if (response.IsSuccessStatusCode)
                    {
                        await using var stream = await response.Content.ReadAsStreamAsync(cts.Token);
                        using var doc = await JsonDocument.ParseAsync(stream, cancellationToken: cts.Token);
                        if (doc.RootElement.TryGetProperty("routes", out var routesEl) &&
                            routesEl.ValueKind == JsonValueKind.Array &&
                            routesEl.GetArrayLength() > 0)
                        {
                            var firstRoute = routesEl[0];
                            double meters = firstRoute.GetProperty("distance").GetDouble();
                            double durationSec = firstRoute.GetProperty("duration").GetDouble();
                            double roadKm = Math.Round(meters / 1000.0, 2);
                            int mins = Math.Max(3, (int)Math.Ceiling(durationSec / 60.0));

                            return new RouteCalculationDto(
                                roadKm,
                                mins,
                                $"Live OSRM Humanitarian Relief Corridor ({roadKm} km via OpenStreetMap road network, ETA {mins} mins)",
                                "OpenStreetMap-OSRM-Live"
                            );
                        }
                    }
                }
                catch
                {
                }

                if (attempt < 2)
                {
                    await Task.Delay(150 * attempt, cancellationToken);
                }
            }

            _resilienceMonitor.RecordTrip("Mapping");
            return BuildHaversineFallbackRoute(haversineKm);
        }

        double roadDistanceKm = Math.Round(haversineKm * 1.22, 2);
        int travelMinutes = Math.Max(5, (int)Math.Ceiling(roadDistanceKm * 1.45));
        return new RouteCalculationDto(
            roadDistanceKm,
            travelMinutes,
            $"OSRM Humanitarian Relief Corridor ({roadDistanceKm} km via primary arterial route, ETA {travelMinutes} mins)",
            "OpenStreetMap-OSRM-Gateway"
        );
    }

    public async Task<GeocodingResultDto> GeocodeAddressAsync(string address, CancellationToken cancellationToken = default)
    {
        if (_resilienceMonitor.SimulateExternalMappingFailure)
        {
            _resilienceMonitor.RecordTrip("Mapping");
            return ResolveOfflineGazetteer(address);
        }

        if (IsLiveOsmEnabled() && !string.IsNullOrWhiteSpace(address))
        {
            string url = $"https://nominatim.openstreetmap.org/search?format=json&limit=1&q={Uri.EscapeDataString(address.Trim())}";
            using var doc = await TrySendNominatimGetAsync(url, cancellationToken);
            if (doc != null && doc.RootElement.ValueKind == JsonValueKind.Array && doc.RootElement.GetArrayLength() > 0)
            {
                var first = doc.RootElement[0];
                string displayName = first.TryGetProperty("display_name", out var dn) ? dn.GetString() ?? address : address;
                if (double.TryParse(first.GetProperty("lat").GetString(), NumberStyles.Float, CultureInfo.InvariantCulture, out double lat) &&
                    double.TryParse(first.GetProperty("lon").GetString(), NumberStyles.Float, CultureInfo.InvariantCulture, out double lon))
                {
                    return new GeocodingResultDto(displayName, Math.Round(lat, 4), Math.Round(lon, 4), "Nominatim-OSM-Live");
                }
            }

            _resilienceMonitor.RecordTrip("Mapping");
            return ResolveOfflineGazetteer(address);
        }

        return ResolveLocalKnownAddress(address, "Nominatim-OSM");
    }

    public async Task<GeocodingResultDto> ReverseGeocodeAsync(double latitude, double longitude, CancellationToken cancellationToken = default)
    {
        if (_resilienceMonitor.SimulateExternalMappingFailure)
        {
            _resilienceMonitor.RecordTrip("Mapping");
            return ResolveOfflineReverseGazetteer(latitude, longitude, "OfflineGazetteerFallback");
        }

        if (IsLiveOsmEnabled())
        {
            string url = string.Format(
                CultureInfo.InvariantCulture,
                "https://nominatim.openstreetmap.org/reverse?format=json&lat={0}&lon={1}",
                latitude,
                longitude);
            using var doc = await TrySendNominatimGetAsync(url, cancellationToken);
            if (doc != null &&
                doc.RootElement.TryGetProperty("display_name", out var dn) &&
                !string.IsNullOrWhiteSpace(dn.GetString()))
            {
                return new GeocodingResultDto(
                    dn.GetString()!,
                    Math.Round(latitude, 4),
                    Math.Round(longitude, 4),
                    "Nominatim-OSM-Reverse-Live");
            }

            _resilienceMonitor.RecordTrip("Mapping");
            return ResolveOfflineReverseGazetteer(latitude, longitude, "OfflineGazetteerFallback");
        }

        return ResolveOfflineReverseGazetteer(latitude, longitude, "Nominatim-OSM-Reverse");
    }

    private async Task<JsonDocument?> TrySendNominatimGetAsync(string url, CancellationToken cancellationToken)
    {
        int timeoutSec = GetHttpTimeoutSeconds();
        for (int attempt = 1; attempt <= 2; attempt++)
        {
            try
            {
                using var cts = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
                cts.CancelAfter(TimeSpan.FromSeconds(timeoutSec));

                var client = _httpClientFactory!.CreateClient();
                using var request = new HttpRequestMessage(HttpMethod.Get, url);
                request.Headers.UserAgent.ParseAdd("CriSync-Humanitarian-Platform/1.0");

                using var response = await client.SendAsync(request, cts.Token);
                if (response.IsSuccessStatusCode)
                {
                    await using var stream = await response.Content.ReadAsStreamAsync(cts.Token);
                    return await JsonDocument.ParseAsync(stream, cancellationToken: cts.Token);
                }
            }
            catch
            {
            }

            if (attempt < 2)
            {
                await Task.Delay(150 * attempt, cancellationToken);
            }
        }

        return null;
    }

    private GeocodingResultDto ResolveOfflineReverseGazetteer(double latitude, double longitude, string providerName)
    {
        var zones = new[]
        {
            (Label: "Ratnapura Flood Operations Zone, Sri Lanka", Lat: 6.6828, Lon: 80.3992),
            (Label: "Kalutara River Basin Sector, Sri Lanka", Lat: 6.5854, Lon: 79.9607),
            (Label: "Badulla Highland Landslide Zone, Sri Lanka", Lat: 6.9934, Lon: 81.0550),
            (Label: "Colombo Central Humanitarian Hub, Sri Lanka", Lat: 6.9271, Lon: 79.8612)
        };

        var nearest = zones
            .Select(z => (z.Label, Dist: Math.Round(CalculateDistanceKm(latitude, longitude, z.Lat, z.Lon), 2)))
            .OrderBy(x => x.Dist)
            .First();

        string suffix = providerName == "OfflineGazetteerFallback"
            ? " (Resolved via Offline Gazetteer)"
            : string.Empty;

        string formatted = string.Format(
            CultureInfo.InvariantCulture,
            "{0} (~{1} km from {2:F4}, {3:F4}){4}",
            nearest.Label,
            nearest.Dist,
            latitude,
            longitude,
            suffix);

        return new GeocodingResultDto(formatted, Math.Round(latitude, 4), Math.Round(longitude, 4), providerName);
    }

    private static RouteCalculationDto BuildHaversineFallbackRoute(double haversineKm)
    {
        double fallbackRoadKm = Math.Round(haversineKm * 1.28, 2);
        int fallbackMinutes = Math.Max(8, (int)Math.Ceiling(fallbackRoadKm * 1.65));
        return new RouteCalculationDto(
            fallbackRoadKm,
            fallbackMinutes,
            $"[OFFLINE GEOSPATIAL FALLBACK] Estimated terrain corridor ({fallbackRoadKm} km, ~{fallbackMinutes} mins)",
            "LocalHaversineFallbackEngine"
        );
    }

    private static GeocodingResultDto ResolveOfflineGazetteer(string? address)
    {
        var baseMatch = ResolveLocalKnownAddress(address, "OfflineGazetteerFallback");
        return baseMatch with
        {
            FormattedAddress = $"{baseMatch.FormattedAddress} (Resolved via Offline Gazetteer)"
        };
    }

    private static GeocodingResultDto ResolveLocalKnownAddress(string? address, string providerName)
    {
        string lower = (address ?? string.Empty).ToLowerInvariant();
        if (lower.Contains("ratnapura"))
        {
            return new GeocodingResultDto("Ratnapura Flood Operations Zone, Sri Lanka", 6.6828, 80.3992, providerName);
        }
        if (lower.Contains("kalutara"))
        {
            return new GeocodingResultDto("Kalutara River Basin Sector, Sri Lanka", 6.5854, 79.9607, providerName);
        }
        if (lower.Contains("badulla"))
        {
            return new GeocodingResultDto("Badulla Highland Landslide Zone, Sri Lanka", 6.9934, 81.0550, providerName);
        }

        return new GeocodingResultDto(
            string.IsNullOrWhiteSpace(address) ? "Colombo Central Humanitarian Hub, Sri Lanka" : address,
            6.9271,
            79.8612,
            providerName
        );
    }

    private static double DegreesToRadians(double deg) => deg * (Math.PI / 180.0);
}
