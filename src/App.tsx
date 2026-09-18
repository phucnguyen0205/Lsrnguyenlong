import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import { Member, Show, ShowDay } from './types';
import { members as initialMembers } from './types';
import { fetchSheetData, loadRegistrations, saveRegistrations } from './sheetService';

// Remap registrations: dùng ID mới từ showDays làm chuẩn
// - Nếu key mới (dayId-show.id) đã tồn tại → giữ
// - Nếu không, tìm key cũ cùng dayId+showName → chuyển sang key mới (merge roles)
function remapRegistrations(regs: Record<string, Show>, showDays: ShowDay[]): Record<string, Show> {
  const result: Record<string, Show> = {};
  let remapped = 0;
  let unmatched = 0;

  // Build map: dayId|time|showName -> Show mới nhất
  const byKey = new Map<string, Show>();
  for (const day of showDays) {
    for (const show of day.shows) {
      const k = `${day.id}|${show.time}|${show.showName}`;
      byKey.set(k, show);
    }
  }

  // Bước 1: remap từng entry
  for (const [k, v] of Object.entries(regs)) {
    if (!v?.showName) {
      result[k] = v;
      continue;
    }
    const dayId = k.split('-').slice(0, 3).join('-');

    // Thử match với key dayId|time|showName trước
    const newShow = byKey.get(`${dayId}|${v.time}|${v.showName}`)
      ?? Array.from(byKey.entries()).find(([key]) =>
        key.startsWith(dayId + '|') && key.endsWith('|' + v.showName)
      )?.[1];

    if (newShow) {
      const newKey = `${dayId}-${newShow.id}`;
      if (newKey === k) {
        result[k] = v;
      } else {
        const existing = result[newKey];
        if (existing) {
          const mergedRoles = [...existing.roles];
          for (const r of v.roles) {
            if (!mergedRoles.some(m => m.memberId === r.memberId && m.role === r.role)) {
              mergedRoles.push(r);
            }
          }
          result[newKey] = { ...existing, roles: mergedRoles };
        } else {
          result[newKey] = { ...newShow, roles: v.roles };
        }
        remapped++;
      }
    } else {
      result[k] = v;
      unmatched++;
    }
  }

  if (remapped > 0) console.log('[remap] Remapped', remapped, 'entries');
  if (unmatched > 0) console.log('[remap] Unmatched (kept):', unmatched);
  return result;
}

export interface AppState {
  currentUser: Member | null;
  showDays: ShowDay[];
  registrations: Record<string, Show>;
  lastUpdated: string;
}

function App() {
  const [currentUser, setCurrentUser] = useState<Member | null>(null);
  const [showDays, setShowDays] = useState<ShowDay[]>([]);
  const [registrations, setRegistrations] = useState<Record<string, Show>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      
      // Check for stored session
      const stored = localStorage.getItem('lan_user');
      if (stored) {
        const user = initialMembers.find(m => m.id === JSON.parse(stored).id);
        if (user) {
          setCurrentUser(user);
        }
      }
      
      // Load registrations từ server (ưu tiên) hoặc localStorage
      const savedRegs = await loadRegistrations();
      setRegistrations(savedRegs);

      // Fetch sheet data
      try {
        const data = await fetchSheetData();
        if (data.length > 0) {
          setShowDays(data);
          // Remap registrations theo ID mới từ showDays (fix key cũ vs mới)
          setRegistrations(prev => remapRegistrations(prev, data));
        } else {
          setError('Không có dữ liệu show nào');
        }
      } catch (err) {
        console.error('Error fetching sheet:', err);
        setError('Không thể kết nối Google Sheets');
      }

      setIsLoading(false);
    };

    loadData();

    // Listen for background refresh
    const handleRefresh = (e: CustomEvent<ShowDay[]>) => {
      console.log('Received background refresh, updating data...');
      setShowDays(e.detail);
      setRegistrations(prev => remapRegistrations(prev, e.detail));
    };
    window.addEventListener('sheetDataRefreshed', handleRefresh as EventListener);
    return () => window.removeEventListener('sheetDataRefreshed', handleRefresh as EventListener);
  }, []);

  const handleLogin = (user: Member) => {
    setCurrentUser(user);
    localStorage.setItem('lan_user', JSON.stringify({ id: user.id }));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('lan_user');
  };

  const updateRegistration = async (dayId: string, show: Show) => {
    const key = `${dayId}-${show.id}`;
    console.log('[updateRegistration] key:', key, 'roles:', show.roles.length);
    const newRegs = { ...registrations, [key]: show };
    setRegistrations(newRegs);

    // Update showDays ngay (optimistic)
    setShowDays(prev => prev.map(day => {
      if (day.id === dayId) {
        return {
          ...day,
          shows: day.shows.map(s => s.id === show.id ? show : s)
        };
      }
      return day;
    }));

    // Lưu lên server + local
    const savedCount = await saveRegistrations(newRegs);
    console.log('[updateRegistration] saved. local keys:', Object.keys(newRegs).length, 'server count:', savedCount);
  };

  if (isLoading) {
    return (
      <div className="loading-screen">
        <div className="loading-lan float">
          <svg viewBox="0 0 100 100" width="120" height="120">
            <defs>
              <linearGradient id="lanGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style={{stopColor: '#FFD700'}}/>
                <stop offset="100%" style={{stopColor: '#FFA500'}}/>
              </linearGradient>
            </defs>
            <ellipse cx="50" cy="30" rx="20" ry="15" fill="url(#lanGrad)" stroke="#8B4513" strokeWidth="2"/>
            <circle cx="42" cy="28" r="4" fill="#FF0000"/>
            <circle cx="58" cy="28" r="4" fill="#FF0000"/>
            <path d="M45 35 Q50 42 55 35" stroke="#8B4513" strokeWidth="2" fill="none"/>
            <path d="M25 30 Q20 35 25 45" stroke="url(#lanGrad)" strokeWidth="3" fill="none"/>
            <path d="M75 30 Q80 35 75 45" stroke="url(#lanGrad)" strokeWidth="3" fill="none"/>
            <ellipse cx="50" cy="60" rx="15" ry="20" fill="url(#lanGrad)" stroke="#8B4513" strokeWidth="2"/>
            <path d="M35 55 Q40 60 35 65" stroke="#FF6347" strokeWidth="2" fill="none"/>
            <path d="M65 55 Q60 60 65 65" stroke="#FF6347" strokeWidth="2" fill="none"/>
            <path d="M40 70 Q50 75 60 70" stroke="#FF6347" strokeWidth="2" fill="none"/>
            <path d="M50 80 Q45 90 35 95 Q50 92 50 80" fill="url(#lanGrad)" stroke="#8B4513" strokeWidth="1"/>
          </svg>
        </div>
        <p>Đang tải lịch show...</p>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={
            currentUser ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <Login onLogin={handleLogin} />
            )
          }
        />
        <Route
          path="/dashboard"
          element={
            currentUser ? (
              <Dashboard
                currentUser={currentUser}
                showDays={showDays}
                registrations={registrations}
                onLogout={handleLogout}
                onUpdateRegistration={updateRegistration}
                error={error}
              />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route path="*" element={<Navigate to={currentUser ? "/dashboard" : "/login"} replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
