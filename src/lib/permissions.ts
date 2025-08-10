// Rol yetkileri tanımları
export interface RolePermissions {
  // Genel yetkiler
  canManageUsers: boolean;
  canViewLogs: boolean;
  
  // Modül bazlı izinler - her modül için ayrı ayrı tanımlanacak
  modules: {
    accommodation: {
      canView: boolean;
      canAdd: boolean;
      canEdit: boolean;
      canDelete: boolean;
    };
    hotels: {
      canView: boolean;
      canAdd: boolean;
      canEdit: boolean;
      canDelete: boolean;
    };
    transfer: {
      canView: boolean;
      canAdd: boolean;
      canEdit: boolean;
      canDelete: boolean;
    };
    vehicles: {
      canView: boolean;
      canAdd: boolean;
      canEdit: boolean;
      canDelete: boolean;
    };
    drivers: {
      canView: boolean;
      canAdd: boolean;
      canEdit: boolean;
      canDelete: boolean;
    };
    customers: {
      canView: boolean;
      canAdd: boolean;
      canEdit: boolean;
      canDelete: boolean;
    };
    suppliers: {
      canView: boolean;
      canAdd: boolean;
      canEdit: boolean;
      canDelete: boolean;
    };
  };
}

// Varsayılan modül izinleri
const defaultModulePermissions = {
  canView: false,
  canAdd: false,
  canEdit: false,
  canDelete: false,
};

// Her rol için yetkileri tanımla
export const ROLE_PERMISSIONS: Record<string, RolePermissions> = {
  ADMIN: {
    canManageUsers: true,
    canViewLogs: true,
    modules: {
      accommodation: { canView: true, canAdd: true, canEdit: true, canDelete: true },
      hotels: { canView: true, canAdd: true, canEdit: true, canDelete: true },
      transfer: { canView: true, canAdd: true, canEdit: true, canDelete: true },
      vehicles: { canView: true, canAdd: true, canEdit: true, canDelete: true },
      drivers: { canView: true, canAdd: true, canEdit: true, canDelete: true },
      customers: { canView: true, canAdd: true, canEdit: true, canDelete: true },
      suppliers: { canView: true, canAdd: true, canEdit: true, canDelete: true },
    },
  },
  MUDUR: {
    canManageUsers: false,
    canViewLogs: false,
    modules: {
      accommodation: { canView: true, canAdd: true, canEdit: true, canDelete: true },
      hotels: { canView: true, canAdd: true, canEdit: true, canDelete: true },
      transfer: { canView: true, canAdd: true, canEdit: true, canDelete: true },
      vehicles: { canView: true, canAdd: true, canEdit: true, canDelete: true },
      drivers: { canView: true, canAdd: true, canEdit: true, canDelete: true },
      customers: { canView: true, canAdd: true, canEdit: true, canDelete: true },
      suppliers: { canView: true, canAdd: true, canEdit: true, canDelete: true },
    },
  },
  OPERATOR: {
    canManageUsers: false,
    canViewLogs: false,
    modules: {
      accommodation: { canView: true, canAdd: true, canEdit: false, canDelete: false },
      hotels: { canView: true, canAdd: true, canEdit: false, canDelete: false },
      transfer: { canView: true, canAdd: true, canEdit: false, canDelete: false },
      vehicles: { canView: true, canAdd: true, canEdit: false, canDelete: false },
      drivers: { canView: true, canAdd: true, canEdit: false, canDelete: false },
      customers: { canView: true, canAdd: true, canEdit: false, canDelete: false },
      suppliers: { canView: true, canAdd: true, canEdit: false, canDelete: false },
    },
  },
  KULLANICI: {
    canManageUsers: false,
    canViewLogs: false,
    modules: {
      accommodation: { canView: true, canAdd: false, canEdit: false, canDelete: false },
      hotels: { canView: true, canAdd: false, canEdit: false, canDelete: false },
      transfer: { canView: true, canAdd: false, canEdit: false, canDelete: false },
      vehicles: { canView: true, canAdd: false, canEdit: false, canDelete: false },
      drivers: { canView: true, canAdd: false, canEdit: false, canDelete: false },
      customers: { canView: true, canAdd: false, canEdit: false, canDelete: false },
      suppliers: { canView: true, canAdd: false, canEdit: false, canDelete: false },
    },
  },
};

// Kullanıcının belirli bir modülde belirli bir yetkiye sahip olup olmadığını kontrol eden fonksiyon
export function hasModulePermission(
  userRole: string, 
  module: keyof RolePermissions['modules'], 
  permission: 'canView' | 'canAdd' | 'canEdit' | 'canDelete'
): boolean {
  const rolePermissions = ROLE_PERMISSIONS[userRole];
  if (!rolePermissions) {
    return false;
  }
  
  // Admin her zaman tüm yetkilere sahiptir
  if (userRole === 'ADMIN') {
    return true;
  }
  
  return rolePermissions.modules[module]?.[permission] || false;
}

// Kullanıcının belirli bir modüle erişim izni olup olmadığını kontrol eden fonksiyon
export function canViewModule(userRole: string, module: keyof RolePermissions['modules']): boolean {
  return hasModulePermission(userRole, module, 'canView');
}

export function canAddModule(userRole: string, module: keyof RolePermissions['modules']): boolean {
  return hasModulePermission(userRole, module, 'canAdd');
}

export function canEditModule(userRole: string, module: keyof RolePermissions['modules']): boolean {
  return hasModulePermission(userRole, module, 'canEdit');
}

export function canDeleteModule(userRole: string, module: keyof RolePermissions['modules']): boolean {
  return hasModulePermission(userRole, module, 'canDelete');
}

// Kullanıcının genel yetkilerini kontrol eden fonksiyonlar
export function canManageUsers(userRole: string): boolean {
  const rolePermissions = ROLE_PERMISSIONS[userRole];
  return rolePermissions?.canManageUsers || false;
}

export function canViewLogs(userRole: string): boolean {
  const rolePermissions = ROLE_PERMISSIONS[userRole];
  return rolePermissions?.canViewLogs || false;
}

// Kullanıcının modül izinlerini almak için yardımcı fonksiyon
export function getUserModulePermissions(userRole: string, module: keyof RolePermissions['modules']) {
  const rolePermissions = ROLE_PERMISSIONS[userRole];
  if (!rolePermissions) {
    return defaultModulePermissions;
  }
  
  return rolePermissions.modules[module] || defaultModulePermissions;
}

// Tüm modülleri listelemek için yardımcı fonksiyon
export function getAllModules(): (keyof RolePermissions['modules'])[] {
  return ['accommodation', 'hotels', 'transfer', 'vehicles', 'drivers', 'customers', 'suppliers'];
}

// Modül adlarını Türkçe olarak almak için yardımcı fonksiyon
export function getModuleDisplayName(module: keyof RolePermissions['modules']): string {
  const moduleNames: Record<keyof RolePermissions['modules'], string> = {
    accommodation: 'Konaklama',
    hotels: 'Oteller',
    transfer: 'Transferler',
    vehicles: 'Araçlar',
    drivers: 'Şoförler',
    customers: 'Cariler',
    suppliers: 'Tedarikçiler',
  };
  
  return moduleNames[module] || module;
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

// Kullanıcının belirli bir yetkiye sahip olup olmadığını kontrol eden fonksiyon (geriye uyumluluk için)
export function hasPermission(userRole: string, permission: string): boolean {
  // Admin her zaman tüm yetkilere sahiptir
  if (userRole === 'ADMIN') {
    return true;
  }
  
  // Genel yetkiler için kontrol
  if (permission === 'canManageUsers') {
    return canManageUsers(userRole);
  }
  
  if (permission === 'canViewLogs') {
    return canViewLogs(userRole);
  }
  
  // Modül bazlı yetkiler için kontrol
  const modulePermissions = [
    'canViewAccommodation', 'canAddAccommodation', 'canEditAccommodation', 'canDeleteAccommodation',
    'canViewHotels', 'canAddHotels', 'canEditHotels', 'canDeleteHotels',
    'canViewTransfer', 'canAddTransfer', 'canEditTransfer', 'canDeleteTransfer',
    'canViewVehicles', 'canAddVehicles', 'canEditVehicles', 'canDeleteVehicles',
    'canViewDrivers', 'canAddDrivers', 'canEditDrivers', 'canDeleteDrivers',
    'canViewCustomers', 'canAddCustomers', 'canEditCustomers', 'canDeleteCustomers',
    'canViewSuppliers', 'canAddSuppliers', 'canEditSuppliers', 'canDeleteSuppliers',
  ];
  
  if (modulePermissions.includes(permission)) {
    // Permission string'ini parse et
    const match = permission.match(/^(canView|canAdd|canEdit|canDelete)([A-Z][a-z]+)$/);
    if (match) {
      const action = match[1] as 'canView' | 'canAdd' | 'canEdit' | 'canDelete';
      const module = match[2].toLowerCase() as keyof RolePermissions['modules'];
      return hasModulePermission(userRole, module, action);
    }
  }
  
  return false;
}
