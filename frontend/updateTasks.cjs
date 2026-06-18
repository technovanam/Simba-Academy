const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'app', 'components', 'admin', 'AdminTabBody.tsx');
let content = fs.readFileSync(filePath, 'utf8');

const startMarker = '{/* ────────────────── TASKS ASSIGNMENT ────────────────── */}';
const endMarker = '{activeTab === "planner" && token && (';

const startIndex = content.indexOf(startMarker);
const endIndex = content.indexOf(endMarker);

if (startIndex === -1 || endIndex === -1) {
  console.error("Markers not found");
  process.exit(1);
}

const newUi = `{/* ────────────────── TASKS ASSIGNMENT ────────────────── */}
          {activeTab === "tasks" && (
            <AdminPageShell className="h-full flex flex-col min-h-0 overflow-hidden">
              <AdminPageHeader
                title="Recurring Class Tasks"
                description="Manage class-specific tasks that automatically assign to teachers every week."
                actions={
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        setRecurringTaskForm({ id: "", title: "", description: "", repeatDay: "MONDAY", isEditing: false });
                        setShowRecurringTaskForm(true);
                      }}
                      className="px-4 py-2 rounded-xl bg-[#8AC926] text-white font-sans font-bold text-xs tracking-wider flex items-center gap-2 hover:bg-[#78B020] transition shadow-md shadow-[#8AC926]/10 whitespace-nowrap"
                    >
                      <Plus className="w-4 h-4" /> Create Recurring Task
                    </button>
                  </>
                }
              />

              <AdminPageBody className="flex-1 min-h-0 flex flex-col overflow-hidden">
                {!selectedClassFolder ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4">
                    {["Playgroup", "Nursery", "LKG", "UKG"].map((className) => {
                      const classTasks = recurringTasks.filter(rt => rt.studentClass === className);
                      const activeCount = classTasks.filter(rt => rt.isActive).length;
                      return (
                        <button
                          key={className}
                          onClick={() => setSelectedClassFolder(className)}
                          className="flex flex-col p-5 bg-white border border-slate-200 rounded-2xl hover:border-[#8AC926] hover:shadow-md transition-all text-left group"
                        >
                          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                            <Folder className="w-6 h-6" />
                          </div>
                          <h3 className="font-bold text-slate-800 text-lg">{className}</h3>
                          <p className="text-xs text-slate-500 font-medium mt-1">{classTasks.length} tasks ({activeCount} active)</p>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex flex-col h-full overflow-hidden">
                    <div className="flex items-center gap-3 p-4 border-b border-slate-200 bg-white shrink-0">
                      <button
                        onClick={() => setSelectedClassFolder(null)}
                        className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 transition"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      <div className="flex items-center gap-2 text-slate-800">
                        <FolderOpen className="w-5 h-5 text-indigo-500" />
                        <h2 className="font-bold text-lg">{selectedClassFolder} Tasks</h2>
                      </div>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto p-4 modern-scrollbar bg-slate-50">
                      {recurringTasks.filter(rt => rt.studentClass === selectedClassFolder).length === 0 ? (
                        <AdminListEmpty message={\`No recurring tasks found for \${selectedClassFolder}.\`} />
                      ) : (
                        <div className="grid grid-cols-1 gap-3">
                          {recurringTasks.filter(rt => rt.studentClass === selectedClassFolder).map((rt) => (
                            <div key={rt.id} className="bg-white p-4 border border-slate-200 rounded-xl flex items-center justify-between gap-4 shadow-sm hover:shadow-md transition-shadow">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <h3 className="font-bold text-slate-800 text-sm truncate">{rt.title}</h3>
                                  <span className={\`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider \${rt.isActive ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'}\`}>
                                    {rt.isActive ? 'Active' : 'Inactive'}
                                  </span>
                                </div>
                                <p className="text-xs text-slate-500 font-medium mb-2">Repeats every <span className="font-bold text-indigo-600">{rt.repeatDay}</span></p>
                                {rt.description && <p className="text-xs text-slate-600 line-clamp-2">{rt.description}</p>}
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <button
                                  onClick={() => handleToggleRecurringTask(rt.id, rt.isActive)}
                                  className={\`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors \${rt.isActive ? 'bg-amber-50 text-amber-700 hover:bg-amber-100' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'}\`}
                                >
                                  {rt.isActive ? 'Deactivate' : 'Activate'}
                                </button>
                                <button
                                  onClick={() => loadRecurringTaskHistory(rt.id)}
                                  className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                                  title="View Assignment History"
                                >
                                  <History className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => {
                                    setRecurringTaskForm({
                                      id: rt.id,
                                      title: rt.title,
                                      description: rt.description || "",
                                      repeatDay: rt.repeatDay,
                                      isEditing: true
                                    });
                                    setShowRecurringTaskForm(true);
                                  }}
                                  className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                                  title="Edit Task"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteRecurringTask(rt.id)}
                                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                                  title="Delete Task"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                {/* CREATE/EDIT MODAL */}
                {showRecurringTaskForm && (
                  <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
                      <div className="bg-slate-50 px-5 py-4 border-b border-slate-100 flex items-center justify-between shrink-0">
                        <h3 className="font-bold text-slate-800 tracking-wide">
                          {recurringTaskForm.isEditing ? "Edit Recurring Task" : "Create Recurring Task"}
                        </h3>
                        <button
                          type="button"
                          onClick={() => setShowRecurringTaskForm(false)}
                          className="text-slate-400 hover:text-slate-600 transition p-1"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                      
                      <div className="p-5 overflow-y-auto modern-scrollbar">
                        <form onSubmit={handleCreateRecurringTask} className="space-y-4 text-xs">
                          <div>
                            <label className="block text-slate-700 font-bold mb-1.5">Task Title</label>
                            <input
                              placeholder="e.g. Upload Weekly Craft Photos"
                              value={recurringTaskForm.title}
                              onChange={(e) => setRecurringTaskForm({ ...recurringTaskForm, title: e.target.value })}
                              className="w-full rounded-xl bg-white border border-slate-200 px-4 py-2.5 text-slate-900 outline-none focus:border-[#8AC926] transition"
                            />
                          </div>
                          <div>
                            <label className="block text-slate-700 font-bold mb-1.5">Description</label>
                            <textarea
                              rows={3}
                              placeholder="Instructions for teachers..."
                              value={recurringTaskForm.description}
                              onChange={(e) => setRecurringTaskForm({ ...recurringTaskForm, description: e.target.value })}
                              className="w-full rounded-xl bg-white border border-slate-200 px-4 py-2.5 text-slate-900 outline-none focus:border-[#8AC926] transition"
                            />
                          </div>
                          <div>
                            <label className="block text-slate-700 font-bold mb-1.5">Repeat Day</label>
                            <select
                              value={recurringTaskForm.repeatDay}
                              onChange={(e) => setRecurringTaskForm({ ...recurringTaskForm, repeatDay: e.target.value })}
                              className="w-full rounded-xl bg-white border border-slate-200 px-4 py-2.5 text-slate-900 outline-none focus:border-[#8AC926] transition appearance-none"
                            >
                              <option value="MONDAY">Monday</option>
                              <option value="TUESDAY">Tuesday</option>
                              <option value="WEDNESDAY">Wednesday</option>
                              <option value="THURSDAY">Thursday</option>
                              <option value="FRIDAY">Friday</option>
                              <option value="SATURDAY">Saturday</option>
                              <option value="SUNDAY">Sunday</option>
                            </select>
                          </div>
                          <button
                            type="submit"
                            disabled={actionLoading === "recurring-task-save"}
                            className="w-full py-3 rounded-xl bg-[#8AC926] text-white font-sans font-bold text-xs tracking-wider uppercase hover:bg-[#78B020] transition shadow-md shadow-[#8AC926]/10 disabled:opacity-60"
                          >
                            {actionLoading === "recurring-task-save" ? "Saving..." : "Save Task"}
                          </button>
                        </form>
                      </div>
                    </div>
                  </div>
                )}

                {/* HISTORY MODAL */}
                {viewingHistoryTaskId && (
                  <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-2xl rounded-2xl shadow-xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
                      <div className="bg-slate-50 px-5 py-4 border-b border-slate-100 flex items-center justify-between shrink-0">
                        <div className="flex items-center gap-2">
                          <History className="w-5 h-5 text-slate-400" />
                          <h3 className="font-bold text-slate-800 tracking-wide">Assignment History</h3>
                        </div>
                        <button
                          type="button"
                          onClick={() => setViewingHistoryTaskId(null)}
                          className="text-slate-400 hover:text-slate-600 transition p-1"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                      <div className="p-0 overflow-y-auto modern-scrollbar bg-slate-50">
                        {recurringTaskHistory.length === 0 ? (
                          <div className="p-8 text-center text-slate-500 font-medium text-sm">
                            No tasks have been automatically generated yet.
                          </div>
                        ) : (
                          <table className="w-full text-left text-xs">
                            <thead className="bg-slate-100 sticky top-0 text-slate-500 font-bold uppercase tracking-wider">
                              <tr>
                                <th className="px-4 py-3">Date</th>
                                <th className="px-4 py-3">Teacher</th>
                                <th className="px-4 py-3">Status</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {recurringTaskHistory.map(th => (
                                <tr key={th.id} className="bg-white hover:bg-slate-50">
                                  <td className="px-4 py-3 font-medium text-slate-700">
                                    {new Date(th.createdAt).toLocaleDateString()}
                                  </td>
                                  <td className="px-4 py-3">
                                    <div className="font-bold text-slate-800">{th.teacher?.name}</div>
                                    <div className="text-[10px] text-slate-500">{th.teacher?.email}</div>
                                  </td>
                                  <td className="px-4 py-3">
                                    <span className={\`px-2 py-1 rounded text-[9px] font-bold uppercase tracking-wider \${
                                      th.status === "COMPLETED" ? "bg-blue-50 text-blue-700" :
                                      th.status === "APPROVED" ? "bg-emerald-50 text-emerald-700" :
                                      th.status === "REJECTED" ? "bg-rose-50 text-rose-700" :
                                      "bg-amber-50 text-amber-700"
                                    }\`}>
                                      {th.status}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </AdminPageBody>
            </AdminPageShell>
          )}

          `;

const newContent = content.substring(0, startIndex) + newUi + content.substring(endIndex);
fs.writeFileSync(filePath, newContent, 'utf8');
console.log("Successfully replaced Tasks UI.");
