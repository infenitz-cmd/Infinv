import { useState, useEffect, useRef, useMemo } from 'react';
import {
  LogOut,
  Boxes,
  Rocket,
  UserCheck,
  Settings,
  ArrowLeft,
  Search,
  Plus,
  Minus,
  Filter,
  Calendar,
  Database,
  X,
  CheckCircle2,
  Trash2,
  Download,
  Upload,
  Package,
  Cake,
  PlusCircle,
  Droplets,
  Wheat,
  AlertTriangle,
  Copy,
  RefreshCw
} from 'lucide-react';
import { Logo } from './Logo';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { UserSettings } from './UserSettings';
import { UserAttendance } from './UserAttendance';
import { InfenitzAnimation } from './InfenitzAnimation';
import { getStoredUsers } from '../lib/userStore';
import type { UserRole } from '../lib/userStore';

interface HomePageProps {
  username: string;
  onLogout: () => void;
}

export interface InventoryItem {
  id: string;
  name: string;
  category: string;
  frQty: number;
  bkQty: number;
  total: number;
  openDate?: string;
  days?: number;
  expiryDate?: string;
  status: 'In Stock' | 'Low Stock' | 'Out of Stock' | 'Active' | 'Expired';
}

export function computeCloseDate(openDateStr?: string, days?: number): string {
  if (!openDateStr) {
    const today = new Date();
    openDateStr = today.toISOString().slice(0, 10);
  }
  const parts = openDateStr.split('-').map(Number);
  if (parts.length < 3 || isNaN(parts[0]) || isNaN(parts[1]) || isNaN(parts[2])) {
    return openDateStr;
  }
  const [year, month, day] = parts;
  const d = new Date(year, month - 1, day);
  d.setDate(d.getDate() + (Number(days) || 0));

  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}

export function computeStatus(closeDateStr?: string): 'Active' | 'Expired' {
  if (!closeDateStr) return 'Active';
  const parts = closeDateStr.split('-').map(Number);
  if (parts.length < 3 || isNaN(parts[0]) || isNaN(parts[1]) || isNaN(parts[2])) {
    return 'Active';
  }
  const [year, month, day] = parts;
  const closeDate = new Date(year, month - 1, day, 23, 59, 59, 999);
  const now = new Date();
  return now.getTime() > closeDate.getTime() ? 'Expired' : 'Active';
}

export function formatDateDisplay(dateStr?: string): string {
  if (!dateStr) return '-';
  const parts = dateStr.split('-');
  if (parts.length < 3) return dateStr;
  const [year, month, day] = parts;
  return `${day}/${month}/${year}`;
}

export function areInventoryItemsEqual(a: InventoryItem[], b: InventoryItem[]): boolean {
  if (a === b) return true;
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    const itemA = a[i];
    const itemB = b[i];
    if (
      itemA.id !== itemB.id ||
      itemA.name !== itemB.name ||
      itemA.category !== itemB.category ||
      itemA.frQty !== itemB.frQty ||
      itemA.bkQty !== itemB.bkQty ||
      itemA.total !== itemB.total ||
      itemA.openDate !== itemB.openDate ||
      itemA.days !== itemB.days ||
      itemA.expiryDate !== itemB.expiryDate ||
      itemA.status !== itemB.status
    ) {
      return false;
    }
  }
  return true;
}

export function sortItemsAlphabetically(items: InventoryItem[]): InventoryItem[] {
  return [...items].sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));
}

const DEFAULT_ITEMS: InventoryItem[] = [];

export const ROX_CATEGORIES = [
  {
    id: 'bulks',
    name: 'Bulks',
    icon: Package,
    textColor: 'text-indigo-700',
    bgColor: 'bg-indigo-50/60',
    borderColor: 'border-indigo-100',
    activeBorder: 'border-indigo-500 ring-2 ring-indigo-400/40',
    iconBg: 'bg-indigo-100 text-indigo-600',
    btnBg: 'bg-indigo-600 hover:bg-indigo-700 text-white',
    badgeBg: 'bg-indigo-100 text-indigo-800',
  },
  {
    id: 'rollCakes',
    name: 'Roll cakes',
    icon: Cake,
    textColor: 'text-purple-700',
    bgColor: 'bg-purple-50/60',
    borderColor: 'border-purple-100',
    activeBorder: 'border-purple-500 ring-2 ring-purple-400/40',
    iconBg: 'bg-purple-100 text-purple-600',
    btnBg: 'bg-purple-600 hover:bg-purple-700 text-white',
    badgeBg: 'bg-purple-100 text-purple-800',
  },
  {
    id: 'addOn',
    name: 'Add-on',
    icon: PlusCircle,
    textColor: 'text-amber-700',
    bgColor: 'bg-amber-50/60',
    borderColor: 'border-amber-100',
    activeBorder: 'border-amber-500 ring-2 ring-amber-400/40',
    iconBg: 'bg-amber-100 text-amber-600',
    btnBg: 'bg-amber-600 hover:bg-amber-700 text-white',
    badgeBg: 'bg-amber-100 text-amber-800',
  },
  {
    id: 'sauces',
    name: 'Sauces',
    icon: Droplets,
    textColor: 'text-rose-700',
    bgColor: 'bg-rose-50/60',
    borderColor: 'border-rose-100',
    activeBorder: 'border-rose-500 ring-2 ring-rose-400/40',
    iconBg: 'bg-rose-100 text-rose-600',
    btnBg: 'bg-rose-600 hover:bg-rose-700 text-white',
    badgeBg: 'bg-rose-100 text-rose-800',
  },
  {
    id: 'bakery',
    name: 'Bakery',
    icon: Wheat,
    textColor: 'text-emerald-700',
    bgColor: 'bg-emerald-50/60',
    borderColor: 'border-emerald-100',
    activeBorder: 'border-emerald-500 ring-2 ring-emerald-400/40',
    iconBg: 'bg-emerald-100 text-emerald-600',
    btnBg: 'bg-emerald-600 hover:bg-emerald-700 text-white',
    badgeBg: 'bg-emerald-100 text-emerald-800',
  },
];

export const HomePage: React.FC<HomePageProps> = ({ username, onLogout }) => {
  const [activeModule, setActiveModule] = useState<string | null>(null);
  const [inventoryCategory, setInventoryCategory] = useState<string>('bulks');
  const [selectedRoxCategory, setSelectedRoxCategory] = useState<string>('bulks');
  const [roxSearchQuery, setRoxSearchQuery] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal State for Add New Item
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemCategory, setNewItemCategory] = useState<string>('bulks');
  const [newItemFrQty, setNewItemFrQty] = useState('');
  const [newItemBkQty, setNewItemBkQty] = useState('');
  const [newItemOpenDate, setNewItemOpenDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [newItemDays, setNewItemDays] = useState('21');
  const [newItemStatus, setNewItemStatus] = useState<'In Stock' | 'Low Stock' | 'Out of Stock'>('In Stock');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showConstraintNotice, setShowConstraintNotice] = useState(false);

  // Current logged in user's role from user accounts
  const currentUserRole = useMemo<UserRole>(() => {
    const list = getStoredUsers();
    const match = list.find((u) => u.username.toLowerCase() === username.toLowerCase());
    return match ? match.role : 'Admin';
  }, [username]);

  // Persistent Inventory Items list state (saves to localStorage)
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>(() => {
    try {
      const saved = localStorage.getItem('infenitz_inventory_items');
      if (saved !== null) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Failed to load inventory from localStorage', e);
    }
    return DEFAULT_ITEMS;
  });

  // Attempt to sync items that exist locally to Supabase
  const syncUnsyncedItems = async (itemsToSync: InventoryItem[]) => {
    if (!isSupabaseConfigured || itemsToSync.length === 0) return;
    let hasCheckConstraintError = false;

    for (const item of itemsToSync) {
      try {
        const { error } = await supabase.from('inventory_items').upsert([item]);
        if (error) {
          console.warn(`Sync failed for "${item.name}" (${item.category}):`, error);
          if (error.code === '23514') {
            hasCheckConstraintError = true;
          }
        }
      } catch (err) {
        console.error('Sync item exception:', err);
      }
    }

    if (hasCheckConstraintError) {
      setShowConstraintNotice(true);
    }
  };

  const instanceIdRef = useRef<string>(Math.random().toString(36).slice(2));

  // Sync state changes to localStorage & BroadcastChannel for local multi-browser sync
  useEffect(() => {
    try {
      localStorage.setItem('infenitz_inventory_items', JSON.stringify(inventoryItems));
    } catch (e) {
      console.error('Failed to save inventory to localStorage', e);
    }

    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        const channel = new BroadcastChannel('infenitz_inventory_sync');
        channel.postMessage({ type: 'SYNC_ITEMS', senderId: instanceIdRef.current, items: inventoryItems });
        channel.close();
      } catch (err) {
        console.error('BroadcastChannel error:', err);
      }
    }
  }, [inventoryItems]);

  // Listen for storage events and BroadcastChannel messages across Edge / Chrome / Tabs
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'infenitz_inventory_items' && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (Array.isArray(parsed)) {
            setInventoryItems((prev) => {
              const sorted = sortItemsAlphabetically(parsed);
              if (areInventoryItemsEqual(prev, sorted)) return prev;
              return sorted;
            });
          }
        } catch (err) {
          console.error(err);
        }
      }
    };

    let channel: BroadcastChannel | null = null;
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        channel = new BroadcastChannel('infenitz_inventory_sync');
        channel.onmessage = (event) => {
          if (
            event.data &&
            event.data.type === 'SYNC_ITEMS' &&
            event.data.senderId !== instanceIdRef.current &&
            Array.isArray(event.data.items)
          ) {
            setInventoryItems((prev) => {
              const sorted = sortItemsAlphabetically(event.data.items);
              if (areInventoryItemsEqual(prev, sorted)) return prev;
              return sorted;
            });
          }
        };
      } catch (err) {
        console.error(err);
      }
    }

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      if (channel) channel.close();
    };
  }, []);

  // Supabase Cloud Realtime Sync & Intelligent Local Merge
  useEffect(() => {
    if (!isSupabaseConfigured) return;

    const fetchAndSyncSupabaseItems = async () => {
      try {
        const { data, error } = await supabase
          .from('inventory_items')
          .select('*')
          .order('name', { ascending: true });
        
        if (!error && data) {
          const cloudItems = data as InventoryItem[];
          const cloudIds = new Set(cloudItems.map((item) => String(item.id)));

          setInventoryItems((currentItems) => {
            // Read latest items from localStorage to ensure nothing added locally is lost
            let localList = currentItems;
            try {
              const saved = localStorage.getItem('infenitz_inventory_items');
              if (saved) {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed) && parsed.length > 0) {
                  localList = parsed;
                }
              }
            } catch (e) {
              console.error(e);
            }

            // Find any items that exist locally but are not yet in Supabase
            const localOnlyItems = localList.filter((item) => !cloudIds.has(String(item.id)));

            // Deep-merge cloud items with local shelf-life attributes so expired items are never lost on login/logout
            const mergedCloudItems = cloudItems.map((cloudItem) => {
              const localMatch = localList.find((li) => String(li.id) === String(cloudItem.id));
              if (localMatch) {
                // If cloudItem has shelf-life fields recorded in DB, use cloud; otherwise preserve local settings
                const hasCloudDates = Boolean(cloudItem.openDate || cloudItem.expiryDate);
                const openDate = hasCloudDates
                  ? (cloudItem.openDate || localMatch.openDate)
                  : (localMatch.openDate || cloudItem.openDate);
                const days = hasCloudDates
                  ? (cloudItem.days !== undefined && cloudItem.days !== null ? cloudItem.days : localMatch.days)
                  : (localMatch.days !== undefined && localMatch.days !== null ? localMatch.days : (cloudItem.days ?? 21));
                const closeDate = (openDate && days !== undefined)
                  ? computeCloseDate(openDate, days)
                  : (cloudItem.expiryDate || localMatch.expiryDate);
                const status = closeDate ? computeStatus(closeDate) : (cloudItem.status || localMatch.status);

                return {
                  ...localMatch,
                  ...cloudItem,
                  openDate,
                  days,
                  expiryDate: closeDate,
                  status,
                };
              }
              return cloudItem;
            });

            // Merge cloud items with local-only items and sort stably
            const merged = sortItemsAlphabetically([...mergedCloudItems, ...localOnlyItems]);

            // Avoid triggering unnecessary re-renders if data is identical
            if (areInventoryItemsEqual(currentItems, merged)) {
              return currentItems;
            }

            try {
              localStorage.setItem('infenitz_inventory_items', JSON.stringify(merged));
            } catch (e) {
              console.error('Failed to update localStorage:', e);
            }

            // Attempt to sync any local-only items to Supabase in the background
            if (localOnlyItems.length > 0) {
              syncUnsyncedItems(localOnlyItems);
            }

            return merged;
          });
        }
      } catch (err) {
        console.error('Supabase sync error:', err);
      }
    };

    fetchAndSyncSupabaseItems();

    const subscription = supabase
      .channel('inventory_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'inventory_items' }, () => {
        fetchAndSyncSupabaseItems();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  // Manual Push Local Items to Cloud
  const handlePushLocalToCloud = async () => {
    if (!isSupabaseConfigured) {
      alert('Supabase is not configured yet.');
      return;
    }
    try {
      const savedLocal = localStorage.getItem('infenitz_inventory_items');
      const localItems: InventoryItem[] = savedLocal ? JSON.parse(savedLocal) : inventoryItems;
      if (Array.isArray(localItems) && localItems.length > 0) {
        const { error } = await supabase.from('inventory_items').upsert(localItems);
        if (error) {
          console.warn('Upsert error:', error);
          if (error.code === '23514') {
            setShowConstraintNotice(true);
            alert('Supabase rejected some items due to a category constraint (only bulks & rollCakes allowed). Check the notice banner for the 1-click SQL fix!');
          } else {
            alert(`Error uploading: ${error.message}`);
          }
        } else {
          setToastMessage(`Pushed ${localItems.length} items to Supabase cloud!`);
          setTimeout(() => setToastMessage(null), 3000);
        }
      } else {
        alert('No local items found to push.');
      }
    } catch (err) {
      console.error(err);
      alert('Failed to push local items to cloud.');
    }
  };

  // Export Data JSON
  const handleExportData = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(inventoryItems, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `infenitz_inventory_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    setToastMessage('Inventory backup exported successfully!');
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Import Data JSON
  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    if (e.target.files && e.target.files[0]) {
      fileReader.readAsText(e.target.files[0], 'UTF-8');
      fileReader.onload = async (event) => {
        try {
          const parsed = JSON.parse(event.target?.result as string);
          if (Array.isArray(parsed)) {
            setInventoryItems(parsed);
            if (isSupabaseConfigured) {
              await supabase.from('inventory_items').upsert(parsed);
            }
            setToastMessage('Inventory items imported & synced!');
            setTimeout(() => setToastMessage(null), 3000);
          } else {
            alert('Invalid file format. Expected an array of items.');
          }
        } catch (err) {
          alert('Failed to parse imported file.');
        }
      };
    }
  };

  const modules = [
    {
      id: 'inventory',
      title: 'Inventory',
      icon: Boxes,
      iconBg: 'bg-blue-600 text-white shadow-blue-500/20',
      hoverBorder: 'hover:border-blue-500 hover:shadow-blue-500/10',
    },
    {
      id: 'rox',
      title: 'ROX',
      icon: Rocket,
      iconBg: 'bg-indigo-600 text-white shadow-indigo-500/20',
      hoverBorder: 'hover:border-indigo-500 hover:shadow-indigo-500/10',
    },
    {
      id: 'attendance',
      title: 'Attendance',
      icon: UserCheck,
      iconBg: 'bg-emerald-600 text-white shadow-emerald-500/20',
      hoverBorder: 'hover:border-emerald-500 hover:shadow-emerald-500/10',
    },
    ...(currentUserRole === 'Admin'
      ? [
          {
            id: 'settings',
            title: 'Settings',
            icon: Settings,
            iconBg: 'bg-slate-800 text-white shadow-slate-900/20',
            hoverBorder: 'hover:border-slate-500 hover:shadow-slate-500/10',
          },
        ]
      : []),
  ];

  const updateQuantity = async (id: string, field: 'frQty' | 'bkQty', delta: number) => {
    const current = inventoryItems.find((item) => item.id === id);
    const newQty = Math.max(0, (current ? current[field] : 0) + delta);
    const newFr = current ? (field === 'frQty' ? newQty : current.frQty) : 0;
    const newBk = current ? (field === 'bkQty' ? newQty : current.bkQty) : 0;
    const newTotal = newFr + newBk;
    const newStatus: 'In Stock' | 'Low Stock' | 'Out of Stock' =
      newTotal === 0
        ? 'Out of Stock'
        : newTotal < 25
        ? 'Low Stock'
        : 'In Stock';

    setInventoryItems((prev) => {
      const updated = prev.map((item) => {
        if (item.id !== id) return item;
        return {
          ...item,
          frQty: newFr,
          bkQty: newBk,
          total: newTotal,
          status: newStatus,
        };
      });
      try {
        localStorage.setItem('infenitz_inventory_items', JSON.stringify(updated));
      } catch (e) {
        console.error(e);
      }
      return updated;
    });

    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase
          .from('inventory_items')
          .update({
            frQty: newFr,
            bkQty: newBk,
            total: newTotal,
            status: newStatus,
          })
          .eq('id', id);

        if (error && current) {
          await supabase.from('inventory_items').upsert([{
            ...current,
            frQty: newFr,
            bkQty: newBk,
            total: newTotal,
            status: newStatus,
          }]);
        }
      } catch (err) {
        console.error('Supabase update error:', err);
      }
    }
  };

  const updateRoxDates = async (id: string, newOpenDate: string, newDays: number) => {
    const safeDays = Math.max(0, Number(newDays) || 0);
    const closeDate = computeCloseDate(newOpenDate, safeDays);
    const newStatus = computeStatus(closeDate);

    // 1. Immediately update React state & localStorage
    setInventoryItems((prev) => {
      const updated = prev.map((item) => {
        if (item.id !== id) return item;
        return {
          ...item,
          openDate: newOpenDate,
          days: safeDays,
          expiryDate: closeDate,
          status: newStatus,
        };
      });
      try {
        localStorage.setItem('infenitz_inventory_items', JSON.stringify(updated));
      } catch (e) {
        console.error(e);
      }
      return updated;
    });

    // 2. Immediately persist to Supabase Cloud
    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase
          .from('inventory_items')
          .update({
            openDate: newOpenDate,
            days: safeDays,
            expiryDate: closeDate,
            status: newStatus,
          })
          .eq('id', id);

        if (error) {
          console.warn('Supabase update failed, attempting upsert:', error);
          const currentItem = inventoryItems.find((i) => i.id === id);
          if (currentItem) {
            await supabase.from('inventory_items').upsert([{
              ...currentItem,
              openDate: newOpenDate,
              days: safeDays,
              expiryDate: closeDate,
              status: newStatus,
            }]);
          }
        }
      } catch (err) {
        console.error('Supabase update error:', err);
      }
    }
  };

  const handleDeleteItem = async (id: string, name: string) => {
    setInventoryItems((prev) => {
      const updated = prev.filter((item) => item.id !== id);
      try {
        localStorage.setItem('infenitz_inventory_items', JSON.stringify(updated));
      } catch (e) {
        console.error(e);
      }
      return updated;
    });

    if (isSupabaseConfigured) {
      try {
        await supabase.from('inventory_items').delete().eq('id', id);
      } catch (err) {
        console.error('Supabase delete error:', err);
      }
    }
    setToastMessage(`Item "${name}" deleted.`);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleAddItemSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim()) return;

    const isRox = activeModule === 'rox';
    const fr = parseInt(newItemFrQty) || 0;
    const bk = parseInt(newItemBkQty) || 0;
    const daysNum = parseInt(newItemDays) || 21;
    const calculatedCloseDate = computeCloseDate(newItemOpenDate, daysNum);
    const calculatedStatus = computeStatus(calculatedCloseDate);

    const itemToAdd: InventoryItem = {
      id: Date.now().toString(),
      name: newItemName.trim(),
      category: newItemCategory,
      frQty: isRox ? 0 : fr,
      bkQty: isRox ? 0 : bk,
      total: isRox ? 0 : fr + bk,
      openDate: isRox ? newItemOpenDate : undefined,
      days: isRox ? daysNum : undefined,
      expiryDate: isRox ? calculatedCloseDate : undefined,
      status: isRox ? calculatedStatus : newItemStatus,
    };

    // 1. Immediately save to state & localStorage
    const updated = [itemToAdd, ...inventoryItems];
    setInventoryItems(updated);
    try {
      localStorage.setItem('infenitz_inventory_items', JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }

    setInventoryCategory(newItemCategory);
    setSelectedRoxCategory(newItemCategory);
    setIsAddModalOpen(false);

    // Reset form
    setNewItemName('');
    setNewItemFrQty('');
    setNewItemBkQty('');
    setNewItemOpenDate(new Date().toISOString().slice(0, 10));
    setNewItemDays('21');
    setNewItemStatus('In Stock');

    // 2. Insert to Supabase if configured
    if (isSupabaseConfigured) {
      try {
        let { error } = await supabase.from('inventory_items').insert([itemToAdd]);
        if (error && error.code === 'PGRST204') {
          const { openDate: _od, days: _d, expiryDate: _ed, ...fallback } = itemToAdd;
          const retry = await supabase.from('inventory_items').insert([fallback]);
          error = retry.error;
        }
        if (error) {
          console.warn('Supabase insert failed:', error);
          if (error.code === '23514') {
            setShowConstraintNotice(true);
            setToastMessage(`Saved locally! Supabase database category constraint needs updating.`);
          } else {
            setToastMessage(`Saved locally! (Supabase sync: ${error.message})`);
          }
          setTimeout(() => setToastMessage(null), 4000);
          return;
        }
      } catch (err) {
        console.error('Supabase insert error:', err);
      }
    }

    // Show toast
    setToastMessage(`Item "${itemToAdd.name}" added successfully!`);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const filteredItems = inventoryItems
    .filter(
      (item) =>
        item.category === inventoryCategory &&
        item.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));

  return (
    <div className="min-h-screen w-full bg-[#f6f9fc] flex flex-col font-sans selection:bg-blue-600 selection:text-white relative">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-3 animate-fadeIn border border-slate-800 text-xs font-semibold">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Navigation Bar */}
      <header className="w-full bg-white border-b border-slate-200/80 sticky top-0 z-50 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Brand Logo */}
          <div className="flex items-center gap-3">
            <Logo size="normal" />
          </div>

          {/* User Profile & Actions */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-slate-100/90 border border-slate-200/80 shadow-xs">
              <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-extrabold text-xs shadow-xs">
                {username.charAt(0).toUpperCase()}
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-slate-800 leading-tight">{username}</span>
                <span className="text-[10px] font-semibold text-blue-600 leading-tight">{currentUserRole}</span>
              </div>
            </div>

            <button
              onClick={onLogout}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-red-50 hover:text-red-600 border border-slate-200/60 transition-all duration-200"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Log Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col justify-start">
        
        {/* Supabase Database Category Constraint Banner */}
        {showConstraintNotice && (
          <div className="bg-amber-50 border border-amber-200/90 rounded-2xl p-4 sm:p-5 mb-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4 animate-fadeIn">
            <div className="flex items-start gap-3.5 max-w-3xl">
              <div className="p-2.5 rounded-xl bg-amber-100 text-amber-700 shrink-0 mt-0.5">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-extrabold text-amber-900 tracking-tight">
                  Supabase Cloud Notice: Database Table Check Constraint
                </h4>
                <p className="text-xs text-amber-800 leading-relaxed">
                  Your new items in <strong>Add-on</strong>, <strong>Sauces</strong>, and <strong>Bakery</strong> are <span className="underline font-bold text-emerald-700">safely preserved in your browser</span> and will not disappear when you refresh! However, Supabase cloud rejected them because your database table constraint currently only allows <em>'bulks'</em> and <em>'rollCakes'</em>.
                </p>
                <div className="pt-2 flex flex-col sm:flex-row sm:items-center gap-2">
                  <span className="text-xs font-bold text-amber-900 shrink-0">Run in Supabase SQL Editor:</span>
                  <div className="flex-1 flex items-center gap-2 bg-white/95 border border-amber-300/80 rounded-xl px-3 py-1.5 font-mono text-[11px] text-slate-800 shadow-2xs">
                    <code className="select-all truncate">ALTER TABLE inventory_items DROP CONSTRAINT IF EXISTS inventory_items_category_check;</code>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
              <button
                onClick={() => {
                  navigator.clipboard.writeText('ALTER TABLE inventory_items DROP CONSTRAINT IF EXISTS inventory_items_category_check;');
                  setToastMessage('SQL command copied to clipboard!');
                  setTimeout(() => setToastMessage(null), 3000);
                }}
                className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                title="Copy SQL command to clipboard"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Copy SQL</span>
              </button>

              <button
                onClick={async () => {
                  setToastMessage('Retrying sync with Supabase...');
                  const saved = localStorage.getItem('infenitz_inventory_items');
                  if (saved) {
                    try {
                      const parsed = JSON.parse(saved);
                      await syncUnsyncedItems(parsed);
                      setToastMessage('Synced with Supabase successfully!');
                      setShowConstraintNotice(false);
                    } catch (e) {
                      console.error(e);
                    }
                  }
                  setTimeout(() => setToastMessage(null), 3000);
                }}
                className="px-3.5 py-2 bg-white border border-amber-300 hover:bg-amber-100/60 active:bg-amber-200/60 text-amber-900 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
                title="Retry syncing unsynced items to Supabase"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Retry Sync</span>
              </button>

              <button
                onClick={() => setShowConstraintNotice(false)}
                className="p-2 text-amber-600 hover:text-amber-900 hover:bg-amber-100 rounded-xl transition-colors cursor-pointer"
                title="Dismiss notice"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Module Detail View if clicked */}
        {activeModule ? (
          <div className="w-full bg-white rounded-3xl p-4 sm:p-6 border border-slate-200/80 shadow-md animate-fadeIn space-y-4">
            {/* Small Compact Back Button right at top */}
            <div>
              <button
                onClick={() => setActiveModule(null)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
            </div>

            {/* Inventory Detail View */}
            {activeModule === 'inventory' && (
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Inventory Dashboard</h2>
                    <p className="text-slate-500 text-xs font-medium mt-0.5">Real-time stock tracking and warehouse supply overview.</p>
                  </div>
                  <button
                    onClick={() => {
                      setNewItemCategory(inventoryCategory === 'rollCakes' ? 'rollCakes' : 'bulks');
                      setIsAddModalOpen(true);
                    }}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 active:bg-blue-800 shadow-md shadow-blue-500/20 transition-all cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add New Item</span>
                  </button>
                </div>

                {/* 2 Category Toggle Boxes for Bulks & Roll cakes alone */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {ROX_CATEGORIES.filter((c) => ['bulks', 'rollCakes'].includes(c.id)).map((cat) => {
                    const isSelected = inventoryCategory === cat.id;
                    const count = inventoryItems.filter((i) => i.category === cat.id).length;
                    const Icon = cat.icon;
                    return (
                      <button
                        key={cat.id}
                        onClick={() => setInventoryCategory(cat.id)}
                        className={`py-3.5 px-5 rounded-2xl border transition-all duration-200 flex items-center justify-between text-left cursor-pointer ${
                          isSelected
                            ? `${cat.btnBg} border-transparent shadow-md shadow-slate-200`
                            : `${cat.bgColor} ${cat.textColor} ${cat.borderColor} hover:brightness-95`
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`p-2.5 rounded-xl ${isSelected ? 'bg-white/20 text-white' : cat.iconBg}`}>
                            <Icon className="w-5 h-5" />
                          </div>
                          <span className="text-base sm:text-lg font-black tracking-tight">{cat.name}</span>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-extrabold shrink-0 ${
                          isSelected ? 'bg-white/20 text-white' : cat.badgeBg
                        }`}>
                          {count} {count === 1 ? 'item' : 'items'}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Inventory Table */}
                <div className="border border-slate-200 rounded-2xl overflow-hidden">
                  <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                    <div className="relative w-64">
                      <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search inventory..."
                        className="w-full pl-9 pr-4 py-1 bg-white border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      {isSupabaseConfigured && (
                        <button
                          onClick={handlePushLocalToCloud}
                          className="flex items-center gap-1.5 px-3 py-1 bg-indigo-50 border border-indigo-200/80 rounded-lg text-xs font-bold text-indigo-600 hover:bg-indigo-100 shadow-2xs cursor-pointer transition-colors"
                          title="Upload all local browser items to Supabase Cloud"
                        >
                          <Database className="w-3.5 h-3.5 text-indigo-600" />
                          <span>Push to Cloud</span>
                        </button>
                      )}

                      <button
                        onClick={handleExportData}
                        className="flex items-center gap-1.5 px-3 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-50 shadow-2xs cursor-pointer transition-colors"
                        title="Export inventory backup to JSON file"
                      >
                        <Download className="w-3.5 h-3.5 text-blue-600" />
                        <span>Export</span>
                      </button>

                      <label
                        className="flex items-center gap-1.5 px-3 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-50 shadow-2xs cursor-pointer transition-colors"
                        title="Import inventory data from JSON file"
                      >
                        <Upload className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Import</span>
                        <input type="file" accept=".json" onChange={handleImportData} className="hidden" />
                      </label>

                      <button className="flex items-center gap-1.5 px-3 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-50">
                        <Filter className="w-3.5 h-3.5" />
                        <span>Filter</span>
                      </button>
                    </div>
                  </div>
                  <table className="w-full text-left text-xs font-medium text-slate-600">
                    <thead className="bg-slate-100/70 uppercase text-[10px] font-extrabold text-slate-500 tracking-wider">
                      <tr>
                        <th className="p-3.5">Item Name</th>
                        <th className="p-3.5">FR QTY (POS)</th>
                        <th className="p-3.5">BK QTY</th>
                        <th className="p-3.5">Total</th>
                        <th className="p-3.5">Status</th>
                        <th className="p-3.5 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredItems.length > 0 ? (
                        filteredItems.map((item) => (
                          <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                            <td className="p-3.5 font-bold text-slate-900 text-base">{item.name}</td>
                            
                            {/* FR QTY Stepper Widget */}
                            <td className="p-3.5">
                              <div className="inline-flex items-center gap-2 bg-slate-100/90 border border-slate-200/90 rounded-xl p-1 shadow-2xs">
                                <button
                                  onClick={() => updateQuantity(item.id, 'frQty', -1)}
                                  className="w-7 h-7 rounded-lg bg-white hover:bg-slate-200 active:bg-slate-300 text-slate-700 flex items-center justify-center font-black transition-all hover:scale-105 active:scale-95 shadow-xs border border-slate-200/80 cursor-pointer"
                                  title="Decrease FR QTY"
                                >
                                  <Minus className="w-3.5 h-3.5" />
                                </button>
                                <span className="w-8 text-center text-sm font-extrabold text-slate-900">{item.frQty}</span>
                                <button
                                  onClick={() => updateQuantity(item.id, 'frQty', 1)}
                                  className="w-7 h-7 rounded-lg bg-white hover:bg-slate-200 active:bg-slate-300 text-slate-700 flex items-center justify-center font-black transition-all hover:scale-105 active:scale-95 shadow-xs border border-slate-200/80 cursor-pointer"
                                  title="Increase FR QTY"
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>

                            {/* BK QTY Stepper Widget */}
                            <td className="p-3.5">
                              <div className="inline-flex items-center gap-2 bg-slate-100/90 border border-slate-200/90 rounded-xl p-1 shadow-2xs">
                                <button
                                  onClick={() => updateQuantity(item.id, 'bkQty', -1)}
                                  className="w-7 h-7 rounded-lg bg-white hover:bg-slate-200 active:bg-slate-300 text-slate-700 flex items-center justify-center font-black transition-all hover:scale-105 active:scale-95 shadow-xs border border-slate-200/80 cursor-pointer"
                                  title="Decrease BK QTY"
                                >
                                  <Minus className="w-3.5 h-3.5" />
                                </button>
                                <span className="w-8 text-center text-sm font-extrabold text-slate-900">{item.bkQty}</span>
                                <button
                                  onClick={() => updateQuantity(item.id, 'bkQty', 1)}
                                  className="w-7 h-7 rounded-lg bg-white hover:bg-slate-200 active:bg-slate-300 text-slate-700 flex items-center justify-center font-black transition-all hover:scale-105 active:scale-95 shadow-xs border border-slate-200/80 cursor-pointer"
                                  title="Increase BK QTY"
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>

                            <td className={`p-3.5 font-bold text-sm ${item.category === 'bulks' ? 'text-blue-600' : 'text-emerald-600'}`}>
                              {item.total}
                            </td>

                            <td className="p-3.5">
                              <span
                                className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                                  item.status === 'In Stock'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : item.status === 'Low Stock'
                                    ? 'bg-amber-100 text-amber-800'
                                    : 'bg-red-100 text-red-800'
                                }`}
                              >
                                {item.status}
                              </span>
                            </td>

                            {/* Delete Action Button */}
                            <td className="p-3.5 text-right">
                              <button
                                onClick={() => handleDeleteItem(item.id, item.name)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-200 transition-all cursor-pointer"
                                title="Delete Item"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={6} className="p-6 text-center text-slate-400 font-medium">
                            No items found in {ROX_CATEGORIES.find((c) => c.id === inventoryCategory)?.name || inventoryCategory}. Click "+ Add New Item" to create one.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ROX View */}
            {activeModule === 'rox' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-extrabold text-slate-900">ROX</h2>
                  <p className="text-slate-500 text-sm font-medium">Performance analytics & category inventory management.</p>
                </div>

                {/* 5 Category Boxes with Add Item Option */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                  {ROX_CATEGORIES.map((cat) => {
                    const Icon = cat.icon;
                    const isSelected = selectedRoxCategory === cat.id;
                    const categoryItemsList = inventoryItems.filter((i) => i.category === cat.id);
                    const count = categoryItemsList.length;

                    // Calculate expired items in this category
                    const expiredCount = categoryItemsList.filter((item) => {
                      const todayStr = new Date().toISOString().slice(0, 10);
                      const openDate = item.openDate || todayStr;
                      const days = item.days ?? 21;
                      const closeDate = item.expiryDate || computeCloseDate(openDate, days);
                      return computeStatus(closeDate) === 'Expired';
                    }).length;

                    return (
                      <div
                        key={cat.id}
                        onClick={() => setSelectedRoxCategory(cat.id)}
                        className={`relative p-4 sm:p-5 rounded-2xl ${cat.bgColor} border transition-all duration-200 cursor-pointer flex items-center gap-3 ${
                          isSelected ? `${cat.activeBorder} shadow-md` : `${cat.borderColor} hover:shadow-md hover:border-slate-300`
                        }`}
                      >
                        {/* Blinking Red Circle Badge with number of expired items */}
                        {expiredCount > 0 && (
                          <div
                            className="absolute -top-2.5 -right-2.5 flex items-center justify-center z-10"
                            title={`${expiredCount} expired ${expiredCount === 1 ? 'item' : 'items'}`}
                          >
                            <span className="animate-ping absolute inline-flex h-6 w-6 rounded-full bg-red-400 opacity-75"></span>
                            <span className="relative inline-flex items-center justify-center min-w-[22px] h-[22px] px-1.5 rounded-full bg-red-600 text-white text-[11px] font-black shadow-md border-2 border-white animate-blink">
                              {expiredCount}
                            </span>
                          </div>
                        )}

                        <div className={`p-2.5 rounded-xl ${cat.iconBg} shrink-0`}>
                          <Icon className="w-6 h-6" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className={`text-base sm:text-lg lg:text-xl font-black ${cat.textColor} leading-tight whitespace-nowrap`}>
                            {cat.name}
                          </p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-xs font-bold text-slate-500">
                              {count} {count === 1 ? 'item' : 'items'}
                            </span>
                            {expiredCount > 0 && (
                              <span className="text-[11px] font-black text-red-600 animate-blink">
                                • {expiredCount} exp
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Selected Category Detail & Inventory Table */}
                {(() => {
                  const currentCategoryConfig = ROX_CATEGORIES.find((c) => c.id === selectedRoxCategory) || ROX_CATEGORIES[0];
                  const ActiveIcon = currentCategoryConfig.icon;
                  const categoryItems = inventoryItems
                    .filter(
                      (item) =>
                        item.category === selectedRoxCategory &&
                        item.name.toLowerCase().includes(roxSearchQuery.toLowerCase())
                    )
                    .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));

                  return (
                    <div className="space-y-4 pt-2 border-t border-slate-200/80">
                      {/* Sub-header for selected category */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
                        <div className="flex items-center gap-3">
                          <div className={`p-2.5 rounded-xl ${currentCategoryConfig.iconBg}`}>
                            <ActiveIcon className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="text-lg font-extrabold text-slate-900">{currentCategoryConfig.name} Items</h3>
                              <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${currentCategoryConfig.badgeBg}`}>
                                {categoryItems.filter((i) => computeStatus(i.expiryDate || computeCloseDate(i.openDate, i.days ?? 21)) === 'Active').length} active
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 font-medium">Batch tracking, open date, shelf-life days and real-time expiration monitoring.</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setNewItemCategory(selectedRoxCategory);
                              setIsAddModalOpen(true);
                            }}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold shadow-md cursor-pointer transition-all duration-200 ${currentCategoryConfig.btnBg}`}
                          >
                            <Plus className="w-4 h-4" />
                            <span>Add Item to {currentCategoryConfig.name}</span>
                          </button>
                        </div>
                      </div>

                      {/* Items Table */}
                      <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-2xs">
                        <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                          <div className="relative w-64">
                            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                            <input
                              type="text"
                              value={roxSearchQuery}
                              onChange={(e) => setRoxSearchQuery(e.target.value)}
                              placeholder={`Search ${currentCategoryConfig.name}...`}
                              className="w-full pl-9 pr-4 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:border-blue-500"
                            />
                          </div>
                        </div>

                        <table className="w-full text-left text-xs font-medium text-slate-600">
                          <thead className="bg-slate-100/70 uppercase text-[10px] font-extrabold text-slate-500 tracking-wider">
                            <tr>
                              <th className="p-3.5">Item Name</th>
                              <th className="p-3.5">Open Date</th>
                              <th className="p-3.5">Days</th>
                              <th className="p-3.5">Close Date</th>
                              <th className="p-3.5">Status</th>
                              <th className="p-3.5 text-right">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {categoryItems.length > 0 ? (
                              categoryItems.map((item) => {
                                const todayStr = new Date().toISOString().slice(0, 10);
                                const openDate = item.openDate || todayStr;
                                const days = item.days ?? 21;
                                const closeDate = item.expiryDate || computeCloseDate(openDate, days);
                                const status = computeStatus(closeDate);

                                return (
                                  <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                                    <td className="p-3.5 font-bold text-slate-900 text-base">{item.name}</td>
                                    
                                    {/* Open Date Picker */}
                                    <td className="p-3.5">
                                      <input
                                        type="date"
                                        value={openDate}
                                        onChange={(e) => updateRoxDates(item.id, e.target.value, days)}
                                        className="px-3 py-1.5 bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 focus:border-indigo-500 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 shadow-2xs transition-all cursor-pointer"
                                      />
                                    </td>

                                    {/* Days Number Box */}
                                    <td className="p-3.5">
                                      <div className="inline-flex items-center gap-1.5">
                                        <input
                                          type="number"
                                          min="0"
                                          value={days}
                                          onChange={(e) => {
                                            const val = e.target.value;
                                            const parsed = parseInt(val, 10);
                                            updateRoxDates(item.id, openDate, isNaN(parsed) ? 0 : parsed);
                                          }}
                                          className="w-20 px-3 py-1.5 bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 focus:border-indigo-500 rounded-xl text-xs font-black text-center text-slate-900 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 shadow-2xs transition-all"
                                        />
                                        <span className="text-xs font-semibold text-slate-400">days</span>
                                      </div>
                                    </td>

                                    {/* Close Date (Calculated from open date + days, not editable) */}
                                    <td className="p-3.5">
                                      <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-100/90 border border-slate-200/90 rounded-xl text-slate-800 font-mono font-bold text-xs shadow-2xs">
                                        <Calendar className="w-3.5 h-3.5 text-slate-500" />
                                        <span>{formatDateDisplay(closeDate)}</span>
                                      </div>
                                    </td>

                                    {/* Status: Active or Expired only */}
                                    <td className="p-3.5">
                                      <span
                                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-black text-xs border ${
                                          status === 'Active'
                                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 shadow-2xs'
                                            : 'bg-red-50 text-red-700 border-red-200 shadow-2xs'
                                        }`}
                                      >
                                        <span className={`w-1.5 h-1.5 rounded-full ${status === 'Active' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                                        {status}
                                      </span>
                                    </td>

                                    {/* Delete Action Button */}
                                    <td className="p-3.5 text-right">
                                      <button
                                        onClick={() => handleDeleteItem(item.id, item.name)}
                                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-200 transition-all cursor-pointer"
                                        title="Delete Item"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    </td>
                                  </tr>
                                );
                              })
                            ) : (
                              <tr>
                                <td colSpan={6} className="p-8 text-center">
                                  <div className="max-w-xs mx-auto space-y-3">
                                    <p className="text-slate-400 font-medium text-sm">
                                      No items found in {currentCategoryConfig.name}.
                                    </p>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setNewItemCategory(selectedRoxCategory);
                                        setIsAddModalOpen(true);
                                      }}
                                      className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold shadow-xs cursor-pointer ${currentCategoryConfig.btnBg}`}
                                    >
                                      <Plus className="w-3.5 h-3.5" />
                                      <span>Add First Item</span>
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}

            {/* Attendance View (Users track shifts, Admin inspects staff attendance) */}
            {activeModule === 'attendance' && (
              <UserAttendance username={username} userRole={currentUserRole} />
            )}

            {/* Settings View */}
            {activeModule === 'settings' && (
              <UserSettings currentUsername={username} />
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {/* Ultra-Sleek & Compact Module Cards */}
            <div className={`grid grid-cols-1 sm:grid-cols-2 ${modules.length === 3 ? 'lg:grid-cols-3' : 'lg:grid-cols-4'} gap-5`}>
              {modules.map((item) => {
                const IconComp = item.icon;
                const roxExpiredTotal = item.id === 'rox'
                  ? inventoryItems.filter((it) => {
                      const todayStr = new Date().toISOString().slice(0, 10);
                      const openDate = it.openDate || todayStr;
                      const days = it.days ?? 21;
                      const closeDate = it.expiryDate || computeCloseDate(openDate, days);
                      return computeStatus(closeDate) === 'Expired';
                    }).length
                  : 0;

                return (
                  <div
                    key={item.id}
                    onClick={() => {
                      setActiveModule(item.id);
                      if (item.id === 'inventory' && inventoryCategory !== 'bulks' && inventoryCategory !== 'rollCakes') {
                        setInventoryCategory('bulks');
                      }
                    }}
                    className={`relative group bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md ${item.hoverBorder} transition-all duration-200 transform hover:-translate-y-1 cursor-pointer flex items-center gap-4`}
                  >
                    {/* Blinking notification badge if ROX has expired items */}
                    {item.id === 'rox' && roxExpiredTotal > 0 && (
                      <div
                        className="absolute -top-2.5 -right-2.5 flex items-center justify-center z-10"
                        title={`${roxExpiredTotal} expired items in ROX`}
                      >
                        <span className="animate-ping absolute inline-flex h-6 w-6 rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex items-center justify-center min-w-[22px] h-[22px] px-1.5 rounded-full bg-red-600 text-white text-[11px] font-black shadow-md border-2 border-white animate-blink">
                          {roxExpiredTotal}
                        </span>
                      </div>
                    )}

                    {/* Icon Box */}
                    <div className={`w-12 h-12 rounded-xl ${item.iconBg} flex items-center justify-center transition-transform duration-200 group-hover:scale-105 flex-shrink-0`}>
                      <IconComp className="w-6 h-6" />
                    </div>

                    {/* Module Name */}
                    <div>
                      <h3 className="text-lg font-bold text-slate-900 tracking-tight group-hover:text-blue-600 transition-colors">
                        {item.title}
                      </h3>
                      {item.id === 'rox' && roxExpiredTotal > 0 && (
                        <span className="text-[11px] font-extrabold text-red-600 animate-blink flex items-center gap-1">
                          ● {roxExpiredTotal} expired
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Infenitz Infinite Motion & Logo Showcase in Empty Space */}
            <InfenitzAnimation />
          </div>
        )}
      </main>

      {/* --- ADD NEW INVENTORY ITEM MODAL DIALOG --- */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-100 relative">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
              <h3 className="text-xl font-extrabold text-slate-900">Add New Inventory Item</h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddItemSubmit} className="space-y-4">
              {/* Item Name */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">
                  Item Name
                </label>
                <input
                  type="text"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  placeholder="e.g. Vanilla Cream Roll"
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-500/10"
                />
              </div>

              {/* Category */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">
                  Category
                </label>
                <select
                  value={newItemCategory}
                  onChange={(e) => setNewItemCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:bg-white focus:border-blue-600"
                >
                  {activeModule === 'inventory' ? (
                    <>
                      <option value="bulks">Bulks</option>
                      <option value="rollCakes">Roll cakes</option>
                    </>
                  ) : (
                    <>
                      <option value="bulks">Bulks</option>
                      <option value="rollCakes">Roll cakes</option>
                      <option value="addOn">Add-on</option>
                      <option value="sauces">Sauces</option>
                      <option value="bakery">Bakery</option>
                    </>
                  )}
                </select>
              </div>

              {/* Dynamic Inputs based on active module: ROX vs Inventory */}
              {activeModule === 'rox' ? (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">
                        Open Date
                      </label>
                      <input
                        type="date"
                        value={newItemOpenDate}
                        onChange={(e) => setNewItemOpenDate(e.target.value)}
                        required
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:bg-white focus:border-indigo-600 cursor-pointer"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">
                        Days
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={newItemDays}
                        onChange={(e) => setNewItemDays(e.target.value)}
                        placeholder="e.g. 21"
                        required
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:bg-white focus:border-indigo-600"
                      />
                    </div>
                  </div>

                  {/* Calculated Close Date (Expiry) & Status Preview Card */}
                  <div className="grid grid-cols-2 gap-3 p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80">
                    <div>
                      <span className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
                        Close Date (Expiry)
                      </span>
                      <span className="text-sm font-black text-slate-800 font-mono">
                        {formatDateDisplay(computeCloseDate(newItemOpenDate, parseInt(newItemDays) || 0))}
                      </span>
                    </div>
                    <div>
                      <span className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
                        Status Preview
                      </span>
                      {(() => {
                        const calculatedClose = computeCloseDate(newItemOpenDate, parseInt(newItemDays) || 0);
                        const computedSt = computeStatus(calculatedClose);
                        return (
                          <span className={`inline-block mt-0.5 px-2.5 py-0.5 rounded-full text-xs font-extrabold border ${
                            computedSt === 'Active'
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                              : 'bg-red-100 text-red-800 border-red-200'
                          }`}>
                            {computedSt}
                          </span>
                        );
                      })()}
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {/* Quantities Row for Inventory */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">
                        FR QTY
                      </label>
                      <input
                        type="number"
                        value={newItemFrQty}
                        onChange={(e) => setNewItemFrQty(e.target.value)}
                        placeholder="e.g. 50"
                        required
                        min="0"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:bg-white focus:border-blue-600"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">
                        BK QTY
                      </label>
                      <input
                        type="number"
                        value={newItemBkQty}
                        onChange={(e) => setNewItemBkQty(e.target.value)}
                        placeholder="e.g. 20"
                        required
                        min="0"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:bg-white focus:border-blue-600"
                      />
                    </div>
                  </div>

                  {/* Status for Inventory */}
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">
                      Status
                    </label>
                    <select
                      value={newItemStatus}
                      onChange={(e) => setNewItemStatus(e.target.value as any)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:bg-white focus:border-blue-600"
                    >
                      <option value="In Stock">In Stock</option>
                      <option value="Low Stock">Low Stock</option>
                      <option value="Out of Stock">Out of Stock</option>
                    </select>
                  </div>
                </>
              )}

              {/* Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-500/20 transition-all"
                >
                  Save Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="w-full border-t border-slate-200/80 bg-white py-4 px-6 text-center text-xs font-semibold text-slate-400 mt-auto">
        Infenitz © {new Date().getFullYear()} — Build • Learn • Grow
      </footer>
    </div>
  );
};
