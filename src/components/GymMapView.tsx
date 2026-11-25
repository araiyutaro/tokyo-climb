'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  ChevronRight,
  Clock,
  Filter,
  Loader2,
  LocateFixed,
  MapPin,
  Star,
  X,
} from 'lucide-react';
import type { Gym, ScheduleEvent } from '@/lib/schema';
import { evaluateGymDayStatus, type GymDayStatus } from '@/lib/schedule';
import { formatDistanceJa, haversineDistanceKm, type Coordinates } from '@/lib/geo';
import { formatTimeRange, getStatusMeta } from '@/lib/ui-helpers';

interface GymMapViewProps {
  gyms: Gym[];
  events: ScheduleEvent[];
  now: Date;
  todayStr: string;
  favorites: Set<string>;
  userLocation: Coordinates | null;
  locating: boolean;
  onRequestLocation: (onSuccess?: () => void) => void;
  onOpenGymDetail: (dayStatus: GymDayStatus) => void;
}

const LIGHT_TILES = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';
const DARK_TILES = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
const TILE_ATTRIBUTION = '&copy; OpenStreetMap &copy; CARTO';

const QUICK_CHAINS = ['all', 'NOBOROCK', 'Base Camp', 'B-PUMP', 'D.Bouldering', 'ROCKY', '独立系'] as const;

function getPinColor(dayStatus: GymDayStatus): string {
  if (dayStatus.status === 'hold_change_closed' || dayStatus.status === 'temp_closed') {
    return '#e11d48'; // rose-600
  }
  if (dayStatus.status === 'closing_soon' || dayStatus.hasPartialHoldChange) {
    return '#f59e0b'; // amber-500
  }
  if (dayStatus.status === 'open' || dayStatus.status === 'scheduled_open') {
    return '#10b981'; // emerald-500
  }
  return '#64748b'; // slate-500
}

export function GymMapView({
  gyms,
  events,
  now,
  todayStr,
  favorites,
  userLocation,
  locating,
  onRequestLocation,
  onOpenGymDetail,
}: GymMapViewProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);

  const [onlyOpenNow, setOnlyOpenNow] = useState(false);
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [selectedChain, setSelectedChain] = useState<string>('all');
  const [selectedGymId, setSelectedGymId] = useState<string | null>(null);
  const [isDark, setIsDark] = useState(false);

  // Sync map tile theme with <html class="dark">
  useEffect(() => {
    const checkDark = () => setIsDark(document.documentElement.classList.contains('dark'));
    checkDark();
    const obs = new MutationObserver(checkDark);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => obs.disconnect();
  }, []);

  const evaluated = useMemo(() => {
    return gyms
      .filter((g) => Boolean(g.coordinates))
      .map((gym) => ({
        dayStatus: evaluateGymDayStatus(gym, todayStr, events, now),
        distanceKm:
          userLocation && gym.coordinates
            ? haversineDistanceKm(userLocation, gym.coordinates)
            : undefined,
      }));
  }, [gyms, todayStr, events, now, userLocation]);

  const filtered = useMemo(() => {
    return evaluated.filter(({ dayStatus }) => {
      if (onlyFavorites && !favorites.has(dayStatus.gym.id)) return false;
      if (
        onlyOpenNow &&
        dayStatus.status !== 'open' &&
        dayStatus.status !== 'closing_soon'
      ) {
        return false;
      }
      if (selectedChain !== 'all' && (dayStatus.gym.chain ?? '独立系') !== selectedChain) {
        return false;
      }
      return true;
    });
  }, [evaluated, onlyFavorites, favorites, onlyOpenNow, selectedChain]);

  const selectedEntry = useMemo(
    () => evaluated.find((e) => e.dayStatus.gym.id === selectedGymId) ?? null,
    [evaluated, selectedGymId],
  );

  // Initialize Leaflet map once
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [35.69, 139.7],
      zoom: 11,
      zoomControl: false,
    });

    L.control.zoom({ position: 'topright' }).addTo(map);
    const layer = L.tileLayer(
      document.documentElement.classList.contains('dark') ? DARK_TILES : LIGHT_TILES,
      { attribution: TILE_ATTRIBUTION, maxZoom: 19 },
    ).addTo(map);

    const markersGroup = L.layerGroup().addTo(map);

    mapRef.current = map;
    tileLayerRef.current = layer;
    markersLayerRef.current = markersGroup;

    return () => {
      map.remove();
      mapRef.current = null;
      tileLayerRef.current = null;
      markersLayerRef.current = null;
    };
  }, []);

  // Swap map tiles cleanly when Dark Mode toggles
  useEffect(() => {
    if (!mapRef.current || !tileLayerRef.current) return;
    tileLayerRef.current.setUrl(isDark ? DARK_TILES : LIGHT_TILES);
  }, [isDark]);

  // Render gym markers & user GPS dot
  useEffect(() => {
    const group = markersLayerRef.current;
    if (!group) return;
    group.clearLayers();

    if (userLocation) {
      const userIcon = L.divIcon({
        className: '',
        iconSize: [18, 18],
        iconAnchor: [9, 9],
        html: `<div style="width:18px;height:18px;border-radius:9999px;background:#0284c7;border:3px solid #ffffff;box-shadow:0 0 0 6px rgba(14,165,233,0.28);"></div>`,
      });
      L.marker([userLocation.lat, userLocation.lng], {
        icon: userIcon,
        zIndexOffset: 900,
      }).addTo(group);
    }

    for (const { dayStatus } of filtered) {
      const coords = dayStatus.gym.coordinates;
      if (!coords) continue;

      const isSelected = dayStatus.gym.id === selectedGymId;
      const isFav = favorites.has(dayStatus.gym.id);
      const color = getPinColor(dayStatus);
      const size = isSelected ? 24 : 18;
      const border = isFav ? '3px solid #fbbf24' : '2.5px solid #ffffff';
      const shadow = isSelected
        ? '0 0 0 5px rgba(15,23,42,0.25), 0 4px 12px rgba(0,0,0,0.35)'
        : '0 2px 6px rgba(0,0,0,0.35)';

      const icon = L.divIcon({
        className: '',
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
        html: `<div style="width:${size}px;height:${size}px;border-radius:9999px;background:${color};border:${border};box-shadow:${shadow};transition:transform 0.15s;"></div>`,
      });

      const marker = L.marker([coords.lat, coords.lng], {
        icon,
        title: dayStatus.gym.name,
        zIndexOffset: isSelected ? 1000 : isFav ? 500 : 100,
      });

      marker.on('click', () => {
        setSelectedGymId(dayStatus.gym.id);
        mapRef.current?.panTo([coords.lat, coords.lng], { animate: true });
      });

      marker.addTo(group);
    }
  }, [filtered, selectedGymId, favorites, userLocation]);

  const handleCenterOnMe = () => {
    if (userLocation) {
      mapRef.current?.setView([userLocation.lat, userLocation.lng], 13, { animate: true });
    } else {
      onRequestLocation();
    }
  };

  // Auto-pan to user location the first time it arrives while on Map view
  useEffect(() => {
    if (userLocation && mapRef.current) {
      mapRef.current.setView([userLocation.lat, userLocation.lng], 12, { animate: true });
    }
  }, [userLocation]);

  return (
    <section className="space-y-3">
      {/* Compact Map Filter Bar */}
      <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div className="no-scrollbar flex items-center gap-1.5 overflow-x-auto pb-0.5">
          <button
            type="button"
            onClick={handleCenterOnMe}
            disabled={locating}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-sky-600 px-3 py-1.5 text-xs font-bold text-white shadow-xs active:scale-95"
          >
            {locating ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <LocateFixed className="h-3.5 w-3.5" />
            )}
            現在地
          </button>

          <button
            type="button"
            onClick={() => setOnlyOpenNow((v) => !v)}
            className={`inline-flex shrink-0 items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-semibold active:scale-95 ${
              onlyOpenNow
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200'
            }`}
          >
            <Filter className="h-3.5 w-3.5" />
            営業中のみ
          </button>

          <button
            type="button"
            onClick={() => setOnlyFavorites((v) => !v)}
            className={`inline-flex shrink-0 items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-semibold active:scale-95 ${
              onlyFavorites
                ? 'bg-amber-600 text-white'
                : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200'
            }`}
          >
            <Star className={`h-3.5 w-3.5 ${onlyFavorites ? 'fill-white' : ''}`} />
            お気に入り
          </button>

          {QUICK_CHAINS.map((chain) => (
            <button
              key={chain}
              type="button"
              onClick={() => setSelectedChain(chain)}
              className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold active:scale-95 ${
                selectedChain === chain
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                  : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
              }`}
            >
              {chain === 'all' ? `全チェーン (${gyms.length})` : chain}
            </button>
          ))}
        </div>

        {/* Pin Legend */}
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-600 dark:text-slate-400">
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-1">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" /> 営業中
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="h-2.5 w-2.5 rounded-full bg-amber-500" /> 一部セット/閉店間近
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="h-2.5 w-2.5 rounded-full bg-rose-600" /> 休業
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="h-2.5 w-2.5 rounded-full bg-slate-500" /> 時間外
            </span>
          </div>
          <span className="font-semibold">{filtered.length} 店舗表示中</span>
        </div>
      </div>

      {/* Interactive Map Canvas */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div
          ref={mapContainerRef}
          className="h-[62vh] min-h-[420px] w-full md:h-[68vh]"
          aria-label="東京・近郊ボルダリングジム地図"
        />

        {/* Floating Preview Card when a pin is tapped */}
        {selectedEntry && (
          <div className="absolute bottom-3 left-3 right-3 z-[400] mx-auto max-w-md animate-[sheet-up_0.18s_ease-out] rounded-2xl border border-slate-200/90 bg-white/95 p-3.5 shadow-xl backdrop-blur-xl dark:border-slate-700 dark:bg-slate-900/95">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold ${
                      getStatusMeta(selectedEntry.dayStatus.status).badgeClass
                    }`}
                  >
                    {getStatusMeta(selectedEntry.dayStatus.status).label}
                  </span>
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-900 dark:text-white">
                    <Clock className="h-3.5 w-3.5 text-slate-400" />
                    {formatTimeRange(selectedEntry.dayStatus.effectiveHours)}
                  </span>
                </div>
                <h2 className="mt-1 truncate text-sm font-extrabold text-slate-900 dark:text-white">
                  {selectedEntry.dayStatus.gym.name}
                </h2>
                <p className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
                  <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                  <span className="truncate">{selectedEntry.dayStatus.gym.nearestStation}</span>
                  {selectedEntry.distanceKm !== undefined && (
                    <span className="shrink-0 font-bold text-sky-700 dark:text-sky-300">
                      約{formatDistanceJa(selectedEntry.distanceKm)}
                    </span>
                  )}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedGymId(null)}
                aria-label="プレビューを閉じる"
                className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <button
              type="button"
              onClick={() => onOpenGymDetail(selectedEntry.dayStatus)}
              className="mt-2.5 flex w-full items-center justify-center gap-1 rounded-xl bg-slate-900 py-2 text-xs font-bold text-white active:scale-[0.98] dark:bg-white dark:text-slate-900"
            >
              詳細・ホールド替え予定を見る
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
