/**
 * Generates admin tab components from admin.dashboard.tsx slices.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const src = fs.readFileSync(path.join(root, "app/routes/admin.dashboard.tsx"), "utf8");
const lines = src.split(/\r?\n/);

function slice(start, end) {
  return lines.slice(start - 1, end).join("\n");
}

function dedent(block, spaces = 14) {
  const prefix = " ".repeat(spaces);
  return block
    .split("\n")
    .map((line) => (line.startsWith(prefix) ? line.slice(spaces) : line))
    .join("\n");
}

function writeTab(name, { imports, state, handlers, loadEffect, jsxStart, jsxEnd, extraReturn, skipLoader }) {
  const jsx = dedent(slice(jsxStart, jsxEnd));
  const loader = skipLoader
    ? ""
    : `  if (loading) return <AdminTabLoader />;\n\n`;

  const content = `${imports}

export function Admin${name}Tab() {
${state}

${handlers}

${loadEffect}

${extraReturn ?? ""}${loader}  return (
${jsx.split("\n").map((l) => (l ? `    ${l}` : l)).join("\n")}
  );
}
`;

  const out = path.join(root, `app/components/admin/tabs/Admin${name}Tab.tsx`);
  fs.writeFileSync(out, content);
  console.log("generated", out);
}

// ── Overview ──
writeTab("Overview", {
  skipLoader: false,
  imports: `import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { Users, CreditCard, Calendar, ChevronRight, TrendingUp, ExternalLink } from "lucide-react";
import { api, ApiError, type DashboardStats, type Inquiry, type FranchiseInquiry, type Payment, type Task } from "../../../lib/api";
import { ADMIN_TAB_PATHS, type AdminTab } from "../../../lib/adminRoutes";
import { useAdminOutlet } from "../AdminOutletContext";
import { useAdminTabLoadError } from "../useAdminTabLoadError";
import { AdminTabLoader } from "../AdminTabLoader";
import { RecentPaymentCard, sortPaymentsNewestFirst } from "../../RecentPaymentCard";
import { clearSession } from "../../../lib/auth";`,
  state: `  const navigate = useNavigate();
  const { token } = useAdminOutlet();
  const handleLoadError = useAdminTabLoadError();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [franchiseInquiries, setFranchiseInquiries] = useState<FranchiseInquiry[]>([]);

  function goToTab(tab: AdminTab) {
    navigate(ADMIN_TAB_PATHS[tab]);
  }

  const recentPaymentsTop = sortPaymentsNewestFirst(payments).slice(0, 2);
  const recentPaymentsList = sortPaymentsNewestFirst(payments).slice(0, 3);`,
  handlers: "",
  loadEffect: `  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const [dashboardStats, paymentsResult, inquiriesResult, tasksResult, franchisesResult] =
          await Promise.allSettled([
            api.getDashboard(token),
            api.getPayments(token),
            api.getInquiries(token),
            api.getTasks(token),
            api.getFranchiseInquiries(token),
          ]);
        if (cancelled) return;
        if (dashboardStats.status !== "fulfilled") throw dashboardStats.reason;
        setStats(dashboardStats.value);
        if (paymentsResult.status === "fulfilled") setPayments(paymentsResult.value);
        if (inquiriesResult.status === "fulfilled") setInquiries(inquiriesResult.value);
        if (tasksResult.status === "fulfilled") setTasks(tasksResult.value);
        if (franchisesResult.status === "fulfilled") setFranchiseInquiries(franchisesResult.value);
      } catch (err) {
        if (!cancelled) handleLoadError("overview", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [token]);`,
  extraReturn: `  const workspaceHeader = (
    <div className="flex flex-wrap justify-between items-center gap-4 border-b border-slate-100 pb-3 mb-5 select-none">
      <div>
        <h2 className="text-lg font-bold text-slate-900 tracking-wide uppercase">Simba Academy Workspace</h2>
      </div>
      <div className="flex items-center gap-3">
        <a href="/" target="_blank" rel="noopener noreferrer" className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-800 font-bold text-2xs flex items-center gap-1.5 shadow-xs hover:bg-[#8AC926]/10 hover:border-[#8AC926]/40 transition-all duration-300">
          <ExternalLink className="w-3 h-3 text-[#8AC926]" /> View Live Site
        </a>
      </div>
    </div>
  );

`,
  jsxStart: 1086,
  jsxEnd: 1340,
});

// Patch overview to include header - rewrite manually after
