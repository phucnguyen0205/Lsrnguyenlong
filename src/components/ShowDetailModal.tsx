import { useState } from 'react';
import { Member, Show, RoleType, roleNames, roleColors, allRoles, getRequiredRoles } from '../types';

interface ShowDetailModalProps {
  show: Show;
  currentUser: Member;
  onRegister: (show: Show, role: RoleType) => boolean;
  onUnregister: (show: Show, role: RoleType) => void;
  onClose: () => void;
}

function ShowDetailModal({ show, currentUser, onRegister, onUnregister, onClose }: ShowDetailModalProps) {
  const [selectedRole, setSelectedRole] = useState<RoleType | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  
  const userRegistration = show.roles.find(r => r.memberId === currentUser.id);
  
  const handleRoleSelect = (role: RoleType) => {
    setSelectedRole(role);
    setShowConfirm(true);
  };
  
  const handleConfirm = () => {
    if (selectedRole) {
      // Gọi onRegister - trả về true nếu thành công, false nếu có conflict
      const success = onRegister(show, selectedRole);
      if (success) {
        onClose();
      }
      // Nếu có conflict, conflict modal sẽ hiện ra
    }
  };
  
  const handleUnregister = () => {
    if (userRegistration) {
      onUnregister(show, userRegistration.role);
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>
          <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
        
        {/* Show Info */}
        <div className="show-modal-header">
          <div className="show-modal-time">{show.time}</div>
          <h2 className="show-modal-title">{show.showName}</h2>
          {show.lionCount > 0 && (
            <p className="show-modal-lions">{show.lionCount} lân (cần {show.lionCount} đầu + {show.lionCount} đuôi)</p>
          )}
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
          {show.notes && (
            <p className="show-modal-notes">{show.notes}</p>
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
        
        {/* User's Current Registration */}
        {userRegistration && (
          <div className="current-registration">
            <h4>Bạn đã đăng ký</h4>
            <div className="current-roles-list">
              {show.roles.filter(r => r.memberId === currentUser.id).map((reg, i) => (
                <div key={i} className="current-role-item">
                  <span className="current-role-badge" style={{ '--role-color': roleColors[reg.role] } as React.CSSProperties}>
                    {roleNames[reg.role]}
                  </span>
                </div>
              ))}
            </div>
            <button className="unregister-btn" onClick={handleUnregister}>
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="3,6 5,6 21,6"/>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
              </svg>
              Hủy đăng ký
            </button>
          </div>
        )}
        
        {/* Role Selection */}
        {!userRegistration && (
          <div className="role-selection">
            <h4>Chọn vai trò của bạn</h4>
            <div className="role-grid">
              {allRoles.map(role => {
                const myRoles = show.roles.filter(r => r.role === role && r.memberId === currentUser.id);
                const otherMembers = show.roles.filter(r => r.role === role && r.memberId !== currentUser.id);
                const required = getRequiredRoles(show.lionCount)[role];
                const totalAssigned = show.roles.filter(r => r.role === role).length;
                const isFilled = totalAssigned >= required;
                const isMine = myRoles.length > 0;
                const isSelected = selectedRole === role;
                
                return (
                  <button
                    key={role}
                    className={`role-btn ${isMine ? 'mine' : ''} ${isSelected ? 'selected' : ''} ${isFilled ? 'filled' : ''}`}
                    onClick={() => handleRoleSelect(role)}
                    style={{ '--role-color': roleColors[role] } as React.CSSProperties}
                  >
                    <span className="role-label">{roleNames[role]}</span>
                    <span className="role-count-label">{totalAssigned}/{required}</span>
                    {otherMembers.length > 0 && (
                      <span className="taken-by">{otherMembers.map(r => r.memberName).join(', ')}</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}
        
        {/* All Registrations List */}
        <div className="registrations-list">
          <h4>Danh sách đăng ký ({show.roles.length})</h4>
          {show.roles.length > 0 ? (
            <div className="reg-items">
              {show.roles.map((reg, i) => (
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
        
        {/* Confirmation Dialog */}
        {showConfirm && selectedRole && (
          <div className="confirm-overlay">
            <div className="confirm-dialog">
              <h4>Xác nhận đăng ký</h4>
              <p>Bạn muốn đăng ký vai trò <strong style={{ color: roleColors[selectedRole] }}>{roleNames[selectedRole]}</strong> cho show này?</p>
              <div className="confirm-actions">
                <button className="confirm-cancel" onClick={() => setShowConfirm(false)}>Hủy</button>
                <button className="confirm-ok" onClick={handleConfirm}>Xác nhận</button>
              </div>
            </div>
          </div>
        )}
        
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
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
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
            margin: 0 0 8px 0;
          }

          .show-modal-lions {
            background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%);
            color: #1a1a2e;
            padding: 8px 16px;
            border-radius: 16px;
            font-size: 1rem;
            font-weight: 700;
            display: inline-block;
            margin-bottom: 8px;
          }

          .show-modal-phone {
            font-size: 0.9rem;
            color: var(--text-muted);
            margin: 0 0 8px 0;
          }

          .show-modal-address {
            display: flex;
            align-items: center;
            gap: 6px;
            font-size: 0.9rem;
            color: var(--text-muted);
            margin: 0 0 8px 0;
          }
          
          .show-modal-notes {
            font-size: 0.85rem;
            color: var(--accent);
            font-style: italic;
            margin: 0 0 8px 0;
          }
          
          .show-modal-price {
            display: flex;
            align-items: center;
            gap: 6px;
            font-size: 0.9rem;
            color: var(--success);
            font-weight: 600;
            margin: 0;
          }
          
          .current-registration {
            background: var(--bg-dark);
            border-radius: 12px;
            padding: 16px;
            margin-bottom: 20px;
            text-align: center;
          }
          
          .current-registration h4 {
            color: var(--text-muted);
            font-size: 0.85rem;
            margin: 0 0 12px 0;
          }
          
          .current-roles-list {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            justify-content: center;
            margin-bottom: 12px;
          }
          
          .current-role-item {
            display: inline-block;
          }
          
          .current-role-badge {
            display: inline-block;
            background: var(--role-color);
            color: #1a1a2e;
            padding: 8px 16px;
            border-radius: 20px;
            font-weight: 700;
            font-size: 1rem;
          }
          
          .unregister-btn {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 8px 16px;
            background: transparent;
            border: 1px solid var(--error);
            border-radius: 8px;
            color: var(--error);
            font-size: 0.85rem;
            cursor: pointer;
            transition: all 0.3s ease;
          }
          
          .unregister-btn:hover {
            background: rgba(244, 67, 54, 0.1);
          }
          
          .role-selection {
            margin-bottom: 20px;
          }
          
          .role-selection h4 {
            color: var(--text-light);
            font-size: 1rem;
            margin: 0 0 12px 0;
          }
          
          .role-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 10px;
          }
          
          @media (max-width: 480px) {
            .role-grid {
              grid-template-columns: repeat(2, 1fr);
            }
          }
          
          .role-btn {
            display: flex;
            flex-direction: column;
            align-items: center;
            padding: 16px 12px;
            background: var(--bg-dark);
            border: 2px solid var(--border);
            border-radius: 12px;
            cursor: pointer;
            transition: all 0.3s ease;
          }
          
          .role-btn:not(.taken):hover {
            border-color: var(--role-color);
            transform: translateY(-2px);
          }
          
          .role-btn.selected {
            border-color: var(--role-color);
            background: rgba(255,255,255,0.1);
          }
          
          .role-btn.taken {
            opacity: 0.6;
          }
          
          .role-btn.mine {
            border-color: var(--success);
            background: rgba(76, 175, 80, 0.1);
          }
          
          .role-label {
            font-size: 1rem;
            font-weight: 700;
            color: var(--role-color);
            text-align: center;
          }

          .role-count-label {
            font-size: 0.7rem;
            color: var(--text-muted);
            margin-top: 2px;
          }

          .role-btn.filled {
            opacity: 0.6;
          }

          .taken-by {
            font-size: 0.7rem;
            color: var(--text-muted);
            margin-top: 6px;
            text-align: center;
          }
          
          .mine-badge {
            font-size: 0.7rem;
            color: var(--success);
            font-weight: 600;
            margin-top: 4px;
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
          
          .confirm-overlay {
            position: absolute;
            inset: 0;
            background: rgba(0,0,0,0.9);
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 20px;
          }
          
          .confirm-dialog {
            background: var(--bg-card);
            padding: 24px;
            border-radius: 16px;
            text-align: center;
            max-width: 300px;
          }
          
          .confirm-dialog h4 {
            color: var(--text-light);
            margin: 0 0 12px 0;
          }
          
          .confirm-dialog p {
            color: var(--text-muted);
            margin: 0 0 20px 0;
          }
          
          .confirm-actions {
            display: flex;
            gap: 12px;
            justify-content: center;
          }
          
          .confirm-cancel {
            padding: 10px 20px;
            background: transparent;
            border: 1px solid var(--border);
            border-radius: 8px;
            color: var(--text-muted);
            cursor: pointer;
          }
          
          .confirm-ok {
            padding: 10px 20px;
            background: var(--primary);
            border: none;
            border-radius: 8px;
            color: #1a1a2e;
            font-weight: 600;
            cursor: pointer;
          }
          
          .confirm-cancel:hover {
            border-color: var(--text-muted);
          }
          
          .confirm-ok:hover {
            opacity: 0.9;
          }
        `}</style>
      </div>
    </div>
  );
}

export default ShowDetailModal;
