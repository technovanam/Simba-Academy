import type { Route } from "./+types/about";
import { PageShell } from "../components/PageShell";
import { Heart, ShieldCheck, Sparkles, Target, Users } from "lucide-react";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "About Us | Simba Academy Preschool" },
    { name: "description", content: "Learn about Simba Academy's vision, mission, values, and founder message." },
  ];
}

const values = [
  { title: "Nurturing Care", desc: "Every cub receives personalized attention in a safe, loving environment.", icon: Heart },
  { title: "Holistic Learning", desc: "We blend academics, creativity, nature exploration, and social skills.", icon: Sparkles },
  { title: "Trusted Safety", desc: "Gated campus, trained staff, and secure child-first policies.", icon: ShieldCheck },
  { title: "Parent Partnership", desc: "Open communication and transparent progress updates for every family.", icon: Users },
];

export default function AboutPage() {
  return (
    <PageShell>
      <section className="max-w-6xl mx-auto px-6 py-16">
        <div className="text-center mb-14">
          <h1 className="font-sans text-4xl md:text-5xl font-extrabold text-[#3E2723] mb-4">About Simba Academy</h1>
          <p className="text-[#5D4037] font-semibold max-w-3xl mx-auto">
            A premier preschool savanna in Salem blending nature-guided discovery with certified early academic excellence.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-16">
          <div className="glass-panel rounded-lg p-8">
            <h2 className="font-sans text-2xl font-extrabold mb-4 flex items-center gap-2">
              <Target className="text-[#FF9F1C]" /> Our Vision
            </h2>
            <p className="text-[#5D4037] font-semibold leading-relaxed">
              To create joyful, confident learners who grow with curiosity, compassion, and a lifelong love for discovery.
            </p>
          </div>
          <div className="glass-panel rounded-lg p-8">
            <h2 className="font-sans text-2xl font-extrabold mb-4 flex items-center gap-2">
              <Sparkles className="text-[#8AC926]" /> Our Mission
            </h2>
            <p className="text-[#5D4037] font-semibold leading-relaxed">
              To deliver premium early childhood education through play-based learning, qualified educators, and a nature-rich campus experience.
            </p>
          </div>
        </div>

        <div className="glass-panel rounded-lg p-8 mb-16">
          <h2 className="font-sans text-2xl font-extrabold mb-4">Founder&apos;s Message</h2>
          <p className="text-[#5D4037] font-semibold leading-relaxed italic">
            &ldquo;At Simba Academy, we believe every child deserves a magical beginning. Our savanna-inspired campus is designed to spark imagination, build confidence, and prepare little cubs for a bright future. Thank you for trusting us with your most precious gift.&rdquo;
          </p>
        </div>

        <h2 className="font-sans text-3xl font-extrabold text-center mb-8">Our Values</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {values.map((v) => (
            <div key={v.title} className="glass-panel rounded-lg p-6 text-center">
              <v.icon className="w-10 h-10 mx-auto mb-4 text-[#FF9F1C]" />
              <h3 className="font-sans font-extrabold mb-2">{v.title}</h3>
              <p className="text-sm text-[#5D4037] font-semibold">{v.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </PageShell>
  );
}
