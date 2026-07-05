import { useEffect, useState, useMemo } from "react";
import type { Route } from "./+types/home";
import { Link } from "react-router";
import { PageShell } from "../components/PageShell";
import { api, type GalleryItem, type Testimonial } from "../lib/api";
import { WHATSAPP_NUMBER, WHATSAPP_URL } from "../lib/constants";
import { resolveStorageUrl } from "../lib/storage";
import type { LucideIcon } from "lucide-react";
import { 
  ArrowRight,
  Star,
  PlayCircle,
  CheckCircle2,
  Phone,
  Baby,
  BookOpen,
  NotebookPen,
  GraduationCap,
} from "lucide-react";
import { BranchesSection } from "../components/BranchesSection";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Simba Preschool | Where Little Steps Begin Big Dreams" },
    {
      name: "description",
      content:
        "Simba Preschool celebrates childhood with laughter, learning, creativity, and love. Joyful early education in Play Group, Pre-KG, LKG, UKG, and after-school programs.",
    },
  ];
}

const defaultParentQuotes = [
  {
    id: "quote-1",
    name: "Happy Parent",
    role: "Simba Preschool",
    content: "My child has become more confident and communicative.",
    rating: 5,
  },
  {
    id: "quote-2",
    name: "Happy Parent",
    role: "Simba Preschool",
    content: "The teachers are caring, patient, and supportive.",
    rating: 5,
  },
  {
    id: "quote-3",
    name: "Happy Parent",
    role: "Simba Preschool",
    content: "A perfect blend of fun and learning.",
    rating: 5,
  },
  {
    id: "quote-4",
    name: "Happy Parent",
    role: "Simba Preschool",
    content: "My child loves going to school every day!",
    rating: 5,
  },
];

const programsList: Array<{
  icon: LucideIcon;
  title: string;
  age: string;
  intro?: string;
  learnLabel: string;
  highlights: string[];
  closing?: string;
  whatsappMsg: string;
  theme: {
    header: string;
    icon: string;
    badge: string;
    bar: string;
  };
}> = [
  {
    icon: Baby,
    title: "Play Group",
    age: "2 – 3 Years",
    theme: {
      header: "bg-gradient-to-br from-amber-50 to-orange-50/80",
      icon: "bg-white text-amber-600 border-amber-200/80",
      badge: "bg-white/90 text-amber-800 border-amber-200/70",
      bar: "from-amber-400 via-amber-300 to-orange-300",
    },
    intro:
      "A gentle and joyful introduction to school life through music, movement, storytelling, sensory activities, and social interaction.",
    learnLabel: "Children learn:",
    highlights: [
      "Social interaction",
      "Basic communication",
      "Motor skill development",
      "Sensory exploration",
      "Classroom routine adaptation",
    ],
    whatsappMsg: "Hi, I am interested in enrolling my child in Play Group. Please share details.",
  },
  {
    icon: BookOpen,
    title: "Pre-KG",
    age: "3 – 4 Years",
    theme: {
      header: "bg-gradient-to-br from-sky-50 to-blue-50/80",
      icon: "bg-white text-sky-600 border-sky-200/80",
      badge: "bg-white/90 text-sky-800 border-sky-200/70",
      bar: "from-sky-400 via-sky-300 to-blue-300",
    },
    learnLabel: "Building strong foundations in:",
    highlights: [
      "Phonics",
      "Vocabulary",
      "Numbers",
      "Fine motor skills",
      "Communication",
    ],
    closing:
      "Fun-filled activities help children develop confidence, curiosity, and independence.",
    whatsappMsg: "Hi, I am interested in enrolling my child in Pre-KG. Please share details.",
  },
  {
    icon: NotebookPen,
    title: "LKG",
    age: "4 – 5 Years",
    theme: {
      header: "bg-gradient-to-br from-violet-50 to-purple-50/80",
      icon: "bg-white text-violet-600 border-violet-200/80",
      badge: "bg-white/90 text-violet-800 border-violet-200/70",
      bar: "from-violet-400 via-violet-300 to-purple-300",
    },
    learnLabel: "Interactive learning through:",
    highlights: [
      "Reading readiness",
      "Writing practice",
      "Creative activities",
      "Rhymes and storytelling",
      "Concept learning",
    ],
    closing:
      "Children begin developing stronger language, thinking, and communication skills.",
    whatsappMsg: "Hi, I am interested in enrolling my child in LKG. Please share details.",
  },
  {
    icon: GraduationCap,
    title: "UKG",
    age: "5 – 6 Years",
    theme: {
      header: "bg-gradient-to-br from-emerald-50 to-teal-50/80",
      icon: "bg-white text-emerald-600 border-emerald-200/80",
      badge: "bg-white/90 text-emerald-800 border-emerald-200/70",
      bar: "from-emerald-400 via-emerald-300 to-teal-300",
    },
    learnLabel: "Preparing children confidently for primary school with:",
    highlights: [
      "Advanced phonics",
      "Reading & writing",
      "Numeracy skills",
      "Public speaking",
      "Independent learning",
    ],
    closing:
      "Our UKG program focuses on overall academic and personality development.",
    whatsappMsg: "Hi, I am interested in enrolling my child in UKG. Please share details.",
  },
];

const defaultGalleryItems = [
  { id: "def-1", imageUrl: "https://images.unsplash.com/photo-1544605151-a2798e21183d?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80", title: "Creative Time" },
  { id: "def-2", imageUrl: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80", title: "Learning Fun" },
  { id: "def-3", imageUrl: "https://images.unsplash.com/photo-1588072432836-e10032774350?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80", title: "Preschool Playground" },
  { id: "def-4", imageUrl: "https://images.unsplash.com/photo-1537655780520-1e392ead81f2?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80", title: "Art Workshop" },
  { id: "def-5", imageUrl: "https://images.unsplash.com/photo-1516627145497-ae6968895b74?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80", title: "Story Time" },
  { id: "def-6", imageUrl: "https://images.unsplash.com/photo-1489710437720-ebb67ec84dd2?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80", title: "Outdoor Play" },
];


export default function LandingPage() {
  const [gallery, setGallery] = useState<GalleryItem[]>([]);
  const [testimonials, setTestimonials] = useState<Array<Testimonial & { role?: string; profilePhotoUrl?: string }>>([]);

  useEffect(() => {
    Promise.all([
      api.getGallery().catch(() => []),
      api.getPublicReviews().catch(() => ({ reviews: [] })),
    ]).then(([fetchedGallery, fetchedReviewsResponse]) => {
      if (fetchedGallery && fetchedGallery.length > 0) setGallery(fetchedGallery);
      
      if (fetchedReviewsResponse && fetchedReviewsResponse.reviews && fetchedReviewsResponse.reviews.length > 0) {
        const meaningfulReviews = fetchedReviewsResponse.reviews.filter((r: any) => 
          r.content && r.content.trim().split(/\s+/).length >= 15
        );

        setTestimonials(
          meaningfulReviews.map((r: any) => ({
            id: r.id,
            name: r.name,
            role: r.placeName || 'Simba Preschool',
            content: r.content,
            profilePhotoUrl: r.profilePhotoUrl,
            rating: r.rating
          }))
        );
      }
    });
  }, []);

  // Merge database items with fallback items to guarantee at least 6 items
  const displayGallery = gallery.length >= 6
    ? gallery
    : [...gallery, ...defaultGalleryItems.slice(gallery.length)].slice(0, 6);

  const chunkedGallery = useMemo(() => {
    if (displayGallery.length === 0) return [];
    const extended = [];
    // Multiply list for infinite marquee feel
    for (let i = 0; i < 6; i++) {
      extended.push(...displayGallery);
    }
    const cols = [];
    for (let i = 0; i < extended.length; ) {
      if (cols.length % 2 === 0) {
        cols.push([extended[i]]);
        i += 1;
      } else {
        if (i + 1 < extended.length) {
          cols.push([extended[i], extended[i+1]]);
          i += 2;
        } else {
          cols.push([extended[i]]);
          i += 1;
        }
      }
    }
    return cols;
  }, [displayGallery]);

  // Split testimonials for opposite scrolling marquee
  const displayTestimonials = testimonials.length > 0 ? testimonials : defaultParentQuotes;
  const halfTestimonials = Math.ceil(displayTestimonials.length / 2);
  const row1Testimonials = displayTestimonials.length > 0 ? displayTestimonials.slice(0, halfTestimonials) : [];
  const row2Testimonials = displayTestimonials.length > 0 ? displayTestimonials.slice(halfTestimonials) : [];

  const scrollingPrograms = useMemo(() => {
    const extended = [];
    for (let i = 0; i < 4; i++) {
      extended.push(...programsList);
    }
    return extended;
  }, []);

  return (
    <>
      <PageShell headerVariant="overlay">
        {/* 1. Hero Section */}
        <section className="relative overflow-hidden min-h-screen flex items-center pt-24 pb-12 bg-black">
          {/* Responsive Background Images */}
          <picture className="absolute inset-0 w-full h-full">
            <source media="(min-width: 1024px)" srcSet="/Hero%20Section.webp" />
            <source
              media="(min-width: 640px) and (max-width: 1023px) and (orientation: portrait)"
              srcSet="/Hero%20Section%20Tab%20Potrait.webp"
            />
            <source media="(min-width: 640px)" srcSet="/Hero%20Section%20Tab.webp" />
            <img loading="lazy" decoding="async" 
              src="/Hero%20Section%20Mobile.webp"
              alt="Simba Academy Background" 
              className="w-full h-full object-cover object-center"
              fetchPriority="high"
            />
          </picture>
        
        <div className="hero-content max-w-6xl mx-auto px-6 sm:px-12 w-full relative z-10 flex flex-col items-center justify-center text-center">
          <div className="space-y-6 flex flex-col items-center w-full">
            <div className="flex flex-col items-center gap-1 sm:gap-1.5">
              <h1 className="text-3xl min-[380px]:text-[2rem] min-[430px]:text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-black tracking-tight leading-[1.1]">
                Welcome to <br className="sm:hidden" />
                <span className="text-[#E8AF34] whitespace-nowrap">Simba Preschool</span>
              </h1>
              <p className="text-lg sm:text-xl text-[#E8AF34] font-bold tracking-wide">
                Where Little Steps Begin Big Dreams
              </p>
            </div>
            <p className="text-base sm:text-lg lg:text-xl text-black font-medium leading-relaxed w-full max-w-3xl lg:max-w-4xl px-2 sm:px-4 py-2">
              At Simba Preschool, childhood is celebrated with laughter, learning, creativity, and love. We create a warm and happy space where children feel safe to explore, imagine, speak, play, and grow confidently every day.
            </p>
            <div className="flex flex-col sm:flex-row gap-5 pt-6 justify-center">
              <Link 
                to="/register" 
                className="px-8 py-4 rounded-full bg-white text-slate-900 font-bold text-sm border-2 border-[#E8AF34] hover:bg-[#E8AF34]/5 hover:-translate-y-1 transition-all flex items-center justify-center gap-2 shadow-lg"
              >
                <PlayCircle className="w-5 h-5 text-[#E8AF34]" />
                Explore
              </Link>
              <button 
                onClick={() => {
                  document.getElementById("programs")?.scrollIntoView({ behavior: "smooth" });
                }}
                className="px-8 py-4 rounded-full bg-[#E8AF34] text-white font-bold text-sm hover:bg-[#d69f2e] hover:-translate-y-1 transition-all shadow-lg shadow-[#E8AF34]/40 flex items-center justify-center gap-2 cursor-pointer"
              >
                View Programs
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </section>


      {/* 2. Small About Section */}
      <section className="home-about-section min-h-screen flex items-center py-20 relative overflow-hidden bg-white">
        {/* Responsive Background Images */}
        <picture className="absolute inset-x-0 top-0 w-full h-[60vh] lg:h-full max-h-screen pointer-events-none">
          <source media="(min-width: 1024px)" srcSet="/About.webp" />
          <source
            media="(min-width: 640px) and (max-width: 1023px) and (orientation: portrait)"
            srcSet="/About%20Section%20Tab%20Potrait.webp"
          />
          <source media="(min-width: 640px)" srcSet="/About%20Section%20Tab.webp" />
          <img
            src="/About%20Section%20Mobile.webp"
            alt="About Simba Academy Background"
            className="w-full h-full object-cover object-top"
            loading="lazy"
            decoding="async"
          />
        </picture>

        <div className="w-full max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 xl:px-16 relative z-10">
          <div className="about-section-content w-full max-w-xl ml-auto pl-10 sm:pl-0 sm:ml-[16%] md:ml-[32%] lg:ml-auto lg:translate-x-6 lg:w-[46%] xl:w-[42%] lg:max-w-2xl text-left flex flex-col items-start space-y-6">
             <h2 className="text-5xl sm:text-6xl font-extrabold text-[#E8AF34] tracking-tight leading-tight">
              About Simba Preschool
            </h2>
            
            <div className="space-y-6 w-full">
            <p className="text-black font-semibold text-base sm:text-lg leading-relaxed">
              Simba Preschool is more than just a preschool — it is a joyful learning family built to nurture curious minds and happy hearts.
            </p>

            <ul className="text-black font-semibold text-base sm:text-lg leading-relaxed space-y-3 list-none">
              {[
                "Early childhood development",
                "Communication and confidence building",
                "Phonics and language skills",
                "Creativity and expression",
                "Social and emotional growth",
                "Activity-based learning",
              ].map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-[#E8AF34] fill-[#E8AF34]/20 shrink-0 mt-0.5" strokeWidth={2.5} />
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            <p className="text-black font-semibold text-base sm:text-lg leading-relaxed">
              We believe children learn best when they are loved, encouraged, and inspired.
            </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Vision & Mission */}
      <section className="relative w-full bg-white overflow-hidden flex items-center justify-center py-10 sm:py-0">
        <picture className="w-full h-auto pointer-events-none select-none">
          <source media="(min-width: 1024px)" srcSet="/Vision%20Mission.png" />
          <source
            media="(min-width: 640px) and (max-width: 1023px) and (orientation: portrait)"
            srcSet="/Vision%20Mission%20Tab%20Potrait.png"
          />
          <source media="(min-width: 640px)" srcSet="/Vision%20Mission%20Tab.png" />
          <img
            src="/Vission%20Mission%20Mobile.png"
            alt="Vision and Mission"
            className="w-full h-auto object-contain"
            loading="lazy"
            decoding="async"
          />
        </picture>
      </section>

      {/* 4. Our Programs */}
      <section id="programs" className="programs-section min-h-screen flex flex-col justify-center py-20 bg-slate-50/50">
        <div className="max-w-7xl mx-auto px-6 sm:px-12 w-full">
          <div className="text-center mb-12 sm:mb-16">
            <span className="text-xs font-bold tracking-widest text-[#E8AF34] uppercase block mb-3">What We Offer</span>
            <h2 className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">Our Programs</h2>
            <div className="w-12 h-1 bg-[#E8AF34] mx-auto mt-4 rounded-full" />
          </div>
        </div>

        <div className="relative w-full overflow-hidden py-4">
          <div className="absolute inset-y-0 left-0 w-24 sm:w-40 bg-gradient-to-r from-slate-50/50 to-transparent z-10 pointer-events-none" />
          <div className="absolute inset-y-0 right-0 w-24 sm:w-40 bg-gradient-to-l from-slate-50/50 to-transparent z-10 pointer-events-none" />

          <div className="flex programs-marquee--left gap-4 md:gap-6 w-max shrink-0 hover:![animation-play-state:paused]">
            {scrollingPrograms.map((program, idx) => (
              <div
                key={`programs-r1-${program.title}-${idx}`}
                className="w-[min(340px,calc(100vw-3rem))] sm:w-[380px] md:w-[400px] shrink-0"
              >
                <ProgramCard program={program} />
              </div>
            ))}
          </div>

          <div className="flex lg:hidden programs-marquee--right gap-4 md:gap-6 w-max shrink-0 hover:![animation-play-state:paused] mt-8 md:mt-12">
            {[...scrollingPrograms].reverse().map((program, idx) => (
              <div
                key={`programs-r2-${program.title}-${idx}`}
                className="w-[min(340px,calc(100vw-3rem))] sm:w-[380px] md:w-[400px] shrink-0"
              >
                <ProgramCard program={program} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. Why Parents Choose Us */}
      <section className="relative h-screen w-full bg-white overflow-hidden">
        <picture className="absolute inset-0 w-full h-full pointer-events-none select-none">
          <source media="(min-width: 1024px)" srcSet="/Parent%20Choose%20Us.webp" />
          <source
            media="(min-width: 640px) and (max-width: 1023px) and (orientation: portrait)"
            srcSet="/Parent%20Choose%20Us%20Tab%20Potrait.webp"
          />
          <source media="(min-width: 640px)" srcSet="/Parent%20Choose%20Us%20Tab.webp" />
          <img
            src="/Parent%20Choose%20Us%20Mobile.webp"
            alt=""
            aria-hidden
            className="absolute inset-0 w-full h-full object-cover object-right"
            loading="lazy"
            decoding="async"
          />
        </picture>

        <div className="parent-choose-layout relative z-10 flex h-full w-full items-center">
          <div className="parent-choose-content w-full lg:w-[55%] xl:w-[50%] px-6 sm:px-10 lg:px-14 py-12 sm:py-16">
            <div className="text-left mb-8 sm:mb-10">
              <span className="text-xs font-bold tracking-widest text-[#E8AF34] uppercase block mb-3">Why Simba</span>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight">Why Parents Choose Us</h2>
              <div className="w-12 h-1 bg-[#E8AF34] mt-4 rounded-full" />
            </div>

            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-slate-700 font-medium text-sm sm:text-base leading-relaxed">
              {[
                "Child-friendly classrooms",
                "Loving and trained teachers",
                "Individual attention",
                "Play-based learning methods",
                "Focus on spoken English and phonics",
                "Music, dance and creative activities",
                "Celebration of festivals and special days",
                "Safe and hygienic environment",
                "Fun-filled learning atmosphere",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-[#E8AF34] fill-[#E8AF34]/20 shrink-0 mt-0.5" strokeWidth={2.5} />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* 5b. Why Choose Simba Preschool */}
      <section className="relative w-full overflow-hidden bg-[#FAF8F2]">
        <div className="absolute top-0 left-0 w-full z-10 text-center pt-16 sm:pt-20 lg:pt-24 px-6 pointer-events-none">
          <span className="text-xs font-bold tracking-widest text-[#E8AF34] uppercase block mb-3">Why Simba</span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight drop-shadow-sm">
            Why Choose Simba Preschool?
          </h2>
          <div className="w-12 h-1 bg-[#E8AF34] mx-auto mt-3 sm:mt-4 rounded-full" />
        </div>
        
        <picture className="w-full h-auto pointer-events-none select-none block">
          <source media="(min-width: 1024px)" srcSet="/Why.webp" />
          <source
            media="(min-width: 640px) and (max-width: 1023px) and (orientation: portrait)"
            srcSet="/Why%20Tab%20Potrait.webp"
          />
          <source media="(min-width: 640px)" srcSet="/Why%20Tab.webp" />
          <img
            src="/Why%20Mobile.webp"
            alt="Why Choose Simba"
            aria-hidden
            className="w-full h-auto object-contain block"
            loading="lazy"
            decoding="async"
          />
        </picture>
      </section>

      {/* 6. Our Learning Approach */}
      <section className="relative w-full bg-white overflow-hidden">
        <div className="absolute top-0 left-0 w-full z-10 text-center pt-16 sm:pt-20 lg:pt-24 px-6 sm:px-10 pointer-events-none">
          <span className="text-xs font-bold tracking-widest text-[#E8AF34] uppercase block mb-3">How We Teach</span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight">Our Learning Approach</h2>
        </div>
        
        <picture className="block w-full pointer-events-none select-none">
          <source media="(min-width: 1024px)" srcSet="/Learning%20Approach.webp" />
          <source
            media="(min-width: 640px) and (max-width: 1023px) and (orientation: portrait)"
            srcSet="/Learning%20Apprach%20Tab%20Potrait.webp"
          />
          <source media="(min-width: 640px)" srcSet="/Learning%20Apprach%20Tab.webp" />
          <img
            src="/Learning%20Apprach%20Mobile.webp"
            alt="Learning Approach"
            aria-hidden
            className="block w-full h-auto object-contain"
            loading="lazy"
            decoding="async"
          />
        </picture>
      </section>

      <div className="learning-facilities-transition w-full bg-[#FDF5E5]" aria-hidden />

      {/* 7. Facilities */}
      <section className="facilities-section relative w-full bg-[#FDF5E5] overflow-hidden">
        <div className="facilities-section-header absolute top-0 left-0 w-full z-10 text-center pt-16 sm:pt-20 lg:pt-24 px-6 pointer-events-none">
          <span className="text-xs font-bold tracking-widest text-[#E8AF34] uppercase block mb-2 sm:mb-3">Our Campus</span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight">Facilities</h2>
        </div>
        
        <picture className="facilities-section-bg block w-full pointer-events-none select-none">
          <source media="(min-width: 1024px)" srcSet="/Facilities.webp" />
          <source
            media="(min-width: 640px) and (max-width: 1023px) and (orientation: portrait)"
            srcSet="/Facilities%20Tab%20Potrait.webp"
          />
          <source media="(min-width: 640px)" srcSet="/Facilities%20Tab.webp" />
          <img
            src="/Facilities%20Mobile.webp"
            alt="Facilities"
            aria-hidden
            className="facilities-section-bg-img block w-full h-auto object-contain"
            loading="lazy"
            decoding="async"
          />
        </picture>
      </section>

      {/* 8. Gallery (from Admin Panel) */}
      <section className="min-h-screen flex flex-col justify-center py-20 bg-slate-50/50">
        <div className="max-w-7xl mx-auto px-6 sm:px-12 w-full">
          <div className="text-center mb-16">
            <span className="text-xs font-bold tracking-widest text-[#E8AF34] uppercase block mb-3">Life at Simba</span>
            <h2 className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">Life at Simba Preschool</h2>
            <div className="w-12 h-1 bg-[#E8AF34] mx-auto mt-4 rounded-full" />
            <p className="text-slate-600 font-medium text-base sm:text-lg max-w-3xl mx-auto mt-6 leading-relaxed">
              Every day at Simba Preschool is filled with smiles, discovery, creativity, friendship, confidence, and happy memories. From tiny achievements to big milestones, we celebrate every child&apos;s journey.
            </p>
          </div>
        </div>
          
          {chunkedGallery.length > 0 ? (
            <div className="relative w-full overflow-hidden py-4">
              {/* Fade edges */}
              <div className="absolute inset-y-0 left-0 w-24 sm:w-40 bg-gradient-to-r from-slate-50/50 to-transparent z-10 pointer-events-none" />
              <div className="absolute inset-y-0 right-0 w-24 sm:w-40 bg-gradient-to-l from-slate-50/50 to-transparent z-10 pointer-events-none" />

              {/* Row 1: Right to Left */}
              <div className="flex animate-scroll-left gap-4 md:gap-6 w-max shrink-0 hover:![animation-play-state:paused]" style={{ animationDuration: '90s' }}>
                {chunkedGallery.map((col, colIdx) => (
                  col.length === 1 ? (
                    <div key={`r1-col-${colIdx}`} className="h-[250px] md:h-[400px] w-[200px] md:w-[320px] shrink-0 rounded-none overflow-hidden shadow-sm relative group/card border border-slate-200">
                      <img loading="lazy" decoding="async" 
                        src={resolveStorageUrl(col[0].imageUrl)} 
                        alt={col[0].title ?? "Gallery Image"} 
                        className="h-full w-full object-cover transition-transform duration-700 group-hover/card:scale-110" 
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity duration-300 flex items-end p-4 md:p-6">
                        <span className="text-white font-medium text-sm sm:text-base drop-shadow-md">
                          {col[0].title || "Life at Simba Preschool"}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div key={`r1-col-${colIdx}`} className="flex flex-col gap-4 md:gap-6 h-[250px] md:h-[400px] w-[280px] md:w-[450px] shrink-0">
                      {col.map((img, idx) => (
                        <div key={`img-${idx}`} className="flex-1 w-full rounded-none overflow-hidden shadow-sm relative group/card border border-slate-200">
                          <img loading="lazy" decoding="async" 
                            src={resolveStorageUrl(img.imageUrl)} 
                            alt={img.title ?? "Gallery Image"} 
                            className="h-full w-full object-cover transition-transform duration-700 group-hover/card:scale-110" 
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity duration-300 flex items-end p-4 md:p-6">
                            <span className="text-white font-medium text-sm sm:text-base drop-shadow-md">
                              {img.title || "Life at Simba Preschool"}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                ))}
              </div>

              {/* Row 2: Left to Right (Mobile & Tablet Only) */}
              <div className="flex lg:hidden animate-scroll-right gap-4 md:gap-6 w-max shrink-0 hover:![animation-play-state:paused] mt-8 md:mt-12" style={{ animationDuration: '95s' }}>
                {[...chunkedGallery].reverse().map((col, colIdx) => (
                  col.length === 1 ? (
                    <div key={`r2-col-${colIdx}`} className="h-[250px] md:h-[400px] w-[200px] md:w-[320px] shrink-0 rounded-none overflow-hidden shadow-sm relative group/card border border-slate-200">
                      <img loading="lazy" decoding="async" 
                        src={resolveStorageUrl(col[0].imageUrl)} 
                        alt={col[0].title ?? "Gallery Image"} 
                        className="h-full w-full object-cover transition-transform duration-700 group-hover/card:scale-110" 
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity duration-300 flex items-end p-4 md:p-6">
                        <span className="text-white font-medium text-sm sm:text-base drop-shadow-md">
                          {col[0].title || "Life at Simba Preschool"}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div key={`r2-col-${colIdx}`} className="flex flex-col gap-4 md:gap-6 h-[250px] md:h-[400px] w-[280px] md:w-[450px] shrink-0">
                      {col.map((img, idx) => (
                        <div key={`r2-img-${idx}`} className="flex-1 w-full rounded-none overflow-hidden shadow-sm relative group/card border border-slate-200">
                          <img loading="lazy" decoding="async" 
                            src={resolveStorageUrl(img.imageUrl)} 
                            alt={img.title ?? "Gallery Image"} 
                            className="h-full w-full object-cover transition-transform duration-700 group-hover/card:scale-110" 
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity duration-300 flex items-end p-4 md:p-6">
                            <span className="text-white font-medium text-sm sm:text-base drop-shadow-md">
                              {img.title || "Life at Simba Preschool"}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                ))}
              </div>
            </div>
          ) : (
             <div className="bg-slate-50 border border-dashed border-slate-300 rounded-3xl p-16 text-center text-slate-500">
                <p>New gallery memories will appear here soon.</p>
             </div>
          )}

      </section>

      {/* 9. Portals Link */}
      <section className="portals-section min-h-screen flex items-center justify-center py-24 bg-white relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 sm:px-12 text-center w-full">
          <div className="portals-section-header text-center mb-16">
            <span className="text-xs font-bold tracking-widest text-[#E8AF34] uppercase block mb-3">Access Your Dashboard</span>
            <h2 className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">Our Portals</h2>
            <div className="w-12 h-1 bg-[#E8AF34] mx-auto mt-4 rounded-full" />
          </div>
          
          <div className="portals-grid grid grid-cols-1 md:grid-cols-2 gap-10 max-w-[95%] xl:max-w-7xl mx-auto">
            {/* Student Portal */}
            <div className="portal-card relative flex flex-col items-center justify-center text-center w-full aspect-[4/3] sm:aspect-[16/9] md:aspect-[4/3] lg:aspect-[16/9]">
              <div 
                className="absolute inset-0 bg-contain bg-center bg-no-repeat z-0" 
                style={{ backgroundImage: "url('/Portal.webp')" }} 
              />
              
              <div className="relative z-10 flex flex-col items-center justify-center px-4 sm:px-10 py-8 max-w-[90%] sm:max-w-[85%] h-full">
                <h3 className="text-xl sm:text-4xl font-extrabold text-slate-800 mb-2 sm:mb-3 tracking-tight drop-shadow-sm">
                  Student Portal
                </h3>
                <p className="text-slate-700 font-semibold text-xs sm:text-base leading-relaxed mb-4 sm:mb-6">
                  Access learning materials, track progress, and view daily activities.
                </p>
                <Link to="/login" className="inline-flex items-center justify-center px-4 py-2 sm:px-6 sm:py-3 rounded-full bg-[#E8AF34] border border-[#c59124] text-white font-extrabold text-xs sm:text-sm hover:bg-[#d69f2e] hover:-translate-y-1 transition-all shadow-md shadow-[#E8AF34]/30 cursor-pointer tracking-wide group">
                  Login <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
                </Link>
              </div>
            </div>

            {/* Teacher Portal */}
            <div className="portal-card relative flex flex-col items-center justify-center text-center w-full aspect-[4/3] sm:aspect-[16/9] md:aspect-[4/3] lg:aspect-[16/9]">
              <div 
                className="absolute inset-0 bg-contain bg-center bg-no-repeat z-0" 
                style={{ backgroundImage: "url('/Portal.webp')" }} 
              />
              
              <div className="relative z-10 flex flex-col items-center justify-center px-4 sm:px-10 py-8 max-w-[90%] sm:max-w-[85%] h-full">
                <h3 className="text-xl sm:text-4xl font-extrabold text-slate-800 mb-2 sm:mb-3 tracking-tight drop-shadow-sm">
                  Teacher Portal
                </h3>
                <p className="text-slate-700 font-semibold text-xs sm:text-base leading-relaxed mb-4 sm:mb-6">
                  Manage classes, update curriculums, and connect with parents.
                </p>
                <Link to="/teacher/login" className="inline-flex items-center justify-center px-4 py-2 sm:px-6 sm:py-3 rounded-full bg-[#E8AF34] border border-[#c59124] text-white font-extrabold text-xs sm:text-sm hover:bg-[#d69f2e] hover:-translate-y-1 transition-all shadow-md shadow-[#E8AF34]/30 cursor-pointer tracking-wide group">
                  Login <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 10. Testimonials (Double Marquee) */}
      <section className="testimonials-section py-24 bg-slate-50 overflow-hidden border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-6 sm:px-12 text-center mb-16">
          <span className="text-xs font-bold tracking-widest text-[#E8AF34] uppercase block mb-3">Testimonials</span>
          <h2 className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">What Parents Say</h2>
          <div className="w-12 h-1 bg-[#E8AF34] mx-auto mt-4 rounded-full" />
        </div>

        {displayTestimonials.length > 0 ? (
          <div className="space-y-8 relative">
            <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-slate-50 to-transparent z-10 pointer-events-none" />
            <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-slate-50 to-transparent z-10 pointer-events-none" />

            <div className="flex overflow-hidden group">
              <div className="testimonials-marquee testimonials-marquee--left flex gap-6 w-max shrink-0 hover:![animation-play-state:paused] group-hover:![animation-play-state:paused]">
                {[...row1Testimonials, ...row1Testimonials, ...row1Testimonials].map((t, idx) => (
                  <TestimonialCard key={`${t.id}-1-${idx}`} testimonial={t} />
                ))}
              </div>
            </div>

            {row2Testimonials.length > 0 && (
              <div className="flex overflow-hidden group">
                <div className="testimonials-marquee testimonials-marquee--right flex gap-6 w-max shrink-0 hover:![animation-play-state:paused] group-hover:![animation-play-state:paused]">
                  {[...row2Testimonials, ...row2Testimonials, ...row2Testimonials].map((t, idx) => (
                    <TestimonialCard key={`${t.id}-2-${idx}`} testimonial={t} />
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="max-w-xl mx-auto text-center text-slate-500">
            <p>Our parent reviews are currently being updated.</p>
          </div>
        )}
      </section>

      <BranchesSection />

      {/* 12. Admissions */}
      <section className="min-h-[70vh] flex flex-col justify-center py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6 sm:px-12 w-full text-center">
          <div className="text-center mb-12">
            <span className="text-xs font-bold tracking-widest text-[#E8AF34] uppercase block mb-3">Join Us</span>
            <h2 className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">Admissions Open Now</h2>
            <div className="w-12 h-1 bg-[#E8AF34] mx-auto mt-4 rounded-full" />
          </div>

          <p className="text-slate-700 font-medium text-base sm:text-lg leading-relaxed max-w-2xl mx-auto mb-4">
            Give your child the perfect start in a joyful learning environment.
          </p>
          <p className="text-slate-800 font-semibold text-base mb-8">
            Limited seats available — enroll today.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <a
              href="tel:+919884866727"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full bg-[#E8AF34] text-white font-bold text-sm hover:bg-[#d69f2e] hover:-translate-y-1 transition-all shadow-lg shadow-[#E8AF34]/40"
            >
              <Phone className="w-5 h-5" />
              Call
            </a>
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full bg-white text-slate-900 border border-slate-200 font-bold text-sm hover:bg-slate-50 hover:-translate-y-1 transition-all shadow-lg"
            >
              Enroll via WhatsApp
              <ArrowRight className="w-5 h-5 text-[#E8AF34]" />
            </a>
          </div>
        </div>
      </section>

    </PageShell>
    </>
  );
}

function ProgramCard({ program }: { program: (typeof programsList)[number] }) {
  const Icon = program.icon;

  return (
    <article className="program-card group flex h-[30rem] sm:h-[31rem] flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-slate-300">
      <div className={`h-1.5 w-full bg-gradient-to-r ${program.theme.bar}`} aria-hidden />

      <div className={`shrink-0 px-5 pt-5 pb-4 sm:px-6 sm:pt-6 ${program.theme.header}`}>
        <div className="flex items-center gap-4">
          <span
            className={`inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border shadow-sm ${program.theme.icon}`}
          >
            <Icon className="h-7 w-7" strokeWidth={2} />
          </span>
          <div className="min-w-0">
            <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 leading-tight">
              {program.title}
            </h3>
            <span
              className={`mt-2 inline-flex rounded-full border px-3 py-1 text-xs font-bold ${program.theme.badge}`}
            >
              {program.age}
            </span>
          </div>
        </div>
      </div>

      <div className="flex flex-1 min-h-0 flex-col bg-white px-5 pb-5 sm:px-6 sm:pb-6">
        <div className="program-card-body flex-1 min-h-0 overflow-y-auto scrollbar-hide pr-0.5">
          {program.intro ? (
            <p className="text-slate-600 text-sm leading-relaxed mb-4">{program.intro}</p>
          ) : null}

          <p className="text-[11px] font-bold uppercase tracking-wider text-[#9A6B1A] mb-2.5">
            {program.learnLabel}
          </p>

          <ul className="space-y-2.5 mb-3">
            {program.highlights.map((item) => (
              <li key={item} className="flex items-start gap-2.5 text-sm text-slate-700">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#E8AF34]" aria-hidden />
                <span className="font-medium leading-snug">{item}</span>
              </li>
            ))}
          </ul>

          {program.closing ? (
            <p className="rounded-xl bg-slate-50 px-3 py-2.5 text-sm leading-relaxed text-slate-600 italic">
              {program.closing}
            </p>
          ) : null}
        </div>

        <a
          href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(program.whatsappMsg)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#E8AF34] px-5 py-3 text-sm font-bold text-white shadow-md shadow-[#E8AF34]/20 transition-all group-hover:bg-[#d69f2e] shrink-0"
        >
          Enroll Now
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </a>
      </div>
    </article>
  );
}

function TestimonialCard({ testimonial }: { testimonial: Testimonial & { role?: string; profilePhotoUrl?: string } }) {
  return (
    <div className="testimonial-card w-[min(300px,calc(100vw-3rem))] sm:w-[350px] md:w-[420px] bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
      <div>
        <div className="flex gap-1 mb-3">
          {[...Array(5)].map((_, i) => (
            <Star 
              key={i} 
              className={`w-5 h-5 ${i < testimonial.rating ? 'fill-yellow-400 text-yellow-400' : 'fill-slate-100 text-slate-200'}`} 
            />
          ))}
        </div>
        <p className="text-slate-700 italic leading-relaxed mb-4 line-clamp-4 text-[15px]">
          "{testimonial.content}"
        </p>
      </div>
      <div className="flex items-center gap-4 border-t border-slate-100 pt-4">
        {testimonial.profilePhotoUrl ? (
          <img loading="lazy" decoding="async" src={testimonial.profilePhotoUrl} alt={testimonial.name} className="w-12 h-12 rounded-full object-cover shadow-sm" referrerPolicy="no-referrer" />
        ) : (
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#E8AF34]/20 to-[#c59124]/20 flex items-center justify-center text-[#E8AF34] font-bold text-xl">
            {testimonial.name.charAt(0)}
          </div>
        )}
        <div>
          <p className="font-bold text-slate-900">{testimonial.name}</p>
          <p className="text-xs text-[#c59124] uppercase tracking-wide font-semibold">{testimonial.role || "Parent"}</p>
        </div>
      </div>
    </div>
  );
}
