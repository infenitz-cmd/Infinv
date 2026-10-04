import React, { useState, useEffect, useMemo } from 'react';
import {
  Clock,
  Calendar as CalendarIcon,
  CheckCircle2,
  XCircle,
  LogIn,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Check,
  Award,
  Users,
  Search,
  Timer,
  ChevronDown
} from 'lucide-react';
import { getStoredUsers, ROLE_DEFINITIONS } from '../lib/userStore';
import type { UserAccount, UserRole } from '../lib/userStore';

interface UserAttendanceProps {
  username: string;
  userRole?: UserRole;
}

export interface AttendanceRecord {
  date: string; // YYYY-MM-DD
  status: 'Present' | 'Absent';
  checkInTime?: string;
  checkOutTime?: string;
  duration?: string;
}

interface StoredAttendanceData {
  [userKey: string]: {
    [dateStr: string]: AttendanceRecord;
  };
}

const STORAGE_KEY = 'infenitz_user_attendance_v2';

// Helper to format date as YYYY-MM-DD
function toDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// Convert "08:45 AM" or "05:15 PM" to minutes from midnight
function parseTimeToMinutes(timeStr: string): number | null {
  if (!timeStr) return null;
  const match = timeStr.trim().match(/^(\d{1,2}):(\d{2})(?::\d{2})?\s*(AM|PM)?$/i);
  if (!match) return null;

  let hour = parseInt(match[1], 10);
  const min = parseInt(match[2], 10);
  const period = match[3]?.toUpperCase();

  if (period === 'PM' && hour < 12) hour += 12;
  if (period === 'AM' && hour === 12) hour = 0;

  return hour * 60 + min;
}

// Compute logged hours string e.g. "8 hrs 30 mins"
export function calculateLoggedHours(
  checkIn?: string,
  checkOut?: string,
  isToday?: boolean,
  currentTime?: Date
): { text: string; totalMinutes: number; isInProgress: boolean } {
  if (!checkIn) {
    return { text: '0 hrs', totalMinutes: 0, isInProgress: false };
  }

  const inMins = parseTimeToMinutes(checkIn);
  if (inMins === null) return { text: '0 hrs', totalMinutes: 0, isInProgress: false };

  let outMins: number | null = null;
  let isInProgress = false;

  if (checkOut) {
    outMins = parseTimeToMinutes(checkOut);
  } else if (isToday && currentTime) {
    outMins = currentTime.getHours() * 60 + currentTime.getMinutes();
    isInProgress = true;
  }

  if (outMins === null || outMins < inMins) {
    // Default standard shift if not completed
    return { text: '8 hrs 30 mins', totalMinutes: 510, isInProgress };
  }

  const diff = outMins - inMins;
  const h = Math.floor(diff / 60);
  const m = diff % 60;

  if (h === 0 && m === 0) {
    return { text: '< 1 min', totalMinutes: 0, isInProgress };
  }

  const parts: string[] = [];
  if (h > 0) parts.push(`${h} hr${h > 1 ? 's' : ''}`);
  if (m > 0) parts.push(`${m} min${m > 1 ? 's' : ''}`);

  return {
    text: parts.join(' ') + (isInProgress ? ' (In Progress)' : ''),
    totalMinutes: diff,
    isInProgress
  };
}

// Generate realistic initial past attendance for the current month so the calendar is immediately populated
function generateInitialRecords(targetUsername: string): { [dateStr: string]: AttendanceRecord } {
  const records: { [dateStr: string]: AttendanceRecord } = {};
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();

  for (let day = 1; day < today.getDate(); day++) {
    const curDate = new Date(year, month, day);
    const dayOfWeek = curDate.getDay();
    const dateKey = toDateKey(curDate);

    // Skip Sundays
    if (dayOfWeek === 0) continue;

    // Deterministic pseudo-random pattern
    const isAbsent = (day + targetUsername.length) % 7 === 0;

    if (isAbsent) {
      records[dateKey] = {
        date: dateKey,
        status: 'Absent'
      };
    } else {
      const inHour = 8 + (day % 2);
      const inMin = 45 + ((day * 7) % 15);
      const outHour = 17 + (day % 2);
      const outMin = 15 + ((day * 9) % 25);

      const checkIn = `${String(inHour).padStart(2, '0')}:${String(inMin).padStart(2, '0')} AM`;
      const checkOut = `${String(outHour - 12).padStart(2, '0')}:${String(outMin).padStart(2, '0')} PM`;

      records[dateKey] = {
        date: dateKey,
        status: 'Present',
        checkInTime: checkIn,
        checkOutTime: checkOut,
        duration: '8h 30m'
      };
    }
  }

  return records;
}

export const UserAttendance: React.FC<UserAttendanceProps> = ({ username, userRole }) => {
  const isAdmin = userRole === 'Admin';

  // Live Digital Clock
  const [currentTime, setCurrentTime] = useState<Date>(new Date());

  // All registered users in system
  const [availableUsers, setAvailableUsers] = useState<UserAccount[]>(() => {
    const all = getStoredUsers();
    // In admin mode, list non-admin staff first or all users
    return all;
  });

  // Selected User for attendance inspection (defaults to first staff/manager if admin, or current user)
  const [selectedUsername, setSelectedUsername] = useState<string>(() => {
    if (isAdmin) {
      const all = getStoredUsers();
      const firstStaff = all.find((u) => u.role !== 'Admin') || all[0];
      return firstStaff ? firstStaff.username : username;
    }
    return username;
  });

  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Calendar View Month & Year
  const [viewDate, setViewDate] = useState<Date>(new Date());
  const [hoveredDateKey, setHoveredDateKey] = useState<string | null>(null);
  const [selectedDayRecord, setSelectedDayRecord] = useState<AttendanceRecord | null>(null);

  // Storage data state for all users
  const [allAttendanceData, setAllAttendanceData] = useState<StoredAttendanceData>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        return JSON.parse(raw);
      }
    } catch {
      // ignore
    }
    return {};
  });

  // Listen to storage changes from other tabs or updates
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        try {
          setAllAttendanceData(JSON.parse(e.newValue));
        } catch {}
      }
      if (e.key === 'infenitz_system_users' && e.newValue) {
        try {
          setAvailableUsers(JSON.parse(e.newValue));
        } catch {}
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  // Ensure selected user has records generated if missing
  const currentUserAttendance = useMemo(() => {
    if (allAttendanceData[selectedUsername]) {
      return allAttendanceData[selectedUsername];
    }
    const initial = generateInitialRecords(selectedUsername);
    const updated = {
      ...allAttendanceData,
      [selectedUsername]: initial
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {}
    return initial;
  }, [allAttendanceData, selectedUsername]);

  // Clock interval
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Selected User Object
  const selectedUserObject = useMemo(() => {
    return availableUsers.find((u) => u.username.toLowerCase() === selectedUsername.toLowerCase());
  }, [availableUsers, selectedUsername]);

  // Filtered Users for Admin selection
  const filteredUsers = useMemo(() => {
    const q = userSearchQuery.toLowerCase().trim();
    if (!q) return availableUsers;
    return availableUsers.filter(
      (u) =>
        u.name.toLowerCase().includes(q) ||
        u.username.toLowerCase().includes(q) ||
        u.role.toLowerCase().includes(q)
    );
  }, [availableUsers, userSearchQuery]);

  // Persist record helper
  const saveAttendanceRecord = (newRecords: { [dateStr: string]: AttendanceRecord }) => {
    const updated = {
      ...allAttendanceData,
      [selectedUsername]: newRecords
    };
    setAllAttendanceData(updated);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (err) {
      console.error('Failed to persist attendance:', err);
    }
  };

  const todayKey = toDateKey(currentTime);
  const todayRecord = currentUserAttendance[todayKey];

  // Determine today's check-in status
  const isCheckedIn = Boolean(todayRecord && todayRecord.checkInTime && !todayRecord.checkOutTime);
  const isCheckedOut = Boolean(todayRecord && todayRecord.checkOutTime);

  // Handle Check In Click (for the user)
  const handleCheckIn = () => {
    const timeStr = currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
    const updated: AttendanceRecord = {
      date: todayKey,
      status: 'Present',
      checkInTime: timeStr
    };
    const newRecords = {
      ...currentUserAttendance,
      [todayKey]: updated
    };
    saveAttendanceRecord(newRecords);
  };

  // Handle Check Out Click (for the user)
  const handleCheckOut = () => {
    if (!todayRecord) return;
    const timeStr = currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
    const updated: AttendanceRecord = {
      ...todayRecord,
      checkOutTime: timeStr,
      duration: 'In Progress'
    };
    const newRecords = {
      ...currentUserAttendance,
      [todayKey]: updated
    };
    saveAttendanceRecord(newRecords);
  };

  // Calendar calculations
  const viewYear = viewDate.getFullYear();
  const viewMonth = viewDate.getMonth();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay();

  const prevMonth = () => setViewDate(new Date(viewYear, viewMonth - 1, 1));
  const nextMonth = () => setViewDate(new Date(viewYear, viewMonth + 1, 1));
  const goToToday = () => setViewDate(new Date());

  // Monthly stats for selected user
  const monthStats = useMemo(() => {
    let presentCount = 0;
    let absentCount = 0;
    let totalMinutesLogged = 0;
    const today = new Date();

    for (let day = 1; day <= daysInMonth; day++) {
      const dateObj = new Date(viewYear, viewMonth, day);
      if (dateObj > today) continue;

      const key = toDateKey(dateObj);
      const rec = currentUserAttendance[key];

      if (rec) {
        if (rec.status === 'Present') {
          presentCount++;
          const isTodayDate = key === todayKey;
          const { totalMinutes } = calculateLoggedHours(rec.checkInTime, rec.checkOutTime, isTodayDate, currentTime);
          totalMinutesLogged += totalMinutes;
        } else if (rec.status === 'Absent') {
          absentCount++;
        }
      } else {
        if (dateObj < today && dateObj.getDay() !== 0) {
          absentCount++;
        }
      }
    }

    const totalDays = presentCount + absentCount;
    const rate = totalDays > 0 ? Math.round((presentCount / totalDays) * 100) : 100;
    const totalHours = (totalMinutesLogged / 60).toFixed(1);

    return {
      presentCount,
      absentCount,
      rate,
      totalHours
    };
  }, [currentUserAttendance, viewYear, viewMonth, daysInMonth, currentTime, todayKey]);

  // Digital clock time parts
  const hours = currentTime.toLocaleTimeString([], { hour: '2-digit', hour12: true }).split(' ')[0];
  const minutes = String(currentTime.getMinutes()).padStart(2, '0');
  const seconds = String(currentTime.getSeconds()).padStart(2, '0');
  const ampm = currentTime.toLocaleTimeString([], { hour12: true }).slice(-2);
  const formattedDate = currentTime.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* ========================================================================= */}
      {/* ADMIN CONTROLS: SELECT USER TO VIEW THEIR ATTENDANCE */}
      {/* ========================================================================= */}
      {isAdmin ? (
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-md space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-700 to-indigo-800 text-white flex items-center justify-center shadow-lg shadow-indigo-900/20">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900 tracking-tight">Staff Attendance Inspector</h3>
                <p className="text-xs text-slate-500 font-medium">
                  Select any employee to view their attendance history, logged hours, and presence calendar.
                </p>
              </div>
            </div>

            {/* Quick Live System Clock in Corner */}
            <div className="px-4 py-2 rounded-2xl bg-slate-50 border border-slate-200 text-right">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">System Time</span>
              <span className="font-mono text-sm font-black text-slate-900">{currentTime.toLocaleTimeString()}</span>
            </div>
          </div>

          {/* User Selector Dropdown & Search */}
          <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                Select Employee:
              </label>

              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="w-full px-4 py-3 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-2xl flex items-center justify-between transition-all text-left group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-extrabold text-xs flex items-center justify-center flex-shrink-0">
                      {selectedUserObject ? selectedUserObject.name.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <div className="truncate">
                      <div className="font-bold text-sm text-slate-900 truncate">
                        {selectedUserObject?.name || selectedUsername}
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono">@{selectedUsername}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {selectedUserObject && (
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-700">
                        {selectedUserObject.role}
                      </span>
                    )}
                    <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-transform" />
                  </div>
                </button>

                {/* Dropdown Menu */}
                {isDropdownOpen && (
                  <div className="absolute left-0 right-0 top-full mt-2 bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 p-2 space-y-2 animate-fadeIn max-h-72 overflow-y-auto">
                    <div className="relative px-1">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={userSearchQuery}
                        onChange={(e) => setUserSearchQuery(e.target.value)}
                        placeholder="Search by employee name or username..."
                        className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-blue-600"
                        autoFocus
                      />
                    </div>

                    <div className="divide-y divide-slate-100">
                      {filteredUsers.map((u) => {
                        const isChosen = u.username.toLowerCase() === selectedUsername.toLowerCase();
                        const def = ROLE_DEFINITIONS[u.role] || ROLE_DEFINITIONS.Staff;
                        return (
                          <div
                            key={u.id}
                            onClick={() => {
                              setSelectedUsername(u.username);
                              setIsDropdownOpen(false);
                            }}
                            className={`p-2.5 rounded-xl cursor-pointer flex items-center justify-between transition-colors ${
                              isChosen ? 'bg-blue-50 text-blue-900 font-bold' : 'hover:bg-slate-50 text-slate-700'
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              <div className="w-7 h-7 rounded-lg bg-slate-800 text-white font-bold text-xs flex items-center justify-center">
                                {u.name.charAt(0)}
                              </div>
                              <div>
                                <div className="text-xs font-bold leading-tight">{u.name}</div>
                                <div className="text-[10px] text-slate-400 font-mono">@{u.username}</div>
                              </div>
                            </div>

                            <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md ${def.badgeBg} ${def.badgeText}`}>
                              {u.role}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Metrics of Selected Employee */}
            <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
              <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-100 text-center min-w-[90px]">
                <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">Present</span>
                <span className="text-lg font-black text-emerald-800">{monthStats.presentCount} Days</span>
              </div>
              <div className="p-3 rounded-2xl bg-red-50 border border-red-100 text-center min-w-[90px]">
                <span className="text-[10px] font-bold text-red-700 uppercase tracking-wider block">Absent</span>
                <span className="text-lg font-black text-red-800">{monthStats.absentCount} Days</span>
              </div>
              <div className="p-3 rounded-2xl bg-blue-50 border border-blue-100 text-center min-w-[100px]">
                <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider block">Logged Hours</span>
                <span className="text-lg font-black text-blue-800">{monthStats.totalHours} hrs</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* ========================================================================= */
        /* REGULAR USER VIEW: DIGITAL CLOCK & CHECK-IN / CHECK-OUT */
        /* ========================================================================= */
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-md relative overflow-hidden">
          <div className="absolute -top-16 -right-16 w-56 h-56 bg-emerald-100/60 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-16 -left-16 w-56 h-56 bg-blue-100/60 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col items-center text-center space-y-5">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-100 text-slate-700 text-xs font-bold tracking-wide uppercase">
              <Clock className="w-3.5 h-3.5 text-blue-600 animate-pulse" />
              <span>Live System Time & Shift Portal</span>
            </div>

            {/* Large Digital Clock */}
            <div className="space-y-1">
              <div className="flex items-baseline justify-center gap-1 sm:gap-2 font-mono tracking-tight text-slate-900">
                <span className="text-5xl sm:text-7xl font-black">{hours}</span>
                <span className="text-4xl sm:text-6xl font-light text-slate-400 animate-pulse">:</span>
                <span className="text-5xl sm:text-7xl font-black">{minutes}</span>
                <span className="text-4xl sm:text-6xl font-light text-slate-400 animate-pulse">:</span>
                <span className="text-4xl sm:text-6xl font-extrabold text-blue-600">{seconds}</span>
                <span className="text-xl sm:text-2xl font-black text-slate-500 ml-2 uppercase">{ampm}</span>
              </div>
              <p className="text-slate-500 font-semibold text-sm sm:text-base">{formattedDate}</p>
            </div>

            {/* Today's Check-in Status Banner */}
            {todayRecord && (
              <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700">
                {todayRecord.checkInTime && (
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                    <span>Checked In: <strong className="text-slate-900">{todayRecord.checkInTime}</strong></span>
                  </div>
                )}
                {todayRecord.checkOutTime && (
                  <div className="flex items-center gap-1.5 ml-3 pl-3 border-l border-slate-200">
                    <Check className="w-3.5 h-3.5 text-blue-600" />
                    <span>Checked Out: <strong className="text-slate-900">{todayRecord.checkOutTime}</strong></span>
                  </div>
                )}
              </div>
            )}

            {/* Check In / Check Out Primary Button */}
            <div className="w-full max-w-sm pt-2">
              {!isCheckedIn && !isCheckedOut && (
                <button
                  type="button"
                  onClick={handleCheckIn}
                  className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 active:scale-98 text-white font-extrabold text-base shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-3 transition-all cursor-pointer group"
                >
                  <LogIn className="w-5 h-5 transition-transform group-hover:translate-x-0.5" />
                  <span>Check In</span>
                </button>
              )}

              {isCheckedIn && (
                <button
                  type="button"
                  onClick={handleCheckOut}
                  className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-amber-600 to-rose-600 hover:from-amber-700 hover:to-rose-700 active:scale-98 text-white font-extrabold text-base shadow-lg shadow-rose-600/30 flex items-center justify-center gap-3 transition-all cursor-pointer group"
                >
                  <LogOut className="w-5 h-5 transition-transform group-hover:translate-x-0.5" />
                  <span>Check Out</span>
                </button>
              )}

              {isCheckedOut && (
                <div className="w-full py-3.5 px-6 rounded-2xl bg-emerald-50 border-2 border-emerald-500 text-emerald-800 font-extrabold text-sm flex items-center justify-center gap-2 shadow-xs">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <span>Attendance Recorded for Today</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ATTENDANCE CALENDAR (GREEN = PRESENT, RED = ABSENT) WITH HOVER LOGGED HOURS */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-md space-y-6">
        {/* Calendar Month Header & Navigation */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <CalendarIcon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-black text-slate-900 tracking-tight">
                  {monthNames[viewMonth]} {viewYear}
                </h3>
                {isAdmin && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800">
                    Viewing: {selectedUserObject?.name || selectedUsername}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 font-medium">
                {isAdmin
                  ? 'Hover over any date to inspect employee logged-in hours and shift times.'
                  : 'Monthly attendance history. Hover over any date to view your logged-in hours.'}
              </p>
            </div>
          </div>

          {/* Month Switcher Controls */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={goToToday}
              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors"
            >
              Today
            </button>
            <div className="flex items-center bg-slate-100 rounded-xl p-1">
              <button
                type="button"
                onClick={prevMonth}
                title="Previous Month"
                className="p-1.5 rounded-lg hover:bg-white text-slate-700 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={nextMonth}
                title="Next Month"
                className="p-1.5 rounded-lg hover:bg-white text-slate-700 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Legend Indicators */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs bg-slate-50 p-3 rounded-2xl border border-slate-100">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded-lg bg-emerald-600 flex items-center justify-center text-white text-[10px] font-bold">✓</span>
              <span className="font-bold text-slate-700">Present (Green)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded-lg bg-red-500 flex items-center justify-center text-white text-[10px] font-bold">✕</span>
              <span className="font-bold text-slate-700">Absent (Red)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded-lg bg-slate-200 border border-slate-300"></span>
              <span className="text-slate-400 font-medium">Future / Weekend</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-emerald-600" />
            <span className="font-bold text-slate-700">Attendance Rate:</span>
            <span className="font-black text-emerald-700">{monthStats.rate}%</span>
          </div>
        </div>

        {/* Calendar Grid */}
        <div>
          {/* Day of week headers */}
          <div className="grid grid-cols-7 gap-2 mb-2 text-center text-xs font-black text-slate-400 uppercase tracking-wider">
            <span>Sun</span>
            <span>Mon</span>
            <span>Tue</span>
            <span>Wed</span>
            <span>Thu</span>
            <span>Fri</span>
            <span>Sat</span>
          </div>

          {/* Month Days Matrix */}
          <div className="grid grid-cols-7 gap-2">
            {/* Empty padding cells before first day of month */}
            {Array.from({ length: firstDayOfWeek }).map((_, idx) => (
              <div key={`empty-${idx}`} className="h-16 sm:h-20 rounded-2xl bg-slate-50/40 border border-transparent" />
            ))}

            {/* Days of current viewed month */}
            {Array.from({ length: daysInMonth }).map((_, idx) => {
              const dayNum = idx + 1;
              const dateObj = new Date(viewYear, viewMonth, dayNum);
              const dateKey = toDateKey(dateObj);
              const isToday = dateKey === todayKey;
              const isFuture = dateObj > currentTime;
              const isSunday = dateObj.getDay() === 0;

              const record = currentUserAttendance[dateKey];
              const isPresent = record?.status === 'Present';
              const isAbsent = record?.status === 'Absent' || (!record && !isFuture && !isSunday && dateObj < currentTime);

              // Calculate logged hours for this date
              const hoursCalculation = calculateLoggedHours(
                record?.checkInTime,
                record?.checkOutTime,
                isToday,
                currentTime
              );

              // Styling: Present = Green, Absent = Red
              let cellBg = 'bg-slate-50 border-slate-200/80 text-slate-700 hover:bg-slate-100';
              let badgeElement = null;

              if (isFuture) {
                cellBg = 'bg-slate-50/50 border-slate-100 text-slate-400 cursor-default';
              } else if (isSunday) {
                cellBg = 'bg-slate-100/50 border-slate-200/50 text-slate-400';
                badgeElement = <span className="text-[10px] text-slate-400 font-semibold">Off</span>;
              } else if (isPresent) {
                // Present in Green
                cellBg = 'bg-emerald-500 border-emerald-600 text-white shadow-md shadow-emerald-500/20';
                badgeElement = (
                  <div className="flex items-center gap-1 text-[11px] font-extrabold text-emerald-100">
                    <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                    <span className="hidden sm:inline">Present</span>
                  </div>
                );
              } else if (isAbsent) {
                // Absent in Red
                cellBg = 'bg-red-500 border-red-600 text-white shadow-md shadow-red-500/20';
                badgeElement = (
                  <div className="flex items-center gap-1 text-[11px] font-extrabold text-red-100">
                    <XCircle className="w-3.5 h-3.5 text-white" />
                    <span className="hidden sm:inline">Absent</span>
                  </div>
                );
              }

              const isHovered = hoveredDateKey === dateKey;

              return (
                <div
                  key={dateKey}
                  onMouseEnter={() => setHoveredDateKey(dateKey)}
                  onMouseLeave={() => setHoveredDateKey(null)}
                  onClick={() => {
                    if (record) setSelectedDayRecord(record);
                    else if (isAbsent) setSelectedDayRecord({ date: dateKey, status: 'Absent' });
                  }}
                  className={`h-16 sm:h-20 p-1.5 sm:p-2.5 rounded-2xl border flex flex-col justify-between items-start transition-all relative group cursor-pointer ${cellBg} ${
                    isToday ? 'ring-2 sm:ring-4 ring-blue-500/40 font-black' : ''
                  }`}
                >
                  {/* Top row in tile */}
                  <div className="w-full flex items-center justify-between">
                    <span className={`text-xs sm:text-sm font-black ${isPresent || isAbsent ? 'text-white' : 'text-slate-800'}`}>
                      {dayNum}
                    </span>
                    {isToday && (
                      <span className="px-1.5 py-0.5 text-[9px] font-black rounded-md bg-white text-blue-700 shadow-2xs">
                        Today
                      </span>
                    )}
                  </div>

                  {/* Tile Badge */}
                  <div className="w-full">{badgeElement}</div>

                  {/* ======================================================= */}
                  {/* HOVER TOOLTIP DISPLAYING LOGGED IN HOURS & SHIFT TIMES */}
                  {/* ======================================================= */}
                  {isHovered && !isFuture && !isSunday && (
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2.5 z-50 w-52 sm:w-60 p-3 bg-slate-900/95 backdrop-blur-md text-white rounded-2xl shadow-2xl border border-slate-700 text-left pointer-events-none animate-fadeIn">
                      {/* Tooltip Header Date */}
                      <div className="text-[11px] font-bold text-slate-300 border-b border-slate-800 pb-1.5 mb-2 flex items-center justify-between">
                        <span>{dateObj.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-extrabold ${
                            isPresent ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                          }`}
                        >
                          {isPresent ? 'Present' : 'Absent'}
                        </span>
                      </div>

                      {/* Logged in Hours Highlight */}
                      <div className="space-y-1.5 text-xs">
                        <div className="flex items-center gap-2">
                          <Timer className="w-4 h-4 text-blue-400 flex-shrink-0" />
                          <div>
                            <span className="text-[10px] text-slate-400 font-semibold uppercase block">Logged In Hours:</span>
                            <span className="font-black text-sm text-white">
                              {isPresent ? hoursCalculation.text : '0 hrs (Absent)'}
                            </span>
                          </div>
                        </div>

                        {/* Check-In / Check-Out Times */}
                        {isPresent && record?.checkInTime && (
                          <div className="pt-1.5 mt-1 border-t border-slate-800/80 text-[11px] text-slate-300 space-y-0.5">
                            <div className="flex items-center justify-between">
                              <span className="text-slate-400">Check-in:</span>
                              <span className="font-mono font-bold text-emerald-400">{record.checkInTime}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-slate-400">Check-out:</span>
                              <span className="font-mono font-bold text-blue-400">
                                {record.checkOutTime || 'Active Shift'}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Tooltip Downward Arrow */}
                      <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900/95" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Day Details Drawer when clicked */}
        {selectedDayRecord && (
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fadeIn">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center text-white ${
                  selectedDayRecord.status === 'Present' ? 'bg-emerald-600' : 'bg-red-500'
                }`}
              >
                {selectedDayRecord.status === 'Present' ? (
                  <CheckCircle2 className="w-5 h-5" />
                ) : (
                  <XCircle className="w-5 h-5" />
                )}
              </div>
              <div>
                <div className="font-extrabold text-sm text-slate-900">
                  {new Date(selectedDayRecord.date + 'T00:00:00').toLocaleDateString(undefined, {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </div>
                <div className="text-xs text-slate-600 flex flex-wrap items-center gap-2 mt-0.5">
                  <span className="font-bold">Status:</span>
                  <span
                    className={`font-black ${
                      selectedDayRecord.status === 'Present' ? 'text-emerald-700' : 'text-red-600'
                    }`}
                  >
                    {selectedDayRecord.status}
                  </span>

                  {selectedDayRecord.status === 'Present' && (
                    <>
                      <span>•</span>
                      <span>
                        Logged Hours:{' '}
                        <strong className="text-slate-900">
                          {calculateLoggedHours(selectedDayRecord.checkInTime, selectedDayRecord.checkOutTime).text}
                        </strong>
                      </span>
                      {selectedDayRecord.checkInTime && (
                        <span>• In: <strong>{selectedDayRecord.checkInTime}</strong></span>
                      )}
                      {selectedDayRecord.checkOutTime && (
                        <span>• Out: <strong>{selectedDayRecord.checkOutTime}</strong></span>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setSelectedDayRecord(null)}
              className="px-3.5 py-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-xl shadow-xs"
            >
              Dismiss
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
