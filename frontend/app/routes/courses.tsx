import { useEffect, useState } from "react";
import { Link } from "react-router";
import type { Route } from "./+types/courses";
import { PageShell } from "../components/PageShell";
import { api, type Course } from "../lib/api";
import { COURSE_LEVELS, WHATSAPP_URL } from "../lib/constants";
import { GraduationCap, MessageCircle } from "lucide-react";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Courses | Simba Academy Preschool" },
    { name: "description", content: "Explore Daycare, Playgroup, Pre-KG, LKG, UKG, Phonics, Handwriting, and Spoken English programs." },
  ];
}

const courseDetails: Record<string, string> = {
  Daycare: "Safe, nurturing care for infants with sensory play and gentle routines.",
  Playgroup: "Early socialization, motor skills, and joyful discovery activities.",
  "Pre-KG": "Foundation literacy, numeracy, and creative expression for young learners.",
  LKG: "Structured preschool curriculum with phonics, art, and group activities.",
  UKG: "School-readiness program with advanced pre-math, reading, and confidence building.",
  Phonics: "Interactive phonics sessions to build strong reading and pronunciation skills.",
  Handwriting: "Fine motor development and beautiful handwriting practice.",
  "Spoken English": "Confidence-building communication and conversational English.",
};

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);

  useEffect(() => {
    api.getCourses().then(setCourses).catch(() => setCourses([]));
  }, []);

  const displayCourses = COURSE_LEVELS.map((level) => {
    const fromApi = courses.find((c) => c.level === level);
    return {
      level,
      title: fromApi?.title ?? level,
      description: fromApi?.description ?? courseDetails[level],
      price: fromApi?.price,
      slug: fromApi?.slug,
    };
  });

  return (
    <PageShell>
      <section className="max-w-6xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h1 className="font-sans text-4xl md:text-5xl font-extrabold text-[#3E2723] mb-4">Our Courses</h1>
          <p className="text-[#5D4037] font-semibold max-w-2xl mx-auto">
            Age-appropriate programs designed to help every cub learn, play, and grow with confidence.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayCourses.map((course) => (
            <div key={course.level} className="glass-panel rounded-2xl p-6 hover:-translate-y-1 transition-transform">
              <div className="w-12 h-12 rounded-xl bg-[#8AC926]/15 flex items-center justify-center mb-4">
                <GraduationCap className="w-6 h-6 text-[#4E8C52]" />
              </div>
              <h2 className="font-sans text-xl font-extrabold mb-2">{course.title}</h2>
              <p className="text-sm text-[#5D4037] font-semibold mb-4">{course.description}</p>
              {course.price && (
                <p className="text-[#FF9F1C] font-extrabold mb-4">₹{course.price.toLocaleString("en-IN")}</p>
              )}
              <div className="flex gap-3">
                <a
                  href={WHATSAPP_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-2.5 rounded-xl bg-[#25D366] text-white text-sm font-bold flex items-center justify-center gap-2"
                >
                  <MessageCircle className="w-4 h-4" /> WhatsApp
                </a>
                <Link
                  to="/contact"
                  className="flex-1 py-2.5 rounded-xl bg-[#FF9F1C] text-white text-sm font-bold text-center"
                >
                  Enquire
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>
    </PageShell>
  );
}
