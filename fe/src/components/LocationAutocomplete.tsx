import { useState, useEffect, useRef, useCallback } from 'react';
import { Search, MapPin, Loader2, X } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

export interface LocationResult {
  displayName: string;      // Tên hiển thị đầy đủ
  formattedAddress: string; // Địa chỉ chi tiết (ví dụ: "311 Nguyễn Xí, Quận Bình Thạnh, TP.HCM")
  lat: number;
  lng: number;
  placeId: string;
}

interface NominatimResult {
  place_id: number;
  display_name: string;
  name: string;
  lat: string;
  lon: string;
  address: {
    road?: string;
    house_number?: string;
    suburb?: string;
    city_district?: string;
    county?: string;
    city?: string;
    state?: string;
    country?: string;
    quarter?: string;
    neighbourhood?: string;
    village?: string;
    town?: string;
    amenity?: string;
    building?: string;
  };
}

interface Props {
  value: string;
  onChange: (value: string) => void;
  onSelect: (result: LocationResult) => void;
  placeholder?: string;
  className?: string;
  inputClassName?: string;
}

/**
 * LocationAutocomplete — Ô nhập địa chỉ với gợi ý từ OpenStreetMap (Nominatim)
 * Hoàn toàn miễn phí, không cần API key.
 */
export default function LocationAutocomplete({
  value,
  onChange,
  onSelect,
  placeholder = 'Nhập địa chỉ sự kiện...',
  inputClassName = '',
}: Props) {
  const { isDark } = useTheme();
  const [suggestions, setSuggestions] = useState<LocationResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  /** Chuyển Nominatim result → địa chỉ tiếng Việt thân thiện */
  const formatAddress = (item: NominatimResult): string => {
    const { address } = item;
    const parts: string[] = [];

    // Tên địa điểm (amenity, building, ...)
    if (address.amenity) parts.push(address.amenity);
    else if (address.building) parts.push(address.building);
    else if (item.name && item.name !== address.road) parts.push(item.name);

    // Số nhà + đường
    if (address.house_number && address.road) {
      parts.push(`${address.house_number} ${address.road}`);
    } else if (address.road) {
      parts.push(address.road);
    }

    // Phường/Xã
    const sublocality =
      address.quarter ||
      address.neighbourhood ||
      address.suburb ||
      address.village ||
      address.town;
    if (sublocality) parts.push(sublocality);

    // Quận/Huyện
    if (address.city_district) parts.push(address.city_district);
    else if (address.county) parts.push(address.county);

    // Thành phố/Tỉnh
    if (address.city) parts.push(address.city);
    else if (address.state) parts.push(address.state);

    // Lọc trùng lặp và ghép lại
    const unique = [...new Set(parts)].filter(Boolean);
    return unique.join(', ');
  };

  const fetchSuggestions = useCallback(async (query: string) => {
    if (query.trim().length < 3) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    // Hủy request cũ nếu còn
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();

    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        q: `${query}, Việt Nam`,
        format: 'json',
        limit: '6',
        addressdetails: '1',
        countrycodes: 'vn',
        'accept-language': 'vi',
      });

      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?${params}`,
        {
          signal: abortRef.current.signal,
          headers: { 'Accept-Language': 'vi' },
        }
      );

      if (!res.ok) throw new Error('Nominatim error');
      const data: NominatimResult[] = await res.json();

      const results: LocationResult[] = data
        .filter((item) => item.lat && item.lon)
        .map((item) => ({
          displayName: item.display_name,
          formattedAddress: formatAddress(item),
          lat: parseFloat(item.lat),
          lng: parseFloat(item.lon),
          placeId: String(item.place_id),
        }))
        .filter((r) => r.formattedAddress.length > 0);

      setSuggestions(results);
      setIsOpen(results.length > 0);
      setActiveIndex(-1);
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error('Nominatim fetch error:', err);
      }
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Debounce 450ms khi user gõ
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchSuggestions(value);
    }, 450);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [value, fetchSuggestions]);

  // Đóng dropdown khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (result: LocationResult) => {
    onChange(result.formattedAddress);
    onSelect(result);
    setIsOpen(false);
    setSuggestions([]);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || suggestions.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((prev) => Math.min(prev + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((prev) => Math.max(prev - 1, -1));
    } else if (e.key === 'Enter' && activeIndex >= 0) {
      e.preventDefault();
      handleSelect(suggestions[activeIndex]);
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const dropdownBg = isDark
    ? 'bg-charcoal border-zinc-700 shadow-2xl shadow-black/50'
    : 'bg-white border-gray-200 shadow-xl shadow-gray-200/60';

  const itemHover = isDark
    ? 'hover:bg-midnight/70 text-cream'
    : 'hover:bg-gray-50 text-ink';

  const itemActive = isDark ? 'bg-midnight/90' : 'bg-gray-100';

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Input */}
      <div className="relative flex items-center">
        <Search
          size={16}
          className="absolute left-3 text-akai pointer-events-none shrink-0"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            if (!e.target.value) {
              setSuggestions([]);
              setIsOpen(false);
            }
          }}
          onFocus={() => suggestions.length > 0 && setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          autoComplete="off"
          className={`w-full pl-9 pr-10 ${inputClassName}`}
        />
        {/* Spinner / Clear */}
        <div className="absolute right-3 flex items-center">
          {isLoading ? (
            <Loader2 size={15} className="text-akai animate-spin" />
          ) : value ? (
            <button
              type="button"
              onClick={() => {
                onChange('');
                setSuggestions([]);
                setIsOpen(false);
              }}
              className="text-gray-400 hover:text-akai transition-colors"
            >
              <X size={15} />
            </button>
          ) : null}
        </div>
      </div>

      {/* Dropdown suggestions */}
      {isOpen && suggestions.length > 0 && (
        <ul
          className={`absolute z-50 left-0 right-0 mt-1.5 rounded-xl border overflow-hidden ${dropdownBg}`}
        >
          {suggestions.map((result, idx) => (
            <li
              key={result.placeId}
              onMouseDown={(e) => {
                e.preventDefault();
                handleSelect(result);
              }}
              onMouseEnter={() => setActiveIndex(idx)}
              className={`flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors ${itemHover} ${
                idx === activeIndex ? itemActive : ''
              }`}
            >
              <MapPin
                size={14}
                className="text-akai mt-0.5 shrink-0"
              />
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">
                  {result.formattedAddress || result.displayName.split(',')[0]}
                </p>
                <p
                  className={`text-xs truncate mt-0.5 ${
                    isDark ? 'text-zinc-500' : 'text-gray-400'
                  }`}
                >
                  {result.displayName}
                </p>
              </div>
            </li>
          ))}
          <li
            className={`px-4 py-2 text-xs text-center ${
              isDark ? 'text-zinc-600' : 'text-gray-300'
            }`}
          >
            Dữ liệu từ © OpenStreetMap
          </li>
        </ul>
      )}
    </div>
  );
}
