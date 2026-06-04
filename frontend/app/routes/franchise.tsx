import type { Route } from "./+types/franchise";
import { PageShell } from "../components/PageShell";
import { FranchiseForm } from "../components/FranchiseForm";
import { Building2, Handshake, TrendingUp, Users } from "lucide-react";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Franchise | Simba Academy Preschool" },
    { name: "description", content: "Partner with Simba Academy and bring premium preschool education to your community." },
  ];
}

const benefits = [
  { title: "Proven Brand", desc: "Join a trusted preschool brand with a strong parent community.", icon: Building2 },
  { title: "Full Support", desc: "Curriculum, training, marketing, and operational guidance included.", icon: Handshake },
  { title: "Growth Ready", desc: "Scalable business model with multiple revenue streams.", icon: TrendingUp },
  { title: "Expert Team", desc: "Dedicated franchise support from Techno Vanam and Simba leadership.", icon: Users },
];

export default function FranchisePage() {
  return (
    <PageShell>
      <section className="max-w-6xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h1 className="font-sans text-4xl md:text-5xl font-extrabold text-[#3E2723] mb-4">Franchise With Us</h1>
          <p className="text-[#5D4037] font-semibold max-w-2xl mx-auto">
            Bring the Simba Academy savanna experience to your city. We provide end-to-end franchise support.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {benefits.map((b) => (
            <div key={b.title} className="glass-panel rounded-lg p-6 text-center">
              <b.icon className="w-10 h-10 mx-auto mb-4 text-[#8AC926]" />
              <h3 className="font-sans font-extrabold mb-2">{b.title}</h3>
              <p className="text-sm text-[#5D4037] font-semibold">{b.desc}</p>
            </div>
          ))}
        </div>

        <div className="max-w-2xl mx-auto">
          <h2 className="font-sans text-2xl font-extrabold text-center mb-6">Franchise Inquiry Form</h2>
          <FranchiseForm />
        </div>
      </section>
    </PageShell>
  );
}
