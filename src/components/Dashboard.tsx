import { useState } from 'react';
import { Member, ShowDay, Show, RoleType, RoleAssignment, roleNames, roleColors, allRoles, isShowMissingRoles, getMissingRoles, getRequiredRoles, getTotalRequiredRoles } from '../types';
import ShowDetailModal from './ShowDetailModal';
import ThemeToggle from './ThemeToggle';

// Interface cho thông tin trùng giờ
interface ConflictInfo {
  show: Show;
  dayId: string;
}

// Chuyển giờ "20h30" -> số phút để so sánh
const timeToMinutes = (time: string): number => {
  const match = time.match(/^(\d{1,2})h(\d{0,2})$/i);
  if (!match) return -1;
  const hours = parseInt(match[1]);
  const minutes = match[2] ? parseInt(match[2].padEnd(2, '0')) : 0;
  return hours * 60 + minutes;
};

// Kiểm tra xem có show nào cùng giờ trong cùng ngày không
const findConflictingShow = (
  currentDayId: string,
  currentShowId: string,
  currentTime: string,
  showDays: ShowDay[],
  registrations: Record<string, Show>,
  memberId: string
): ConflictInfo | null => {
  const currentMinutes = timeToMinutes(currentTime);
  if (currentMinutes < 0) return null;

  for (const day of showDays) {
    if (day.id !== currentDayId) continue; // Chỉ kiểm tra cùng ngày
    
    for (const show of day.shows) {
      if (show.id === currentShowId) continue; // Bỏ qua chính mình
      
      const showMinutes = timeToMinutes(show.time);
      if (showMinutes === currentMinutes) {
        // Cùng giờ - kiểm tra user đã đăng ký role nào trong show này chưa
        // Check 1: Trong showDays (khi chưa reload)
        const hasRegisteredInShowDays = show.roles.some(r => r.memberId === memberId);
        
        // Check 2: Trong registrations (khi đã reload - showDays chưa có)
        const regKey = `${day.id}-${show.id}`;
        const regData = registrations[regKey];
        const hasRegisteredInRegs = regData && regData.roles.some(r => r.memberId === memberId);
        
        if (hasRegisteredInShowDays || hasRegisteredInRegs) {
          return { show, dayId: day.id };
        }
      }
    }
  }
  return null;
};

interface DashboardProps {
  currentUser: Member;
  showDays: ShowDay[];
  registrations: Record<string, Show>;
  onLogout: () => void;
  onUpdateRegistration: (dayId: string, show: Show) => void;
  error?: string | null;
}

function Dashboard({ currentUser, showDays, registrations, onLogout, onUpdateRegistration, error }: DashboardProps) {
  const [selectedShow, setSelectedShow] = useState<{ dayId: string; show: Show } | null>(null);
  const [selectedDayIndex, setSelectedDayIndex] = useState<number>(0);
  const [adminDayIndex, setAdminDayIndex] = useState<number>(0);
  const [conflictWarning, setConflictWarning] = useState<ConflictInfo | null>(null);
  const [pendingRole, setPendingRole] = useState<RoleType | null>(null);

  const isAdmin = currentUser.role === 'admin';
  
  // Get the currently selected day for main view
  const selectedDay = showDays[selectedDayIndex] || null;
  
  // Get the currently selected day for admin panel
  const adminSelectedDay = showDays[adminDayIndex] || null;

  // Check if a day has any show missing roles (for admin tabs)
  const hasDayMissingRoles = (day: ShowDay): boolean => {
    if (!isAdmin) return false;
    return day.shows.some(show => isShowMissingRoles(show));
  };

  const handleShowClick = (dayId: string, show: Show) => {
    setSelectedShow({ dayId, show });
    setConflictWarning(null);
  };

  const handleRegister = (show: Show, role: RoleType): boolean => {
    if (!selectedShow) return false;
    
    // Kiểm tra trùng giờ với show khác đã đăng ký
    const conflicting = findConflictingShow(
      selectedShow.dayId,
      show.id,
      show.time,
      showDays,
      registrations,
      currentUser.id
    );
    
    if (conflicting) {
      setConflictWarning(conflicting);
      setPendingRole(role);
      return false; // Có conflict - không đóng modal
    }
    
    const newShow = {
      ...show,
      roles: [
        ...show.roles.filter(r => r.memberId !== currentUser.id),
        {
          memberId: currentUser.id,
          memberName: currentUser.name,
          role,
          registeredAt: new Date().toISOString()
        }
      ]
    };
    
    onUpdateRegistration(selectedShow.dayId, newShow);
    setSelectedShow(null);
    setConflictWarning(null);
    return true; // Thành công
  };

  const handleUnregister = (show: Show, role: RoleType) => {
    if (!selectedShow) return;
    const newShow = {
      ...show,
      roles: show.roles.filter(r => !(r.memberId === currentUser.id && r.role === role))
    };
    onUpdateRegistration(selectedShow.dayId, newShow);
  };
  
  const handleForceRegister = () => {
    if (!selectedShow || !conflictWarning || !pendingRole) return;
    
    // Tìm show trùng giờ - ưu tiên từ registrations (sau reload), fallback sang showDays
    const regKey = `${conflictWarning.dayId}-${conflictWarning.show.id}`;
    let conflictShowData = registrations[regKey] || conflictWarning.show;
    
    // Nếu registrations không có, lấy từ showDays
    if (!registrations[regKey]) {
      const conflictDay = showDays.find(d => d.id === conflictWarning.dayId);
      if (conflictDay) {
        const found = conflictDay.shows.find(s => s.id === conflictWarning.show.id);
        if (found) conflictShowData = found;
      }
    }
    
    // Hủy đăng ký show trùng giờ
    const newConflictShow = {
      ...conflictShowData,
      roles: conflictShowData.roles.filter(r => r.memberId !== currentUser.id)
    };
    onUpdateRegistration(conflictWarning.dayId, newConflictShow);
    
    // Đăng ký show mới
    const showToReg = selectedShow.show;
    const newShow = {
      ...showToReg,
      roles: [
        ...showToReg.roles.filter(r => r.memberId !== currentUser.id),
        {
          memberId: currentUser.id,
          memberName: currentUser.name,
          role: pendingRole,
          registeredAt: new Date().toISOString()
        }
      ]
    };
    
    onUpdateRegistration(selectedShow.dayId, newShow);
    setSelectedShow(null);
    setConflictWarning(null);
    setPendingRole(null);
  };

  return (
    <div className="dashboard">
      {/* Error Banner */}
      {error && (
        <div className="error-banner">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          {error}
        </div>
      )}

      {/* Header */}
      <header className="dashboard-header">
        <div className="header-left">
          <div className="logo-container">
            <svg viewBox="0 0 100 100" width="50" height="50">
              <defs>
                <linearGradient id="headerLanGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" style={{stopColor: '#FFD700'}}/>
                  <stop offset="100%" style={{stopColor: '#FFA500'}}/>
                </linearGradient>
              </defs>
              <ellipse cx="50" cy="30" rx="20" ry="15" fill="url(#headerLanGrad)" stroke="#8B4513" strokeWidth="2"/>
              <circle cx="42" cy="28" r="4" fill="#FF0000"/>
              <circle cx="58" cy="28" r="4" fill="#FF0000"/>
              <path d="M45 35 Q50 42 55 35" stroke="#8B4513" strokeWidth="2" fill="none"/>
              <ellipse cx="50" cy="60" rx="15" ry="20" fill="url(#headerLanGrad)" stroke="#8B4513" strokeWidth="2"/>
              <path d="M50 80 Q45 90 35 95 Q50 92 50 80" fill="url(#headerLanGrad)" stroke="#8B4513" strokeWidth="1"/>
            </svg>
          </div>
          <div className="header-title">
            <h1>Lịch Show Lân</h1>
            <p>Trung Thu 2026</p>
          </div>
        </div>
        <div className="header-right">
          <ThemeToggle />
          <div className="user-info">
            <span className="user-greeting">Xin chào,</span>
            <span className="user-name">{currentUser.name}</span>
          </div>
          <button className="logout-button" onClick={onLogout}>
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16,17 21,12 16,7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            Đăng xuất
          </button>
        </div>
      </header>

      {/* Day Tabs - Only visible to non-admin */}
      {!isAdmin && (
        <div className="day-tabs-container">
          <div className="day-tabs">
            {showDays.map((day, index) => {
              const date = new Date(day.date);
              const isToday = new Date().toDateString() === date.toDateString();
              const hasMissing = isAdmin && hasDayMissingRoles(day);
              
              return (
                <button
                  key={day.id}
                  className={`day-tab ${selectedDayIndex === index ? 'active' : ''} ${hasMissing ? 'missing-roles' : ''}`}
                  onClick={() => setSelectedDayIndex(index)}
                >
                  <span className="day-date">{day.dayName}</span>
                  <span className="day-weekday">{day.dayOfWeek}</span>
                  {isToday && <span className="day-badge">Hôm nay</span>}
                  {hasMissing && <span className="day-alert">⚠️</span>}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Show List - Single day (hidden for admin) */}
      {!isAdmin && (
        <div className="shows-container">
          {selectedDay ? (
          <div className="day-section">
            <div className="day-header">
              <h2 className="day-title">
                {selectedDay.dayName} - {selectedDay.dayOfWeek}
              </h2>
              <span className="day-date">{new Date(selectedDay.date).toLocaleDateString('vi-VN')}</span>
            </div>
            
            <div className="day-shows">
              {selectedDay.shows.map((show) => {
                const regKey = `${selectedDay.id}-${show.id}`;
                const regShow = registrations[regKey] || show;
                const userRole = regShow.roles.find(r => r.memberId === currentUser.id);
                
                return (
                  <div 
                    key={show.id} 
                    className={`show-card ${userRole ? 'registered' : ''}`}
                    onClick={() => handleShowClick(selectedDay.id, regShow)}
                  >
                    <div className="show-card-main">
                      <div className="show-time">
                        <span className="time-value">{show.time}</span>
                      </div>
                      
                      <div className="show-info">
                        <h3 className="show-name">{show.showName}</h3>
          {show.lionCount > 0 && (
            <span className="show-lion-badge">{show.lionCount} lân</span>
          )}
                        {show.phone && (
                          <span className="show-phone">📞 {show.phone}</span>
                        )}
                        {show.address && (
                          <p className="show-address">
                            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                              <circle cx="12" cy="10" r="3"/>
                            </svg>
                            {show.address}
                          </p>
                        )}
                        {show.notes && (
                          <p className="show-notes">{show.notes}</p>
                        )}
                      </div>
                      
                      <div className="show-status">
                        {userRole ? (
                          <span className="status-registered">
                            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                              <polyline points="20,6 9,17 4,12"/>
                            </svg>
                            <span className="status-role" style={{ color: roleColors[userRole.role] }}>
                              {roleNames[userRole.role]}
                            </span>
                          </span>
                        ) : (
                          <span className="status-available">Nhấn để đăng ký</span>
                        )}
                      </div>
                    </div>
                    
                    {/* Quick role summary */}
                    <div className="role-summary">
                      {allRoles.map(role => {
                        const required = getRequiredRoles(show.lionCount)[role];
                        const members = regShow.roles.filter(r => r.role === role);
                        const isFilled = members.length >= required;
                        const isMine = members.some(m => m.memberId === currentUser.id);
                        return (
                          <div 
                            key={role}
                            className={`role-dot ${isFilled ? 'taken' : ''} ${isMine ? 'mine' : ''}`}
                            style={{ backgroundColor: isFilled ? roleColors[role] : undefined }}
                            title={`${roleNames[role]}: ${members.length}/${required}`}
                          />
                        );
                      })}
                      <span className="role-count">{regShow.roles.length}/{getTotalRequiredRoles(show.lionCount)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="no-shows">
            <svg viewBox="0 0 100 100" width="80" height="80">
              <circle cx="50" cy="50" r="40" stroke="currentColor" strokeWidth="2" fill="none" strokeDasharray="5 5"/>
              <path d="M35 50 L45 60 L65 40" stroke="currentColor" strokeWidth="3" fill="none"/>
            </svg>
            <p>Không có show nào</p>
          </div>
        )}
        </div>
      )}

      {/* My Registrations for Selected Day (hidden for admin) */}
      {!isAdmin && selectedDay && (() => {
        const dayRegs: { reg: RoleAssignment; show: Show }[] = selectedDay.shows.flatMap(show => {
          const regKey = `${selectedDay.id}-${show.id}`;
          const regShow = registrations[regKey] || show;
          return regShow.roles
            .filter((r: RoleAssignment) => r.memberId === currentUser.id)
            .map((r: RoleAssignment) => ({ reg: r, show }));
        });
        return dayRegs.length > 0 && (
          <div className="my-registrations">
            <h3>Đăng ký của bạn - {selectedDay.dayName}</h3>
            <div className="reg-list">
              {dayRegs.map(({ reg, show }, i: number) => (
                <div key={i} className="reg-item" style={{ '--role-color': roleColors[reg.role] } as React.CSSProperties}>
                  <span className="reg-time">{show.time}</span>
                  <span className="reg-role">{roleNames[reg.role]}</span>
                </div>
              ))}
            </div>
          </div>
        );
      })()}

      {/* Admin Panel - Only visible to admin */}
      {isAdmin && (
        <div className="admin-panel">
          <div className="admin-header">
            <h3>
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
              Bảng điều khiển Admin
            </h3>
            <p className="admin-subtitle">Xem danh sách đăng ký của thành viên</p>
          </div>
          
          {/* Admin Day Tabs */}
          <div className="admin-tabs-container">
            <div className="admin-tabs">
              {showDays.map((day, index) => {
                const hasMissing = hasDayMissingRoles(day);
                return (
                  <button
                    key={day.id}
                    className={`admin-tab ${adminDayIndex === index ? 'active' : ''} ${hasMissing ? 'missing-roles' : ''}`}
                    onClick={() => setAdminDayIndex(index)}
                  >
                    <span className="admin-tab-day">{day.dayName}</span>
                    <span className="admin-tab-weekday">{day.dayOfWeek}</span>
                    {hasMissing && <span className="admin-tab-alert">⚠️</span>}
                  </button>
                );
              })}
            </div>
          </div>
          
          {/* Admin Content for Selected Day */}
          {adminSelectedDay && (
            <div className="admin-day-content">
              <h4>{adminSelectedDay.dayName} - {adminSelectedDay.dayOfWeek}</h4>
              {adminSelectedDay.shows.map(show => {
                const regKey = `${adminSelectedDay.id}-${show.id}`;
                const regShow = registrations[regKey] || show;
                const hasRegistrations = regShow.roles.length > 0;
                const missingRolesList = getMissingRoles(regShow);
                
                return (
                  <div key={show.id} className={`admin-show-item ${missingRolesList.length > 0 ? 'missing-roles' : ''}`}>
                    <div className="admin-show-info">
                      <span className="admin-show-time">{show.time}</span>
                      <span className="admin-show-name">{show.showName}</span>
                      {show.lionCount > 0 && (
                        <span className="admin-show-lions">{show.lionCount} lân</span>
                      )}
                      {missingRolesList.length > 0 && (
                        <span className="admin-show-missing">
                          Thiếu: {missingRolesList.map(m => `${roleNames[m.role]}(${m.current}/${m.required})`).join(', ')}
                        </span>
                      )}
                      {show.phone && (
                        <span className="admin-show-phone">📞 {show.phone}</span>
                      )}
                    </div>
                    <div className="admin-roles-list">
                      {hasRegistrations ? (
                        [...regShow.roles].sort((a, b) => {
                          const roleOrder = allRoles.indexOf(a.role) - allRoles.indexOf(b.role);
                          if (roleOrder !== 0) return roleOrder;
                          return a.memberName.localeCompare(b.memberName, 'vi');
                        }).map((reg, i) => (
                          <div key={i} className="admin-role-item" style={{ '--role-color': roleColors[reg.role] } as React.CSSProperties}>
                            <span className="admin-role-name">{reg.memberName}</span>
                            <span className="admin-role-type">{roleNames[reg.role]}</span>
                          </div>
                        ))
                      ) : (
                        <span className="no-registrations">Chưa có đăng ký</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Show Detail Modal */}
      {selectedShow && (
        <ShowDetailModal
          show={selectedShow.show}
          currentUser={currentUser}
          onRegister={handleRegister}
          onUnregister={handleUnregister}
          onClose={() => { setSelectedShow(null); setConflictWarning(null); setPendingRole(null); }}
        />
      )}

      {/* Conflict Warning Modal */}
      {conflictWarning && (
        <div className="conflict-overlay" onClick={() => setConflictWarning(null)}>
          <div className="conflict-modal" onClick={e => e.stopPropagation()}>
            <div className="conflict-icon">⚠️</div>
            <h3>Trùng giờ diễn!</h3>
            <p>Bạn đã đăng ký <strong>{conflictWarning.show.showName}</strong> lúc <strong>{conflictWarning.show.time}</strong>.</p>
            <p>Bạn chỉ có thể đăng ký 1 show mỗi khung giờ.</p>
            <div className="conflict-actions">
              <button className="conflict-cancel" onClick={() => setConflictWarning(null)}>
                Hủy bỏ
              </button>
              <button className="conflict-confirm" onClick={handleForceRegister}>
                Đổi sang show mới
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .dashboard {
          min-height: 100vh;
          padding-bottom: 120px;
        }

        .error-banner {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 24px;
          background: rgba(244, 67, 54, 0.1);
          border-bottom: 1px solid rgba(244, 67, 54, 0.3);
          color: var(--error);
          font-size: 0.9rem;
        }

        .dashboard-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 24px;
          background: var(--bg-card);
          border-bottom: 1px solid var(--border);
          position: sticky;
          top: 0;
          z-index: 100;
          backdrop-filter: blur(10px);
        }

        .header-left {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .logo-container {
          animation: float 3s ease-in-out infinite;
        }

        .header-title h1 {
          font-size: 1.4rem;
          color: var(--primary);
          margin: 0;
        }

        .header-title p {
          font-size: 0.85rem;
          color: var(--text-muted);
          margin: 0;
        }

        .header-right {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .user-info {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 2px;
        }

        .user-greeting {
          font-size: 0.75rem;
          color: var(--text-muted);
        }

        .user-name {
          font-weight: 700;
          color: var(--primary);
        }

        .admin-badge {
          background: var(--primary);
          color: #1a1a2e;
          font-size: 0.65rem;
          padding: 2px 6px;
          border-radius: 4px;
          font-weight: 600;
        }

        .logout-button {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 10px 16px;
          background: transparent;
          border: 1px solid var(--border);
          border-radius: 8px;
          color: var(--text-muted);
          font-size: 0.85rem;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .logout-button:hover {
          background: rgba(244, 67, 54, 0.1);
          border-color: var(--error);
          color: var(--error);
        }

        .day-tabs-container {
          background: linear-gradient(135deg, rgba(139, 69, 19, 0.15) 0%, rgba(0, 0, 0, 0.3) 100%);
          padding: 16px 24px 0;
          border-bottom: 2px solid var(--border);
          overflow-x: auto;
        }

        .day-tabs {
          display: flex;
          gap: 8px;
          min-width: min-content;
        }

        .day-tab {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 12px 24px;
          background: var(--bg-card);
          border: 2px solid var(--border);
          border-bottom: none;
          border-radius: 12px 12px 0 0;
          color: var(--text-muted);
          cursor: pointer;
          transition: all 0.3s ease;
          position: relative;
          min-width: 90px;
        }

        .day-tab:hover {
          background: var(--bg-darker);
          color: var(--text-light);
          transform: translateY(-2px);
        }

        .day-tab.active {
          background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%);
          border-color: #FFD700;
          color: #1a1a2e;
          font-weight: 700;
        }

        .day-tab.missing-roles {
          border-color: var(--error);
          animation: pulse-red 2s ease-in-out infinite;
        }

        .day-alert {
          position: absolute;
          top: -6px;
          right: -6px;
          background: var(--error);
          color: white;
          font-size: 0.7rem;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        @keyframes pulse-red {
          0%, 100% { box-shadow: 0 0 0 0 rgba(244, 67, 54, 0.4); }
          50% { box-shadow: 0 0 10px 3px rgba(244, 67, 54, 0.5); }
        }

        .day-date {
          font-size: 1.2rem;
          font-weight: 800;
          color: var(--primary);
        }
        
        .day-tab.active .day-date {
          color: #1a1a2e;
          text-shadow: 0 1px 2px rgba(0,0,0,0.2);
        }

        .day-weekday {
          font-size: 0.75rem;
        }

        .day-badge {
          position: absolute;
          top: -8px;
          right: -8px;
          background: var(--accent);
          color: white;
          font-size: 0.65rem;
          padding: 2px 6px;
          border-radius: 10px;
          font-weight: 600;
        }

        .shows-container {
          padding: 24px;
        }

        .all-shows {
          display: flex;
          flex-direction: column;
          gap: 32px;
        }

        .day-section {
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: 16px;
          overflow: hidden;
        }

        .day-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 20px;
          background: var(--bg-dark);
          border-bottom: 1px solid var(--border);
        }

        .day-title {
          font-size: 1.1rem;
          color: var(--text-light);
          margin: 0;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .today-badge {
          background: var(--accent);
          color: white;
          font-size: 0.7rem;
          padding: 3px 8px;
          border-radius: 10px;
          font-weight: 600;
        }

        .day-date {
          font-size: 0.85rem;
          color: var(--text-muted);
        }

        .day-shows {
          display: flex;
          flex-direction: column;
          gap: 12px;
          padding: 16px;
        }

        .shows-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .show-card {
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 16px;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .show-card:hover {
          border-color: var(--primary);
          transform: translateY(-2px);
          box-shadow: 0 4px 16px rgba(0,0,0,0.2);
        }

        .show-card.registered {
          border-color: var(--success);
          background: rgba(76, 175, 80, 0.05);
        }

        .show-card-main {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .show-time {
          background: var(--primary);
          color: #1a1a2e;
          padding: 8px 16px;
          border-radius: 8px;
          font-weight: 700;
          font-size: 1rem;
          min-width: 70px;
          text-align: center;
        }

        .show-info {
          flex: 1;
        }

        .show-name {
          font-size: 1rem;
          color: var(--text-light);
          margin: 0 0 4px 0;
        }

        .show-lion-badge {
          display: inline-block;
          background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%);
          color: #1a1a2e;
          padding: 4px 10px;
          border-radius: 10px;
          font-size: 0.85rem;
          font-weight: 700;
          margin-right: 6px;
        }

        .show-phone {
          font-size: 0.75rem;
          color: var(--text-muted);
        }

        .show-address {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.8rem;
          color: var(--text-muted);
          margin: 0;
        }

        .show-notes {
          font-size: 0.75rem;
          color: var(--accent);
          font-style: italic;
          margin: 4px 0 0 0;
        }

        .show-status {
          text-align: right;
        }

        .status-registered {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2px;
          color: var(--success);
          font-size: 0.75rem;
        }

        .status-role {
          font-weight: 700;
          font-size: 0.9rem;
        }

        .status-available {
          color: var(--text-muted);
          font-size: 0.8rem;
        }

        .role-summary {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-top: 12px;
          padding-top: 12px;
          border-top: 1px solid var(--border);
        }

        .role-dot {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: var(--bg-dark);
          border: 1px solid var(--border);
          transition: all 0.3s ease;
        }

        .role-dot.taken {
          border-color: transparent;
        }

        .role-dot.mine {
          box-shadow: 0 0 0 2px var(--bg-card), 0 0 0 4px currentColor;
        }

        .role-count {
          margin-left: auto;
          font-size: 0.75rem;
          color: var(--text-muted);
        }

        .no-shows {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 60px 24px;
          color: var(--text-muted);
          text-align: center;
        }

        .no-shows svg {
          opacity: 0.3;
          margin-bottom: 16px;
        }

        .my-registrations {
          position: fixed;
          bottom: 20px;
          left: 24px;
          background: var(--bg-card);
          border: 1px solid var(--primary);
          border-radius: 12px;
          padding: 12px 16px;
          max-width: 250px;
          box-shadow: 0 4px 16px rgba(0,0,0,0.3);
        }

        .my-registrations h3 {
          font-size: 0.8rem;
          color: var(--primary);
          margin: 0 0 8px 0;
        }

        .reg-list {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .reg-item {
          display: flex;
          align-items: center;
          gap: 8px;
          background: var(--role-color);
          color: #1a1a2e;
          padding: 6px 12px;
          border-radius: 16px;
          font-size: 0.8rem;
          font-weight: 600;
        }

        .reg-time {
          font-weight: 700;
          opacity: 0.7;
          font-size: 0.75rem;
        }

        .reg-role {
          font-size: 0.85rem;
        }

        .reg-icon {
          width: 14px;
          height: 14px;
        }

        .reg-icon svg {
          width: 100%;
          height: 100%;
        }

        .admin-panel {
          margin: 24px;
          background: var(--bg-card);
          border: 1px solid var(--primary);
          border-radius: 16px;
          padding: 20px;
        }

        .admin-header {
          margin-bottom: 16px;
        }

        .admin-header h3 {
          display: flex;
          align-items: center;
          gap: 8px;
          color: var(--primary);
          margin: 0 0 4px 0;
          font-size: 1.1rem;
        }

        .admin-subtitle {
          font-size: 0.8rem;
          color: var(--text-muted);
          margin: 0;
        }

        .admin-tabs-container {
          background: rgba(255, 215, 0, 0.05);
          padding: 12px 16px 0;
          border-radius: 8px 8px 0 0;
          border-bottom: 2px solid var(--border);
          margin-bottom: 16px;
        }

        .admin-tabs {
          display: flex;
          gap: 6px;
          overflow-x: auto;
        }

        .admin-tab {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 10px 20px;
          background: var(--bg-dark);
          border: 1px solid var(--border);
          border-bottom: none;
          border-radius: 8px 8px 0 0;
          color: var(--text-muted);
          cursor: pointer;
          transition: all 0.3s ease;
          min-width: 80px;
        }

        .admin-tab:hover {
          background: var(--bg-darker);
          color: var(--text-light);
        }

        .admin-tab.active {
          background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%);
          border-color: #FFD700;
          color: #1a1a2e;
          font-weight: 700;
        }

        .admin-tab.missing-roles {
          border-color: var(--error);
          animation: pulse-red 2s ease-in-out infinite;
        }

        .admin-tab-alert {
          position: absolute;
          top: -5px;
          right: -5px;
          background: var(--error);
          color: white;
          font-size: 0.6rem;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .admin-tab {
          position: relative;
        }

        .admin-tab-day {
          font-size: 1rem;
          font-weight: 700;
          color: var(--primary);
        }

        .admin-tab.active .admin-tab-day {
          color: #1a1a2e;
        }

        .admin-tab-weekday {
          font-size: 0.7rem;
        }

        .admin-day-content {
          background: var(--bg-dark);
          border-radius: 8px;
          padding: 16px;
        }

        .admin-day-content h4 {
          color: var(--primary);
          margin: 0 0 16px 0;
          padding-bottom: 10px;
          border-bottom: 1px solid var(--border);
          font-size: 1rem;
        }

        .admin-show-item {
          background: var(--bg-card);
          border-radius: 8px;
          padding: 12px;
          margin-bottom: 8px;
          border: 1px solid var(--border);
        }

        .admin-show-item.missing-roles {
          border-color: var(--error);
          background: rgba(244, 67, 54, 0.05);
        }

        .admin-show-info {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          margin-bottom: 8px;
        }

        .admin-show-time {
          font-weight: 700;
          color: var(--primary);
          min-width: 50px;
        }

        .admin-show-name {
          color: var(--text-light);
        }

        .admin-show-lions {
          background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%);
          color: #1a1a2e;
          padding: 4px 10px;
          border-radius: 12px;
          font-size: 0.85rem;
          font-weight: 700;
        }

        .admin-show-phone {
          width: 100%;
          color: var(--text-muted);
          font-size: 0.8rem;
        }

        .admin-show-missing {
          width: 100%;
          color: var(--error);
          font-size: 0.85rem;
          font-weight: 600;
          margin-top: 4px;
        }

        .admin-roles-list {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          padding-left: 8px;
        }

        .admin-role-item {
          display: flex;
          align-items: center;
          gap: 6px;
          background: var(--bg-card);
          border-left: 3px solid var(--role-color);
          padding: 4px 10px;
          border-radius: 4px;
          font-size: 0.8rem;
        }

        .admin-role-name {
          color: var(--text-light);
          font-weight: 600;
        }

        .admin-role-type {
          color: var(--role-color);
        }

        .no-registrations {
          color: var(--text-muted);
          font-size: 0.8rem;
          font-style: italic;
        }

        /* Conflict Warning Modal */
        .conflict-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.7);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
          backdrop-filter: blur(4px);
        }

        .conflict-modal {
          background: var(--bg-card);
          border-radius: 16px;
          padding: 32px;
          max-width: 400px;
          width: 90%;
          text-align: center;
          border: 2px solid var(--error);
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
          animation: conflictPop 0.3s ease;
        }

        @keyframes conflictPop {
          from {
            transform: scale(0.8);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }

        .conflict-icon {
          font-size: 48px;
          margin-bottom: 16px;
        }

        .conflict-modal h3 {
          color: var(--error);
          margin: 0 0 16px 0;
          font-size: 1.3rem;
        }

        .conflict-modal p {
          color: var(--text);
          margin: 8px 0;
          line-height: 1.5;
        }

        .conflict-actions {
          display: flex;
          gap: 12px;
          margin-top: 24px;
          justify-content: center;
        }

        .conflict-cancel {
          padding: 12px 24px;
          border: 1px solid var(--border);
          border-radius: 8px;
          background: transparent;
          color: var(--text);
          cursor: pointer;
          font-size: 0.95rem;
          transition: all 0.2s;
        }

        .conflict-cancel:hover {
          background: var(--bg-dark);
        }

        .conflict-confirm {
          padding: 12px 24px;
          border: none;
          border-radius: 8px;
          background: var(--error);
          color: white;
          cursor: pointer;
          font-size: 0.95rem;
          font-weight: 600;
          transition: all 0.2s;
        }

        .conflict-confirm:hover {
          opacity: 0.9;
          transform: scale(1.02);
        }

        @media (max-width: 768px) {
          .dashboard-header {
            flex-direction: column;
            gap: 12px;
          }

          .header-right {
            width: 100%;
            justify-content: space-between;
          }

          .show-card-main {
            flex-direction: column;
            align-items: flex-start;
          }

          .show-status {
            text-align: left;
          }

          .my-registrations {
            left: 12px;
            right: 12px;
            max-width: none;
          }
        }
      `}</style>
    </div>
  );
}

export default Dashboard;
