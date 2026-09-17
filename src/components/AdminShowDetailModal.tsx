import { Show, roleNames, roleColors, allRoles, getRequiredRoles } from '../types';

interface AdminShowDetailModalProps {
  show: Show;
  dayDate: string;
  onClose: () => void;
}

function AdminShowDetailModal({ show, dayDate, onClose }: AdminShowDetailModalProps) {
  const required = getRequiredRoles(show.lionCount);
  const totalRegs = show.roles.length;
  const totalRequired = Object.values(required).reduce((a, b) => a + b, 0);
  const completionPercent = totalRequired > 0 ? Math.round((totalRegs / totalRequired) * 100) : 0;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>
          <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>

        {/* Badge Admin */}
        <div className="admin-modal-badge">
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          </svg>
          Chế độ Admin - Xem chi tiết
        </div>

        {/* Show Info */}
        <div className="show-modal-header">
          <div className="show-modal-time">{show.time}</div>
          <h2 className="show-modal-title">{show.showName}</h2>
          <div className="admin-show-meta">
            <span className="meta-item">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                <line x1="16" y1="2" x2="16" y2="6"/>
                <line x1="8" y1="2" x2="8" y2="6"/>
                <line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
              {dayDate}
            </span>
            {show.lionCount > 0 && (
              <span className="meta-item lions-info">
                🦁 {show.lionCount} lân (cần {show.lionCount} đầu + {show.lionCount} đuôi)
              </span>
            )}
            <span className={`meta-item status-badge ${completionPercent === 100 ? 'complete' : 'incomplete'}`}>
              {totalRegs}/{totalRequired} người ({completionPercent}%)
            </span>
          </div>

          {show.phone && (
            <p className="show-modal-phone">📞 {show.phone}</p>
          )}
          {show.address && (
            <p className="show-modal-address">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
              {show.address}
            </p>
          )}
          {show.source && (
            <p className="show-modal-source">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
              Nguồn: {show.source}
            </p>
          )}
          {show.status && (
            <p className="show-modal-status">
              <span className="status-tag">{show.status}</span>
            </p>
          )}
          {show.notes && (
            <p className="show-modal-notes">📝 {show.notes}</p>
          )}
          {show.price && (
            <p className="show-modal-price">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="1" x2="12" y2="23"/>
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
              </svg>
              {show.price}
            </p>
          )}
        </div>

        {/* Role Summary Stats */}
        <div className="role-summary">
          <h4>Thống kê vai trò</h4>
          <div className="role-stats-grid">
            {allRoles.map(role => {
              const assigned = show.roles.filter(r => r.role === role).length;
              const req = required[role] || 0;
              const members = show.roles.filter(r => r.role === role).map(r => r.memberName);
              const isComplete = assigned >= req;
              const isEmpty = req === 0;

              if (isEmpty) return null;

              return (
                <div 
                  key={role} 
                  className={`role-stat-item ${isComplete ? 'complete' : 'incomplete'}`}
                  style={{ '--role-color': roleColors[role] } as React.CSSProperties}
                >
                  <div className="role-stat-header">
                    <span className="role-stat-name">{roleNames[role]}</span>
                    <span className="role-stat-count">{assigned}/{req}</span>
                  </div>
                  {members.length > 0 && (
                    <div className="role-stat-members">
                      {members.join(', ')}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* All Registrations List */}
        <div className="registrations-list">
          <h4>Danh sách đăng ký ({totalRegs})</h4>
          {totalRegs > 0 ? (
            <div className="reg-items">
              {[...show.roles].sort((a, b) => {
                const roleOrder = allRoles.indexOf(a.role) - allRoles.indexOf(b.role);
                if (roleOrder !== 0) return roleOrder;
                return a.memberName.localeCompare(b.memberName, 'vi');
              }).map((reg, i) => (
                <div key={i} className="reg-item" style={{ '--role-color': roleColors[reg.role] } as React.CSSProperties}>
                  <span className="reg-name">{reg.memberName}</span>
                  <span className="reg-role">{roleNames[reg.role]}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="no-registrations">Chưa có ai đăng ký</p>
          )}
        </div>

        <style>{`
          .modal-overlay {
            position: fixed;
            inset: 0;
            background: rgba(0,0,0,0.8);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
            padding: 20px;
            backdrop-filter: blur(4px);
          }

          .modal-content {
            background: var(--bg-card);
            border-radius: 20px;
            padding: 24px;
            max-width: 500px;
            width: 100%;
            max-height: 90vh;
            overflow-y: auto;
            position: relative;
            animation: slideUp 0.3s ease;
          }

          @keyframes slideUp {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }

          .modal-close {
            position: absolute;
            top: 16px;
            right: 16px;
            background: var(--bg-dark);
            border: none;
            border-radius: 50%;
            width: 36px;
            height: 36px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            color: var(--text-muted);
            transition: all 0.3s ease;
          }

          .modal-close:hover {
            background: var(--bg-darker);
            color: var(--text-light);
          }

          .admin-modal-badge {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            background: rgba(156, 39, 176, 0.2);
            color: #CE93D8;
            padding: 4px 10px;
            border-radius: 12px;
            font-size: 0.7rem;
            font-weight: 600;
            margin-bottom: 12px;
            border: 1px solid rgba(156, 39, 176, 0.4);
          }

          .show-modal-header {
            margin-bottom: 20px;
            padding-right: 40px;
          }

          .show-modal-time {
            display: inline-block;
            background: var(--primary);
            color: #1a1a2e;
            padding: 6px 16px;
            border-radius: 8px;
            font-weight: 700;
            margin-bottom: 12px;
          }

          .show-modal-title {
            font-size: 1.4rem;
            color: var(--text-light);
            margin: 0 0 12px 0;
          }

          .admin-show-meta {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            margin-bottom: 12px;
          }

          .meta-item {
            display: inline-flex;
            align-items: center;
            gap: 4px;
            background: var(--bg-dark);
            padding: 4px 10px;
            border-radius: 12px;
            font-size: 0.8rem;
            color: var(--text-muted);
          }

          .meta-item.lions-info {
            background: linear-gradient(135deg, rgba(255,215,0,0.2) 0%, rgba(255,165,0,0.2) 100%);
            color: var(--primary);
            font-weight: 600;
          }

          .meta-item.status-badge.complete {
            background: rgba(76, 175, 80, 0.2);
            color: var(--success);
            font-weight: 600;
          }

          .meta-item.status-badge.incomplete {
            background: rgba(244, 67, 54, 0.2);
            color: var(--error);
            font-weight: 600;
          }

          .show-modal-phone,
          .show-modal-address,
          .show-modal-source,
          .show-modal-status {
            font-size: 0.9rem;
            color: var(--text-muted);
            margin: 6px 0;
            display: flex;
            align-items: center;
            gap: 6px;
          }

          .status-tag {
            display: inline-block;
            padding: 2px 10px;
            background: var(--bg-dark);
            border: 1px solid var(--border);
            border-radius: 12px;
            font-size: 0.85rem;
          }

          .show-modal-notes {
            font-size: 0.85rem;
            color: var(--accent);
            font-style: italic;
            margin: 8px 0;
          }

          .show-modal-price {
            display: flex;
            align-items: center;
            gap: 6px;
            font-size: 0.9rem;
            color: var(--success);
            font-weight: 600;
            margin: 8px 0 0 0;
          }

          .role-summary {
            background: var(--bg-dark);
            border-radius: 12px;
            padding: 16px;
            margin-bottom: 20px;
          }

          .role-summary h4 {
            color: var(--text-light);
            font-size: 0.95rem;
            margin: 0 0 12px 0;
          }

          .role-stats-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 8px;
          }

          @media (max-width: 480px) {
            .role-stats-grid {
              grid-template-columns: 1fr;
            }
          }

          .role-stat-item {
            background: var(--bg-card);
            border-left: 3px solid var(--role-color);
            border-radius: 6px;
            padding: 8px 10px;
          }

          .role-stat-item.complete {
            opacity: 0.7;
          }

          .role-stat-item.incomplete {
            border-color: var(--error);
          }

          .role-stat-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
          }

          .role-stat-name {
            font-weight: 700;
            color: var(--role-color);
            font-size: 0.85rem;
          }

          .role-stat-count {
            font-size: 0.75rem;
            color: var(--text-muted);
            background: var(--bg-dark);
            padding: 2px 8px;
            border-radius: 10px;
          }

          .role-stat-members {
            font-size: 0.75rem;
            color: var(--text-muted);
            margin-top: 4px;
            line-height: 1.3;
          }

          .registrations-list {
            border-top: 1px solid var(--border);
            padding-top: 16px;
          }

          .registrations-list h4 {
            color: var(--text-light);
            font-size: 0.9rem;
            margin: 0 0 12px 0;
          }

          .reg-items {
            display: flex;
            flex-direction: column;
            gap: 8px;
          }

          .reg-item {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 12px 14px;
            background: var(--bg-dark);
            border-left: 4px solid var(--role-color);
            border-radius: 8px;
          }

          .reg-name {
            flex: 1;
            font-weight: 600;
            color: var(--text-light);
            font-size: 0.95rem;
          }

          .reg-role {
            font-size: 0.85rem;
            color: #1a1a2e;
            font-weight: 700;
            background: var(--role-color);
            padding: 4px 12px;
            border-radius: 14px;
          }

          .no-registrations {
            color: var(--text-muted);
            font-size: 0.9rem;
            text-align: center;
            padding: 20px;
          }
        `}</style>
      </div>
    </div>
  );
}

export default AdminShowDetailModal;
