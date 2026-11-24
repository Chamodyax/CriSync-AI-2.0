import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { Maximize2, Minimize2 } from 'lucide-react';

interface MapProps {
  requests: any[];
  shelters: any[];
  resources: any[];
  operationalAreas: any[];
  mappingReferences?: any[];
  onSelectLocation?: (lat: number, lon: number) => void;
}

export const InteractiveCrisisMap: React.FC<MapProps> = ({
  requests,
  shelters,
  resources,
  operationalAreas,
  mappingReferences = [],
  onSelectLocation
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const layerGroupRef = useRef<L.LayerGroup | null>(null);

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [layers, setLayers] = useState({
    emergencies: true,
    shelters: true,
    serviceCentres: true,
    warehouses: true,
    routes: true
  });

  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) {
      return;
    }

    const map = L.map(mapContainerRef.current).setView([6.6828, 80.3992], 10);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap Humanitarian Contributors'
    }).addTo(map);

    const group = L.layerGroup().addTo(map);
    mapInstanceRef.current = map;
    layerGroupRef.current = group;

    map.on('click', (evt: L.LeafletMouseEvent) => {
      if (onSelectLocation) {
        onSelectLocation(
          Number(evt.latlng.lat.toFixed(4)),
          Number(evt.latlng.lng.toFixed(4))
        );
      }
    });

    setTimeout(() => {
      map.invalidateSize();
    }, 150);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!isFullscreen) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsFullscreen(false);
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isFullscreen]);

  useEffect(() => {
    const timer = setTimeout(() => {
      mapInstanceRef.current?.invalidateSize();
    }, 180);
    return () => clearTimeout(timer);
  }, [isFullscreen]);

  useEffect(() => {
    const group = layerGroupRef.current;
    if (!group) {
      return;
    }

    group.clearLayers();

    if (layers.emergencies) {
      operationalAreas.forEach((area) => {
        if (area.riskLevel === 'Critical') {
          L.marker([area.latitude, area.longitude], {
            interactive: false,
            icon: L.divIcon({
              className: 'crisync-map-sonar-icon',
              html: '<span class="crisync-sonar-ring"></span><span class="crisync-sonar-ring crisync-sonar-delay"></span>',
              iconSize: [44, 44],
              iconAnchor: [22, 22]
            })
          }).addTo(group);
        }
        L.circle([area.latitude, area.longitude], {
          radius: (area.coverageRadiusKm || 10) * 1000,
          color: area.riskLevel === 'Critical' ? '#f43f5e' : '#f59e0b',
          fillColor: area.riskLevel === 'Critical' ? '#f43f5e' : '#f59e0b',
          fillOpacity: 0.14,
          weight: 2
        })
          .bindPopup(
            `<strong>${area.zoneName}</strong><br/>District: ${area.district}<br/>Risk: ${area.riskLevel}<br/>Est. Affected: ${area.estimatedAffectedPopulation}`
          )
          .addTo(group);
      });

      requests.forEach((req) => {
        const isUrgent =
          req.finalApprovedUrgency === 'LifeThreatening' || req.finalApprovedUrgency === 'Critical';
        const color = isUrgent
          ? '#f43f5e'
          : req.finalApprovedUrgency === 'High'
          ? '#fb923c'
          : '#6366f1';

        if (isUrgent) {
          L.marker([req.latitude, req.longitude], {
            interactive: false,
            icon: L.divIcon({
              className: 'crisync-map-sonar-icon',
              html: '<span class="crisync-sonar-ring"></span><span class="crisync-sonar-ring crisync-sonar-delay"></span>',
              iconSize: [44, 44],
              iconAnchor: [22, 22]
            })
          }).addTo(group);
        }

        L.circleMarker([req.latitude, req.longitude], {
          radius: 9,
          fillColor: color,
          color: '#ffffff',
          weight: 2,
          fillOpacity: 0.95
        })
          .bindPopup(
            `<strong>[${req.referenceCode}] ${req.title}</strong><br/>Category: ${req.category}<br/>Urgency: ${req.finalApprovedUrgency} (Score: ${req.priorityScore})<br/>Status: ${req.status}<br/>Affected: ${req.affectedPeopleCount} people`
          )
          .addTo(group);
      });
    }

    if (layers.routes && requests.length > 0 && resources.length > 0) {
      requests
        .filter((r) => r.status !== 'Fulfilled' && r.status !== 'Closed' && r.status !== 'MergedAsDuplicate')
        .slice(0, 12)
        .forEach((req) => {
          let bestDepot: any = null;
          let bestDistSq = Number.POSITIVE_INFINITY;
          resources.forEach((res) => {
            if (!res.warehouseLatitude || !res.warehouseLongitude) return;
            const dLat = Number(res.warehouseLatitude) - Number(req.latitude);
            const dLon = Number(res.warehouseLongitude) - Number(req.longitude);
            const distSq = dLat * dLat + dLon * dLon;
            if (distSq < bestDistSq) {
              bestDistSq = distSq;
              bestDepot = res;
            }
          });
          if (bestDepot) {
            L.polyline(
              [
                [bestDepot.warehouseLatitude, bestDepot.warehouseLongitude],
                [req.latitude, req.longitude]
              ],
              {
                color: '#38bdf8',
                weight: 2.5,
                opacity: 0.85,
                dashArray: '8 8',
                className: 'crisync-route-flow'
              }
            )
              .bindPopup(
                `<strong>Supply Corridor</strong><br/>From: ${bestDepot.warehouseName}<br/>To: ${req.referenceCode || req.title}`
              )
              .addTo(group);
          }
        });
    }

    if (layers.shelters) {
      shelters.forEach((sh) => {
        L.circleMarker([sh.latitude, sh.longitude], {
          radius: 10,
          fillColor: '#10b981',
          color: '#ecfdf5',
          weight: 2,
          fillOpacity: 0.95
        })
          .bindPopup(
            `<strong>Shelter: ${sh.name}</strong><br/>Occupancy: ${sh.currentOccupancy} / ${sh.totalCapacity}<br/>Wheelchair Accessible: ${sh.isWheelchairAccessible ? 'Yes' : 'No'}<br/>Services: ${sh.availableServices}`
          )
          .addTo(group);
      });
    }

    if (layers.warehouses) {
      resources.forEach((res) => {
        L.circleMarker([res.warehouseLatitude, res.warehouseLongitude], {
          radius: 8,
          fillColor: '#a855f7',
          color: '#ffffff',
          weight: 2,
          fillOpacity: 0.95
        })
          .bindPopup(
            `<strong>Depot: ${res.warehouseName}</strong><br/>Item: ${res.name}<br/>Available: ${res.availableQuantity} / ${res.totalQuantity} ${res.unit}<br/>Cold-Chain: ${res.supportsColdChain ? 'Yes' : 'No'}`
          )
          .addTo(group);
      });
    }

    if (layers.serviceCentres) {
      mappingReferences.forEach((mr) => {
        L.circleMarker([mr.latitude, mr.longitude], {
          radius: 8,
          fillColor: '#06b6d4',
          color: '#ecfeff',
          weight: 2,
          fillOpacity: 0.95
        })
          .bindPopup(
            `<strong>${mr.referenceType || 'ServiceCentre'}: ${mr.label}</strong><br/>Coordinates: ${Number(mr.latitude).toFixed(4)}, ${Number(mr.longitude).toFixed(4)}`
          )
          .addTo(group);
      });
    }
  }, [requests, shelters, resources, operationalAreas, mappingReferences, layers]);

  const toggleLayer = (key: keyof typeof layers) => {
    setLayers((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div
      className={
        isFullscreen
          ? 'fixed inset-4 z-[85] bento-glass rounded-3xl p-3 sm:p-4 flex flex-col gap-3 border border-indigo-500/40 shadow-2xl'
          : 'space-y-2.5'
      }
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-bold">
          <button
            type="button"
            onClick={() => toggleLayer('emergencies')}
            className={`px-2.5 py-1 rounded-xl border inline-flex items-center gap-1.5 transition ${
              layers.emergencies
                ? 'bg-rose-500/15 border-rose-500/40 text-rose-300'
                : 'bg-white/[0.03] border-white/10 text-zinc-400 opacity-60'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            <span>Emergencies ({requests.length})</span>
          </button>
          <button
            type="button"
            onClick={() => toggleLayer('shelters')}
            className={`px-2.5 py-1 rounded-xl border inline-flex items-center gap-1.5 transition ${
              layers.shelters
                ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                : 'bg-white/[0.03] border-white/10 text-zinc-400 opacity-60'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Shelters ({shelters.length})</span>
          </button>
          <button
            type="button"
            onClick={() => toggleLayer('warehouses')}
            className={`px-2.5 py-1 rounded-xl border inline-flex items-center gap-1.5 transition ${
              layers.warehouses
                ? 'bg-purple-500/15 border-purple-500/40 text-purple-300'
                : 'bg-white/[0.03] border-white/10 text-zinc-400 opacity-60'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-purple-500" />
            <span>Depots ({resources.length})</span>
          </button>
          <button
            type="button"
            onClick={() => toggleLayer('serviceCentres')}
            className={`px-2.5 py-1 rounded-xl border inline-flex items-center gap-1.5 transition ${
              layers.serviceCentres
                ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-300'
                : 'bg-white/[0.03] border-white/10 text-zinc-400 opacity-60'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-cyan-500" />
            <span>Service Centres ({mappingReferences.length})</span>
          </button>
          <button
            type="button"
            onClick={() => toggleLayer('routes')}
            className={`px-2.5 py-1 rounded-xl border inline-flex items-center gap-1.5 transition ${
              layers.routes
                ? 'bg-sky-500/15 border-sky-500/40 text-sky-300'
                : 'bg-white/[0.03] border-white/10 text-zinc-400 opacity-60'
            }`}
          >
            <span className="w-2.5 h-0.5 bg-sky-400" />
            <span>Supply Routes</span>
          </button>
        </div>

        <button
          type="button"
          onClick={() => setIsFullscreen((prev) => !prev)}
          className="px-2.5 py-1 rounded-xl bg-white/[0.06] hover:bg-white/15 border border-white/15 text-[11px] font-bold text-zinc-200 inline-flex items-center gap-1.5 transition shrink-0"
        >
          {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          <span>{isFullscreen ? 'Exit Fullscreen' : 'Fullscreen Map'}</span>
        </button>
      </div>

      <div
        className={`${
          isFullscreen ? 'flex-1 min-h-[300px]' : 'w-full h-[340px] sm:h-[450px]'
        } rounded-2xl overflow-hidden border border-white/10 shadow-2xl`}
      >
        <div ref={mapContainerRef} className="w-full h-full" />
      </div>
    </div>
  );
};
