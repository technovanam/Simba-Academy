import { useCallback, useEffect, useState } from "react";
import {
  api,
  formatApiError,
  API_URL,
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
import { ThemeSelect } from "./ThemeSelect";
import { ModalCloseButton } from "./ModalCloseButton";
import { Compass, Loader2, Pencil, Plus, Trash2, Upload, Paperclip, FileText, X } from "lucide-react";
import { ConfirmDialog } from "./ConfirmDialog";

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
};

export function AdminLessonPlansPanel({ token, onNotify, onError }: AdminLessonPlansPanelProps) {
  const [plans, setPlans] = useState<LessonPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const allPlans = await api.getLessonPlans(token);
      setPlans(allPlans);
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
    return p.title.toLowerCase().includes(q);
  });

  const pagination = useAdminPagination(filtered, [search]);

  function openCreate() {
    setForm({ ...emptyForm });
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
    });
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
        planDate: null,
        content: form.title.trim(),
        materialsNeeded: form.materialsNeeded.trim() || null,
        isPublished: true,
        fileUrl: form.fileUrl || null,
        fileName: form.fileName || null,
        targetClass: form.targetClass || null,
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
            <div className="overflow-x-auto flex-1 min-h-0 overflow-y-auto modern-scrollbar">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-medium text-xs sticky top-0 z-10">
                  <tr>
                    <th className="px-4 py-3 font-semibold w-[40%]">Title</th>
                    <th className="px-4 py-3 font-semibold w-[20%]">Class</th>
                    <th className="px-4 py-3 font-semibold w-[20%]">Attachment</th>
                    <th className="px-4 py-3 font-semibold w-[20%]">Date Added</th>
                    <th className="px-4 py-3 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map((plan) => (
                    <tr key={plan.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3 align-middle w-[40%] min-w-0">
                        <span className="font-bold text-sm text-slate-800 truncate block max-w-md">{plan.title}</span>
                      </td>
                      <td className="px-4 py-3 align-middle text-xs text-slate-600 w-[20%] font-semibold">
                        {plan.targetClass || "All Classes"}
                      </td>
                      <td className="px-4 py-3 align-middle text-xs w-[20%] min-w-0">
                        {plan.fileUrl ? (
                          <div className="flex items-center gap-1.5 max-w-xs">
                            <Paperclip className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <a
                              href={plan.fileUrl.startsWith("/") ? `${API_URL}${plan.fileUrl}` : plan.fileUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="font-bold text-[#8AC926] hover:underline truncate max-w-[200px] block"
                            >
                              {plan.fileName || "View attachment"}
                            </a>
                          </div>
                        ) : (
                          <span className="text-slate-450">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 align-middle text-xs text-slate-500 w-[20%]">
                        {plan.createdAt ? new Date(plan.createdAt).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" }) : <span className="text-slate-450">—</span>}
                      </td>
                      <td className="px-4 py-2 text-right align-middle">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => openEdit(plan)}
                            className="px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100 text-[12px] font-medium flex items-center gap-1"
                            title="Edit"
                          >
                            <Pencil className="w-3 h-3" /> Edit
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
