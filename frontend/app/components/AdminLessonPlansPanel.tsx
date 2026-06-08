import { useCallback, useEffect, useState } from "react";
import {
  api,
  formatApiError,
  type Course,
  type LessonPlan,
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
import { ModalCloseButton } from "./ModalCloseButton";
import { PortalSelect } from "./PortalSelect";
import { Compass, Loader2, Pencil, Plus, Trash2 } from "lucide-react";

interface AdminLessonPlansPanelProps {
  token: string;
  onNotify: (message: string) => void;
  onError: (message: string) => void;
}

const emptyForm = {
  id: "",
  title: "",
  courseId: "",
  planDate: "",
  content: "",
  materialsNeeded: "",
  isPublished: true,
};

export function AdminLessonPlansPanel({ token, onNotify, onError }: AdminLessonPlansPanelProps) {
  const [plans, setPlans] = useState<LessonPlan[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [allPlans, allCourses] = await Promise.all([
        api.getLessonPlans(token),
        api.getCourses(),
      ]);
      setPlans(allPlans);
      setCourses(allCourses);
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
    if (!q) return true;
    return (
      p.title.toLowerCase().includes(q) ||
      p.content.toLowerCase().includes(q) ||
      (p.course?.title ?? "").toLowerCase().includes(q)
    );
  });

  const pagination = useAdminPagination(filtered, [search]);

  function openCreate() {
    setForm({ ...emptyForm, courseId: courses[0]?.id ?? "" });
    setShowForm(true);
  }

  function openEdit(plan: LessonPlan) {
    setForm({
      id: plan.id,
      title: plan.title,
      courseId: plan.courseId ?? "",
      planDate: plan.planDate ? plan.planDate.slice(0, 10) : "",
      content: plan.content,
      materialsNeeded: plan.materialsNeeded ?? "",
      isPublished: plan.isPublished,
    });
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (saving || isActionBusy(actionLoading)) return;
    if (form.title.trim().length < 2 || form.content.trim().length < 10) {
      onError("Title must be at least 2 characters and lesson content at least 10 characters.");
      return;
    }

    setSaving(true);
    try {
      const body = {
        title: form.title.trim(),
        courseId: form.courseId || null,
        planDate: form.planDate || null,
        content: form.content.trim(),
        materialsNeeded: form.materialsNeeded.trim() || null,
        isPublished: form.isPublished,
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
    if (isActionBusy(actionLoading) || !window.confirm("Delete this lesson plan permanently?")) return;
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
    <AdminPageShell>
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

      <AdminPageBody>
        {loading ? (
          <div className="flex items-center justify-center py-16 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-[#8AC926]" />
            <p className="font-bold text-slate-600 text-sm">Loading lesson plans…</p>
          </div>
        ) : filtered.length === 0 ? (
          <AdminListEmpty message="No lesson plans matched your search." />
        ) : (
          <AdminRecordList>
            {pagination.paginatedItems.map((plan) => (
              <div key={plan.id} className={adminListRowClass}>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span
                      className={`px-2 py-0.5 rounded-md text-4xs font-extrabold uppercase border shrink-0 ${
                        plan.isPublished
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-slate-100 text-slate-600 border-slate-200"
                      }`}
                    >
                      {plan.isPublished ? "Published" : "Draft"}
                    </span>
                    {plan.course?.title && (
                      <span className="px-2 py-0.5 rounded-md bg-violet-50 text-violet-700 text-4xs font-extrabold uppercase border border-violet-200 shrink-0">
                        {plan.course.title}
                      </span>
                    )}
                  </div>
                  <p className="font-bold text-sm text-slate-800">{plan.title}</p>
                  {plan.planDate && (
                    <p className="text-2xs text-slate-600 font-medium mt-0.5">
                      Plan date:{" "}
                      {new Date(plan.planDate).toLocaleDateString("en-IN", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                  )}
                  <p className="text-2xs text-slate-600 font-medium line-clamp-2 mt-0.5 whitespace-pre-wrap">
                    {plan.content}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => openEdit(plan)}
                    className="px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100 flex items-center justify-center"
                    title="Edit"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    disabled={actionLoading === `delete-${plan.id}`}
                    onClick={() => handleDelete(plan.id)}
                    className="px-3 py-1.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 disabled:opacity-50 flex items-center justify-center"
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
            ))}
            <AdminListPagination
              rangeStart={pagination.rangeStart}
              rangeEnd={pagination.rangeEnd}
              total={filtered.length}
              safePage={pagination.safePage}
              totalPages={pagination.totalPages}
              pageNumbers={pagination.pageNumbers}
              onPageChange={pagination.setCurrentPage}
              itemLabel="plans"
            />
          </AdminRecordList>
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
              <div>
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
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 font-bold mb-1.5">Course (optional)</label>
                  <PortalSelect
                    value={form.courseId}
                    onChange={(e) => setForm({ ...form, courseId: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 outline-none focus:border-[#8AC926]"
                  >
                    <option value="">— None —</option>
                    {courses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.title}
                      </option>
                    ))}
                  </PortalSelect>
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1.5">Plan date (optional)</label>
                  <input
                    type="date"
                    value={form.planDate}
                    onChange={(e) => setForm({ ...form, planDate: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 outline-none focus:border-[#8AC926]"
                  />
                </div>
              </div>
              <div>
                <label className="block text-slate-700 font-bold mb-1.5">Lesson plan content</label>
                <textarea
                  required
                  rows={6}
                  value={form.content}
                  onChange={(e) => setForm({ ...form, content: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 outline-none focus:border-[#8AC926]"
                  placeholder="Objectives, activities, timing, notes for teachers…"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-bold mb-1.5">Materials needed (optional)</label>
                <textarea
                  rows={2}
                  value={form.materialsNeeded}
                  onChange={(e) => setForm({ ...form, materialsNeeded: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 outline-none focus:border-[#8AC926]"
                  placeholder="Charts, worksheets, props…"
                />
              </div>
              <label className="flex items-center gap-2 font-bold text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isPublished}
                  onChange={(e) => setForm({ ...form, isPublished: e.target.checked })}
                  className="rounded border-slate-300 text-[#8AC926] focus:ring-[#8AC926]"
                />
                Publish for teachers
              </label>
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
    </AdminPageShell>
  );
}
