import { SHEET_CONFIG } from './types';
import { ShowDay, Show } from './types';

// Map index sang ngày thực tế (có bỏ qua ngày 21)
const DAY_INDEX_MAP: Record<number, { day: number; month: number }> = {
  0: { day: 19, month: 9 },   // 19.9
  1: { day: 20, month: 9 },   // 20.9
  2: { day: 22, month: 9 },   // 22.9 (bỏ qua 21)
  3: { day: 23, month: 9 },   // 23.9
  4: { day: 24, month: 9 },   // 24.9
  5: { day: 25, month: 9 },   // 25.9
  6: { day: 17, month: 9 },   // 18.9 (Các show khác - sẽ override bằng ngày trong dòng)
  7: { day: 18, month: 9 },   // 19.9
};

// Parse CSV data from Google Sheets
export const parseCSV = (csvText: string, dayIndex: number = 0): ShowDay[] => {
  const days: ShowDay[] = [];
  const lines = csvText.trim().split('\n');
  
  if (lines.length < 2) {
    console.log(`Sheet ${dayIndex}: Empty or too short (${lines.length} lines)`);
    return days;
  }
  
  let shows: Show[] = [];
  let dayDate = '';
  let dayName = '';
  
  // Trích xuất ngày từ header
  const headerLine = lines[0];
  const headerRow = parseCSVLine(headerLine);
  const headerText = headerRow.join(' ');
  
  // Tìm ngày trong header (format: "dd.mm" hoặc "dd.m (m Âm)")
  const dayMatch = headerText.match(/(\d{1,2})\.(\d{1,2})/);
  
  if (dayMatch) {
    const dayNum = parseInt(dayMatch[1]);
    const month = parseInt(dayMatch[2]);
    const year = 2026;
    dayDate = `${year}-${String(month).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
    dayName = `${dayNum}.${month}`;
  } else {
    // Dùng map cố định thay vì tính toán
    const dayInfo = DAY_INDEX_MAP[dayIndex];
    if (dayInfo) {
      dayDate = `2026-${String(dayInfo.month).padStart(2, '0')}-${String(dayInfo.day).padStart(2, '0')}`;
      dayName = `${dayInfo.day}.${dayInfo.month}`;
    } else {
      // Fallback cuối cùng
      const baseDate = new Date('2026-09-19');
      baseDate.setDate(baseDate.getDate() + dayIndex);
      dayDate = baseDate.toISOString().split('T')[0];
      dayName = `${baseDate.getDate()}.${baseDate.getMonth() + 1}`;
    }
  }
  
  const dayOfWeek = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'][new Date(dayDate).getDay()];
  
  console.log(`Sheet ${dayIndex} (${dayName}): Processing ${lines.length - 1} data rows`);
  console.log(`  Header: ${headerRow.slice(0, 5).join(', ')}`);
  
  // Xác định format dựa trên header
  const isCacShowKhac = headerRow[0]?.toLowerCase().includes('ngày');
  const isFirstSheetNoTimeCol = headerRow[0] === '-' || headerRow[0] === '';
  
  // Cho "Các show khác", theo dõi các ngày riêng biệt
  const cacShowKhacDays: Record<string, { shows: Show[], dayName: string }> = {};
  
  // Duyệt qua các dòng (bắt đầu từ dòng 1, bỏ header)
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    let row = parseCSVLine(line);
    
    // Nếu dòng có nhiều hơn 9 cột (trường hợp file 24.9 có 10 cột), trim cột thừa
    // Standard format: 9 cột (THỜI GIAN, Số lân, Tên, Địa chỉ, Phone, Nguồn, Trạng thái, Ghi chú, Báo giá)
    if (!isCacShowKhac && row.length > 9) {
      row = row.slice(0, 9);
    }
    
    let time = '';
    let lionCount = '';
    let showName = '';
    let address = '';
    let phone = '';
    let source = '';
    let status = '';
    let notes = '';
    let price = '';
    let rowDate = '';
    
    if (isCacShowKhac) {
      // Format "Các show khác": Ngày, Giờ, Số lân, Tên, Địa chỉ, Phone, Nguồn, Trạng thái, Ghi chú, Báo giá
      rowDate = row[0]?.trim() || '';
      time = row[1]?.trim() || '';
      lionCount = row[2]?.trim() || '';
      showName = row[3]?.trim() || '';
      address = row[4]?.trim() || '';
      phone = row[5]?.trim() || '';
      source = row[6]?.trim() || '';
      status = row[7]?.trim() || '';
      notes = row[8]?.trim() || '';
      price = row[9]?.trim() || '';
    } else if (isFirstSheetNoTimeCol) {
      // Format 19.9: -, Số lân, Tên, Địa chỉ, Phone, Nguồn, Trạng thái, Ghi chú, Báo giá
      time = row[0]?.trim() || '';
      lionCount = row[1]?.trim() || '';
      showName = row[2]?.trim() || '';
      address = row[3]?.trim() || '';
      phone = row[4]?.trim() || '';
      source = row[5]?.trim() || '';
      status = row[6]?.trim() || '';
      notes = row[7]?.trim() || '';
      price = row[8]?.trim() || '';
    } else {
      // Format chuẩn: THỜI GIAN, Số lân, Tên, Địa chỉ, Phone, Nguồn, Trạng thái, Ghi chú, Báo giá
      time = row[0]?.trim() || '';
      lionCount = row[1]?.trim() || '';
      showName = row[2]?.trim() || '';
      address = row[3]?.trim() || '';
      phone = row[4]?.trim() || '';
      source = row[5]?.trim() || '';
      status = row[6]?.trim() || '';
      notes = row[7]?.trim() || '';
      price = row[8]?.trim() || '';
    }
    
    // Kiểm tra format giờ hợp lệ (hỗ trợ: 8h, 8h30, 8h00, 8H, 8h30, etc)
    const timeRegex = /^\d{1,2}[hH]\d{0,2}$/;
    if (!time || !timeRegex.test(time)) continue;
    
    // Skip dòng trống (không có tên show)
    if (!showName) continue;
    
    // Xử lý ngày cho "Các show khác"
    if (isCacShowKhac && rowDate) {
      // rowDate format: "17/9", "18/9"
      const dateParts = rowDate.split('/');
      if (dateParts.length === 2) {
        const rowDay = parseInt(dateParts[0]);
        const rowMonth = parseInt(dateParts[1]);
        dayDate = `2026-${String(rowMonth).padStart(2, '0')}-${String(rowDay).padStart(2, '0')}`;
        dayName = `${rowDay}.${rowMonth}`;
      }
    }
    
    // Parse số lân (lấy số đầu tiên trong chuỗi)
    const lionCountMatch = lionCount.match(/\d+/);
    const parsedLionCount = lionCountMatch ? parseInt(lionCountMatch[0]) : 1;
    
    const show: Show = {
      id: `show-${dayIndex}-${shows.length}`,
      time: time.toLowerCase().replace('H', 'h'), // Chuẩn hóa: 20H -> 20h
      showName,
      lionCount: parsedLionCount,
      address,
      phone,
      source,
      status,
      notes,
      price,
      roles: []
    };
    
    if (isCacShowKhac && rowDate) {
      // Thêm vào ngày tương ứng
      if (!cacShowKhacDays[rowDate]) {
        cacShowKhacDays[rowDate] = { shows: [], dayName };
      }
      cacShowKhacDays[rowDate].shows.push(show);
      console.log(`  Row ${i}: ${rowDate} ${time} - ${showName} (${lionCount})`);
    } else {
      shows.push(show);
      console.log(`  Row ${i}: ${time} - ${showName} (${lionCount})`);
    }
  }
  
  // Xử lý riêng cho "Các show khác"
  if (isCacShowKhac && Object.keys(cacShowKhacDays).length > 0) {
    for (const [rowDate, data] of Object.entries(cacShowKhacDays)) {
      const dateParts = rowDate.split('/');
      const rowDay = parseInt(dateParts[0]);
      const rowMonth = parseInt(dateParts[1]);
      const showDate = `2026-${String(rowMonth).padStart(2, '0')}-${String(rowDay).padStart(2, '0')}`;
      const dayOfWeek = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'][new Date(showDate).getDay()];
      
      days.push({
        id: `day-${showDate}`,
        date: showDate,
        dayName: data.dayName,
        dayOfWeek,
        shows: data.shows
      });
    }
  } else {
    // Tạo ngày với shows (luôn tạo ngày, kể cả khi không có show)
    days.push({
      id: `day-${dayDate}`,
      date: dayDate,
      dayName,
      dayOfWeek,
      shows
    });
  }
  
  console.log(`Sheet ${dayIndex}: Created ${days.length} days`);
  return days;
};

// Parse một dòng CSV (xử lý quoted values)
const parseCSVLine = (line: string): string[] => {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current.trim());
  return result;
};

// Cache key cho sheet data
const SHEET_CACHE_KEY = 'lan_sheet_cache';
const SHEET_CACHE_TIMESTAMP_KEY = 'lan_sheet_cache_timestamp';

// Kiểm tra cache còn hạn không (unused - để tự refresh sau 5p)

// Lưu cache
const saveCache = (data: ShowDay[]) => {
  try {
    localStorage.setItem(SHEET_CACHE_KEY, JSON.stringify(data));
    localStorage.setItem(SHEET_CACHE_TIMESTAMP_KEY, Date.now().toString());
  } catch (e) {
    console.warn('Cache save failed:', e);
  }
};

// Load cache
const loadCache = (): ShowDay[] | null => {
  try {
    const cached = localStorage.getItem(SHEET_CACHE_KEY);
    if (cached) {
      console.log('Loading sheet data from cache');
      return JSON.parse(cached);
    }
  } catch (e) {
    console.warn('Cache load failed:', e);
  }
  return null;
};

// Fetch dữ liệu từ Google Sheets
export const fetchSheetData = async (): Promise<ShowDay[]> => {
  try {
    // 1. Thử load từ cache TRƯỚC
    const cached = loadCache();
    if (cached && cached.length > 0) {
      console.log('Using cached sheet data, will refresh in background');
      
      // Refresh background (không block)
      refreshSheetDataBackground();
      
      return cached;
    }

    // 2. Cache miss - fetch mới
    console.log('No cache, fetching sheets...');
    return await fetchSheetDataFresh();

  } catch (error) {
    console.error('Error fetching sheet data:', error);
    return [];
  }
};

// Fetch fresh data (tuần tự hoặc song song)
const fetchSheetDataFresh = async (): Promise<ShowDay[]> => {
  const allDays: ShowDay[] = [];

  // Fetch SONG SONG thay vì tuần tự
  console.log('Fetching', SHEET_CONFIG.sheetUrls.length, 'sheets in parallel...');
  
  const fetchPromises = SHEET_CONFIG.sheetUrls.map((url, i) => {
    const cacheBuster = `&t=${Date.now()}`;
    return fetch(url + cacheBuster)
      .then(res => res.text())
      .then(text => parseCSV(text, i));
  });

  const results = await Promise.all(fetchPromises);
  
  // Merge kết quả
  for (const days of results) {
    allDays.push(...days);
  }

  // Sắp xếp theo ngày
  allDays.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Lưu cache
  saveCache(allDays);

  console.log('Total days parsed:', allDays.length);
  allDays.forEach(d => console.log(`  ${d.dayName}: ${d.shows.length} shows`));

  return allDays;
};

// Refresh background (sau khi load từ cache)
const refreshSheetDataBackground = async () => {
  try {
    // Chờ 1 chút để không block initial render
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log('Background refreshing sheet data...');
    const freshData = await fetchSheetDataFresh();
    
    if (freshData && freshData.length > 0) {
      // Dispatch event để App cập nhật nếu cần
      window.dispatchEvent(new CustomEvent('sheetDataRefreshed', { detail: freshData }));
      console.log('Background refresh complete');
    }
  } catch (e) {
    console.warn('Background refresh failed:', e);
  }
};

// Lưu đăng ký - localStorage là nguồn chính, server là backup/sync
export const saveRegistrations = async (registrations: Record<string, Show>): Promise<number> => {
  // 1. Lưu local LUÔN (kể cả khi server lỗi)
  try {
    localStorage.setItem('lan_registrations', JSON.stringify(registrations));
  } catch (e) {
    console.warn('localStorage save failed:', e);
  }

  // 2. Thử sync lên server (không bắt buộc thành công)
  try {
    const res = await fetch('/api/registrations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ registrations })
    });
    if (res.ok) {
      const data = await res.json();
      console.log('[save] server response:', { kvConfigured: data.kvConfigured, count: data.count, debug: data.debug });
      return data.count || 0;
    }
  } catch (e) {
    // Im lặng - local đã lưu rồi
  }
  return 0;
};

// Load đăng ký - localStorage là nguồn chính
export const loadRegistrations = async (): Promise<Record<string, Show>> => {
  // 1. Lấy local trước
  let local: Record<string, Show> = {};
  try {
    const stored = localStorage.getItem('lan_registrations');
    if (stored) local = JSON.parse(stored);
  } catch (e) {}

  // 2. Thử lấy từ server - LUÔN lấy nếu server có data
  try {
    const res = await fetch('/api/registrations');
    if (res.ok) {
      const data = await res.json();
      console.log('[load] server response:', { kvConfigured: data.kvConfigured, count: Object.keys(data.registrations || {}).length, debug: data.debug });
      if (data.registrations && Object.keys(data.registrations).length > 0) {
        // Server có data - merge (server ưu tiên)
        // Merge roles cho cùng key thay vì ghi đè
        const merged: Record<string, Show> = { ...local };
        for (const [k, v] of Object.entries(data.registrations)) {
          const serverShow = v as Show;
          const localShow = merged[k];
          if (localShow) {
            // Merge roles: thêm roles từ server mà chưa có trong local
            const mergedRoles = [...localShow.roles];
            for (const r of serverShow.roles || []) {
              if (!mergedRoles.some(m => m.memberId === r.memberId && m.role === r.role)) {
                mergedRoles.push(r);
              }
            }
            merged[k] = { ...serverShow, roles: mergedRoles };
          } else {
            merged[k] = serverShow;
          }
        }
        localStorage.setItem('lan_registrations', JSON.stringify(merged));
        return merged;
      }
    }
  } catch (e) {
    console.warn('[load] server error:', e);
  }

  return local;
};
