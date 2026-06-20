import type { Route } from "./+types/about";
import { PageShell } from "../components/PageShell";
import { Heart, Sparkles, ShieldCheck, Users, Target, Award, Quote, CheckCircle2 } from "lucide-react";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "About Us | Simba Academy Preschool" },
    { name: "description", content: "Discover Simba Academy's early childhood savanna ecosystem, mission, vision, core values, and message from our founder." },
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

const VALUES = [
  {
    title: "Nurturing Care",
    desc: "Every cub receives personalized attention in a safe, loving, and supportive environment.",
    icon: Heart,
    color: "text-[#FF9F1C]",
    bg: "bg-[#FF9F1C]/10",
    border: "border-[#FF9F1C]/25"
  },
  {
    title: "Holistic Learning",
    desc: "We blend academic rigor, creative arts, outdoor biology exploration, and social cooperation.",
    icon: Sparkles,
    color: "text-[#8AC926]",
    bg: "bg-[#8AC926]/10",
    border: "border-[#8AC926]/25"
  },
  {
    title: "Trusted Safety",
    desc: "A completely gated campus, verified guides, secure checkouts, and medical safety procedures.",
    icon: ShieldCheck,
    color: "text-[#4EA8DE]",
    bg: "bg-[#4EA8DE]/10",
    border: "border-[#4EA8DE]/25"
  },
  {
    title: "Parent Partnership",
    desc: "Open channels, real-time daily reports, and collaborative milestones for our cub families.",
    icon: Users,
    color: "text-[#FF70A6]",
    bg: "bg-[#FF70A6]/10",
    border: "border-[#FF70A6]/25"
  },
];

const TRUST_POINTS = [
  {
    title: "1:5 Guide-to-Cub Ratio",
    desc: "Ensures focused attention and interactive learning support for every child."
  },
  {
    title: "Tactile Biology Labs",
    desc: "Immersive nature yards where kids learn botany, geology, and weather through touch."
  },
  {
    title: "Verified Ranger Network",
    desc: "Every staff member is certified in early childhood care and pediatric first-aid."
  },
  {
    title: "Zero-Plastic Play Yards",
    desc: "All physical play materials are crafted from sustainable wood, clay, and soft organic fibers."
  },
  {
    title: "Real-time Portal Updates",
    desc: "Check lesson plans, review daily tasks, and track child progress on Zoho integrations."
  },
  {
    title: "Structured Expedition Schedule",
    desc: "A healthy balance of indoor logic modules and physical outdoor playsheet runs."
  }
];

export default function AboutPage() {
  return (
    <PageShell>
      <div className="py-16 px-6 sm:px-12 max-w-7xl mx-auto relative">
        {/* About Hero Header */}
        <WoodenHeader 
          badge="Our Origin Story" 
          title="About Simba Academy" 
          subtitle="A state-of-the-art preschool savanna where untamed curiosity meets premium early childhood academic standard."
        />

        {/* Section 1: About the School & Vision/Mission */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center mb-24">
          <div className="lg:col-span-6 space-y-6">
            <h2 className="text-3xl font-extrabold text-[#3E2723] tracking-tight">
              An Immersive Nature-Rich Learning Savanna
            </h2>
            <p className="text-[#5D4037] text-base leading-relaxed font-semibold">
              Simba Academy was founded with a singular dream: to break free from rigid, concrete-bound classrooms and introduce a vibrant learning savanna. Located in Salem, Tamil Nadu, our campus matches the layout of a nature preserve, incorporating soil research beds, indoor play cages, and tactile sandboxes.
            </p>
            <p className="text-[#5D4037]/80 text-sm leading-relaxed">
              We leverage play-based learning frameworks to help young explorers identify shapes, construct vocabulary, and build basic mathematical coordinates. Rather than forcing memory blocks, we guide children to experience science, communication, and emotional resilience through hands-on activities.
            </p>
          </div>

          <div className="lg:col-span-6 grid grid-cols-1 gap-6">
            {/* Vision Card */}
            <div className="bg-white border-3 border-[#8AC926]/15 rounded-[2.2rem] p-8 shadow-sm hover:shadow-md transition-all duration-300 bouncy-card relative overflow-hidden group">
              <div className="absolute -right-4 -top-4 w-24 h-24 bg-[#8AC926]/5 rounded-full pointer-events-none group-hover:scale-125 transition-transform" />
              <div className="w-12 h-12 bg-[#FAF6EE] rounded-2xl border-2 border-[#8AC926]/20 flex items-center justify-center mb-6 shadow-2xs">
                <Target className="w-6 h-6 text-[#8AC926]" />
              </div>
              <h4 className="text-xl font-extrabold text-[#3E2723] mb-2">Our Vision</h4>
              <p className="text-[#5D4037]/90 text-sm leading-relaxed font-semibold">
                To build a generation of brave, self-motivated, and environment-conscious leaders who navigate academic transitions with confidence, emotional resilience, and a deep appreciation for the world around them.
              </p>
            </div>

            {/* Mission Card */}
            <div className="bg-white border-3 border-[#FF9F1C]/15 rounded-[2.2rem] p-8 shadow-sm hover:shadow-md transition-all duration-300 bouncy-card relative overflow-hidden group">
              <div className="absolute -right-4 -top-4 w-24 h-24 bg-[#FF9F1C]/5 rounded-full pointer-events-none group-hover:scale-125 transition-transform" />
              <div className="w-12 h-12 bg-[#FAF6EE] rounded-2xl border-2 border-[#FF9F1C]/20 flex items-center justify-center mb-6 shadow-2xs">
                <Award className="w-6 h-6 text-[#FF9F1C]" />
              </div>
              <h4 className="text-xl font-extrabold text-[#3E2723] mb-2">Our Mission</h4>
              <p className="text-[#5D4037]/90 text-sm leading-relaxed font-semibold">
                To deliver accredited childhood curriculums wrapped in tactile savanna roleplay, offering students certified development tracks in communication, fine-motor coordination, and environmental sciences.
              </p>
            </div>
          </div>
        </div>

        {/* Section 2: Founder Message */}
        <div className="mb-24 bg-gradient-to-br from-[#FAF8F5] to-[#F1EDE4] border-[3px] border-[#8b4513]/15 rounded-[3rem] p-8 sm:p-12 shadow-md relative overflow-hidden">
          {/* Decorative Vine Overlay */}
          <div className="absolute top-0 right-0 w-32 h-32 text-[#8AC926]/10 opacity-30 pointer-events-none">
            <svg viewBox="0 0 100 100" fill="currentColor">
              <path d="M0,50 Q25,25 50,50 T100,50" stroke="currentColor" strokeWidth="4" fill="none" />
            </svg>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
            <div className="lg:col-span-4 flex flex-col items-center text-center">
              <div className="w-40 h-40 rounded-full border-4 border-[#FF9F1C] overflow-hidden shadow-md bg-white flex items-center justify-center relative">
                <Users className="w-16 h-16 text-[#FF9F1C]" />
              </div>
              <h4 className="text-lg font-black text-[#3E2723] mt-4">Sasikiran TT</h4>
              <p className="text-xs text-[#8AC926] font-extrabold uppercase tracking-wider">Founder, Simba Academy</p>
            </div>
            
            <div className="lg:col-span-8 space-y-4">
              <div className="w-10 h-10 rounded-xl bg-[#FFF3E0] flex items-center justify-center text-[#FF9F1C] border border-[#FF9F1C]/20 shadow-2xs">
                <Quote className="w-5 h-5 fill-current" />
              </div>
              <h3 className="text-2.5xl font-black text-[#3E2723]">Founder&apos;s Message</h3>
              <p className="text-[#5D4037] text-base leading-relaxed italic font-semibold">
                &ldquo;Every child is born with the natural curiosity of a young cub entering a vast, exciting world. At Simba Academy, our role is not to restrict that curiosity with standard benches and walls, but to provide a secure, guidance-rich savanna where they can explore, make mistakes, and learn to roar. We are committed to making their first educational steps unforgettable, creative, and safe.&rdquo;
              </p>
            </div>
          </div>
        </div>

        {/* Section 3: Our Values */}
        <div className="mb-24">
          <WoodenHeader 
            badge="Savanna Guidelines" 
            title="Core Values We Stand For" 
            subtitle="We hold ourselves to strict developmental and moral standards, shaping a positive space for your cub."
          />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 pt-4">
            {VALUES.map((val, idx) => {
              const Icon = val.icon;
              return (
                <div 
                  key={idx} 
                  className={`bg-white border-2 ${val.border} rounded-[2.5rem] p-8 shadow-xs hover:shadow-lg transition-all duration-300 bouncy-card flex flex-col items-start`}
                >
                  <div className={`w-12 h-12 rounded-2xl ${val.bg} ${val.color} flex items-center justify-center mb-6 border border-current/10 shadow-2xs`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <h4 className="text-lg font-extrabold text-[#3E2723] mb-2">{val.title}</h4>
                  <p className="text-[#5D4037]/80 text-xs leading-relaxed font-semibold">{val.desc}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Section 4: Why Parents Trust Us */}
        <div className="mb-8">
          <WoodenHeader 
            badge="The Simba Shield" 
            title="Why Parents Trust Us" 
            subtitle="Discover what makes Simba Academy the premier preschool choice for families across Salem."
          />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pt-4 max-w-6xl mx-auto">
            {TRUST_POINTS.map((pt, idx) => (
              <div 
                key={idx} 
                className="bg-white border-2 border-slate-100/80 rounded-3xl p-6 shadow-2xs flex gap-4 hover:border-[#8AC926]/30 transition-all duration-300 bouncy-card"
              >
                <div className="w-10 h-10 rounded-xl bg-[#E8F5E9] flex items-center justify-center shrink-0 border border-[#8AC926]/30 text-[#8AC926]">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-extrabold text-[#3E2723]">{pt.title}</h4>
                  <p className="text-xs text-[#5D4037]/80 leading-relaxed font-semibold">{pt.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </PageShell>
  );
}
