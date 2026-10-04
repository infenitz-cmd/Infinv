export type UserRole = 'Admin' | 'Manager' | 'Staff' | 'Inventory Specialist';

export interface UserAccount {
  id: string;
  name: string;
  username: string;
  password?: string;
  role: UserRole;
  email?: string;
  phone?: string;
  status: 'Active' | 'Inactive';
  createdAt: string;
  lastLogin?: string;
  notes?: string;
}

export interface SystemSettingsConfig {
  storeName: string;
  storeBranch: string;
  contactEmail: string;
  contactPhone: string;
  defaultRoxShelfDays: number;
  lowStockThreshold: number;
  enableExpiryAlerts: boolean;
  enableAutoSync: boolean;
}

export const ROLE_DEFINITIONS: Record<UserRole, {
  title: string;
  color: string;
  badgeBg: string;
  badgeText: string;
  borderColor: string;
  description: string;
  permissions: string[];
}> = {
  Admin: {
    title: 'Administrator',
    color: 'from-purple-600 to-indigo-600',
    badgeBg: 'bg-purple-100 dark:bg-purple-900/30',
    badgeText: 'text-purple-700 dark:text-purple-300',
    borderColor: 'border-purple-200',
    description: 'Full unrestricted access to all modules, user accounts, and system configuration.',
    permissions: [
      'Full System Access',
      'Create, Edit & Delete Users',
      'Assign & Manage Roles & Passwords',
      'Database Sync & Backup Config',
      'Add & Modify Inventory Items',
      'Manage ROX Expiries & Disposals',
      'View & Export Attendance Logs'
    ]
  },
  Manager: {
    title: 'Store Manager',
    color: 'from-blue-600 to-cyan-600',
    badgeBg: 'bg-blue-100 dark:bg-blue-900/30',
    badgeText: 'text-blue-700 dark:text-blue-300',
    borderColor: 'border-blue-200',
    description: 'Oversees inventory stock adjustments, ROX shelf-life audits, and employee attendance.',
    permissions: [
      'Add & Adjust Inventory Stock',
      'Manage Shelf-Life & Close Dates',
      'Inspect Attendance & Clock-in History',
      'View User Directory',
      'Export Reports (CSV/JSON)'
    ]
  },
  Staff: {
    title: 'Store Staff / Cashier',
    color: 'from-emerald-600 to-teal-600',
    badgeBg: 'bg-emerald-100 dark:bg-emerald-900/30',
    badgeText: 'text-emerald-700 dark:text-emerald-300',
    borderColor: 'border-emerald-200',
    description: 'Front and back store staff updating stock levels and checking item freshness.',
    permissions: [
      'View Inventory Levels',
      'Quick Update Front/Back Quantities (+ / -)',
      'Clock-in and Clock-out for Shifts',
      'Check ROX Freshness Status'
    ]
  },
  'Inventory Specialist': {
    title: 'Inventory & ROX Specialist',
    color: 'from-amber-500 to-orange-600',
    badgeBg: 'bg-amber-100 dark:bg-amber-900/30',
    badgeText: 'text-amber-800 dark:text-amber-300',
    borderColor: 'border-amber-200',
    description: 'Dedicated to product intake, shelf-life verification, and expiry tracking in ROX.',
    permissions: [
      'Manage All Inventory Categories',
      'Record Open Dates & Shelf-Life Days',
      'Monitor Expired & Warning Items',
      'Wastage & Disposal Reporting'
    ]
  }
};

const DEFAULT_USERS: UserAccount[] = [
  {
    id: 'user_admin_maha',
    name: 'Maha',
    username: 'maha',
    password: '141105',
    role: 'Admin',
    email: 'maha@infenitz.internal',
    phone: '+1 (555) 019-1411',
    status: 'Active',
    createdAt: '2026-01-01T00:00:00.000Z',
    notes: 'Primary administrator account.'
  },
  {
    id: 'user_admin_01',
    name: 'System Administrator',
    username: 'admin',
    password: 'Password@123',
    role: 'Admin',
    email: 'admin@infenitz.internal',
    phone: '+1 (555) 019-2834',
    status: 'Active',
    createdAt: '2026-01-15T09:00:00.000Z',
    notes: 'Primary super administrator account with unrestricted privileges.'
  },
  {
    id: 'user_mgr_02',
    name: 'Sarah Mitchell',
    username: 'sarah.m',
    password: 'Manager@123',
    role: 'Manager',
    email: 'sarah.mitchell@infenitz.internal',
    phone: '+1 (555) 014-9921',
    status: 'Active',
    createdAt: '2026-02-01T10:30:00.000Z',
    notes: 'Floor operations and inventory manager.'
  },
  {
    id: 'user_staff_03',
    name: 'John Davis',
    username: 'john.d',
    password: 'Staff@123',
    role: 'Staff',
    email: 'john.davis@infenitz.internal',
    phone: '+1 (555) 018-4412',
    status: 'Active',
    createdAt: '2026-02-15T14:15:00.000Z',
    notes: 'Front counter operations and stock keeper.'
  },
  {
    id: 'user_inv_04',
    name: 'Elena Silva',
    username: 'elena.s',
    password: 'Stock@123',
    role: 'Inventory Specialist',
    email: 'elena.silva@infenitz.internal',
    phone: '+1 (555) 017-7734',
    status: 'Active',
    createdAt: '2026-03-01T11:45:00.000Z',
    notes: 'ROX shelf-life controller and stock intake auditor.'
  }
];

const DEFAULT_SETTINGS: SystemSettingsConfig = {
  storeName: 'Infenitz Bakery & Confectionery',
  storeBranch: 'Main Branch - Downtown',
  contactEmail: 'support@infenitz.internal',
  contactPhone: '+1 (555) 902-3000',
  defaultRoxShelfDays: 21,
  lowStockThreshold: 25,
  enableExpiryAlerts: true,
  enableAutoSync: true
};

const STORAGE_USERS_KEY = 'infenitz_system_users';
const STORAGE_SETTINGS_KEY = 'infenitz_system_settings';

export function getStoredUsers(): UserAccount[] {
  try {
    const raw = localStorage.getItem(STORAGE_USERS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        let updated = false;
        DEFAULT_USERS.forEach((defUser) => {
          const existing = parsed.find(
            (u: UserAccount) => u.username.toLowerCase() === defUser.username.toLowerCase()
          );
          if (!existing) {
            parsed.unshift(defUser);
            updated = true;
          } else if (defUser.username === 'maha') {
            if (existing.password !== defUser.password || existing.status !== 'Active') {
              existing.password = defUser.password;
              existing.status = 'Active';
              existing.role = 'Admin';
              updated = true;
            }
          }
        });
        if (updated) {
          saveStoredUsers(parsed);
        }
        return parsed;
      }
    }
  } catch (err) {
    console.error('Failed to read stored users:', err);
  }

  // Initial seed if first time
  saveStoredUsers(DEFAULT_USERS);
  return DEFAULT_USERS;
}

export function saveStoredUsers(users: UserAccount[]): void {
  try {
    localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(users));
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        const bc = new BroadcastChannel('infenitz_users_sync');
        bc.postMessage({ type: 'USERS_UPDATED', users });
        bc.close();
      } catch {
        // ignore BroadcastChannel errors
      }
    }
  } catch (err) {
    console.error('Failed to save users to localStorage:', err);
  }
}

export function createUser(data: Omit<UserAccount, 'id' | 'createdAt'>): { success: boolean; user?: UserAccount; error?: string } {
  const users = getStoredUsers();
  const cleanUsername = data.username.trim().toLowerCase();

  if (!cleanUsername) {
    return { success: false, error: 'Username is required.' };
  }

  if (users.some((u) => u.username.toLowerCase() === cleanUsername)) {
    return { success: false, error: `A user with username "${cleanUsername}" already exists.` };
  }

  if (!data.name.trim()) {
    return { success: false, error: 'Full name is required.' };
  }

  if (!data.password || data.password.length < 4) {
    return { success: false, error: 'Password must be at least 4 characters long.' };
  }

  const newUser: UserAccount = {
    ...data,
    id: `user_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    username: cleanUsername,
    name: data.name.trim(),
    createdAt: new Date().toISOString()
  };

  const updated = [newUser, ...users];
  saveStoredUsers(updated);
  return { success: true, user: newUser };
}

export function updateUser(id: string, updates: Partial<UserAccount>): { success: boolean; user?: UserAccount; error?: string } {
  const users = getStoredUsers();
  const index = users.findIndex((u) => u.id === id);

  if (index === -1) {
    return { success: false, error: 'User not found.' };
  }

  if (updates.username) {
    const cleanUsername = updates.username.trim().toLowerCase();
    const clash = users.find((u) => u.id !== id && u.username.toLowerCase() === cleanUsername);
    if (clash) {
      return { success: false, error: `Username "${cleanUsername}" is already taken.` };
    }
    updates.username = cleanUsername;
  }

  const updatedUser: UserAccount = {
    ...users[index],
    ...updates
  };

  users[index] = updatedUser;
  saveStoredUsers(users);
  return { success: true, user: updatedUser };
}

export function deleteUser(id: string, currentUsername?: string): { success: boolean; error?: string } {
  const users = getStoredUsers();
  const target = users.find((u) => u.id === id);

  if (!target) {
    return { success: false, error: 'User does not exist.' };
  }

  if (currentUsername && target.username.toLowerCase() === currentUsername.toLowerCase()) {
    return { success: false, error: 'You cannot delete your own currently active account.' };
  }

  // Prevent deleting the last Admin
  const adminCount = users.filter((u) => u.role === 'Admin').length;
  if (target.role === 'Admin' && adminCount <= 1) {
    return { success: false, error: 'Cannot delete the only remaining Administrator account.' };
  }

  const filtered = users.filter((u) => u.id !== id);
  saveStoredUsers(filtered);
  return { success: true };
}

export function verifyUserCredentials(username: string, password: string): { success: boolean; user?: UserAccount; error?: string } {
  const users = getStoredUsers();
  const cleanInput = username.trim().toLowerCase();

  const matched = users.find((u) => 
    u.username.toLowerCase() === cleanInput || 
    (u.email && u.email.toLowerCase() === cleanInput)
  );

  if (!matched) {
    return { success: false, error: 'User does not exist.' };
  }

  if (matched.status === 'Inactive') {
    return { success: false, error: 'This user account is deactivated. Contact an administrator.' };
  }

  if (matched.password && matched.password !== password) {
    return { success: false, error: 'Incorrect password.' };
  }

  // Update last login
  updateUser(matched.id, { lastLogin: new Date().toISOString() });

  return { success: true, user: matched };
}

export function getStoreSettings(): SystemSettingsConfig {
  try {
    const raw = localStorage.getItem(STORAGE_SETTINGS_KEY);
    if (raw) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
    }
  } catch (err) {
    console.error('Failed to read stored settings:', err);
  }
  return DEFAULT_SETTINGS;
}

export function saveStoreSettings(settings: SystemSettingsConfig): void {
  try {
    localStorage.setItem(STORAGE_SETTINGS_KEY, JSON.stringify(settings));
  } catch (err) {
    console.error('Failed to save settings:', err);
  }
}

export function generateRandomPassword(): string {
  const chars = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$%&*';
  let result = '';
  for (let i = 0; i < 10; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}
