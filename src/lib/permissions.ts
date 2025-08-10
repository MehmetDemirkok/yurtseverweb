// Rol yetkileri tanımları
export interface RolePermissions {
  canView: boolean;
  canAdd: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canManageUsers: boolean;
  canViewLogs: boolean;
}

// Her rol için yetkileri tanımla
export const ROLE_PERMISSIONS: Record<string, RolePermissions> = {
  ADMIN: {
    canView: true,
    canAdd: true,
    canEdit: true,
    canDelete: true,
    canManageUsers: true,
    canViewLogs: true,
  },
  MUDUR: {
    canView: true,
    canAdd: true,
    canEdit: true,
    canDelete: true,
    canManageUsers: false,
    canViewLogs: false,
  },
  OPERATOR: {
    canView: true,
    canAdd: true,
    canEdit: false,
    canDelete: false,
    canManageUsers: false,
    canViewLogs: false,
  },
  KULLANICI: {
    canView: true,
    canAdd: false,
    canEdit: false,
    canDelete: false,
    canManageUsers: false,
    canViewLogs: false,
  },
};

// Kullanıcının belirli bir yetkiye sahip olup olmadığını kontrol eden fonksiyon
export function hasPermission(userRole: string, permission: keyof RolePermissions): boolean {
  const rolePermissions = ROLE_PERMISSIONS[userRole];
  if (!rolePermissions) {
    return false;
  }
  return rolePermissions[permission];
}

// Kullanıcının belirli bir sayfaya erişim izni olup olmadığını kontrol eden fonksiyon
export function hasPageAccess(userRole: string, userPermissions: string[], pagePermission: string): boolean {
  // Admin tüm sayfalara erişebilir
  if (userRole === 'ADMIN') {
    return true;
  }
  
  // Diğer roller için izin kontrolü
  return userPermissions.includes(pagePermission);
}
