import { useCallback, useEffect, useRef, useState } from "react";
import {
  api,
  formatApiError,
  API_URL,
  type LessonPlan,
  type AuthUser,
} from "../lib/api";
import { isActionBusy } from "../lib/actionGuard";
import { AdminPageBody, AdminPageHeader, AdminPageShell } from "./AdminPageShell";
import {
  AdminListEmpty,
  AdminListPagination,
  AdminRecordList,
  AdminSearchInput,
  adminListRowClass,
  useAdminPagination,
} from "./AdminListUi";
import { ThemeSelect } from "./ThemeSelect";
import { ModalCloseButton } from "./ModalCloseButton";
import { Compass, Loader2, Pencil, Plus, Trash2, Upload, Paperclip, FileText, X, ChevronDown, Filter } from "lucide-react";
import { ConfirmDialog } from "./ConfirmDialog";

/** Full-title popup shown when a truncated title is clicked */
function TitlePopup({ title, onClose }: { title: string; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener("keydown", handleKey);
    document.addEventListener("mousedown", handleClick);
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.removeEventListener("mousedown", handleClick);
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div
        ref={ref}
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 max-w-sm w-full relative"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3 right-3 p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition"
          title="Close"
        >
          <X className="w-4 h-4" />
        </button>
        <p className="text-[10px] font-bold uppercase tracking-widest text-[#8AC926] mb-2">Lesson Plan Title</p>
        <p className="text-sm font-bold text-slate-800 leading-relaxed break-words pr-6">{title}</p>
      </div>
    </div>
  );
}

/** Desktop title cell — truncated, hover tooltip, click popup */
function TitleCell({ title }: { title: string }) {
  const [showPopup, setShowPopup] = useState(false);
  const spanRef = useRef<HTMLSpanElement>(null);
  const [isTruncated, setIsTruncated] = useState(false);

  useEffect(() => {
    const el = spanRef.current;
    if (el) setIsTruncated(el.scrollWidth > el.clientWidth + 1);
  }, [title]);

  return (
    <>
      <span
        ref={spanRef}
        title={title}
        onClick={() => isTruncated && setShowPopup(true)}
        className={`font-bold text-sm text-slate-800 block truncate${
          isTruncated ? " cursor-pointer hover:text-[#8AC926] transition-colors" : ""
        }`}
      >
        {title}
      </span>
      {showPopup && <TitlePopup title={title} onClose={() => setShowPopup(false)} />}
    </>
  );
}

/** Mobile title — 2-line clamp, always clickable to show full popup */
function MobileTitleCell({ title }: { title: string }) {
  const [showPopup, setShowPopup] = useState(false);

  return (
    <>
      <h4
        onClick={() => setShowPopup(true)}
        title={title}
        className="font-extrabold text-sm text-slate-800 leading-tight cursor-pointer hover:text-[#8AC926] transition-colors"
        style={{
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical" as const,
          overflow: "hidden",
        }}
      >
        {title}
      </h4>
      {showPopup && <TitlePopup title={title} onClose={() => setShowPopup(false)} />}
    </>
  );
}

const CLASS_OPTIONS = ["All Classes", "Playgroup", "Pre-KG", "LKG", "UKG"];

/** Multi-select class filter dropdown */
function ClassFilterDropdown({
  selected,
  onChange,
}: {
  selected: string[];
  onChange: (v: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function toggle(cls: string) {
    if (selected.includes(cls)) {
      onChange(selected.filter((c) => c !== cls));
    } else {
      onChange([...selected, cls]);
    }
  }

  const label =
    selected.length === 0
      ? "All Classes"
      : selected.length === 1
      ? selected[0]
      : `${selected.length} classes`;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-bold transition whitespace-nowrap ${
          selected.length > 0
            ? "bg-[#8AC926]/10 border-[#8AC926] text-[#5a8218]"
            : "bg-white border-slate-200 text-slate-600 hover:border-[#8AC926]/50"
        }`}
      >
        <Filter className="w-3.5 h-3.5" />
        {label}
        {selected.length > 0 && (
          <span
            role="button"
            tabIndex={0}
            onClick={(e) => { e.stopPropagation(); onChange([]); }}
            onKeyDown={(e) => { if (e.key === "Enter") { e.stopPropagation(); onChange([]); } }}
            className="ml-0.5 rounded-full hover:bg-[#8AC926]/20 p-0.5"
            title="Clear filter"
          >
            <X className="w-3 h-3" />
          </span>
        )}
        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-1.5 z-30 bg-white border border-slate-200 rounded-2xl shadow-xl p-2 min-w-[160px]">
          <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 px-2 pt-1 pb-1.5">Filter by class</p>
          {CLASS_OPTIONS.map((cls) => {
            const isActive = selected.includes(cls);
            return (
              <button
                key={cls}
                type="button"
                onClick={() => toggle(cls)}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition mb-0.5 ${
                  isActive
                    ? "bg-[#8AC926]/10 text-[#5a8218] font-bold"
                    : "hover:bg-slate-50 text-slate-700"
                }`}
              >
                <span
                  className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition ${
                    isActive ? "bg-[#8AC926] border-[#8AC926]" : "border-slate-300"
                  }`}
                >
                  {isActive && (
                    <svg viewBox="0 0 10 8" className="w-2.5 h-2.5 fill-none">
                      <path d="M1 4l2.5 2.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </span>
                {cls}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

interface AdminLessonPlansPanelProps {
  token: string;
  onNotify: (message: string) => void;
  onError: (message: string) => void;
}

const emptyForm = {
  id: "",
  title: "",
  materialsNeeded: "",
  fileUrl: "",
  fileName: "",
  targetClass: "",
  assignedTeacherIds: [] as string[],
  planDate: "",
};

export function AdminLessonPlansPanel({ token, onNotify, onError }: AdminLessonPlansPanelProps) {
  const [plans, setPlans] = useState<LessonPlan[]>([]);
  const [users, setUsers] = useState<AuthUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedClasses, setSelectedClasses] = useState<string[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [teacherSearch, setTeacherSearch] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [allPlans, allUsers] = await Promise.all([
        api.getLessonPlans(token),
        api.getUsers(token)
      ]);
      setPlans(allPlans);
      setUsers(allUsers);
    } catch (err) {
      onError(formatApiError(err, "Failed to load lesson plans."));
    } finally {
      setLoading(false);
    }
  }, [token, onError]);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = plans.filter((p) => {
    const q = search.toLowerCase();
    const matchesSearch = !q || p.title.toLowerCase().includes(q);

    let matchesClass = true;
    if (selectedClasses.length > 0) {
      const planClasses = (p.targetClass ?? "")
        .split(",")
        .map((c) => c.trim())
        .filter(Boolean);
      matchesClass = selectedClasses.some((sel) => {
        if (sel === "All Classes") return planClasses.length === 0;
        return planClasses.includes(sel);
      });
    }

    return matchesSearch && matchesClass;
  });

  const pagination = useAdminPagination(filtered, [search, selectedClasses]);

  function openCreate() {
    setForm({ ...emptyForm });
    setTeacherSearch("");
    setShowForm(true);
  }

  function openEdit(plan: LessonPlan) {
    setForm({
      id: plan.id,
      title: plan.title,
      materialsNeeded: plan.materialsNeeded ?? "",
      fileUrl: plan.fileUrl ?? "",
      fileName: plan.fileName ?? "",
      targetClass: plan.targetClass ?? "",
      assignedTeacherIds: plan.assignedTeacherIds ? plan.assignedTeacherIds.split(",") : [],
      planDate: plan.planDate ? plan.planDate.split("T")[0] : "",
    });
    setTeacherSearch("");
    setShowForm(true);
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = [".pdf", ".doc", ".docx", ".ppt", ".pptx"];
    const ext = file.name.substring(file.name.lastIndexOf(".")).toLowerCase();
    if (!allowedTypes.includes(ext)) {
      onError("Only PDF, Word, and PowerPoint files are allowed.");
      return;
    }

    setUploading(true);
    try {
      const res = await api.uploadRaw(token, file);
      setForm((prev) => ({
        ...prev,
        fileUrl: res.url,
        fileName: file.name,
      }));
      onNotify("File uploaded successfully.");
    } catch (err) {
      onError(formatApiError(err, "Failed to upload file."));
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (saving || isActionBusy(actionLoading)) return;
    if (form.title.trim().length < 2) {
      onError("Title must be at least 2 characters.");
      return;
    }

    setSaving(true);
    try {
      const body = {
        title: form.title.trim(),
        courseId: null,
        planDate: form.planDate ? new Date(form.planDate).toISOString() : null,
        content: form.title.trim(),
        materialsNeeded: form.materialsNeeded.trim() || null,
        isPublished: true,
        fileUrl: form.fileUrl || null,
        fileName: form.fileName || null,
        targetClass: form.targetClass || null,
        assignedTeacherIds: form.assignedTeacherIds.length > 0 ? form.assignedTeacherIds : null,
      };

      if (form.id) {
        const updated = await api.updateLessonPlan(token, form.id, body);
        setPlans((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
        onNotify("Lesson plan updated.");
      } else {
        const created = await api.createLessonPlan(token, body);
        setPlans((prev) => [created, ...prev]);
        onNotify("Lesson plan created.");
      }
      setShowForm(false);
      setForm(emptyForm);
    } catch (err) {
      onError(formatApiError(err, "Failed to save lesson plan."));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (isActionBusy(actionLoading)) return;
    setDeleteTarget(id);
  }

  async function handleDeleteConfirmed() {
    if (!deleteTarget) return;
    const id = deleteTarget;
    setDeleteTarget(null);
    setActionLoading(`delete-${id}`);
    try {
      await api.deleteLessonPlan(token, id);
      setPlans((prev) => prev.filter((p) => p.id !== id));
      onNotify("Lesson plan deleted.");
    } catch (err) {
      onError(formatApiError(err, "Failed to delete lesson plan."));
    } finally {
      setActionLoading(null);
    }
  }

  return (
    <AdminPageShell className="h-full flex flex-col min-h-0 overflow-hidden">
      <AdminPageHeader
        title="Lesson Planner"
        description="Create and publish lesson plans for teachers to view in their portal."
        actions={
          <>
            <AdminSearchInput
              value={search}
              onChange={setSearch}
              placeholder="Search lesson plans…"
              ariaLabel="Search lesson plans"
            />
            <ClassFilterDropdown
              selected={selectedClasses}
              onChange={setSelectedClasses}
            />
            <button
              type="button"
              onClick={openCreate}
              className="px-4 py-2 rounded-xl bg-[#8AC926] text-white font-sans font-bold text-xs tracking-wider flex items-center gap-2 hover:bg-[#78B020] transition shadow-md shadow-[#8AC926]/10 whitespace-nowrap"
            >
              <Plus className="w-4 h-4" /> Add lesson plan
            </button>
          </>
        }
      />

      <AdminPageBody className="flex-1 min-h-0 flex flex-col overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-[#8AC926]" />
            <p className="font-bold text-slate-600 text-sm">Loading lesson plans…</p>
          </div>
        ) : filtered.length === 0 ? (
          <AdminListEmpty message="No lesson plans matched your search." />
        ) : (
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm flex-1 min-h-0 flex flex-col">
            {/* Desktop Table View — no horizontal scroll */}
            <div className="hidden md:block flex-1 min-h-0 overflow-y-auto modern-scrollbar overflow-x-hidden">
              <table className="w-full text-left text-sm table-fixed">
                <colgroup>
                  <col style={{ width: "38%" }} />
                  <col style={{ width: "18%" }} />
                  <col style={{ width: "20%" }} />
                  <col style={{ width: "14%" }} />
                  <col style={{ width: "10%" }} />
                </colgroup>
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-medium text-xs sticky top-0 z-10">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Title</th>
                    <th className="px-4 py-3 font-semibold whitespace-nowrap">Class</th>
                    <th className="px-4 py-3 font-semibold whitespace-nowrap">Attachment</th>
                    <th className="px-4 py-3 font-semibold whitespace-nowrap">Date Added</th>
                    <th className="px-4 py-3 font-semibold text-right whitespace-nowrap">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map((plan) => (
                    <tr key={plan.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3 align-middle min-w-0 max-w-0">
                        <TitleCell title={plan.title} />
                      </td>
                      <td className="px-4 py-3 align-middle text-xs text-slate-600 font-semibold">
                        <span className="block truncate" title={plan.targetClass || "All Classes"}>{plan.targetClass || "All Classes"}</span>
                      </td>
                      <td className="px-4 py-3 align-middle text-xs min-w-0">
                        {plan.fileUrl ? (
                          <div className="flex items-center gap-1.5 min-w-0">
                            <Paperclip className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <a
                              href={plan.fileUrl.startsWith("/") ? `${API_URL}${plan.fileUrl}` : plan.fileUrl}
                              target="_blank"
                              rel="noreferrer"
                              title={plan.fileName || "View attachment"}
                              className="font-bold text-[#8AC926] hover:underline truncate block min-w-0"
                            >
                              {plan.fileName || "View attachment"}
                            </a>
                          </div>
                        ) : (
                          <span className="text-slate-450">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 align-middle text-xs text-slate-500 whitespace-nowrap">
                        {plan.createdAt ? new Date(plan.createdAt).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" }) : <span className="text-slate-450">—</span>}
                      </td>
                      <td className="px-4 py-2 text-right align-middle whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => openEdit(plan)}
                            className="p-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 flex items-center justify-center"
                            title="Edit"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            disabled={actionLoading === `delete-${plan.id}`}
                            onClick={() => handleDelete(plan.id)}
                            className="px-2 py-1.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 disabled:opacity-50 flex items-center justify-center"
                            title="Delete"
                          >
                            {actionLoading === `delete-${plan.id}` ? (
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
            <div className="md:hidden divide-y divide-slate-200 flex-1 overflow-y-auto modern-scrollbar bg-slate-50/50">
              {filtered.map((plan) => (
                <div key={plan.id} className="p-4 hover:bg-slate-50 transition-colors flex flex-col gap-2.5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <MobileTitleCell title={plan.title} />
                      <p className="text-2xs text-slate-500 font-semibold mt-1">
                        Added: {plan.createdAt ? new Date(plan.createdAt).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" }) : "—"}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => openEdit(plan)}
                        className="p-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100 flex items-center justify-center"
                        title="Edit"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={actionLoading === `delete-${plan.id}`}
                        onClick={() => handleDelete(plan.id)}
                        className="p-1.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 disabled:opacity-50 flex items-center justify-center"
                        title="Delete"
                      >
                        {actionLoading === `delete-${plan.id}` ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-[11px]">
                    <div>
                      <span className="text-slate-400 font-semibold block uppercase text-[9px] tracking-wider mb-0.5">Class</span>
                      <span className="text-indigo-650 font-bold">{plan.targetClass || "All Classes"}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-semibold block uppercase text-[9px] tracking-wider mb-0.5">Attachment</span>
                      {plan.fileUrl ? (
                        <div className="flex items-center gap-1 max-w-full">
                          <Paperclip className="w-3 h-3 text-slate-400 shrink-0" />
                          <a
                            href={plan.fileUrl.startsWith("/") ? `${API_URL}${plan.fileUrl}` : plan.fileUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="font-extrabold text-[#8AC926] hover:underline truncate block"
                          >
                            {plan.fileName || "Download"}
                          </a>
                        </div>
                      ) : (
                        <span className="text-slate-400 font-normal">—</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </AdminPageBody>

      {showForm && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl border border-slate-200 text-slate-800 relative max-h-[90vh] overflow-y-auto">
            <ModalCloseButton
              onClick={() => {
                setShowForm(false);
                setForm(emptyForm);
              }}
              className="absolute top-4 right-4"
            />
            <h3 className="font-sans text-lg font-extrabold text-slate-900 mb-4 pr-10 flex items-center gap-2">
              <Compass className="w-5 h-5 text-[#8AC926]" />
              {form.id ? "Edit lesson plan" : "New lesson plan"}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs" noValidate>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-slate-700 font-bold mb-1.5">Title</label>
                  <input
                    required
                    minLength={2}
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 outline-none focus:border-[#8AC926]"
                    placeholder="e.g. UKG Phonics — Week 3"
                  />
                </div>
              </div>
              <div>
                <label className="block text-slate-700 font-bold mb-2">Class Assignment</label>
                <div className="flex flex-wrap gap-2">
                  {["Playgroup", "Pre-KG", "LKG", "UKG"].map((cls) => {
                    const classesList = form.targetClass
                      ? form.targetClass.split(",").map((c) => c.trim()).filter(Boolean)
                      : [];
                    const isChecked = classesList.includes(cls);
                    return (
                      <label
                        key={cls}
                        className={`flex items-center gap-2 px-3 py-2 border rounded-xl cursor-pointer transition select-none ${
                          isChecked
                            ? "bg-[#8AC926]/10 border-[#8AC926] text-[#5a8218] font-bold"
                            : "bg-white border-slate-200 text-slate-650 hover:border-[#8AC926]/50"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            let nextClasses = [...classesList];
                            if (e.target.checked) {
                              if (!nextClasses.includes(cls)) {
                                nextClasses.push(cls);
                              }
                            } else {
                              nextClasses = nextClasses.filter((c) => c !== cls);
                            }
                            setForm({ ...form, targetClass: nextClasses.join(",") });
                          }}
                          className="w-4 h-4 rounded border-slate-300 text-[#8AC926] focus:ring-[#8AC926]/30"
                        />
                        <span className="text-xs">{cls}</span>
                      </label>
                    );
                  })}
                </div>
                <p className="text-[10px] text-slate-400 mt-1.5">
                  Leave all unchecked to assign to **All Classes** (Send to all teachers).
                </p>
              </div>
              <div>
                <label className="block text-slate-700 font-bold mb-1.5">Additional Teachers</label>
                <div className="relative mb-2">
                  <input
                    type="text"
                    placeholder="Search teachers to add..."
                    value={teacherSearch}
                    onChange={(e) => setTeacherSearch(e.target.value)}
                    className="w-full rounded-xl bg-white border border-slate-200 px-4 py-2 text-slate-900 outline-none focus:border-[#8AC926] transition"
                  />
                </div>
                <div className="border border-slate-200 rounded-xl overflow-hidden max-h-48 overflow-y-auto bg-slate-50 p-2 space-y-1 modern-scrollbar">
                  {users
                    .filter((u) => u.role === "TEACHER" && (
                      u.name.toLowerCase().includes(teacherSearch.toLowerCase()) ||
                      (u.email ?? "").toLowerCase().includes(teacherSearch.toLowerCase())
                    ))
                    .map((teacher) => {
                      const selectedClasses = form.targetClass
                        ? form.targetClass.split(",").map((c: string) => c.trim()).filter(Boolean)
                        : [];
                      
                      const teacherClasses = teacher.assignedClasses && teacher.assignedClasses.length > 0
                        ? teacher.assignedClasses
                        : teacher.studentClass
                          ? [teacher.studentClass]
                          : [];

                      const isAutoIncluded = teacherClasses.some((c) => selectedClasses.includes(c));
                      const isSelected = isAutoIncluded || form.assignedTeacherIds.includes(teacher.id);

                      return (
                        <div
                          key={teacher.id}
                          className={`flex items-center justify-between p-2 rounded-lg border text-left transition text-xs ${
                            isAutoIncluded
                              ? "border-emerald-100 bg-emerald-50/50 text-slate-500 cursor-default"
                              : isSelected
                                ? "border-[#8AC926] bg-[#8AC926]/5"
                                : "border-transparent bg-white hover:border-slate-200"
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-extrabold text-[10px] shrink-0 ${
                              isAutoIncluded
                                ? "bg-emerald-150 text-emerald-700"
                                : isSelected
                                  ? "bg-[#8AC926] text-white"
                                  : "bg-slate-200 text-slate-600"
                            }`}>
                              {teacher.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className={`font-bold truncate ${isAutoIncluded ? "text-slate-500" : "text-slate-700"}`}>
                                {teacher.name}
                              </p>
                              <p className={`truncate ${isAutoIncluded ? "text-emerald-600 font-medium text-[10px]" : "text-slate-400 text-[10px]"}`}>
                                {isAutoIncluded 
                                  ? `Automatically included via ${teacherClasses.find((c: string) => selectedClasses.includes(c))}` 
                                  : teacherClasses.length > 0 ? teacherClasses.join(", ") : "No classes assigned"}
                              </p>
                            </div>
                          </div>
                          {!isAutoIncluded && (
                            <button
                              type="button"
                              onClick={() => {
                                const newIds = isSelected
                                  ? form.assignedTeacherIds.filter(id => id !== teacher.id)
                                  : [...form.assignedTeacherIds, teacher.id];
                                setForm({ ...form, assignedTeacherIds: newIds });
                              }}
                              className={`px-3 py-1.5 rounded-lg font-bold transition shrink-0 ml-2 ${
                                isSelected
                                  ? "bg-rose-50 text-rose-600 hover:bg-rose-100"
                                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                              }`}
                            >
                              {isSelected ? "Remove" : "Add"}
                            </button>
                          )}
                        </div>
                      );
                    })}
                  {users.filter(u => u.role === "TEACHER").length === 0 && (
                    <div className="p-4 text-center text-slate-500 italic">No teachers found in the system.</div>
                  )}
                </div>
                {form.assignedTeacherIds.length > 0 && (
                  <p className="text-emerald-600 font-bold mt-2 flex items-center gap-1 text-[11px]">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    {form.assignedTeacherIds.length} specific teacher{form.assignedTeacherIds.length !== 1 ? 's' : ''} added
                  </p>
                )}
              </div>
              <div>
                <label className="block text-slate-700 font-bold mb-1.5">Materials needed (PDF or Word)</label>
                {form.fileUrl ? (
                  <div className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 bg-slate-50">
                     <div className="flex items-center gap-2 min-w-0">
                       <FileText className="w-4 h-4 text-[#8AC926] shrink-0" />
                       <span className="text-xs text-slate-700 font-medium truncate">{form.fileName || "Attachment"}</span>
                     </div>
                     <button
                       type="button"
                       onClick={() => setForm((prev) => ({ ...prev, fileUrl: "", fileName: "" }))}
                       className="p-1 rounded-full hover:bg-slate-200 text-slate-500"
                       title="Remove file"
                     >
                       <X className="w-4 h-4" />
                     </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-slate-300 rounded-xl cursor-pointer bg-slate-50 hover:bg-slate-100 hover:border-[#8AC926] transition">
                    <div className="flex flex-col items-center justify-center py-4">
                      {uploading ? (
                        <>
                          <Loader2 className="w-6 h-6 animate-spin text-[#8AC926] mb-1" />
                          <p className="text-2xs text-slate-500 font-bold">Uploading document...</p>
                        </>
                      ) : (
                        <>
                          <Upload className="w-6 h-6 text-slate-400 mb-1" />
                          <p className="text-2xs text-slate-500 font-bold">Attach PDF or Word Document</p>
                          <p className="text-[10px] text-slate-400">Word (.doc/.docx) or PDF up to 50MB</p>
                        </>
                      )}
                    </div>
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx"
                      disabled={uploading}
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
              <button
                type="submit"
                disabled={saving}
                className="w-full py-3 rounded-xl bg-[#8AC926] text-white font-bold text-xs uppercase tracking-wider hover:bg-[#78B020] transition disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Saving…
                  </>
                ) : form.id ? (
                  "Update lesson plan"
                ) : (
                  "Create lesson plan"
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Delete Lesson Plan?"
        message="Delete this lesson plan permanently?"
        confirmLabel="Delete"
        variant="danger"
        loading={actionLoading === `delete-${deleteTarget}`}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirmed}
      />
    </AdminPageShell>
  );
}
