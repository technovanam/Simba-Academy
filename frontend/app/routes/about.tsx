import type { Route } from "./+types/about";
import { PageShell } from "../components/PageShell";
import { Heart, Sparkles, ShieldCheck, Users, Target, Award, Quote, CheckCircle2 } from "lucide-react";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "About Us | Simba Academy" },
    { name: "description", content: "Discover Simba Academy's mission, vision, core values, and message from our founder." },
  ];
}

const VALUES = [
  {
    title: "Nurturing Care",
    desc: "Every child receives personalized attention in a safe, loving, and supportive environment.",
    icon: Heart,
    color: "text-blue-600",
    bg: "bg-blue-50",
  },
  {
    title: "Holistic Learning",
    desc: "We blend academic rigor, creative arts, outdoor exploration, and social cooperation.",
    icon: Sparkles,
    color: "text-indigo-600",
    bg: "bg-indigo-50",
  },
  {
    title: "Trusted Safety",
    desc: "A completely secure campus, verified staff, safe checkouts, and medical safety procedures.",
    icon: ShieldCheck,
    color: "text-emerald-600",
    bg: "bg-emerald-50",
  },
  {
    title: "Parent Partnership",
    desc: "Open communication channels and collaborative milestones for our families.",
    icon: Users,
    color: "text-purple-600",
    bg: "bg-purple-50",
  },
];

const TRUST_POINTS = [
  {
    title: "1:5 Teacher-to-Student Ratio",
    desc: "Ensures focused attention and interactive learning support for every child."
  },
  {
    title: "Tactile Learning Labs",
    desc: "Immersive spaces where kids learn science and nature through touch."
  },
  {
    title: "Verified Educators",
    desc: "Every staff member is certified in early childhood care and pediatric first-aid."
  },
  {
    title: "Sustainable Play Areas",
    desc: "Play materials are crafted from sustainable wood and soft organic fibers."
  },
  {
    title: "Real-time Portal Updates",
    desc: "Check lesson plans, review daily tasks, and track child progress easily."
  },
  {
    title: "Structured Schedule",
    desc: "A healthy balance of indoor learning modules and physical outdoor play."
  }
];

export default function AboutPage() {
  return (
    <PageShell>
      <div className="py-20 px-6 sm:px-12 max-w-7xl mx-auto">
        
        {/* Hero Section */}
        <div className="text-center max-w-3xl mx-auto mb-20">
          <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 tracking-tight mb-6">
            About Simba Academy
          </h1>
          <p className="text-lg text-slate-600 leading-relaxed">
            A state-of-the-art preschool where untamed curiosity meets premium early childhood academic standards. We provide a vibrant, secure, and guidance-rich environment for young explorers.
          </p>
        </div>

        {/* Section 1: Vision & Mission */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-24">
          <div className="bg-white border border-slate-200 rounded-2xl p-10 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-center mb-6">
              <Target className="w-6 h-6 text-slate-700" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-4">Our Vision</h3>
            <p className="text-slate-600 leading-relaxed">
              To build a generation of brave, self-motivated, and environment-conscious leaders who navigate academic transitions with confidence, emotional resilience, and a deep appreciation for the world around them.
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-10 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-center mb-6">
              <Award className="w-6 h-6 text-slate-700" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-4">Our Mission</h3>
            <p className="text-slate-600 leading-relaxed">
              To deliver accredited childhood curriculums through engaging, hands-on learning experiences, offering students certified development tracks in communication, fine-motor coordination, and environmental sciences.
            </p>
          </div>
        </div>

        {/* Section 2: Founder Message */}
        <div className="mb-24 bg-slate-50 border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
          <div className="grid grid-cols-1 lg:grid-cols-2">
            {/* Left: Full Photo */}
            <div className="relative h-96 lg:h-auto">
              <img 
                src="https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=800&h=1000" 
                alt="Sasikiran TT - Founder" 
                className="absolute inset-0 w-full h-full object-cover"
              />
            </div>
            
            {/* Right: Content */}
            <div className="p-8 sm:p-14 lg:p-20 flex flex-col justify-center">
              <Quote className="w-10 h-10 text-slate-300 mb-8" />
              <h3 className="text-3xl font-bold text-slate-900 mb-6">Founder&apos;s Message</h3>
              <p className="text-slate-600 text-lg leading-relaxed italic mb-10">
                &ldquo;Every child is born with natural curiosity, eager to explore a vast and exciting world. At Simba Academy, our role is not to restrict that curiosity with standard benches and walls, but to provide a secure, guidance-rich environment where they can discover, make mistakes, and learn to thrive. We are committed to making their first educational steps unforgettable, creative, and safe.&rdquo;
              </p>
              <div>
                <h4 className="text-xl font-bold text-slate-900">Sasikiran TT</h4>
                <p className="text-sm font-bold text-slate-500 mt-1 uppercase tracking-wider">Founder & CEO</p>
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Our Values */}
        <div className="mb-24">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Core Values</h2>
            <p className="text-slate-600">We hold ourselves to strict developmental and moral standards.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {VALUES.map((val, idx) => {
              const Icon = val.icon;
              return (
                <div key={idx} className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow">
                  <div className={`w-12 h-12 rounded-xl ${val.bg} ${val.color} flex items-center justify-center mb-6`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <h4 className="text-lg font-bold text-slate-900 mb-3">{val.title}</h4>
                  <p className="text-slate-600 text-sm leading-relaxed">{val.desc}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Section 4: Why Parents Trust Us */}
        <div className="mb-12">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Why Parents Trust Us</h2>
            <p className="text-slate-600">Discover what makes Simba Academy the premier preschool choice.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {TRUST_POINTS.map((pt, idx) => (
              <div key={idx} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex gap-4">
                <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center shrink-0 border border-slate-100">
                  <CheckCircle2 className="w-4 h-4 text-slate-700" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-slate-900 mb-1">{pt.title}</h4>
                  <p className="text-sm text-slate-600 leading-relaxed">{pt.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </PageShell>
  );
}
