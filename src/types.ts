// Thành viên
export interface Member {
  id: string;
  name: string;
  password: string;
  role?: 'admin' | 'member';
}

// Vai trò trong show
export type RoleType = 'trong' | 'xeng' | 'chieng' | 'dia' | 'dau_lan' | 'duoi_lan';

// Thông tin show từ Google Sheets
export interface Show {
  id: string;
  time: string;
  showName: string;
  lionCount: number; // Số lượng lân (mỗi lân cần 1 đầu + 1 đuôi)
  address: string;
  phone: string;
  source: string;
  status: string;
  notes: string;
  price: string;
  roles: RoleAssignment[];
}

// Đăng ký vai trò
export interface RoleAssignment {
  memberId: string;
  memberName: string;
  role: RoleType;
  registeredAt?: string;
}

// Ngày show
export interface ShowDay {
  id: string;
  date: string;
  dayName: string;
  dayOfWeek: string;
  shows: Show[];
}

// Dữ liệu từ Google Sheets
export interface SheetData {
  days: ShowDay[];
  lastUpdated: string;
}

// Icon SVG cho các loại vai trò
export const roleIcons: Record<RoleType, string> = {
  trong: `<svg viewBox="0 0 64 64" width="24" height="24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="32" cy="32" r="24" stroke="currentColor" stroke-width="3"/>
    <circle cx="32" cy="32" r="14" stroke="currentColor" stroke-width="2"/>
    <circle cx="32" cy="32" r="6" fill="currentColor"/>
  </svg>`,
  xeng: `<svg viewBox="0 0 64 64" width="24" height="24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <!-- Chiếc chảo tròn -->
    <ellipse cx="32" cy="36" rx="22" ry="8" stroke="currentColor" stroke-width="3" fill="currentColor" fill-opacity="0.2"/>
    <!-- Thành chảo -->
    <path d="M10 36 L10 28 Q10 20 32 20 Q54 20 54 28 L54 36" stroke="currentColor" stroke-width="3" fill="none"/>
    <!-- Mặt đồng -->
    <ellipse cx="32" cy="32" rx="18" ry="6" stroke="currentColor" stroke-width="2"/>
    <!-- Tâm đồng -->
    <circle cx="32" cy="32" r="4" fill="currentColor"/>
  </svg>`,
  chieng: `<svg viewBox="0 0 64 64" width="24" height="24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <!-- Thân chiêng hình tròn -->
    <circle cx="32" cy="32" r="24" stroke="currentColor" stroke-width="3" fill="currentColor" fill-opacity="0.15"/>
    <!-- Các vòng trang trí -->
    <circle cx="32" cy="32" r="18" stroke="currentColor" stroke-width="1.5"/>
    <circle cx="32" cy="32" r="12" stroke="currentColor" stroke-width="1.5"/>
    <!-- Tâm chiêng -->
    <circle cx="32" cy="32" r="5" stroke="currentColor" stroke-width="2"/>
    <circle cx="32" cy="32" r="2" fill="currentColor"/>
    <!-- Mép chiêng -->
    <path d="M8 32 Q8 38 32 38 Q56 38 56 32" stroke="currentColor" stroke-width="2" fill="none"/>
  </svg>`,
  dia: `<svg viewBox="0 0 64 64" width="24" height="24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <!-- Đĩa tròn -->
    <ellipse cx="32" cy="36" rx="26" ry="18" stroke="currentColor" stroke-width="3" fill="currentColor" fill-opacity="0.1"/>
    <!-- Mép đĩa -->
    <ellipse cx="32" cy="24" rx="26" ry="18" stroke="currentColor" stroke-width="2"/>
    <!-- Đế đĩa -->
    <ellipse cx="32" cy="48" rx="8" ry="4" stroke="currentColor" stroke-width="2"/>
    <!-- Mặt đĩa lõm -->
    <ellipse cx="32" cy="28" rx="20" ry="12" stroke="currentColor" stroke-width="1.5" stroke-dasharray="3 2"/>
  </svg>`,
  dau_lan: `<svg viewBox="0 0 64 64" width="24" height="24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <!-- Đầu sư tử -->
    <path d="M32 8 Q16 16 18 32 Q20 44 32 52 Q44 44 46 32 Q48 16 32 8" stroke="currentColor" stroke-width="3" fill="currentColor" fill-opacity="0.15"/>
    <!-- Mắt trái -->
    <circle cx="24" cy="28" r="5" fill="currentColor"/>
    <!-- Mắt phải -->
    <circle cx="40" cy="28" r="5" fill="currentColor"/>
    <!-- Miệng -->
    <path d="M24 40 Q32 48 40 40" stroke="currentColor" stroke-width="2" fill="none"/>
    <!-- Bờm -->
    <path d="M20 18 Q12 8 24 6" stroke="currentColor" stroke-width="2" fill="none"/>
    <path d="M44 18 Q52 8 40 6" stroke="currentColor" stroke-width="2" fill="none"/>
  </svg>`,
  duoi_lan: `<svg viewBox="0 0 64 64" width="24" height="24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <!-- Thân rắn/lân -->
    <path d="M32 8 Q16 16 16 32 Q16 48 32 56 Q48 48 48 32 Q48 16 32 8" stroke="currentColor" stroke-width="3" fill="currentColor" fill-opacity="0.1"/>
    <!-- Vảy lưng -->
    <path d="M20 24 Q32 20 44 24" stroke="currentColor" stroke-width="1.5" fill="none"/>
    <path d="M18 32 Q32 28 46 32" stroke="currentColor" stroke-width="1.5" fill="none"/>
    <path d="M20 40 Q32 36 44 40" stroke="currentColor" stroke-width="1.5" fill="none"/>
    <!-- Đuôi -->
    <path d="M32 56 Q24 60 16 56 Q12 52 20 48" stroke="currentColor" stroke-width="2" fill="none"/>
    <!-- Mắt -->
    <circle cx="26" cy="24" r="3" fill="currentColor"/>
    <circle cx="38" cy="24" r="3" fill="currentColor"/>
  </svg>`
};

// Tên hiển thị cho các vai trò
export const roleNames: Record<RoleType, string> = {
  trong: 'Trống',
  xeng: 'Xèng',
  chieng: 'Chiêng',
  dia: 'Địa',
  dau_lan: 'Đầu Lân',
  duoi_lan: 'Đuôi Lân'
};

// Màu sắc cho các vai trò
export const roleColors: Record<RoleType, string> = {
  trong: '#9E9E9E',
  xeng: '#FF9800',
  chieng: '#E91E63',
  dia: '#4CAF50',
  dau_lan: '#D4AF37',
  duoi_lan: '#2196F3'
};

// Danh sách thành viên từ ảnh chụp màn hình
export const members: Member[] = [
  { id: 'anhkhoa', name: 'Anh Khoa', password: '123' },
  { id: 'anhnguyet', name: 'Ánh Nguyệt', password: '123' },
  { id: 'baoloc', name: 'Bảo Lộc', password: '123' },
  { id: 'baongan', name: 'Bao Ngan', password: '123' },
  { id: 'baotran', name: 'Bảo Trân', password: '123' },
  { id: 'dinhthikimcuc', name: 'Đinh Thị Kim Cúc', password: '123' },
  { id: 'dttoyen', name: 'DT Tố Uyên', password: '123' },
  { id: 'duylong', name: 'Duy Long', password: '123' },
  { id: 'hoangphuc', name: 'Hoàng Phúc', password: '123' },
  { id: 'hoangtranbaohoang', name: 'Hoàng Trần Bảo Hoàng', password: '123' },
  { id: 'hychuu', name: 'Hy Chuu', password: '123' },
  { id: 'khuanguyen', name: 'Khui Nguyên', password: '123' },
  { id: 'lamphan', name: 'Lâm Phan', password: '123' },
  { id: 'lebaonam', name: 'Lê Bảo Nam', password: '123' },
  { id: 'ledaohongphuc', name: 'Lê Đào Hồng Phúc', password: '123' },
  { id: 'longdoan', name: 'Long Đoàn', password: '123' },
  { id: 'lykhanh', name: 'Ly Khanh', password: '123' },
  { id: 'minhsan', name: 'Minh Sann', password: '123' },
  { id: 'minhtuan', name: 'Minh Tuấn', password: '123' },
  { id: 'nganhaa', name: 'Ngan Haa', password: '123' },
  { id: 'ngochat', name: 'Ngọc Chất', password: '123' },
  { id: 'nguyencongduyhao', name: 'Nguyễn Công Duy Hào', password: '123' },
  { id: 'nguyenhoang', name: 'Nguyên Hoàng', password: '123' },
  { id: 'nguyennguyen', name: 'Nguyễn Nguyên', password: '123' },
  { id: 'nguyenquyenchien', name: 'Nguyen Quyen Chien', password: '123' },
  { id: 'nguyentanhai', name: 'Nguyễn Tấn Hải', password: '123' },
  { id: 'nguyenvanhai', name: 'Nguyễn Văn Hải', password: '123' },
  { id: 'phucnguyen', name: 'Phúc Nguyễn', password: '123' },
  { id: 'phungdinh', name: 'Phùng Định', password: '123' },
  { id: 'thedsan', name: 'Thế Dân', password: '123' },
  { id: 'thienphuc', name: 'Thiên Phuc', password: '123' },
  { id: 'tranminhhoang', name: 'Trần Minh Hoàng', password: '123' },
  { id: 'tranphuoc', name: 'Trần Phước', password: '123' },
  { id: 'tructran', name: 'Trúc Trần', password: '123' },
  { id: 'vanhainguyen', name: 'Văn Hải Nguyễn', password: '123' },
  { id: 'admin', name: 'Admin', password: 'admin123', role: 'admin' }
];

// Tất cả các vai trò có thể đăng ký
export const allRoles: RoleType[] = ['trong', 'xeng', 'chieng', 'dia', 'dau_lan', 'duoi_lan'];

// Tính số role cần thiết dựa trên số lân
export const getRequiredRoles = (lionCount: number): Record<RoleType, number> => {
  return {
    trong: 1,
    xeng: 1,
    chieng: 1,
    dia: 1,
    dau_lan: lionCount,  // Mỗi lân cần 1 đầu
    duoi_lan: lionCount  // Mỗi lân cần 1 đuôi
  };
};

// Tính tổng số role cần thiết
export const getTotalRequiredRoles = (lionCount: number): number => {
  return 4 + lionCount * 2; // trong, xeng, chieng, dia + dau_lan + duoi_lan
};

// Kiểm tra show có thiếu role không
export const isShowMissingRoles = (show: Show): boolean => {
  const required = getRequiredRoles(show.lionCount);
  const registered: Record<RoleType, number> = {
    trong: 0,
    xeng: 0,
    chieng: 0,
    dia: 0,
    dau_lan: 0,
    duoi_lan: 0
  };
  
  show.roles.forEach(r => {
    registered[r.role]++;
  });
  
  for (const role of allRoles) {
    if (registered[role] < required[role]) {
      return true;
    }
  }
  return false;
};

// Lấy danh sách role bị thiếu
export const getMissingRoles = (show: Show): { role: RoleType; required: number; current: number }[] => {
  const required = getRequiredRoles(show.lionCount);
  const registered: Record<RoleType, number> = {
    trong: 0,
    xeng: 0,
    chieng: 0,
    dia: 0,
    dau_lan: 0,
    duoi_lan: 0
  };
  
  show.roles.forEach(r => {
    registered[r.role]++;
  });
  
  const missing: { role: RoleType; required: number; current: number }[] = [];
  for (const role of allRoles) {
    if (registered[role] < required[role]) {
      missing.push({ role, required: required[role], current: registered[role] });
    }
  }
  return missing;
};

// Google Sheets configuration - Published URL
export const SHEET_CONFIG = {
  // Published CSV URLs for each day
  sheetUrls: [
    'https://docs.google.com/spreadsheets/d/e/2PACX-1vRw3yj5GkqAujHmvvJv0Yr7Sm-Pqi-z93zl-nSsVxhiuMgR6voyROLcSeCyO2NQ0O2plmuJ5U4LQa48/pub?gid=1321031702&single=true&output=csv', // 19.9 (9 Âm)
    'https://docs.google.com/spreadsheets/d/e/2PACX-1vRw3yj5GkqAujHmvvJv0Yr7Sm-Pqi-z93zl-nSsVxhiuMgR6voyROLcSeCyO2NQ0O2plmuJ5U4LQa48/pub?gid=255073364&single=true&output=csv',   // 20.9 (10 Âm)
    'https://docs.google.com/spreadsheets/d/e/2PACX-1vRw3yj5GkqAujHmvvJv0Yr7Sm-Pqi-z93zl-nSsVxhiuMgR6voyROLcSeCyO2NQ0O2plmuJ5U4LQa48/pub?gid=1149283581&single=true&output=csv', // 22.9 (12 Âm)
    'https://docs.google.com/spreadsheets/d/e/2PACX-1vRw3yj5GkqAujHmvvJv0Yr7Sm-Pqi-z93zl-nSsVxhiuMgR6voyROLcSeCyO2NQ0O2plmuJ5U4LQa48/pub?gid=1975001236&single=true&output=csv', // 23.9 (13 Âm)
    'https://docs.google.com/spreadsheets/d/e/2PACX-1vRw3yj5GkqAujHmvvJv0Yr7Sm-Pqi-z93zl-nSsVxhiuMgR6voyROLcSeCyO2NQ0O2plmuJ5U4LQa48/pub?gid=0&single=true&output=csv',                    // 24.9 (14 Âm)
    'https://docs.google.com/spreadsheets/d/e/2PACX-1vRw3yj5GkqAujHmvvJv0Yr7Sm-Pqi-z93zl-nSsVxhiuMgR6voyROLcSeCyO2NQ0O2plmuJ5U4LQa48/pub?gid=1739135532&single=true&output=csv', // 25.9 (15 Âm)
    'https://docs.google.com/spreadsheets/d/e/2PACX-1vRw3yj5GkqAujHmvvJv0Yr7Sm-Pqi-z93zl-nSsVxhiuMgR6voyROLcSeCyO2NQ0O2plmuJ5U4LQa48/pub?gid=137929300&single=true&output=csv', // Các show khác
  ]
};
