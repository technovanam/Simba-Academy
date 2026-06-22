import { useEffect } from "react";
import type { Route } from "./+types/home";
import { Link } from "react-router";
import { PageShell } from "../components/PageShell";
import { 
  GraduationCap, 
  Heart, 
  ShieldCheck, 
  Award, 
  ArrowRight,
  BookOpen,
  Users,
  Compass
} from "lucide-react";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Simba Academy | Premium Education" },
    {
      name: "description",
      content: "Step into an immersive, premium, learning ecosystem. Simba Academy blends modern education with certified curriculums.",
    },
  ];
}

export default function LandingPage() {
  return (
    <PageShell>
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 sm:px-12 py-20 lg:py-32 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-8 z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-100">
              <span className="text-blue-600 font-bold text-xs uppercase tracking-wider">
                Premium Preschool Education
              </span>
            </div>
            <h1 className="text-5xl sm:text-6xl font-bold text-slate-900 tracking-tight leading-tight">
              Where Little Minds <span className="text-blue-600">Grow Big</span>.
            </h1>
            <p className="text-lg text-slate-600 leading-relaxed max-w-xl">
              We deliver an immersive, premium early childhood education that transforms learning into a lifelong success story.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Link 
                to="/portals" 
                className="px-8 py-4 rounded-xl bg-blue-600 text-white font-bold text-sm hover:bg-blue-700 transition-colors shadow-sm flex items-center justify-center gap-2"
              >
                Explore Portals
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link 
                to="/contact" 
                className="px-8 py-4 rounded-xl bg-white text-slate-700 font-bold text-sm hover:bg-slate-50 border border-slate-200 transition-colors flex items-center justify-center"
              >
                Contact Admissions
              </Link>
            </div>
          </div>
          <div className="relative z-10">
            <div className="aspect-[4/3] rounded-3xl overflow-hidden shadow-2xl border border-slate-200">
              <img 
                src="/914a0fab-87fe-4876-88f7-45d1705afe50.png" 
                alt="Simba Academy Campus" 
                className="w-full h-full object-cover" 
              />
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-slate-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 sm:px-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <h3 className="text-4xl font-bold text-blue-600 mb-2">100%</h3>
              <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">Safe Campus</p>
            </div>
            <div className="text-center">
              <h3 className="text-4xl font-bold text-indigo-600 mb-2">1:5</h3>
              <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">Teacher Ratio</p>
            </div>
            <div className="text-center">
              <h3 className="text-4xl font-bold text-emerald-600 mb-2">12+</h3>
              <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">Weekly Activities</p>
            </div>
            <div className="text-center">
              <h3 className="text-4xl font-bold text-purple-600 mb-2">5★</h3>
              <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">Parent Rating</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6 sm:px-12">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
              Nurturing Excellence
            </h2>
            <p className="text-lg text-slate-600 leading-relaxed">
              We provide a foundation for cognitive, emotional, and physical development through certified curriculums.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-slate-50 border border-slate-200 rounded-3xl p-10 text-center hover:shadow-md transition-shadow">
              <div className="w-16 h-16 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center mx-auto mb-6">
                <GraduationCap className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Academic Rigor</h3>
              <p className="text-slate-600 leading-relaxed">
                Certified curriculums designed to prepare children for primary education with strong fundamentals.
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-3xl p-10 text-center hover:shadow-md transition-shadow">
              <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-6">
                <Heart className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Holistic Care</h3>
              <p className="text-slate-600 leading-relaxed">
                A focus on emotional resilience, social skills, and personalized attention for every student.
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-3xl p-10 text-center hover:shadow-md transition-shadow">
              <div className="w-16 h-16 rounded-2xl bg-purple-100 text-purple-600 flex items-center justify-center mx-auto mb-6">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Unmatched Safety</h3>
              <p className="text-slate-600 leading-relaxed">
                Secure campuses with stringent medical protocols and vetted, highly-trained educators.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-slate-900">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to Begin the Journey?
          </h2>
          <p className="text-xl text-slate-400 mb-10 leading-relaxed">
            Schedule a visit today to see our facilities, meet the team, and discover what makes Simba Academy truly special.
          </p>
          <Link 
            to="/contact" 
            className="inline-flex px-10 py-4 rounded-xl bg-blue-600 text-white font-bold text-lg hover:bg-blue-700 transition-colors shadow-sm"
          >
            Schedule a Tour
          </Link>
        </div>
      </section>

    </PageShell>
  );
}