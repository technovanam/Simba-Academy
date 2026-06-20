import { useEffect } from "react";
import type { Route } from "./+types/home";
import { Link } from "react-router";
import { JungleHeader } from "../components/JungleHeader";
import { 
  Sparkles, 
  Compass, 
  GraduationCap, 
  BookOpen, 
  Heart, 
  Shield, 
  MapPin, 
  Activity, 
  Phone, 
  ArrowRight, 
  Star, 
  Award, 
  Smile, 
  Users, 
  Clock, 
  Mail,
  Palette,
  MessageCircle,
  Footprints,
  ChevronRight
} from "lucide-react";
import { BRANCHES, SOCIAL_LINKS, WHATSAPP_URL } from "../lib/constants";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Simba Academy | Premium Preschool Learning Savanna" },
    {
      name: "description",
      content: "Step into an immersive, premium, biology-rich learning ecosystem. Simba Academy preschool blends nature's untamed magic with certified curriculums.",
    },
  ];
}

// 1. Playful Wooden Header Component (Inspired by Reference Image 2)
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
          <h3 className="text-xl sm:text-2.5xl font-black tracking-tight text-white mt-1">
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

// 2. Playful Grass Border Divider (Inspired by Reference Images 1 & 4)
function GrassDivider({ flip = false }: { flip?: boolean }) {
  return (
    <div className={`w-full overflow-hidden leading-none z-30 pointer-events-none relative ${flip ? "-mt-1" : "-mb-1"}`}>
      <svg 
        viewBox="0 0 1200 24" 
        preserveAspectRatio="none" 
        className={`relative block w-full h-[18px] text-[#FAF6EE] fill-current ${flip ? "rotate-180" : ""}`}
      >
        <path d="M0,24 L1200,24 L1200,10 L1180,18 L1160,5 L1140,15 L1120,2 L1100,18 L1080,8 L1060,18 L1040,5 L1020,20 L1000,2 L980,18 L960,8 L940,20 L920,2 L900,18 L880,8 L860,15 L840,5 L820,18 L800,2 L780,18 L760,8 L740,18 L720,2 L700,18 L680,8 L660,15 L640,5 L620,18 L600,2 L580,18 L560,8 L540,18 L520,2 L500,15 L480,8 L460,20 L440,2 L420,18 L400,8 L380,20 L360,2 L340,18 L320,8 L300,18 L280,8 L260,20 L240,2 L220,18 L200,8 L180,18 L160,2 L140,18 L120,8 L100,15 L80,5 L60,18 L40,2 L20,18 L0,8 Z" />
      </svg>
    </div>
  );
}

export default function LandingPage() {
  useEffect(() => {
    document.documentElement.classList.add("landing-page");
    return () => {
      document.documentElement.classList.remove("landing-page");
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#FAF6EE] font-sans text-[#3E2723] selection:bg-[#FFD275] selection:text-[#3E2723] overflow-x-hidden flex flex-col relative">
      
      {/* Decorative Hanging Vines & Swaying Leaves in Margins */}
      <div className="absolute inset-x-0 top-0 h-[200px] pointer-events-none z-40 overflow-hidden flex justify-between px-10">
        {/* Hanging Vine Left */}
        <svg className="w-16 h-36 text-[#8AC926]/40 fill-current animate-sway origin-top" viewBox="0 0 100 200">
          <path d="M50,0 Q60,50 40,100 T50,200 M50,40 Q30,45 40,60 M50,80 Q70,90 60,105 M50,130 Q30,135 45,150 M50,170 Q70,180 55,195" stroke="currentColor" strokeWidth="3" fill="none" />
          <circle cx="40" cy="60" r="10" />
          <circle cx="60" cy="105" r="12" />
          <circle cx="45" cy="150" r="8" />
          <circle cx="55" cy="195" r="10" />
        </svg>

        {/* Hanging Vine Right */}
        <svg className="w-20 h-44 text-[#FF9F1C]/35 fill-current animate-sway-delayed origin-top" viewBox="0 0 100 200">
          <path d="M50,0 Q40,60 60,120 T50,200 M50,50 Q70,55 55,70 M50,90 Q30,100 45,115 M50,140 Q70,145 60,160" stroke="currentColor" strokeWidth="2.5" fill="none" />
          <circle cx="55" cy="70" r="9" />
          <circle cx="45" cy="115" r="11" />
          <circle cx="60" cy="160" r="9" />
        </svg>
      </div>

      {/* Decorative Floating Jungle Elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        {/* Soft floating dust particles */}
        {[
          { left: "8%", top: "12%", delay: "0s" },
          { left: "88%", top: "28%", delay: "1.5s" },
          { left: "4%", top: "55%", delay: "3s" },
          { left: "92%", top: "75%", delay: "2s" },
          { left: "48%", top: "42%", delay: "4s" },
        ].map((f, i) => (
          <div 
            key={i}
            className="absolute w-3 h-3 bg-[#8AC926]/30 rounded-full blur-[2px] animate-pulse"
            style={{ 
              left: f.left, 
              top: f.top, 
              animationDelay: f.delay,
              animationDuration: "5s"
            }}
          />
        ))}

        {/* Swaying Leaf 1 - Mid Left */}
        <div className="absolute left-[-2rem] top-[15%] w-24 h-24 text-[#8AC926]/12 opacity-80 animate-sway pointer-events-none">
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
            <path d="M17,8C8,10 5.9,16.17 3.82,21.34L2.18,20.66C4.26,15.49 6.34,8.5 17,8M21,2C21,2 14,3 10,7C14,7 18.5,8.5 21,11C21.5,9 21.75,7 21,2Z" />
          </svg>
        </div>

        {/* Swaying Leaf 2 - Mid Right */}
        <div className="absolute right-[-2rem] top-[45%] w-32 h-32 text-[#FF9F1C]/8 opacity-60 animate-sway-delayed pointer-events-none">
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
            <path d="M17,8C8,10 5.9,16.17 3.82,21.34L2.18,20.66C4.26,15.49 6.34,8.5 17,8M21,2C21,2 14,3 10,7C14,7 18.5,8.5 21,11C21.5,9 21.75,7 21,2Z" />
          </svg>
        </div>

        {/* Swaying Leaf 3 - Bottom Left */}
        <div className="absolute left-[-1rem] top-[75%] w-28 h-28 text-[#4EA8DE]/10 opacity-75 animate-sway pointer-events-none">
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
            <path d="M17,8C8,10 5.9,16.17 3.82,21.34L2.18,20.66C4.26,15.49 6.34,8.5 17,8M21,2C21,2 14,3 10,7C14,7 18.5,8.5 21,11C21.5,9 21.75,7 21,2Z" />
          </svg>
        </div>
      </div>

      {/* 1. Hero Section */}
      <div className="relative min-h-[100dvh] flex flex-col justify-between text-white overflow-hidden">
        {/* Background Image layer with deep dark organic overlay */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          <img 
            src="/914a0fab-87fe-4876-88f7-45d1705afe50.png" 
            alt="Simba Academy Learning Savanna" 
            className="w-full h-full object-cover" 
          />
          {/* Rich aesthetic overlay to enhance readability of white text */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-[1.5px]" />
          {/* Subtle gradient gradient bottom mask */}
          <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-black/40 to-transparent" />
        </div>

        {/* Header overlays the background */}
        <JungleHeader variant="overlay" />
        
        {/* Hero Content Container */}
        <section className="relative z-10 flex-1 flex flex-col justify-center items-center pt-36 pb-24 px-6 sm:px-12 max-w-7xl mx-auto w-full text-center">
          {/* Bold, premium Dribbble title - Guaranteed to fit on ONE line */}
          <h2 className="font-sans text-5xl sm:text-6xl md:text-7.5xl font-extrabold leading-[1.1] tracking-tight text-white mb-6 drop-shadow-md max-w-5xl whitespace-nowrap lg:whitespace-normal">
            Where Little Cubs Learn to Roar!
          </h2>

          {/* Hero Subtext */}
          <p className="text-base sm:text-lg text-slate-200/90 max-w-2xl font-semibold mb-10 leading-relaxed drop-shadow-sm">
            We deliver immersive, premium, biology-rich preschool education that transforms early childhood learning into a roaring success.
          </p>

          {/* Dribbble-style Bouncy Pill Button */}
          <div className="flex justify-center items-center w-full">
            <Link 
              to="/portals" 
              className="px-10 py-5 rounded-full bg-[#8AC926] text-white font-sans font-extrabold text-lg transition-all duration-300 hover:bg-[#78b020] hover:scale-[1.04] shadow-lg hover:shadow-[#8AC926]/40 flex items-center justify-center gap-3 group cursor-pointer jungle-btn-primary border-2 border-[#8AC926]/20"
            >
              Explore Portals
              <span className="group-hover:translate-x-1.5 transition-transform duration-300">👋</span>
            </Link>
          </div>
        </section>

        {/* Grass Divider shape separating Hero from About */}
        <GrassDivider />
      </div>

      {/* 2. About Preschool Short Intro & Vision/Mission */}
      <section className="py-28 px-6 sm:px-12 bg-[#FAF6EE] relative z-20 overflow-hidden">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-16 items-center relative z-10">
          
          {/* About Us Left Column */}
          <div className="lg:col-span-6 space-y-7">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#8AC926]/10 border border-[#8AC926]/25">
              <span className="text-[#8AC926] font-extrabold text-[10px] uppercase tracking-wider">
                About Simba Academy
              </span>
            </div>
            <h3 className="text-4xl sm:text-5xl font-extrabold text-[#3E2723] tracking-tight leading-tight">
              Nurturing Minds in a Natural Learning Ecosystem
            </h3>
            <p className="text-[#5D4037] text-base sm:text-lg leading-relaxed font-semibold">
              Simba Academy is a state-of-the-art preschool designed to foster curiosity, creativity, and cognitive development. We believe in providing children with an immersive, biology-rich ecosystem where natural exploration meets premium, certified curriculum standards.
            </p>
            <p className="text-[#5D4037]/80 text-sm leading-relaxed">
              Our classrooms and play yards are built to feel like an open savanna, encouraging students to learn through tactile engagement, science-based exploration, and collaborative circle-time campfires.
            </p>
            
            {/* Stats Badge Pill Layout */}
            <div className="pt-6 flex flex-wrap gap-4 sm:gap-6">
              <div className="bg-white border-2 border-[#8AC926]/15 px-6 py-4 rounded-[2rem] shadow-2xs hover:border-[#8AC926]/40 transition-colors">
                <p className="text-3xl font-black text-[#8AC926]">100%</p>
                <p className="text-[10px] text-[#5D4037] font-extrabold uppercase tracking-wider mt-1">Safe Savanna</p>
              </div>
              <div className="bg-white border-2 border-[#FF9F1C]/15 px-6 py-4 rounded-[2rem] shadow-2xs hover:border-[#FF9F1C]/40 transition-colors">
                <p className="text-3xl font-black text-[#FF9F1C]">1:5</p>
                <p className="text-[10px] text-[#5D4037] font-extrabold uppercase tracking-wider mt-1">Cub to Guide Ratio</p>
              </div>
              <div className="bg-white border-2 border-[#4EA8DE]/15 px-6 py-4 rounded-[2rem] shadow-2xs hover:border-[#4EA8DE]/40 transition-colors">
                <p className="text-3xl font-black text-[#4EA8DE]">12+</p>
                <p className="text-[10px] text-[#5D4037] font-extrabold uppercase tracking-wider mt-1">Weekly Expeditions</p>
              </div>
            </div>
          </div>

          {/* Vision & Mission Right Column */}
          <div className="lg:col-span-6 space-y-6 lg:pt-8">
            {/* Vision Card */}
            <div className="bg-white border-[3px] border-[#8AC926]/15 rounded-[2.2rem] p-8 relative overflow-hidden group shadow-sm hover:shadow-md transition-all duration-300 bouncy-card">
              <div className="absolute -right-4 -top-4 w-24 h-24 bg-[#8AC926]/5 rounded-full pointer-events-none group-hover:scale-125 transition-transform" />
              <div className="w-12 h-12 bg-[#FAF6EE] rounded-2xl border-2 border-[#8AC926]/20 flex items-center justify-center mb-6 shadow-2xs">
                <Award className="w-6 h-6 text-[#8AC926]" />
              </div>
              <h4 className="text-xl font-extrabold text-[#3E2723] mb-2">Our Vision</h4>
              <p className="text-[#5D4037] text-sm leading-relaxed font-semibold">
                To cultivate a generation of mindful, resilient, and eco-conscious leaders who navigate the world with curiosity, compassion, and academic confidence.
              </p>
            </div>

            {/* Mission Card */}
            <div className="bg-white border-[3px] border-[#FF9F1C]/15 rounded-[2.2rem] p-8 relative overflow-hidden group shadow-sm hover:shadow-md transition-all duration-300 bouncy-card">
              <div className="absolute -right-4 -top-4 w-24 h-24 bg-[#FF9F1C]/5 rounded-full pointer-events-none group-hover:scale-125 transition-transform" />
              <div className="w-12 h-12 bg-[#FAF6EE] rounded-2xl border-2 border-[#FF9F1C]/20 flex items-center justify-center mb-6 shadow-2xs">
                <Compass className="w-6 h-6 text-[#FF9F1C]" />
              </div>
              <h4 className="text-xl font-extrabold text-[#3E2723] mb-2">Our Mission</h4>
              <p className="text-[#5D4037] text-sm leading-relaxed font-semibold">
                To blend early childhood science with outdoor exploration, delivering a holistic curriculum that respects the natural pace of learning while igniting core cognitive pathways.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Courses Offered - Completely Redesigned to Match Reference Image 1 & 4 */}
      <section className="py-28 px-6 sm:px-12 bg-[#F6F2E9] border-t border-b border-[#EADFCB] relative overflow-hidden">
        {/* Repeating grass border at top transition */}
        <GrassDivider flip={true} />

        <div className="max-w-7xl mx-auto relative z-10 mt-10">
          
          {/* Wooden signage board for section title */}
          <WoodenHeader 
            badge="Academic Expeditions" 
            title="Programs Tailored for Every Explorer"
            subtitle="Choose the program that fits your child's age group. Our curriculum expands with their developmental stages."
          />

          {/* Cards Grid styling matches the What is Our School / Educational Programs cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 pt-8">
            {[
              {
                title: "Daycare Nest",
                age: "6 - 18 months",
                desc: "A warm, nurturing cocoon focused on sensory playsheets, soft turf coordination, and gentle care.",
                headerBg: "bg-[#FF9F1C]",
                borderColor: "border-[#FF9F1C]",
                accentColor: "#FF9F1C",
                image: "/jungle_preschool_garden.png",
                icon: Heart,
              },
              {
                title: "Playgroup Ridge",
                age: "1.5 - 3 years",
                desc: "Fostering language development, parallel stories, dexterity crafts, and group savanna play.",
                headerBg: "bg-[#8AC926]",
                borderColor: "border-[#8AC926]",
                accentColor: "#8AC926",
                image: "/jungle_preschool_reading.png",
                icon: Smile,
              },
              {
                title: "Pre-KG / Nursery",
                age: "3 - 4 years",
                desc: "Introducing mock classroom structures, eco-gardening labs, clay art, and early math concepts.",
                headerBg: "bg-[#4EA8DE]",
                borderColor: "border-[#4EA8DE]",
                accentColor: "#4EA8DE",
                image: "/jungle_preschool_outdoor.png",
                icon: BookOpen,
              },
              {
                title: "LKG & UKG Summit",
                age: "4 - 6 years",
                desc: "Preparing cubs for primary school with phonics workshops, basic reading skills, and social roleplay.",
                headerBg: "bg-[#FF70A6]",
                borderColor: "border-[#FF70A6]",
                accentColor: "#FF70A6",
                image: "/914a0fab-87fe-4876-88f7-45d1705afe50.png",
                icon: GraduationCap,
              },
            ].map((program, idx) => {
              const IconComponent = program.icon;
              return (
                <div 
                  key={idx} 
                  className={`bg-[#FFFDF9] border-[4px] ${program.borderColor} rounded-[2.5rem] shadow-md hover:shadow-xl transition-all duration-300 flex flex-col justify-between h-full relative bouncy-card pb-12 overflow-hidden`}
                >
                  <div>
                    {/* Colored Header Block with Icon on Left */}
                    <div className={`${program.headerBg} px-6 py-4 flex items-center gap-3 text-white border-b-4 border-[#5d4037]/15`}>
                      <IconComponent className="w-6 h-6 shrink-0 text-white fill-current" />
                      <div className="text-left">
                        <h4 className="text-base font-black tracking-tight leading-tight">{program.title}</h4>
                        <span className="text-[9px] font-extrabold uppercase opacity-85">{program.age}</span>
                      </div>
                    </div>

                    {/* Centered Image with White Margins & Box Shadow */}
                    <div className="px-5 pt-5">
                      <div className="bg-white p-2.5 rounded-2xl border border-slate-100 shadow-xs overflow-hidden aspect-[4/3] relative">
                        <img 
                          src={program.image} 
                          alt={program.title} 
                          className="w-full h-full object-cover rounded-xl" 
                        />
                      </div>
                    </div>

                    {/* Description Text block */}
                    <p className="text-[#5D4037]/90 text-[13px] leading-relaxed font-semibold px-6 pt-5 pb-2">
                      {program.desc}
                    </p>
                  </div>

                  {/* Circular details button overlapping bottom right of the card border */}
                  <Link 
                    to="/portals" 
                    className="details-badge-overlap"
                    style={{ color: program.accentColor }}
                  >
                    details
                  </Link>
                </div>
              );
            })}
          </div>

        </div>
      </section>

      {/* 4. Why Choose Us */}
      <section className="py-28 px-6 sm:px-12 bg-[#FAF6EE] relative z-20">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
          
          {/* Left Column: Visual graphic container with generated image */}
          <div className="lg:col-span-5 relative">
            <div className="w-full aspect-square bg-[#FAF6EE] rounded-[3rem] overflow-hidden border-[3px] border-[#8AC926]/35 shadow-xl relative p-2">
              <img 
                src="/jungle_preschool_garden.png" 
                alt="Simba Academy Classroom Garden" 
                className="w-full h-full object-cover rounded-[2.5rem]" 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#3E2723]/35 via-transparent to-transparent pointer-events-none rounded-[2.5rem] m-2" />
            </div>
            
            {/* Overlapping premium badge */}
            <div className="absolute -bottom-6 -right-6 bg-white border-2 border-[#FF9F1C]/45 p-6 rounded-[2rem] shadow-xl flex items-center gap-4 max-w-xs z-20 hover:scale-[1.03] transition-transform duration-300">
              <div className="w-12 h-12 rounded-2xl bg-[#FFF8E1] flex items-center justify-center shrink-0 text-[#FF9F1C] border border-[#FF9F1C]/20">
                <Award className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <p className="text-sm font-extrabold text-[#3E2723]">Premium Standard</p>
                <p className="text-[10px] text-[#5D4037]/80 font-bold mt-0.5">Accredited cognitive nature curriculum</p>
              </div>
            </div>
          </div>

          {/* Right Column: Feature list */}
          <div className="lg:col-span-7 space-y-8">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#8AC926]/10 border border-[#8AC926]/25">
                <span className="text-[#8AC926] font-extrabold text-[10px] uppercase tracking-wider">
                  Why Simba Academy
                </span>
              </div>
              <h3 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-[#3E2723] tracking-tight">
                Crafting the Ideal Environment for Learning
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              {[
                {
                  title: "Tactile Biology Labs",
                  desc: "Studying flower structures, insect life cycles, and soils through touch.",
                  icon: Activity,
                },
                {
                  title: "CAMPFIRE Assemblies",
                  desc: "Circle roleplays designed to grow emotional support and empathy.",
                  icon: Users,
                },
                {
                  title: "Gated Safe Savanna",
                  desc: "High security standard enclosing all play zones and yards.",
                  icon: Shield,
                },
                {
                  title: "Cognitive Playrooms",
                  desc: "Specially engineered rooms to boost spatial thinking and arithmetic.",
                  icon: Sparkles,
                },
              ].map((feat, idx) => {
                const IconComponent = feat.icon;
                return (
                  <div key={idx} className="flex gap-4 p-4 bg-white/40 border border-[#8AC926]/10 rounded-2xl hover:bg-white hover:border-[#8AC926]/25 transition-all duration-300">
                    <div className="w-12 h-12 bg-white border border-[#8AC926]/20 rounded-2xl flex items-center justify-center shrink-0 shadow-2xs">
                      <IconComponent className="w-5 h-5 text-[#8AC926]" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-sm font-extrabold text-[#3E2723]">{feat.title}</h4>
                      <p className="text-[#5D4037]/80 text-xs leading-relaxed font-semibold">{feat.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      </section>

      {/* 5. Daily Activities / Typical Day Schedule (Wooden Hanging Boards from Image 2) */}
      <section className="py-28 px-6 sm:px-12 bg-[#FAF6EE] border-t border-b border-[#E5DAC6] relative overflow-hidden">
        {/* Footprint Trail Background Pathway Line */}
        <div className="absolute top-[50%] left-[10%] right-[10%] h-20 safari-trail-line pointer-events-none hidden md:block" />
        
        <div className="max-w-7xl mx-auto relative z-10">
          
          <WoodenHeader 
            badge="A Day in the Savanna" 
            title="Structured Play & Exploration Timeline"
            subtitle="We structure our days to maintain a healthy balance between rigorous brain tasks and energetic outdoor play."
          />

          {/* Schedule blocks styled like hanging wooden boards (Reference Image 2) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto relative pt-6">
            {[
              {
                time: "09:00 AM - 10:30 AM",
                title: "Morning Circle & Talk",
                desc: "Cubs assemble in circles to recite stories and study weather, plants, or savanna creatures.",
                icon: Clock,
              },
              {
                time: "10:30 AM - 12:00 PM",
                title: "Tactile Learning & Arts",
                desc: "Hands-on paint hours, sandbox biology crawl, and clay toy building to boost sensory pathways.",
                icon: Palette,
              },
              {
                time: "12:00 PM - 01:30 PM",
                title: "Quiet Den & Sleep",
                desc: "Nutritious fresh lunches followed by peaceful sleep inside dedicated temperature-controlled quiet zones.",
                icon: BookOpen,
              },
            ].map((activity, idx) => {
              const IconComponent = activity.icon;
              return (
                <div key={idx} className="flex flex-col items-center select-none">
                  {/* Hanging ropes from top */}
                  <div className="flex justify-between w-40 h-8 px-8 pointer-events-none">
                    <div className="w-[3px] h-full bg-[#8b4513]/40 border-l-[1.5px] border-[#5c2c0a]/60 border-dashed" />
                    <div className="w-[3px] h-full bg-[#8b4513]/40 border-l-[1.5px] border-[#5c2c0a]/60 border-dashed" />
                  </div>

                  {/* Hanging wood board */}
                  <div 
                    className="wood-board-sign wood-board-nails w-full p-6 text-white text-left shadow-xl border-2 border-[#5c2c0a] flex flex-col justify-between aspect-[5/4] sm:aspect-auto sm:h-64 bouncy-card"
                  >
                    <div>
                      {/* Time text highlight */}
                      <span className="text-[#FFD275] text-[10px] font-black uppercase tracking-wider block mb-2">
                        {activity.time}
                      </span>
                      <h4 className="text-base sm:text-lg font-black tracking-tight text-white mb-2 leading-snug">
                        {activity.title}
                      </h4>
                      <p className="text-orange-100/90 text-xs leading-relaxed font-semibold">
                        {activity.desc}
                      </p>
                    </div>

                    {/* Paw print indicator */}
                    <div className="flex justify-between items-center pt-4 mt-2 border-t border-white/10">
                      <div className="w-7 h-7 bg-white/10 rounded-lg flex items-center justify-center text-[#FFD275]">
                        <IconComponent className="w-4 h-4" />
                      </div>
                      <Footprints className="w-5 h-5 text-[#8AC926]/40 animate-footprint" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      </section>

      {/* 6. Branch Locations */}
      <section className="py-28 px-6 sm:px-12 bg-[#FAF6EE] border-b border-[#EADFCB]">
        <div className="max-w-7xl mx-auto">
          
          <WoodenHeader 
            badge="Simba Savanna Network" 
            title="Our Preschool Branches"
            subtitle="We operate multiple fully-equipped branches in Salem. Find the nearest Simba Savanna."
          />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {BRANCHES.map((branch, idx) => (
              <div 
                key={idx} 
                className="bg-white border-2 border-slate-100 rounded-[2.5rem] p-8 shadow-2xs flex flex-col justify-between hover:border-[#8AC926]/20 transition-all duration-300 hover:shadow-lg bouncy-card"
              >
                <div>
                  <div className="w-12 h-12 bg-[#FAF6EE] rounded-2xl flex items-center justify-center border border-[#8AC926]/20 mb-6 text-[#8AC926]">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <h4 className="text-lg font-bold text-[#3E2723] mb-2">{branch.name}</h4>
                  <p className="text-[#5D4037]/80 text-xs leading-relaxed font-semibold">{branch.address}</p>
                </div>
                <div className="border-t border-slate-100/80 pt-5 mt-6 flex justify-between items-center text-[10px] font-extrabold text-[#5D4037]/65">
                  <span className="flex items-center gap-1.5">
                    <Footprints className="w-4 h-4 text-[#8AC926]/80" /> 
                    Salem, TN
                  </span>
                  <a 
                    href={WHATSAPP_URL} 
                    target="_blank" 
                    rel="noreferrer" 
                    className="text-[#8AC926] hover:underline flex items-center gap-1 hover:text-[#78b020] transition-colors"
                  >
                    Navigate <Compass className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* 7. Gallery Preview (Pinterest Board Style) */}
      <section className="py-28 px-6 sm:px-12 bg-[#F6F2E9] border-b border-[#EADFCB] relative overflow-hidden">
        {/* Grass Divider shape */}
        <GrassDivider flip={true} />

        <div className="max-w-7xl mx-auto mt-10">
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-20">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#4EA8DE]/10 border border-[#4EA8DE]/25">
                <span className="text-[#4EA8DE] font-extrabold text-[10px] uppercase tracking-wider">
                  Visual Journeys
                </span>
              </div>
              <h3 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-[#3E2723] tracking-tight">
                Sneak Peek Into Simba Savanna
              </h3>
            </div>
            <Link 
              to="/gallery" 
              className="px-8 py-3.5 rounded-full bg-[#3E2723] text-white font-extrabold text-sm hover:bg-[#251714] transition-all duration-300 shadow-md hover:scale-[1.04] cursor-pointer"
            >
              View Full Gallery
            </Link>
          </div>

          {/* Pinterest grid board with rotating frames */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { src: "/jungle_preschool_garden.png", rotate: "-rotate-2", label: "Savanna Garden" },
              { src: "/jungle_preschool_reading.png", rotate: "rotate-3", label: "Campfire Library" },
              { src: "/jungle_preschool_outdoor.png", rotate: "-rotate-1", label: "Treehouse Play" },
              { src: "/914a0fab-87fe-4876-88f7-45d1705afe50.png", rotate: "rotate-2", label: "Cubs Assembly" },
            ].map((img, idx) => (
              <div 
                key={idx} 
                className={`bg-white p-3.5 pb-6 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 hover:scale-105 border border-slate-200/50 cursor-pointer ${img.rotate} group`}
              >
                <div className="relative aspect-[4/3] sm:aspect-square bg-[#FAF6EE] rounded-xl overflow-hidden mb-4">
                  <img 
                    src={img.src} 
                    alt={img.label} 
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                  />
                  <div className="absolute inset-0 bg-black/5 group-hover:bg-transparent transition-colors" />
                </div>
                <p className="text-[10px] text-center font-extrabold text-[#5D4037] uppercase tracking-wider flex items-center justify-center gap-1">
                  <span>🍃</span> {img.label}
                </p>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* 8. Franchise Opportunity Highlight */}
      <section className="py-28 px-6 sm:px-12 bg-[#FAF6EE] relative z-20">
        <div className="max-w-5xl mx-auto bg-gradient-to-r from-[#1B3E1C] via-[#2A592B] to-[#1B3E1C] rounded-[3rem] p-8 sm:p-14 text-white relative overflow-hidden shadow-xl border-4 border-[#8AC926]/30">
          
          {/* Custom SVG leaf badge top-right */}
          <div className="absolute -right-8 -top-8 w-44 h-44 text-[#8AC926]/8 pointer-events-none rotate-90 animate-sway">
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
              <path d="M17,8C8,10 5.9,16.17 3.82,21.34L2.18,20.66C4.26,15.49 6.34,8.5 17,8M21,2C21,2 14,3 10,7C14,7 18.5,8.5 21,11C21.5,9 21.75,7 21,2Z" />
            </svg>
          </div>

          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-8 space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#8AC926]/20 border border-[#8AC926]/40">
                <span className="text-[#8AC926] font-extrabold text-[10px] uppercase tracking-wider">
                  Partner With Us
                </span>
              </div>
              <h3 className="text-3xl sm:text-4xl font-extrabold tracking-tight leading-tight">
                Bring Simba Academy to Your City
              </h3>
              <p className="text-emerald-100/80 text-sm leading-relaxed max-w-xl font-medium">
                Join our mission of revolutionizing early childhood education. We offer end-to-end curriculum support, branding kits, teacher training, and premium savanna setup layouts.
              </p>
            </div>

            <div className="lg:col-span-4 flex justify-start lg:justify-end">
              <Link 
                to="/portals" 
                className="px-8 py-4.5 rounded-full bg-[#8AC926] text-white font-extrabold text-sm hover:bg-[#78b020] transition-colors shadow-lg hover:shadow-xl hover:scale-[1.04] jungle-btn-primary cursor-pointer border border-[#8AC926]/30"
              >
                Apply for Franchise
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 9. Testimonials & Course Feedback Section */}
      <section className="py-28 px-6 sm:px-12 bg-[#F6F2E9] border-t border-b border-[#EADFCB]">
        <div className="max-w-7xl mx-auto">
          
          <WoodenHeader 
            badge="Campfire Feedback" 
            title="What Our Cub Families Say"
            subtitle="Discover real parent feedback about our cognitive development methodologies."
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                name: "Sarah Jenkins",
                role: "Parent of LKG Student",
                comment: "Our daughter joins the Playgroup ridge and comes home reciting nature poems, glowing with social coordination, and carrying gorgeous hand-painted leaf art. The rangers are warm and highly professional.",
                rating: 5,
              },
              {
                name: "Dr. Karthik R.",
                role: "Parent of Pre-KG Student",
                comment: "The tactile biology approach is brilliant! My son identified several leaf textures and started asking deep scientific questions. Best pre-school ecosystem in Salem.",
                rating: 5,
              },
              {
                name: "Anjali Gupta",
                role: "Parent of Nursery Student",
                comment: "Extremely pleased with the safety standards and the low guide-to-cub ratio. The daily circular updates keep us informed about everything they do.",
                rating: 5,
              },
            ].map((review, idx) => (
              <div 
                key={idx} 
                className="bg-white border-2 border-slate-100 rounded-[2.5rem] p-8 shadow-2xs relative flex flex-col justify-between hover:shadow-md bouncy-card"
              >
                <div>
                  <div className="flex gap-0.5 text-[#FF9F1C] mb-5">
                    {[...Array(review.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-current" />
                    ))}
                  </div>
                  <p className="text-[#5D4037]/80 italic text-sm leading-relaxed mb-6 font-semibold">
                    &ldquo;{review.comment}&rdquo;
                  </p>
                </div>
                <div className="flex items-center gap-3.5 border-t border-slate-100/80 pt-5 mt-4">
                  <div className="w-10 h-10 bg-[#FAF6EE] rounded-full flex items-center justify-center font-extrabold text-xs text-[#3E2723] border border-[#8AC926]/30">
                    {review.name.split(" ").map(n => n[0]).join("")}
                  </div>
                  <div>
                    <h5 className="text-sm font-extrabold text-[#3E2723]">{review.name}</h5>
                    <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">{review.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* 10. Contact CTA */}
      <section className="py-28 px-6 sm:px-12 bg-[#FAF6EE]">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#8AC926]/10 border border-[#8AC926]/25 mx-auto">
            <span className="text-[#8AC926] font-extrabold text-[10px] uppercase tracking-wider">
              Begin Your Expedition
            </span>
          </div>
          <h3 className="text-3xl sm:text-5xl font-extrabold text-[#3E2723] tracking-tight max-w-2xl mx-auto leading-tight">
            Ready to Enroll Your Cub?
          </h3>
          <p className="text-[#5D4037] text-sm sm:text-base max-w-lg mx-auto font-semibold">
            Schedule a physical safari tour of our playrooms or talk directly with our intake rangers.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center max-w-md mx-auto">
            <Link 
              to="/portals" 
              className="w-full sm:w-auto px-8 py-4.5 rounded-full bg-[#3E2723] text-white font-extrabold text-sm hover:bg-black transition-all duration-300 shadow-md flex items-center justify-center gap-2 group cursor-pointer hover:scale-[1.03] jungle-btn-secondary"
            >
              <Compass className="w-4.5 h-4.5 group-hover:rotate-45 transition-transform" />
              Access Portals
            </Link>
            <a 
              href={WHATSAPP_URL} 
              target="_blank" 
              rel="noreferrer"
              className="w-full sm:w-auto px-8 py-4.5 rounded-full border-2 border-[#8AC926]/30 bg-white hover:bg-slate-50 transition-all duration-300 text-[#3E2723] font-extrabold text-sm flex items-center justify-center gap-2 shadow-sm hover:scale-[1.03]"
            >
              <Phone className="w-4.5 h-4.5 text-[#8AC926]" />
              Talk to intake Ranger
            </a>
          </div>
        </div>
      </section>

      {/* 11. Footer */}
      <footer className="bg-[#3E2723] text-white py-20 px-6 sm:px-12 border-t border-[#2d1b18] relative z-10">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          
          {/* Column 1: Identity */}
          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white rounded-xl px-1.5 py-1.5 flex items-center justify-center shadow-sm">
                <img src="/Simba Logo 2025.pdf.png" alt="Simba Academy" className="w-full h-full object-contain" />
              </div>
              <div>
                <h4 className="font-extrabold text-base tracking-tight text-white">Simba Academy</h4>
                <p className="text-[10px] font-bold text-[#8AC926] uppercase tracking-widest mt-0.5">Sunny Preschool</p>
              </div>
            </div>
            <p className="text-orange-100/70 text-xs leading-relaxed max-w-xs font-medium">
              An immersive, premium early learning ecosystem designed to foster spatial development and academic growth.
            </p>
          </div>

          {/* Column 2: Navigation Links */}
          <div className="space-y-4">
            <h5 className="text-xs font-bold uppercase tracking-wider text-orange-200/95">Quick Links</h5>
            <ul className="space-y-3.5 text-xs text-orange-100/70 font-semibold">
              <li><Link to="/about" className="hover:text-white transition-colors flex items-center gap-1 group">
                <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" /> About Us
              </Link></li>
              <li><Link to="/courses" className="hover:text-white transition-colors flex items-center gap-1 group">
                <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" /> Expeditions
              </Link></li>
              <li><Link to="/franchise" className="hover:text-white transition-colors flex items-center gap-1 group">
                <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" /> Franchise
              </Link></li>
              <li><Link to="/gallery" className="hover:text-white transition-colors flex items-center gap-1 group">
                <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" /> Gallery
              </Link></li>
              <li><Link to="/contact" className="hover:text-white transition-colors flex items-center gap-1 group">
                <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" /> Contact Us
              </Link></li>
            </ul>
          </div>

          {/* Column 3: Contact Info */}
          <div className="space-y-4">
            <h5 className="text-xs font-bold uppercase tracking-wider text-orange-200/95">Contact Info</h5>
            <ul className="space-y-3.5 text-xs text-orange-100/70 font-semibold">
              <li className="flex gap-2.5 items-start">
                <MapPin className="w-4.5 h-4.5 text-[#8AC926] shrink-0 mt-0.5" />
                <span>Salem, Tamil Nadu, India</span>
              </li>
              <li className="flex gap-2.5 items-center">
                <Phone className="w-4.5 h-4.5 text-[#8AC926] shrink-0" />
                <span>+91 98848 66727</span>
              </li>
              <li className="flex gap-2.5 items-center">
                <Mail className="w-4.5 h-4.5 text-[#8AC926] shrink-0" />
                <span>support@simbapreschool.in</span>
              </li>
            </ul>
          </div>

          {/* Column 4: Socials / Credit */}
          <div className="space-y-5">
            <h5 className="text-xs font-bold uppercase tracking-wider text-orange-200/95">Expeditions Social</h5>
            <div className="flex gap-3 pt-1">
              {Object.entries(SOCIAL_LINKS).map(([name, url]) => (
                <a 
                  key={name} 
                  href={url} 
                  target="_blank" 
                  rel="noreferrer"
                  className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 hover:border-white/20 transition-all text-orange-200/80 hover:text-white text-xs font-bold shadow-2xs hover:scale-105"
                >
                  {name[0].toUpperCase()}
                </a>
              ))}
            </div>
            <p className="text-[10px] text-orange-200/50 pt-4 border-t border-white/[0.05] font-semibold leading-relaxed">
              Developed & Maintained by <a href="https://technovanam.in" target="_blank" rel="noreferrer" className="text-[#8AC926] hover:underline font-bold">Techno Vanam</a>
            </p>
          </div>

        </div>
        <div className="max-w-7xl mx-auto pt-10 mt-12 border-t border-white/[0.05] flex flex-col sm:flex-row justify-between items-center gap-4 text-[10px] text-orange-200/40 font-bold">
          <p>© {new Date().getFullYear()} Simba Academy. All rights reserved.</p>
          <div className="flex gap-4">
            <a href="#privacy" className="hover:text-slate-400">Privacy Policy</a>
            <a href="#terms" className="hover:text-slate-400">Terms of Service</a>
          </div>
        </div>
      </footer>

      {/* 12. Floating WhatsApp Support Button */}
      <a 
        href={WHATSAPP_URL} 
        target="_blank" 
        rel="noreferrer"
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-[#25D366] text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-[#25D366]/40 cursor-pointer group"
        aria-label="Contact support on WhatsApp"
      >
        <MessageCircle className="w-7 h-7 animate-float-gentle" />
        {/* Soft tooltip */}
        <span className="absolute right-16 scale-0 group-hover:scale-100 transition-all origin-right bg-slate-900 text-white font-bold text-2xs px-3 py-1.5 rounded-lg whitespace-nowrap shadow-md">
          Chat with intake Ranger 👋
        </span>
      </a>

    </div>
  );
}