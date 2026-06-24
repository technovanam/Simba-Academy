import { useCallback, useEffect, useRef, useState } from "react";
import {
  api,
  ApiError,
  type AuthUser,
  type AccountStatus,
  type TeacherListFilter,
  type UserListFilter,
  type UserListSort,
} from "../lib/api";
import { isActionBusy } from "../lib/actionGuard";
import { AdminModal } from "./AdminModal";
import { ConfirmDialog } from "./ConfirmDialog";
import { AccountStatusBadge } from "./AccountStatusBadge";
import { ThemeSelect } from "./ThemeSelect";
import { AdminPageBody, AdminPageHeader, AdminPageShell } from "./AdminPageShell";
import { adminListContainerClass, adminListRowStackClass } from "./AdminListUi";
import { STUDENT_CLASS_OPTIONS } from "../lib/constants";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Lock,
  Mail,
  Pencil,
  Phone,
  Search,
  Trash2,
  Unlock,
  UserPlus,
} from "lucide-react";

const PAGE_SIZE = 5;

function buildPageNumbers(current: number, total: number): (number | "ellipsis")[] {
  if (total <= 1) return total === 1 ? [1] : [];
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  const pages: (number | "ellipsis")[] = [1];
  if (current > 3) pages.push("ellipsis");
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  for (let p = start; p <= end; p++) pages.push(p);
  if (current < total - 2) pages.push("ellipsis");
  pages.push(total);
  return pages;
}

type PanelMode = "users" | "teachers";

interface AdminPeoplePanelProps {
  mode: PanelMode;
  token: string;
  currentUserId?: string;
  onNotify: (message: string) => void;
  onError: (message: string) => void;
}

const USER_FILTERS: { id: UserListFilter; label: string }[] = [
  { id: "ALL", label: "All Students" },
  { id: "ACTIVE", label: "Active Students" },
  { id: "DEACTIVATED", label: "Deactivated Students" },
];

const TEACHER_FILTERS: { id: TeacherListFilter; label: string }[] = [
  { id: "ALL", label: "All Teachers" },
  { id: "ACTIVE", label: "Active" },
  { id: "DEACTIVATED", label: "Deactivated" },
];

const SORT_OPTIONS: { id: UserListSort; label: string }[] = [
  { id: "NEWEST", label: "Newest First" },
  { id: "OLDEST", label: "Oldest First" },
  { id: "NAME_ASC", label: "Name A–Z" },
  { id: "NAME_DESC", label: "Name Z–A" },
];

const emptyTeacherForm = { firstName: "", lastName: "", email: "", phone: "", studentClass: "" };

const CLASS_FILTER_OPTIONS = [
  { id: "ALL", label: "All Classes" },
  ...STUDENT_CLASS_OPTIONS,
];

function PillSelect<T extends string>({
  value,
  options,
  onChange,
  ariaLabel,
  align = "left",
}: {
  value: T;
  options: { id: T; label: string }[];
  onChange: (id: T) => void;
  ariaLabel: string;
  align?: "left" | "right";
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = options.find((o) => o.id === value);

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [open]);

  return (
    <div ref={ref} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={ariaLabel}
        aria-expanded={open}
        aria-haspopup="listbox"
        className="inline-flex items-center gap-1.5 pl-3.5 pr-2.5 py-2 rounded-full border border-[#8AC926] bg-white text-xs font-bold text-slate-800 hover:bg-[#8AC926]/5 transition min-w-[128px] max-w-[168px] justify-between leading-none"
      >
        <span className="truncate leading-none">{selected?.label}</span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-700 shrink-0 block transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <ul
          role="listbox"
          aria-label={ariaLabel}
          className={`absolute ${align === "right" ? "left-0 right-auto sm:right-0 sm:left-auto" : "left-0"} top-[calc(100%+6px)] z-30 min-w-[168px] py-1.5 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden`}
        >
          {options.map((o) => (
            <li key={o.id} role="option" aria-selected={o.id === value}>
              <button
                type="button"
                onClick={() => {
                  onChange(o.id);
                  setOpen(false);
                }}
                className={`w-full text-left px-3.5 py-2.5 text-xs font-bold transition ${o.id === value
                    ? "bg-[#8AC926]/15 text-[#5a8218]"
                    : "text-slate-700 hover:bg-slate-50"
                  }`}
              >
                {o.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function AdminPeoplePanel({
  mode,
  token,
  currentUserId,
  onNotify,
  onError,
}: AdminPeoplePanelProps) {
  const [records, setRecords] = useState<AuthUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [userFilter, setUserFilter] = useState<UserListFilter>("ALL");
  const [teacherFilter, setTeacherFilter] = useState<TeacherListFilter>("ALL");
  const [sort, setSort] = useState<UserListSort>("NEWEST");
  const [classFilter, setClassFilter] = useState<string>("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const [showCreateTeacher, setShowCreateTeacher] = useState(false);
  const [teacherForm, setTeacherForm] = useState(emptyTeacherForm);
  const [editingTeacher, setEditingTeacher] = useState<AuthUser | null>(null);
  const [editForm, setEditForm] = useState(emptyTeacherForm);

  const [deleteTarget, setDeleteTarget] = useState<AuthUser | null>(null);
  const [statusToggleTarget, setStatusToggleTarget] = useState<AuthUser | null>(null);

  const loadRecords = useCallback(async () => {
    setLoading(true);
    try {
      if (mode === "users") {
        const data = await api.getUsers(token, {
          search: search.trim() || undefined,
          filter: userFilter,
          sort,
        });
        setRecords(data.filter((u) => u.role === "STUDENT"));
      } else {
        const data = await api.getTeachers(token, {
          search: search.trim() || undefined,
          filter: teacherFilter,
          sort,
        });
        setRecords(data);
      }
    } catch (err) {
      onError(err instanceof ApiError ? err.message : "Failed to load accounts.");
    } finally {
      setLoading(false);
    }
  }, [token, mode, search, userFilter, teacherFilter, sort, onError]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadRecords();
    }, 250);
    return () => clearTimeout(timer);
  }, [loadRecords]);

  useEffect(() => {
    setCurrentPage(1);
    setClassFilter("ALL");
  }, [search, userFilter, teacherFilter, sort, mode]);

  const filteredRecords = records.filter((u) => {
    if (mode === "users" && classFilter !== "ALL") {
      return u.studentClass === classFilter;
    }
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filteredRecords.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const pageStart = (safePage - 1) * pageSize;
  const paginatedRecords = filteredRecords;
  const pageNumbers = buildPageNumbers(safePage, totalPages);
  const rangeStart = filteredRecords.length === 0 ? 0 : pageStart + 1;
  const rangeEnd = Math.min(pageStart + pageSize, filteredRecords.length);

  const isCreatingTeacher = actionLoading === "teacher-create";
  const isTeacherFormReady =
    teacherForm.firstName.trim().length > 0 &&
    teacherForm.lastName.trim().length > 0 &&
    teacherForm.email.trim().length > 0;

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  async function handleToggleStatus(user: AuthUser) {
    if (isActionBusy(actionLoading)) return;
    const next: AccountStatus = user.status === "ACTIVE" ? "DEACTIVATED" : "ACTIVE";
    setActionLoading(`status-${user.id}`);
    try {
      const updated =
        mode === "teachers"
          ? await api.updateTeacher(token, user.id, { status: next })
          : await api.updateUser(token, user.id, { status: next });
      setRecords((prev) => prev.map((r) => (r.id === user.id ? { ...r, ...updated } : r)));
      onNotify(`User account ${next === "ACTIVE" ? "activated" : "deactivated"} successfully.`);
    } catch (err) {
      onError(err instanceof ApiError ? err.message : "Failed to update status.");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleDeleteConfirmed() {
    if (!deleteTarget || isActionBusy(actionLoading)) return;
    setActionLoading(`delete-${deleteTarget.id}`);
    try {
      await api.deleteUser(token, deleteTarget.id);
      setRecords((prev) => prev.filter((r) => r.id !== deleteTarget.id));
      onNotify(
        mode === "teachers"
          ? "Teacher permanently deleted from the database."
          : "User permanently deleted from the database."
      );
      setDeleteTarget(null);
    } catch (err) {
      onError(err instanceof ApiError ? err.message : "Failed to delete user.");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleSendReset(user: AuthUser) {
    if (isActionBusy(actionLoading)) return;
    setActionLoading(`reset-${user.id}`);
    try {
      if (mode === "teachers") {
        await api.sendTeacherPasswordReset(token, user.id);
      } else {
        await api.sendUserPasswordReset(token, user.id);
      }
      onNotify("Password reset email sent successfully.");
    } catch (err) {
      onError(err instanceof ApiError ? err.message : "Failed to send reset email.");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleCreateTeacher(e: React.FormEvent) {
    e.preventDefault();
    if (isActionBusy(actionLoading)) return;
    if (!teacherForm.firstName.trim()) {
      onError("Please enter first name.");
      return;
    }
    if (!teacherForm.lastName.trim()) {
      onError("Please enter last name.");
      return;
    }
    if (!teacherForm.email.trim()) {
      onError("Please enter the teacher's email address.");
      return;
    }
    if (!teacherForm.phone.trim()) {
      onError("Please enter contact number.");
      return;
    }
    if (teacherForm.phone.trim().length < 7) {
      onError("Please enter a valid phone number (at least 7 digits).");
      return;
    }
    if (!teacherForm.studentClass) {
      onError("Please select an assigned class.");
      return;
    }
    setActionLoading("teacher-create");
    try {
      const created = await api.createTeacher(token, {
        firstName: teacherForm.firstName.trim(),
        lastName: teacherForm.lastName.trim(),
        email: teacherForm.email.trim(),
        phone: teacherForm.phone.trim(),
        studentClass: teacherForm.studentClass,
      });
      setRecords((prev) => [created, ...prev]);
      if (created.emailSent) {
        onNotify(`Teacher created. Welcome email sent to ${created.email}.`);
      } else {
        onError(
          created.emailWarning ??
          `Teacher ${created.email} was created but the welcome email failed. Check backend terminal for TEMPORARY PASSWORD, or check Resend API key in .env.`
        );
      }
      setTeacherForm(emptyTeacherForm);
      setShowCreateTeacher(false);
    } catch (err) {
      onError(err instanceof ApiError ? err.message : "Failed to create teacher.");
    } finally {
      setActionLoading(null);
    }
  }

  function openEditTeacher(teacher: AuthUser) {
    setEditingTeacher(teacher);
    setEditForm({
      firstName: teacher.firstName ?? teacher.name.split(" ")[0] ?? "",
      lastName: teacher.lastName ?? teacher.name.split(" ").slice(1).join(" ") ?? "",
      email: teacher.email,
      phone: teacher.phone ?? "",
      studentClass: teacher.studentClass ?? "",
    });
  }

  async function handleSaveTeacherEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingTeacher || isActionBusy(actionLoading)) return;
    if (!editForm.firstName.trim()) {
      onError("Please enter first name.");
      return;
    }
    if (!editForm.lastName.trim()) {
      onError("Please enter last name.");
      return;
    }
    if (!editForm.email.trim()) {
      onError("Please enter email address.");
      return;
    }
    if (mode === "teachers" && !editForm.phone.trim()) {
      onError("Please enter contact number.");
      return;
    }
    if (editForm.phone.trim() && editForm.phone.trim().length < 7) {
      onError("Please enter a valid phone number (at least 7 digits).");
      return;
    }
    if (!editForm.studentClass) {
      onError(mode === "teachers" ? "Please select an assigned class." : "Please select a class.");
      return;
    }
    setActionLoading(mode === "teachers" ? "teacher-save" : "student-save");
    try {
      if (mode === "teachers") {
        const updated = await api.updateTeacher(token, editingTeacher.id, {
          firstName: editForm.firstName.trim(),
          lastName: editForm.lastName.trim(),
          email: editForm.email.trim(),
          phone: editForm.phone.trim(),
          studentClass: editForm.studentClass,
        });
        setRecords((prev) => prev.map((r) => (r.id === editingTeacher.id ? { ...r, ...updated } : r)));
        if ((updated as any).emailSent !== undefined) {
          if ((updated as any).emailSent) {
            onNotify(`Teacher profile updated. Welcome email with new temporary password sent to ${updated.email}.`);
          } else {
            onError(
              (updated as any).emailWarning ??
              `Teacher profile updated, but welcome email failed. Check backend terminal for TEMPORARY PASSWORD, or check Resend API key in .env.`
            );
          }
        } else {
          onNotify("Teacher profile updated successfully.");
        }
      } else {
        const updated = await api.updateUser(token, editingTeacher.id, {
          firstName: editForm.firstName.trim(),
          lastName: editForm.lastName.trim(),
          email: editForm.email.trim(),
          phone: editForm.phone.trim() || null,
          studentClass: editForm.studentClass || null,
        });
        setRecords((prev) => prev.map((r) => (r.id === editingTeacher.id ? { ...r, ...updated } : r)));
        onNotify("Student profile updated successfully.");
      }
      setEditingTeacher(null);
    } catch (err) {
      onError(err instanceof ApiError ? err.message : `Failed to update ${mode === "teachers" ? "teacher" : "student"}.`);
    } finally {
      setActionLoading(null);
    }
  }

  const filters = mode === "users" ? USER_FILTERS : TEACHER_FILTERS;

  return (
    <AdminPageShell className="h-full flex flex-col min-h-0 overflow-hidden">
      <AdminPageHeader
        title={mode === "users" ? "Student Management" : "Teacher Management"}
        description={
          mode === "users"
            ? "Search, filter, activate, deactivate, or remove student accounts."
            : "Create staff accounts, edit profiles, and send password reset emails."
        }
        actions={
          <>
            <div className="relative w-full min-w-0 sm:w-[260px] max-w-full">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                placeholder="Search name, email, phone…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 pr-3 py-2 bg-white border border-slate-200 text-slate-900 rounded-full text-xs w-full outline-none focus:border-[#8AC926] placeholder-slate-400 transition-all"
                aria-label="Search name, email, phone, or user ID"
              />
            </div>
            <PillSelect
              value={mode === "users" ? userFilter : teacherFilter}
              options={filters}
              onChange={(id) =>
                mode === "users"
                  ? setUserFilter(id as UserListFilter)
                  : setTeacherFilter(id as TeacherListFilter)
              }
              ariaLabel="Filter accounts"
            />
            {mode === "users" && (
              <PillSelect
                value={classFilter}
                options={CLASS_FILTER_OPTIONS}
                onChange={setClassFilter}
                ariaLabel="Filter by class"
              />
            )}
            <PillSelect
              value={sort}
              options={SORT_OPTIONS}
              onChange={setSort}
              ariaLabel="Sort order"
              align="right"
            />
            {mode === "teachers" && (
              <button
                type="button"
                onClick={() => setShowCreateTeacher(true)}
                className="px-4 py-2 rounded-xl bg-[#8AC926] text-white font-sans font-bold text-xs tracking-wider flex items-center gap-2 hover:bg-[#78B020] transition shadow-md shadow-[#8AC926]/10 whitespace-nowrap"
              >
                <UserPlus className="w-4 h-4" /> Create Teacher
              </button>
            )}
          </>
        }
      />

      <AdminPageBody className="flex-1 min-h-0 flex flex-col overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-[#8AC926]" />
          </div>
        ) : records.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center text-sm font-semibold text-slate-600 border border-slate-200">
            No accounts match your search or filters.
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm flex-1 min-h-0 flex flex-col">
            <div className="hidden md:block overflow-x-auto flex-1 min-h-0 overflow-y-auto modern-scrollbar">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-medium text-xs sticky top-0 z-10">
                  <tr>
                    <th className="px-4 py-3 font-semibold whitespace-nowrap">Name</th>
                    <th className="px-4 py-3 font-semibold whitespace-nowrap">Email</th>
                    <th className="px-4 py-3 font-semibold whitespace-nowrap">Class</th>
                    <th className="px-4 py-3 font-semibold whitespace-nowrap">Phone Number</th>
                    {mode === "users" && <th className="px-4 py-3 font-semibold whitespace-nowrap">Joining Date</th>}
                    {mode === "teachers" && <th className="px-4 py-3 font-semibold whitespace-nowrap">Joined Date</th>}
                    {mode === "teachers" && <th className="px-4 py-3 font-semibold whitespace-nowrap">Strength</th>}
                    <th className="px-4 py-3 font-semibold text-right whitespace-nowrap">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedRecords.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3 align-middle whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {u.role === "ADMIN" && (
                            <span className="px-1.5 py-0.5 rounded text-4xs font-extrabold uppercase border shrink-0 bg-purple-50 text-purple-700 border-purple-200">
                              {u.role}
                            </span>
                          )}
                          <span className="font-bold text-sm text-slate-800">{u.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 align-middle text-xs text-slate-600 font-medium whitespace-nowrap">
                        {u.email}
                      </td>
                      <td className="px-4 py-3 align-middle text-xs text-slate-650 whitespace-nowrap">
                        {u.studentClass ? (
                          <span className="text-[#8AC926] font-bold">{u.studentClass}</span>
                        ) : (
                          <span className="text-slate-450">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 align-middle text-xs text-slate-500 whitespace-nowrap">
                        {u.phone ? u.phone : <span className="text-slate-450">—</span>}
                      </td>
                      {mode === "users" && (
                        <td className="px-4 py-3 align-middle text-xs text-slate-500 whitespace-nowrap">
                          {u.createdAt ? (
                            new Date(u.createdAt).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })
                          ) : (
                            <span className="text-slate-450">—</span>
                          )}
                        </td>
                      )}
                      {mode === "teachers" && (
                        <>
                          <td className="px-4 py-3 align-middle text-xs text-slate-500 whitespace-nowrap">
                            {u.createdAt ? (
                              new Date(u.createdAt).toLocaleDateString("en-IN", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })
                            ) : (
                              <span className="text-slate-450">—</span>
                            )}
                          </td>
                          <td className="px-4 py-3 align-middle text-xs text-slate-500 font-bold whitespace-nowrap">
                            {u.classStrength !== undefined ? u.classStrength : 0}
                          </td>
                        </>
                      )}
                      <td className="px-4 py-2 text-right align-middle whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            disabled={u.id === currentUserId || actionLoading === `status-${u.id}`}
                            onClick={() => setStatusToggleTarget(u)}
                            title={u.status === "ACTIVE" ? "Deactivate account" : "Activate account"}
                            className={`px-2 py-1.5 rounded-lg transition flex items-center justify-center border ${u.status === "ACTIVE"
                                ? "bg-amber-55 border-amber-200 text-amber-700 hover:bg-amber-100 disabled:opacity-50"
                                : "bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100"
                              }`}
                          >
                            {actionLoading === `status-${u.id}` ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : u.status === "ACTIVE" ? (
                              <Lock className="w-3.5 h-3.5" />
                            ) : (
                              <Unlock className="w-3.5 h-3.5" />
                            )}
                          </button>

                          {(u.role === "TEACHER" || u.role === "STUDENT") && (
                            <button
                              type="button"
                              disabled={actionLoading === `reset-${u.id}` || u.status !== "ACTIVE"}
                              onClick={() => handleSendReset(u)}
                              title="Send password reset email"
                              className="px-2 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100 disabled:opacity-50 flex items-center justify-center"
                            >
                              {actionLoading === `reset-${u.id}` ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Mail className="w-3.5 h-3.5" />
                              )}
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => openEditTeacher(u)}
                            className="px-2 py-1.5 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 flex items-center justify-center"
                            title={mode === "teachers" ? "Edit teacher" : "Edit student"}
                          >
                            <Pencil className="w-3 h-3" />
                          </button>

                          <button
                            type="button"
                            disabled={u.id === currentUserId || actionLoading === `delete-${u.id}`}
                            onClick={() => setDeleteTarget(u)}
                            className="px-2 py-1.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 disabled:opacity-50 flex items-center justify-center"
                            title="Delete account"
                          >
                            {actionLoading === `delete-${u.id}` ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <Trash2 className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile/Tablet Card Layout */}
            <div className="md:hidden divide-y divide-slate-200/50 flex-1 overflow-y-auto modern-scrollbar bg-slate-50/50">
              {paginatedRecords.map((u) => (
                <div key={u.id} className="p-4 hover:bg-slate-50 transition-colors flex flex-col gap-2.5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {u.role === "ADMIN" && (
                          <span className="px-1 py-0.5 rounded text-[9px] font-extrabold uppercase border bg-purple-50 text-purple-700 border-purple-200">
                            {u.role}
                          </span>
                        )}
                        <h4 className="font-extrabold text-sm text-slate-800 break-all leading-tight">{u.name}</h4>
                      </div>
                      <p className="text-2xs text-slate-500 font-semibold mt-1 whitespace-nowrap">{u.email}</p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        disabled={u.id === currentUserId || actionLoading === `status-${u.id}`}
                        onClick={() => setStatusToggleTarget(u)}
                        title={u.status === "ACTIVE" ? "Deactivate account" : "Activate account"}
                        className={`p-1.5 rounded-lg transition flex items-center justify-center border ${u.status === "ACTIVE"
                            ? "bg-amber-50 border-amber-200 text-amber-750 hover:bg-amber-100 disabled:opacity-50"
                            : "bg-emerald-50 border-emerald-200 text-emerald-750 hover:bg-emerald-100"
                          }`}
                      >
                        {actionLoading === `status-${u.id}` ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : u.status === "ACTIVE" ? (
                          <Lock className="w-3.5 h-3.5" />
                        ) : (
                          <Unlock className="w-3.5 h-3.5" />
                        )}
                      </button>

                      {(u.role === "TEACHER" || u.role === "STUDENT") && (
                        <button
                          type="button"
                          disabled={actionLoading === `reset-${u.id}` || u.status !== "ACTIVE"}
                          onClick={() => handleSendReset(u)}
                          title="Send password reset email"
                          className="p-1.5 rounded-lg bg-slate-55 border border-slate-200 text-slate-700 hover:bg-slate-100 disabled:opacity-50 flex items-center justify-center"
                        >
                          {actionLoading === `reset-${u.id}` ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Mail className="w-3.5 h-3.5" />
                          )}
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => openEditTeacher(u)}
                        className="p-1.5 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 flex items-center justify-center"
                        title={mode === "teachers" ? "Edit teacher" : "Edit student"}
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        disabled={u.id === currentUserId || actionLoading === `delete-${u.id}`}
                        onClick={() => setDeleteTarget(u)}
                        className="p-1.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 disabled:opacity-50 flex items-center justify-center"
                        title="Delete account"
                      >
                        {actionLoading === `delete-${u.id}` ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className={`grid gap-2.5 bg-slate-50 p-3 rounded-xl border border-slate-200/30 text-[11px] ${
                    mode === "users" ? "grid-cols-1 sm:grid-cols-3" : "grid-cols-2 sm:grid-cols-4"
                  }`}>
                    <div>
                      <span className="text-slate-400 font-semibold block uppercase text-[9px] tracking-wider mb-0.5">Class</span>
                      {u.studentClass ? (
                        <span className="text-[#8AC926] font-extrabold">{u.studentClass}</span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </div>
                    <div>
                      <span className="text-slate-400 font-semibold block uppercase text-[9px] tracking-wider mb-0.5">Phone</span>
                      <span className="text-slate-650 font-bold">{u.phone ? u.phone : <span className="text-slate-400 font-normal">—</span>}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-semibold block uppercase text-[9px] tracking-wider mb-0.5">
                        {mode === "users" ? "Joining Date" : "Joined Date"}
                      </span>
                      <span className="text-slate-605 font-medium">
                        {u.createdAt ? (
                          new Date(u.createdAt).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </span>
                    </div>
                    {mode === "teachers" && (
                      <div>
                        <span className="text-slate-400 font-semibold block uppercase text-[9px] tracking-wider mb-0.5">Strength</span>
                        <span className="text-slate-600 font-extrabold">{u.classStrength !== undefined ? u.classStrength : 0}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </AdminPageBody>

      <AdminModal
        open={showCreateTeacher}
        onClose={() => {
          if (isCreatingTeacher) return;
          setShowCreateTeacher(false);
          setTeacherForm(emptyTeacherForm);
        }}
        title="Create Teacher Account"
      >
        <form onSubmit={handleCreateTeacher} noValidate autoComplete="off" className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <input
              required
              placeholder="First name"
              value={teacherForm.firstName}
              onChange={(e) => setTeacherForm({ ...teacherForm, firstName: e.target.value })}
              className="w-full rounded-xl bg-white border border-slate-200 px-4 py-3 text-xs text-slate-900 outline-none focus:border-[#8AC926]"
            />
            <input
              required
              placeholder="Last name"
              value={teacherForm.lastName}
              onChange={(e) => setTeacherForm({ ...teacherForm, lastName: e.target.value })}
              className="w-full rounded-xl bg-white border border-slate-200 px-4 py-3 text-xs text-slate-900 outline-none focus:border-[#8AC926]"
            />
          </div>
          <input
            required
            type="email"
            placeholder="Professional email address"
            value={teacherForm.email}
            onChange={(e) => setTeacherForm({ ...teacherForm, email: e.target.value })}
            className="w-full rounded-xl bg-white border border-slate-200 px-4 py-3 text-xs text-slate-900 outline-none focus:border-[#8AC926]"
          />
          <input
            required
            placeholder="Contact number"
            value={teacherForm.phone}
            onChange={(e) => setTeacherForm({ ...teacherForm, phone: e.target.value })}
            className="w-full rounded-xl bg-white border border-slate-200 px-4 py-3 text-xs text-slate-900 outline-none focus:border-[#8AC926]"
          />
          <div>
            <label className="block text-slate-700 font-bold mb-1 text-2xs uppercase tracking-wider">Assigned Class</label>
            <ThemeSelect
              value={teacherForm.studentClass}
              onChange={(val) => setTeacherForm({ ...teacherForm, studentClass: val })}
              options={STUDENT_CLASS_OPTIONS}
              placeholder="Select assigned class"
            />
          </div>
          <p className="text-2xs text-slate-500 font-medium">
            A secure temporary password will be generated automatically and emailed to the teacher via Resend.
          </p>
          <button
            type="submit"
            disabled={isCreatingTeacher}
            className="w-full py-3 rounded-xl bg-[#8AC926] text-white font-sans font-bold text-xs tracking-wider uppercase hover:bg-[#78B020] transition disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isCreatingTeacher ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Creating...
              </>
            ) : (
              "Create Teacher Account"
            )}
          </button>
        </form>
      </AdminModal>

      <AdminModal
        open={!!editingTeacher}
        onClose={() => setEditingTeacher(null)}
        title={mode === "teachers" ? "Edit Teacher" : "Edit Student"}
      >
        <form onSubmit={handleSaveTeacherEdit} noValidate autoComplete="off" className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <input
              required
              placeholder="First name"
              value={editForm.firstName}
              onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
              className="w-full rounded-xl bg-white border border-slate-200 px-4 py-3 text-xs outline-none focus:border-[#8AC926]"
            />
            <input
              required
              placeholder="Last name"
              value={editForm.lastName}
              onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
              className="w-full rounded-xl bg-white border border-slate-200 px-4 py-3 text-xs outline-none focus:border-[#8AC926]"
            />
          </div>
          <input
            required
            type="email"
            value={editForm.email}
            onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
            className="w-full rounded-xl bg-white border border-slate-200 px-4 py-3 text-xs outline-none focus:border-[#8AC926]"
          />
          <input
            placeholder={mode === "teachers" ? "Phone" : "Phone (optional)"}
            value={editForm.phone}
            onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
            className="w-full rounded-xl bg-white border border-slate-200 px-4 py-3 text-xs outline-none focus:border-[#8AC926]"
          />
          <div>
            <label className="block text-slate-700 font-bold mb-1 text-2xs uppercase tracking-wider">
              {mode === "teachers" ? "Assigned Class" : "Student Class"}
            </label>
            <ThemeSelect
              value={editForm.studentClass}
              onChange={(val) => setEditForm({ ...editForm, studentClass: val })}
              options={STUDENT_CLASS_OPTIONS}
              placeholder={mode === "teachers" ? "Select assigned class" : "Select class"}
            />
          </div>
          {editingTeacher?.employeeId && (
            <p className="text-2xs text-slate-500 font-semibold">Employee ID: {editingTeacher.employeeId}</p>
          )}
          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-[#8AC926] text-white font-sans font-bold text-xs uppercase hover:bg-[#78B020] transition"
          >
            Save Changes
          </button>
        </form>
      </AdminModal>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete User?"
        message="This permanently deletes the account from the database (and removes their uploaded files). This cannot be undone."
        confirmLabel="Delete User"
        loading={!!deleteTarget && actionLoading === `delete-${deleteTarget.id}`}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirmed}
      />

      <ConfirmDialog
        open={!!statusToggleTarget}
        title={statusToggleTarget?.status === "ACTIVE" ? "Deactivate User?" : "Activate User?"}
        message={
          statusToggleTarget?.status === "ACTIVE"
            ? `Are you sure you want to deactivate ${statusToggleTarget?.name}'s account? They will lose access to the portal.`
            : `Are you sure you want to activate ${statusToggleTarget?.name}'s account? They will regain access to the portal.`
        }
        confirmLabel={statusToggleTarget?.status === "ACTIVE" ? "Deactivate" : "Activate"}
        loading={statusToggleTarget ? actionLoading === `status-${statusToggleTarget.id}` : false}
        onCancel={() => setStatusToggleTarget(null)}
        onConfirm={async () => {
          if (!statusToggleTarget) return;
          await handleToggleStatus(statusToggleTarget);
          setStatusToggleTarget(null);
        }}
      />
    </AdminPageShell>
  );
}
