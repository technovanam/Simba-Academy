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

function SectionHeader({ badge, title, subtitle }: { badge: string; title: string; subtitle?: string }) {
  return (
    <div className="text-center max-w-3xl mx-auto mb-16">
      <span className="text-sm font-bold uppercase tracking-wider text-blue-600 block mb-3">
        {badge}
      </span>
      <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
        {title}
      </h2>
      {subtitle && (
        <p className="text-slate-600 text-lg leading-relaxed">
          {subtitle}
        </p>
      )}
    </div>
  );
}

const COURSES = [
  {
    title: "Daycare",
    age: "6 - 18 Months",
    desc: "A safe, nurturing space centered around sensory exploration, tactile play, daily nap schedules, and motor development.",
    color: "text-blue-600",
    bg: "bg-blue-50",
    border: "border-blue-200",
    image: "/jungle_preschool_garden.png",
    icon: Heart,
  },
  {
    title: "Playgroup",
    age: "1.5 - 3 Years",
    desc: "Focuses on language building, fine-motor coordination, interactive storytelling, and parallel play.",
    color: "text-indigo-600",
    bg: "bg-indigo-50",
    border: "border-indigo-200",
    image: "/jungle_preschool_reading.png",
    icon: Smile,
  },
  {
    title: "Pre-KG / Nursery",
    age: "3 - 4 Years",
    desc: "Introduces basic shapes, colors, clay arts, cognitive puzzles, and early scientific observations.",
    color: "text-emerald-600",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    image: "/jungle_preschool_outdoor.png",
    icon: BookOpen,
  },
  {
    title: "LKG",
    age: "4 - 5 Years",
    desc: "Expands into sound association, phonetic sheets, mathematical coordinates, tracing blocks, and collaborative group tasks.",
    color: "text-purple-600",
    bg: "bg-purple-50",
    border: "border-purple-200",
    image: "/914a0fab-87fe-4876-88f7-45d1705afe50.png",
    icon: GraduationCap,
  },
  {
    title: "UKG",
    age: "5 - 6 Years",
    desc: "Prepares children for primary school with advanced vocabulary, full sentence structures, mathematical additions, and social roleplay.",
    color: "text-pink-600",
    bg: "bg-pink-50",
    border: "border-pink-200",
    image: "/student-auth-jungle.avif",
    icon: Star,
  },
  {
    title: "Phonics Workshop",
    age: "3 - 6 Years",
    desc: "Specialized workshop focusing on letter sound association, vowel combinations, decoding words, and building reading confidence.",
    color: "text-sky-600",
    bg: "bg-sky-50",
    border: "border-sky-200",
    image: "/jungle_preschool_reading.png",
    icon: MessageCircle,
  },
  {
    title: "Handwriting Lab",
    age: "4 - 6 Years",
    desc: "Dedicated pencil grip development, horizontal/vertical tracing worksheets, stroke guides, and fine handwriting coordination.",
    color: "text-teal-600",
    bg: "bg-teal-50",
    border: "border-teal-200",
    image: "/jungle_preschool_garden.png",
    icon: Palette,
  },
  {
    title: "Spoken English",
    age: "3 - 6 Years",
    desc: "Builds expressive communication, children's vocabulary, storytelling circles, and public sharing confidence in a supportive space.",
    color: "text-rose-600",
    bg: "bg-rose-50",
    border: "border-rose-200",
    image: "/jungle_preschool_outdoor.png",
    icon: Award,
  },
];

export default function CoursesPage() {
  return (
    <PageShell>
      <div className="py-20 px-6 sm:px-12 max-w-7xl mx-auto">
        
        <div className="text-center max-w-3xl mx-auto mb-20 pt-10">
          <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 tracking-tight mb-6">
            Educational Programs
          </h1>
          <p className="text-lg text-slate-600 leading-relaxed">
            Explore our certified, age-targeted curriculums specifically designed to foster cognitive, spatial, and social growth.
          </p>
        </div>

        {/* Courses Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {COURSES.map((course, idx) => {
            const Icon = course.icon;
            const encodedMsg = encodeURIComponent(
              `Hi Simba Academy, I am interested in enrolling my child in the ${course.title} program. Please provide more details!`
            );
            const cardWhatsAppUrl = `${WHATSAPP_URL}?text=${encodedMsg}`;

            return (
              <div 
                key={idx}
                className="bg-white border border-slate-200 rounded-2xl shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between h-full overflow-hidden group"
              >
                <div>
                  <div className={`px-6 py-5 flex items-center gap-4 border-b border-slate-100 ${course.bg}`}>
                    <div className={`w-10 h-10 rounded-xl bg-white flex items-center justify-center shrink-0 shadow-sm border border-slate-100 ${course.color}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-slate-900 leading-tight">{course.title}</h4>
                      <span className="text-xs font-bold uppercase text-slate-500 tracking-wider">{course.age}</span>
                    </div>
                  </div>

                  <div className="px-6 pt-6">
                    <div className="aspect-[4/3] rounded-xl overflow-hidden bg-slate-100 mb-5 relative">
                      <img 
                        src={course.image} 
                        alt={course.title} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                      />
                    </div>
                    <p className="text-slate-600 text-sm leading-relaxed mb-6">
                      {course.desc}
                    </p>
                  </div>
                </div>

                <div className="px-6 pb-6 pt-2">
                  <a
                    href={cardWhatsAppUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-blue-600 hover:border-blue-200 font-bold text-sm flex items-center justify-center gap-2 transition-colors"
                  >
                    <Phone className="w-4 h-4" />
                    Contact Admissions
                  </a>
                </div>
              </div>
            );
          })}
        </div>

        {/* Quick Inquiry / General Contact CTA section */}
        <div className="mt-24 bg-slate-900 rounded-3xl p-10 sm:p-16 text-center shadow-xl border border-slate-800">
          <div className="max-w-2xl mx-auto space-y-6">
            <h3 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">Need Help Choosing the Right Program?</h3>
            <p className="text-slate-400 text-lg leading-relaxed">
              Talk directly with our admissions team to understand which program matches your child's age, physical coordinates, and cognitive milestones.
            </p>
            <div className="pt-6 flex flex-col sm:flex-row gap-4 justify-center items-center">
              <a
                href={WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 transition-colors shadow-sm flex items-center justify-center gap-2"
              >
                <Phone className="w-4 h-4" />
                Chat on WhatsApp
              </a>
              <Link
                to="/contact"
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-slate-800 text-white font-bold hover:bg-slate-700 border border-slate-700 transition-colors flex items-center justify-center gap-2"
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
