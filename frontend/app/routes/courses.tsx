import type { Route } from "./+types/courses";
import { PageShell } from "../components/PageShell";
import { Link } from "react-router";
import { Heart, Smile, BookOpen, GraduationCap, Star, MessageCircle, Palette, Award, Phone } from "lucide-react";
import { WHATSAPP_URL } from "../lib/constants";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Academic Programs & Courses | Simba Academy" },
    { name: "description", content: "Explore our early childhood programs: Daycare, Playgroup, Pre-KG, LKG, UKG, Phonics, Handwriting, and Spoken English." },
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

const COURSES = [
  {
    title: "Daycare Nest",
    age: "6 - 18 Months",
    desc: "A safe, nurturing space centered around sensory exploration, tactile play, daily nap schedules, and motor development.",
    borderColor: "border-[#FF9F1C]",
    headerBg: "bg-[#FF9F1C]",
    accentColor: "#FF9F1C",
    image: "/jungle_preschool_garden.png",
    icon: Heart,
  },
  {
    title: "Playgroup Ridge",
    age: "1.5 - 3 Years",
    desc: "Focuses on language building, fine-motor coordination, interactive storytelling, and parallel play on soft-turf savanna yards.",
    borderColor: "border-[#8AC926]",
    headerBg: "bg-[#8AC926]",
    accentColor: "#8AC926",
    image: "/jungle_preschool_reading.png",
    icon: Smile,
  },
  {
    title: "Pre-KG / Nursery",
    age: "3 - 4 Years",
    desc: "Introduces basic shapes, colors, clay arts, cognitive puzzles, and early scientific observations in outdoor biology labs.",
    borderColor: "border-[#4EA8DE]",
    headerBg: "bg-[#4EA8DE]",
    accentColor: "#4EA8DE",
    image: "/jungle_preschool_outdoor.png",
    icon: BookOpen,
  },
  {
    title: "LKG Summit",
    age: "4 - 5 Years",
    desc: "Expands into sound association, phonetic sheets, mathematical coordinates, tracing blocks, and collaborative group tasks.",
    borderColor: "border-[#FF70A6]",
    headerBg: "bg-[#FF70A6]",
    accentColor: "#FF70A6",
    image: "/914a0fab-87fe-4876-88f7-45d1705afe50.png",
    icon: GraduationCap,
  },
  {
    title: "UKG Summit",
    age: "5 - 6 Years",
    desc: "Prepares children for primary school with advanced vocabulary, full sentence structures, mathematical additions, and social roleplay.",
    borderColor: "border-[#9B5DE5]",
    headerBg: "bg-[#9B5DE5]",
    accentColor: "#9B5DE5",
    image: "/student-auth-jungle.avif",
    icon: Star,
  },
  {
    title: "Phonics Workshop",
    age: "3 - 6 Years",
    desc: "Specialized workshop focusing on letter sound association, vowel combinations, decoding words, and building reading confidence.",
    borderColor: "border-[#00BBF9]",
    headerBg: "bg-[#00BBF9]",
    accentColor: "#00BBF9",
    image: "/jungle_preschool_reading.png",
    icon: MessageCircle,
  },
  {
    title: "Handwriting Lab",
    age: "4 - 6 Years",
    desc: "Dedicated pencil grip development, horizontal/vertical tracing worksheets, stroke guides, and fine handwriting coordination.",
    borderColor: "border-[#F15BB5]",
    headerBg: "bg-[#F15BB5]",
    accentColor: "#F15BB5",
    image: "/jungle_preschool_garden.png",
    icon: Palette,
  },
  {
    title: "Spoken English Safari",
    age: "3 - 6 Years",
    desc: "Builds expressive communication, children's vocabulary, storytelling circles, and public sharing confidence in a supportive space.",
    borderColor: "border-[#FF70A6]",
    headerBg: "bg-[#FF70A6]",
    accentColor: "#FF70A6",
    image: "/jungle_preschool_outdoor.png",
    icon: Award,
  },
];

export default function CoursesPage() {
  return (
    <PageShell>
      <div className="py-16 px-6 sm:px-12 max-w-7xl mx-auto">
        <WoodenHeader 
          badge="Academic Expeditions" 
          title="Our Educational Programs" 
          subtitle="Explore our certified, age-targeted curriculums specifically designed to foster cognitive, spatial, and social growth."
        />

        {/* Courses Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 pt-4">
          {COURSES.map((course, idx) => {
            const Icon = course.icon;
            const encodedMsg = encodeURIComponent(
              `Hi Simba Academy, I am interested in enrolling my child in the ${course.title} program. Please provide more details!`
            );
            const cardWhatsAppUrl = `${WHATSAPP_URL}?text=${encodedMsg}`;

            return (
              <div 
                key={idx}
                className={`bg-[#FFFDF9] border-[4px] ${course.borderColor} rounded-[2.5rem] shadow-md hover:shadow-xl transition-all duration-300 flex flex-col justify-between h-full relative bouncy-card pb-6 overflow-hidden`}
              >
                <div>
                  {/* Banner header block with icon */}
                  <div className={`${course.headerBg} px-6 py-4 flex items-center gap-3 text-white border-b-4 border-[#5d4037]/15`}>
                    <Icon className="w-6 h-6 shrink-0 text-white fill-current" />
                    <div className="text-left">
                      <h4 className="text-base font-black tracking-tight leading-tight">{course.title}</h4>
                      <span className="text-[10px] font-extrabold uppercase opacity-85">{course.age}</span>
                    </div>
                  </div>

                  {/* Thumbnail image */}
                  <div className="px-5 pt-5">
                    <div className="bg-white p-2 rounded-2xl border border-slate-100 shadow-2xs overflow-hidden aspect-[4/3] relative">
                      <img 
                        src={course.image} 
                        alt={course.title} 
                        className="w-full h-full object-cover rounded-xl" 
                      />
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-[#5D4037]/90 text-[13px] leading-relaxed font-semibold px-6 pt-5 pb-2">
                    {course.desc}
                  </p>
                </div>

                {/* Direct WhatsApp Contact CTA */}
                <div className="px-5 pt-4">
                  <a
                    href={cardWhatsAppUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-3 rounded-2xl bg-white border-2 hover:bg-slate-50 text-center font-bold text-xs flex items-center justify-center gap-2 transition-all"
                    style={{ 
                      borderColor: course.accentColor, 
                      color: course.accentColor 
                    }}
                  >
                    <Phone className="w-4 h-4" />
                    Contact intake Ranger
                  </a>
                </div>
              </div>
            );
          })}
        </div>

        {/* Quick Inquiry / General Contact CTA section */}
        <div className="mt-24 bg-gradient-to-r from-[#1B3E1C] to-[#2A592B] rounded-[3.5rem] p-10 sm:p-14 text-white text-center relative overflow-hidden shadow-xl border-4 border-[#8AC926]/30">
          <div className="absolute top-0 left-0 w-full h-full opacity-5 bg-[radial-gradient(#8AC926_2px,transparent_2px)] [background-size:16px_16px] pointer-events-none" />
          <div className="relative z-10 max-w-2xl mx-auto space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#8AC926]/20 border border-[#8AC926]/40 mx-auto">
              <span className="text-[#8AC926] font-extrabold text-[10px] uppercase tracking-wider">
                Savanna Admissions
              </span>
            </div>
            <h3 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Need Help Choosing the Right Track?</h3>
            <p className="text-emerald-100/80 text-sm leading-relaxed font-medium">
              Talk directly with our Intake Rangers to understand which expedition matches your child's age, physical coordinates, and cognitive milestones.
            </p>
            <div className="pt-4 flex flex-col sm:flex-row gap-4 justify-center items-center">
              <a
                href={WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto px-8 py-4 rounded-full bg-[#8AC926] text-white font-extrabold text-sm hover:bg-[#78b020] transition-all shadow-md flex items-center justify-center gap-2 hover:scale-105"
              >
                <Phone className="w-4 h-4" />
                Chat on WhatsApp
              </a>
              <Link
                to="/contact"
                className="w-full sm:w-auto px-8 py-4 rounded-full bg-[#3E2723] text-white font-extrabold text-sm hover:bg-[#251714] border border-[#3E2723] transition-all flex items-center justify-center gap-2 hover:scale-105"
              >
                Submit Inquiry Form
              </Link>
            </div>
          </div>
        </div>

      </div>
    </PageShell>
  );
}
