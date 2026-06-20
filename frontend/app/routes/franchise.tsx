import type { Route } from "./+types/franchise";
import { PageShell } from "../components/PageShell";
import { FranchiseForm } from "../components/FranchiseForm";
import { ShieldCheck, Award, TrendingUp, HelpCircle, Phone, ArrowRight, BookOpen, Users, Compass, Laptop } from "lucide-react";
import { WHATSAPP_URL } from "../lib/constants";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Franchise Opportunity | Simba Academy" },
    { name: "description", content: "Partner with Simba Academy to bring a premium, nature-guided learning savanna to your city. Explore franchise benefits, support, and apply today." },
  ];
}

// Playful Wooden Header Component
function WoodenHeader({ badge, title, subtitle }: { badge: string; title: string; subtitle?: string }) {
  return (
    <div className="text-center max-w-3xl mx-auto mb-16 flex flex-col items-center">
      <div className="flex flex-col items-center select-none animate-rope-swing mb-4">
        {/* Hanging Rope Strands */}
        <div className="flex justify-between w-36 h-6 px-6 pointer-events-none">
          <div className="w-[3px] h-full bg-[#8b4513]/40 border-l-[1.5px] border-[#5c2c0a]/60 border-dashed" />
          <div className="w-[3px] h-full bg-[#8b4513]/40 border-l-[1.5px] border-[#5c2c0a]/60 border-dashed" />
        </div>
        {/* Wooden Sign Board */}
        <div className="wood-board-sign wood-board-nails px-8 py-3.5 text-center text-white border-2 border-[#5c2c0a]">
          <span className="font-sans font-black text-[10px] uppercase tracking-widest text-[#FFD275] block drop-shadow-sm">
            {badge}
          </span>
          <h3 className="text-xl sm:text-2.5xl font-fredoka font-black tracking-tight text-white mt-1">
            {title}
          </h3>
        </div>
      </div>
      {subtitle && (
        <p className="text-[#5D4037] text-sm sm:text-base font-semibold max-w-xl mt-3 leading-relaxed">
          {subtitle}
        </p>
      )}
    </div>
  );
}

const BENEFITS = [
  {
    title: "Established Brand Trust",
    desc: "Leverage Simba Academy's premium brand name and parent-approved savanna theme.",
    icon: Award,
    color: "text-[#FF9F1C]"
  },
  {
    title: "High Returns (ROI)",
    desc: "Enjoy rapid break-even and highly attractive returns driven by our high retention rates.",
    icon: TrendingUp,
    color: "text-[#8AC926]"
  },
  {
    title: "Proprietary Software Suite",
    desc: "Full automated platform covering fee payments, lesson plans, storybook portals, and teacher checks.",
    icon: Laptop,
    color: "text-[#4EA8DE]"
  },
  {
    title: "Zero-Risk Curriculum",
    desc: "Acquire full rights to our accredited play-based environmental and early science syllabus.",
    icon: ShieldCheck,
    color: "text-[#FF70A6]"
  }
];

const SUPPORTS = [
  {
    title: "Savanna Architectural Setup",
    desc: "Complete interior blueprints, sandbox specifications, organic toy sourcing, and classroom safety layout plans.",
    icon: Compass
  },
  {
    title: "Teacher Recruitment & Training",
    desc: "Standard screening protocols, guide manuals, child care workshops, and onboarding programs.",
    icon: Users
  },
  {
    title: "Admissions Marketing Kit",
    desc: "Localized launch plans, brochures, digital media templates, and customized flyers.",
    icon: BookOpen
  }
];

const FAQS = [
  {
    q: "What is the typical property area required?",
    a: "A minimum carpet area of 1,500 - 2,500 sq.ft. on a ground floor property with secure access and play area."
  },
  {
    q: "How long does it take to launch a branch?",
    a: "Usually between 45 to 60 days once property leasing and agreements are finalized."
  },
  {
    q: "Do I get exclusive regional rights?",
    a: "Yes! We secure territorial rights for each partner to ensure zero internal competition within designated bounds."
  }
];

export default function FranchisePage() {
  return (
    <PageShell>
      <div className="py-16 px-6 sm:px-12 max-w-7xl mx-auto">
        <WoodenHeader 
          badge="Savanna Partnerships" 
          title="Bring Simba Academy to Your City" 
          subtitle="Join the fastest growing network of premium, nature-guided preschools. We provide all the tools, curriculum, and technology required."
        />

        {/* Section 1: Why Partner & Benefits */}
        <div className="mb-24 grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
          <div className="lg:col-span-5 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#8AC926]/10 border border-[#8AC926]/25">
              <span className="text-[#8AC926] font-extrabold text-[10px] uppercase tracking-wider">
                Why Partner With Us
              </span>
            </div>
            <h3 className="text-3.5xl font-black text-[#3E2723] tracking-tight leading-tight">
              An Innovative Early Education Business Model
            </h3>
            <p className="text-[#5D4037] text-base leading-relaxed font-semibold">
              The early learning industry is shifting rapidly toward experiential, visual, and ecological education. Simba Academy is at the forefront of this shift, offering parents a premium biology-rich preschool model. 
            </p>
            <p className="text-[#5D4037]/80 text-sm leading-relaxed">
              By franchising with us, you aren't just opening a day school; you are introducing a custom-designed savanna ecosystem. Our automated student portal, digital story libraries, and cloud-integrated billing systems reduce admin friction, allowing you to focus entirely on school quality.
            </p>
          </div>

          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-6">
            {BENEFITS.map((benefit, idx) => {
              const Icon = benefit.icon;
              return (
                <div 
                  key={idx}
                  className="bg-white border-2 border-slate-100/80 rounded-[2.2rem] p-8 shadow-xs hover:border-[#8AC926]/20 transition-all duration-300 bouncy-card flex flex-col items-start"
                >
                  <div className={`w-12 h-12 bg-[#FAF6EE] rounded-2xl flex items-center justify-center mb-6 shadow-2xs border border-slate-100 ${benefit.color}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <h4 className="text-base font-extrabold text-[#3E2723] mb-2">{benefit.title}</h4>
                  <p className="text-xs text-[#5D4037]/80 leading-relaxed font-semibold">{benefit.desc}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Section 2: Support Provided & Business Growth */}
        <div className="mb-24 bg-gradient-to-br from-[#FAF8F5] to-[#F1EDE4] border-[3px] border-[#8b4513]/15 rounded-[3.5rem] p-8 sm:p-14 shadow-sm relative overflow-hidden">
          <div className="absolute -bottom-8 -right-8 w-44 h-44 text-[#8AC926]/5 pointer-events-none rotate-45">
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
              <path d="M17,8C8,10 5.9,16.17 3.82,21.34L2.18,20.66C4.26,15.49 6.34,8.5 17,8M21,2C21,2 14,3 10,7C14,7 18.5,8.5 21,11C21.5,9 21.75,7 21,2Z" />
            </svg>
          </div>
          
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-12">
            <div className="lg:col-span-6 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FF9F1C]/10 border border-[#FF9F1C]/25">
                <span className="text-[#FF9F1C] font-extrabold text-[10px] uppercase tracking-wider">
                  Support System
                </span>
              </div>
              <h3 className="text-3xl font-black text-[#3E2723] tracking-tight">Support Provided to Partners</h3>
              <p className="text-[#5D4037]/90 text-sm leading-relaxed font-semibold">
                Our support team is with you at every stage, from the day you sign your agreement to daily operational reviews.
              </p>
              
              <div className="space-y-4 pt-2">
                {SUPPORTS.map((support, idx) => {
                  const Icon = support.icon;
                  return (
                    <div key={idx} className="flex gap-4">
                      <div className="w-10 h-10 rounded-xl bg-white border border-[#FF9F1C]/25 flex items-center justify-center shrink-0 text-[#FF9F1C] shadow-2xs">
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="space-y-0.5">
                        <h4 className="text-sm font-extrabold text-[#3E2723]">{support.title}</h4>
                        <p className="text-xs text-[#5D4037]/80 leading-relaxed font-semibold">{support.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="lg:col-span-6 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#4EA8DE]/10 border border-[#4EA8DE]/25">
                <span className="text-[#4EA8DE] font-extrabold text-[10px] uppercase tracking-wider">
                  Scalability
                </span>
              </div>
              <h3 className="text-3xl font-black text-[#3E2723] tracking-tight">Business Growth Opportunities</h3>
              <p className="text-[#5D4037] text-sm leading-relaxed font-semibold">
                With early preschool demand steadily climbing in tier-2 cities, expanding your footprint is extremely straightforward.
              </p>
              <div className="bg-white border-2 border-slate-100 rounded-3xl p-6 shadow-2xs space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#E3F2FD] text-blue-600 flex items-center justify-center font-bold text-sm">1</div>
                  <h4 className="text-sm font-extrabold text-[#3E2723]">Multi-Center Expansion</h4>
                </div>
                <p className="text-xs text-[#5D4037]/80 leading-relaxed font-semibold">
                  Once your primary branch breaks even, our territorial agreements support setting up smaller feeder nurseries in satellite suburbs.
                </p>
                <div className="border-t border-slate-100 pt-4 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#E8F5E9] text-[#8AC926] flex items-center justify-center font-bold text-sm">2</div>
                  <h4 className="text-sm font-extrabold text-[#3E2723]">Integrated Daycare Add-on</h4>
                </div>
                <p className="text-xs text-[#5D4037]/80 leading-relaxed font-semibold">
                  Enrich your revenue model by adding our certified daycare program, keeping classrooms active until evening hours.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Franchise Inquiry Form & FAQ */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">
          {/* Inquiry form */}
          <div className="lg:col-span-7 space-y-6">
            <h3 className="text-2.5xl font-black text-[#3E2723] tracking-tight">Franchise Inquiry Form</h3>
            <p className="text-[#5D4037]/90 text-sm font-semibold">
              Fill out the form below to receive our detailed curriculum booklet and financial model spreadsheets.
            </p>
            <FranchiseForm />
          </div>

          {/* Sidebar FAQs */}
          <div className="lg:col-span-5 space-y-8 bg-white border-2 border-slate-100 rounded-[2.5rem] p-8 shadow-xs">
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-xl bg-[#FFF3E0] flex items-center justify-center text-[#FF9F1C] border border-[#FF9F1C]/20 shadow-2xs">
                <HelpCircle className="w-5 h-5" />
              </div>
              <h4 className="text-lg font-black text-[#3E2723]">Partnership FAQs</h4>
            </div>
            
            <div className="space-y-6">
              {FAQS.map((faq, idx) => (
                <div key={idx} className="space-y-1.5 text-left">
                  <h5 className="text-xs font-extrabold text-[#3E2723] flex items-center gap-1.5">
                    <ArrowRight className="w-3.5 h-3.5 text-[#FF9F1C] shrink-0" />
                    {faq.q}
                  </h5>
                  <p className="text-xs text-[#5D4037]/80 leading-relaxed pl-5 font-semibold">
                    {faq.a}
                  </p>
                </div>
              ))}
            </div>

            <div className="border-t border-slate-100 pt-6 space-y-4">
              <h5 className="text-xs font-black text-[#3E2723] uppercase tracking-wider">Need Immediate Answers?</h5>
              <p className="text-xs text-[#5D4037]/80 font-semibold leading-relaxed">
                Connect directly with our franchise coordinators for a friendly introductory conversation.
              </p>
              <a
                href={WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-xs font-extrabold text-[#8AC926] hover:text-[#78b020] transition-colors"
              >
                Chat on WhatsApp <Phone className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>

      </div>
    </PageShell>
  );
}
