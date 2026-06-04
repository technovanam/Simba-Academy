import { useEffect } from "react";
import { Link, useNavigate } from "react-router";
import type { Route } from "./+types/home";
import { AuthPageShell } from "../components/AuthUi";
import { GraduationCap, Shield, Users } from "lucide-react";
import { getDashboardPath, getUser } from "../lib/auth";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Simba Academy | Sign In" },
    { name: "description", content: "Sign in to the Simba Academy student, teacher, or admin portal." },
  ];
}

const PORTALS = [
  {
    label: "Student",
    description: "Parents & students",
    to: "/login",
    icon: GraduationCap,
    className: "bg-[#FF9F1C] hover:bg-[#e88f0a] text-white shadow-[#FF9F1C]/25",
  },
  {
    label: "Teacher",
    description: "Staff portal",
    to: "/teacher/login",
    icon: Users,
    className: "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/25",
  },
  {
    label: "Admin",
    description: "Academy director",
    to: "/admin/login",
    icon: Shield,
    className: "bg-[#8AC926] hover:bg-[#78B020] text-white shadow-[#8AC926]/20",
  },
] as const;

export default function Home() {
  const navigate = useNavigate();

  useEffect(() => {
    const user = getUser();
    if (user) {
      navigate(getDashboardPath(user.role), { replace: true });
    }
  }, [navigate]);

  return (
    <AuthPageShell maxWidth="max-w-sm">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-lg overflow-hidden">
        <div className="p-8">
          <div className="flex flex-col items-center text-center mb-6">
            <img
              src="/favicon.png"
              alt="Simba Preschool"
              className="w-14 h-14 object-contain mb-3"
            />
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Simba Preschool
            </h1>
            <p className="text-sm text-slate-500 font-medium mt-1.5">
              Choose your portal to continue
            </p>
          </div>

          <div className="space-y-3">
            {PORTALS.map(({ label, description, to, icon: Icon, className }) => (
              <Link
                key={to}
                to={to}
                className={`flex items-center gap-4 w-full px-4 py-3.5 rounded-xl font-bold text-sm transition-colors shadow-md ${className}`}
              >
                <Icon className="w-5 h-5 shrink-0 opacity-90" strokeWidth={2} />
                <span className="flex flex-col items-start text-left leading-tight">
                  <span>{label} login</span>
                  <span className="text-[10px] font-semibold opacity-80 normal-case">
                    {description}
                  </span>
                </span>
              </Link>
            ))}
          </div>

          <p className="text-center text-xs text-slate-500 font-medium mt-5">
            New student?{" "}
            <Link to="/register" className="text-[#c77a00] font-bold hover:underline">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </AuthPageShell>
  );
}
