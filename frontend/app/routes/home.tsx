import { useEffect, useState, useRef, useMemo } from "react";
import type { Route } from "./+types/home";
import { Link } from "react-router";
import { PageShell } from "../components/PageShell";
import { api, type GalleryItem, type Testimonial, type Course } from "../lib/api";
import { WHATSAPP_NUMBER } from "../lib/constants";
import { resolveStorageUrl } from "../lib/storage";
import { 
  GraduationCap, 
  Heart, 
  ShieldCheck, 
  ArrowRight,
  MapPin,
  Star,
  PlayCircle,
  BookOpen
} from "lucide-react";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Simba Academy | Premium Education" },
    {
      name: "description",
      content: "Step into an immersive, premium, learning ecosystem. Simba Academy blends modern education with certified curriculums.",
    },
  ];
}

const coursesList = [
  {
    title: "Daycare",
    age: "1.5 - 6 Years",
    description: "A safe, nurturing, and playful environment for your little ones to learn and rest while you are away. Focused on early motor skills, healthy habits, and social interaction.",
    whatsappMsg: "Hi, I am interested in enrolling my child in the Daycare program. Please share details."
  },
  {
    title: "Playgroup",
    age: "1.5 - 2.5 Years",
    description: "A fun-filled, interactive space designed for toddlers to explore, learn, and grow. Focused on sensory exploration, coordination, and building early social relationships in a child-friendly atmosphere.",
    whatsappMsg: "Hi, I am interested in enrolling my child in the Playgroup. Please share details."
  },
  {
    title: "Pre-KG",
    age: "2.5 - 3.5 Years",
    description: "An engaging preparatory curriculum that readies young minds for their transition to classroom life. Focused on early communication, structured playtime, and creative activities.",
    whatsappMsg: "Hi, I am interested in enrolling my child in Pre-KG. Please share details."
  },
  {
    title: "LKG",
    age: "3.5 - 4.5 Years",
    description: "A balanced program introducing core literacy, writing, and mathematical concepts through interactive play. Focused on early reading prep, environmental studies, and communication skills.",
    whatsappMsg: "Hi, I am interested in enrolling my child in LKG. Please share details."
  },
  {
    title: "UKG",
    age: "4.5 - 5.5 Years",
    description: "An advanced kindergarten curriculum designed to prepare children for primary school with strong fundamentals. Focused on phonics reading, core arithmetic, and active speaking.",
    whatsappMsg: "Hi, I am interested in enrolling my child in UKG. Please share details."
  },
  {
    title: "Phonics",
    age: "4 - 8 Years",
    description: "Unlock fluent reading and natural pronunciation! A systematic reading program making letter-sound associations and word blending fun, easy, and effortless.",
    whatsappMsg: "Hi, I am interested in enrolling my child in the Phonics program. Please share details."
  },
  {
    title: "Handwriting",
    age: "4 - 10 Years",
    description: "Develop beautiful cursive and print handwriting styles! We focus on correct pencil grip, posture, stroke patterns, and neatness to build writing confidence.",
    whatsappMsg: "Hi, I am interested in enrolling my child in the Handwriting class. Please share details."
  },
  {
    title: "Spoken English",
    age: "4 - 12 Years",
    description: "Build exceptional English speaking skills! Students gain communication confidence, enrich their daily vocabulary, and master everyday conversation styles naturally.",
    whatsappMsg: "Hi, I am interested in enrolling my child in the Spoken English course. Please share details."
  }
];

const courseBgs = [
  { desktop: "/Courses/1.png", tab: "/Courses/1tab.png", mobile: "/Courses/1Mobile.png" },
  { desktop: "/Courses/2.png", tab: "/Courses/2%20tab.png", mobile: "/Courses/2%20mobile.png" },
  { desktop: "/Courses/3.png", tab: "/Courses/3%20tab.png", mobile: "/Courses/3%20mobile.png" },
  { desktop: "/Courses/4.png", tab: "/Courses/4%20tab.png", mobile: "/Courses/4%20mobile.png" },
  { desktop: "/Courses/1.png", tab: "/Courses/1tab.png", mobile: "/Courses/1Mobile.png" },
  { desktop: "/Courses/2.png", tab: "/Courses/2%20tab.png", mobile: "/Courses/2%20mobile.png" },
  { desktop: "/Courses/3.png", tab: "/Courses/3%20tab.png", mobile: "/Courses/3%20mobile.png" },
  { desktop: "/Courses/4.png", tab: "/Courses/4%20tab.png", mobile: "/Courses/4%20mobile.png" }
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
  const [courses, setCourses] = useState<Course[]>([]);
  
  const coursesSectionRef = useRef<HTMLDivElement>(null);
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    // Fetch data concurrently
    Promise.all([
      api.getGallery().catch(() => []),
      api.getPublicReviews().catch(() => ({ reviews: [] })),
      api.getCourses().catch(() => [])
    ]).then(([fetchedGallery, fetchedReviewsResponse, fetchedCourses]) => {
      if (fetchedGallery && fetchedGallery.length > 0) setGallery(fetchedGallery);
      
      if (fetchedReviewsResponse && fetchedReviewsResponse.reviews && fetchedReviewsResponse.reviews.length > 0) {
        // Only keep reviews that have actual text written by the user (filter out star-only or one-word reviews)
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
      
      if (fetchedCourses && fetchedCourses.length > 0) setCourses(fetchedCourses);
    });
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      if (!coursesSectionRef.current) return;
      const rect = coursesSectionRef.current.getBoundingClientRect();
      const sectionHeight = rect.height;
      const scrolled = -rect.top;
      const viewportHeight = window.innerHeight;
      const totalScrollable = sectionHeight - viewportHeight;

      if (totalScrollable <= 0) return;

      if (scrolled >= 0 && scrolled <= totalScrollable) {
        const progress = scrolled / totalScrollable;
        const step = Math.min(Math.floor(progress * 8), 7);
        setActiveStep(step);
      } else if (rect.top > 0) {
        setActiveStep(0);
      } else {
        setActiveStep(7);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
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
  const halfTestimonials = Math.ceil(testimonials.length / 2);
  const row1Testimonials = testimonials.length > 0 ? testimonials.slice(0, halfTestimonials) : [];
  const row2Testimonials = testimonials.length > 0 ? testimonials.slice(halfTestimonials) : [];

  return (
    <>
      <PageShell headerVariant="overlay">
        {/* 1. Hero Section */}
        <section className="relative overflow-hidden min-h-screen flex items-center pt-24 pb-12 bg-black">
          {/* Responsive Background Images */}
          <picture className="absolute inset-0 w-full h-full opacity-80 lg:opacity-100">
            <source media="(min-width: 1024px)" srcSet="/Hero%20Section.webp" />
            <source media="(min-width: 640px)" srcSet="/Hero%20Tab.png" />
            <img loading="lazy" decoding="async" 
              src="/Hero%20Mobile.png" 
              alt="Simba Academy Background" 
              className="w-full h-full object-cover object-center"
              fetchPriority="high"
              decoding="async"
            />
          </picture>

          {/* Dark radial overlay to make text pop against the bright jungle background */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-black/40 via-black/20 lg:from-black/60 lg:via-black/30 to-transparent z-0 pointer-events-none" />
        
        <div className="max-w-4xl mx-auto px-6 sm:px-12 w-full relative z-10 flex flex-col items-center justify-center text-center">
          <div className="space-y-6 flex flex-col items-center">
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-white tracking-tight leading-[1.1] drop-shadow-[0_4px_4px_rgba(0,0,0,0.8)]">
              Where Little Minds <span className="text-[#E8AF34] drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]">Grow Big</span>
            </h1>
            <p className="text-base sm:text-lg text-white font-medium leading-relaxed max-w-2xl drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-black/60 via-black/20 to-transparent px-4 sm:px-10 py-6">
              We deliver an immersive, premium early childhood education that transforms learning into lifelong success story.
            </p>
            <div className="flex flex-col sm:flex-row gap-5 pt-6 justify-center">
              <Link 
                to="/register" 
                className="px-8 py-4 rounded-full bg-white text-slate-900 font-bold text-sm hover:bg-slate-50 hover:-translate-y-1 transition-all flex items-center justify-center gap-2 shadow-lg"
              >
                <PlayCircle className="w-5 h-5 text-[#E8AF34]" />
                Explore
              </Link>
              <button 
                onClick={() => {
                  coursesSectionRef.current?.scrollIntoView({ behavior: "smooth" });
                }}
                className="px-8 py-4 rounded-full bg-[#E8AF34] text-white font-bold text-sm hover:bg-[#d69f2e] hover:-translate-y-1 transition-all shadow-lg shadow-[#E8AF34]/40 flex items-center justify-center gap-2 cursor-pointer"
              >
                View Courses
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Curved Bottom Divider to blend into the next section */}
        <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-[0] z-20">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320" preserveAspectRatio="none" className="w-full h-[40px] sm:h-[60px] lg:h-[80px]">
            <path fill="#ffffff" d="M0,128 C360,256 1080,256 1440,128 L1440,320 L0,320 Z"></path>
          </svg>
        </div>
      </section>


      {/* 2. Small About Section */}
      <section className="min-h-screen flex items-center py-20 relative overflow-hidden">
        {/* Responsive Background Images */}
        <picture className="absolute inset-0 w-full h-full pointer-events-none">
          <source media="(min-width: 1024px)" srcSet="/About.webp" />
          <source media="(min-width: 640px)" srcSet="/Home%20About%20Tab.png" />
          <img loading="lazy" decoding="async" 
            src="/Home%20About%20Mobile.png" 
            alt="About Simba Academy Background" 
            className="w-full h-full object-cover object-center"
            loading="lazy"
            decoding="async"
          />
        </picture>

        <div className="w-full max-w-[1400px] mx-auto px-6 sm:px-12 md:pl-24 md:pr-12 lg:pr-16 xl:pr-20 flex justify-center sm:justify-end items-center relative z-10">
          <div className="max-w-xl text-left flex flex-col items-start space-y-6 mr-0">
             <h2 className="text-5xl sm:text-6xl font-extrabold text-[#E8AF34] tracking-tight leading-tight">
              Simba Preschool
            </h2>
            
            <p className="text-slate-700 font-medium text-base sm:text-lg leading-relaxed">
              Simba Academy is a premium early childhood childcare and learning centre. Open 6 days a week, Simba Academy provides care, adventure, and education to children from 1.5 to 6 years. A child-centric development program is available to families who wish to give their kids the best foundation, as well as extracurricular labs in phonics, handwriting, and spoken English.
            </p>
            
            {/* Playful Read More Button */}
            <Link 
              to="/about"
              className="px-8 py-3 rounded-xl border border-[#E8AF34] text-[#E8AF34] font-medium text-sm sm:text-base hover:bg-[#E8AF34] hover:text-white transition-all shadow-sm bg-white/40"
            >
              Read More
            </Link>
          </div>
        </div>
      </section>

      {/* 4. Courses Offered (Sticky Scrollytelling) */}
      <section 
        id="courses"
        ref={coursesSectionRef} 
        className="relative h-[550vh]"
      >
        <div className="sticky top-0 h-screen w-full flex items-center justify-center overflow-hidden">
          {/* Background Images Layer */}
          <div className="absolute inset-0 w-full h-full pointer-events-none">
            {courseBgs.map((bg, idx) => (
              <div
                key={idx}
                className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
                  activeStep === idx ? "opacity-100" : "opacity-0"
                }`}
              >
                <picture className="absolute inset-0 w-full h-full">
                  <source media="(min-width: 1024px)" srcSet={bg.desktop} />
                  <source media="(min-width: 640px)" srcSet={bg.tab} />
                  <img loading="lazy" decoding="async" 
                    src={bg.mobile} 
                    alt={`Course background ${idx}`} 
                    className="w-full h-full object-cover object-center"
                    loading="lazy"
                  />
                </picture>
              </div>
            ))}
          </div>

          {/* Content Layer (Parchment Board UI) */}
          <div className="relative z-10 w-full max-w-[1400px] px-6 sm:px-12 md:px-24 lg:pr-16 xl:pr-20 flex flex-col items-center sm:items-end justify-center text-center mt-12 sm:mt-0">
            {/* parchment board wrapper */}
            <div className="w-full max-w-[min(100%,560px)] aspect-[4/3] flex flex-col items-center justify-center px-2 py-6 sm:p-12 relative mx-auto sm:ml-auto sm:mr-0">
              
              {coursesList.map((course, idx) => (
                <div
                  key={idx}
                  className={`absolute inset-x-0 mx-auto flex flex-col items-center justify-center p-6 sm:p-10 transition-all duration-500 transform ${
                    activeStep === idx 
                      ? "opacity-100 translate-y-0 scale-100" 
                      : "opacity-0 translate-y-4 scale-95 pointer-events-none"
                  } ${
                    (idx === 0 || idx === 4) ? "sm:-translate-x-[14px]" :
                    (idx === 1 || idx === 5) ? "sm:-translate-x-[12px]" :
                    (idx === 2 || idx === 6) ? "sm:-translate-x-[12px]" : ""
                  }`}
                >
                  <h3 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-800 mb-2.5 tracking-tight">
                    {course.title}
                  </h3>
                  <div className="mb-4">
                    <span className="px-3.5 py-1 rounded-full bg-[#E8AF34]/10 text-amber-800 font-bold text-xs sm:text-sm tracking-wide border border-[#E8AF34]/20">
                      Age group: {course.age}
                    </span>
                  </div>
                  <p className="text-slate-700 font-semibold text-xs sm:text-sm md:text-base max-w-sm sm:max-w-md leading-relaxed mb-6 sm:mb-8">
                    {course.description}
                  </p>
                  
                  <a
                    href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(course.whatsappMsg)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center px-6 py-3 sm:px-8 sm:py-3.5 rounded-full bg-[#E8AF34] border border-[#c59124] text-white font-extrabold text-xs sm:text-sm hover:bg-[#d69f2e] hover:-translate-y-1 hover:shadow-xl transition-all shadow-lg shadow-[#E8AF34]/30 cursor-pointer tracking-wide gap-2"
                  >
                    Enroll <ArrowRight className="w-4 h-4" />
                  </a>
                </div>
              ))}



            </div>

          </div>
        </div>
      </section>



      {/* 7. Gallery (from Admin Panel) */}
      <section className="min-h-screen flex flex-col justify-center py-20 bg-slate-50/50">
        <div className="max-w-7xl mx-auto px-6 sm:px-12 w-full">
          <div className="text-center mb-16">
            <span className="text-xs font-bold tracking-widest text-[#E8AF34] uppercase block mb-3">Moments at Simba</span>
            <h2 className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">Our Gallery</h2>
            <div className="w-12 h-1 bg-[#E8AF34] mx-auto mt-4 rounded-full" />
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

      {/* 6. Branch Information */}
      <section className="min-h-screen flex items-center py-24 relative overflow-hidden">
        {/* Responsive Background Images */}
        <picture className="absolute inset-0 w-full h-full pointer-events-none">
          <source media="(min-width: 1024px)" srcSet="/Map.webp" />
          <source media="(min-width: 640px)" srcSet="/Map%20Tab.png" />
          <img loading="lazy" decoding="async" 
            src="/Map%20Mobile.png" 
            alt="Simba Academy Branches Map Background" 
            className="w-full h-full object-cover object-center"
            loading="lazy"
            decoding="async"
          />
        </picture>

        <div className="absolute inset-0 bg-slate-950/5 pointer-events-none" />

        <div className="max-w-7xl mx-auto px-6 sm:px-12 w-full text-center relative z-10">
          <div className="relative -translate-y-20 sm:-translate-y-16">
            <div className="text-center mb-10">
              <span className="text-xs font-bold tracking-widest text-[#E8AF34] uppercase block mb-3">Our Network</span>
              <h2 className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">Our Branches</h2>
              <div className="w-12 h-1 bg-[#E8AF34] mx-auto mt-4 rounded-full" />
            </div>

            <p className="text-slate-800 sm:text-slate-700 font-semibold text-base sm:text-lg max-w-2xl mx-auto mb-10 drop-shadow-sm bg-white/85 sm:bg-transparent px-4 py-3 rounded-xl sm:px-0 sm:py-0">
              Simba Academy is expanding! Discover our interactive locations and flagship campuses across the region.
            </p>
          </div>

          {/* Interactive Google Map Box */}
          <div className="w-full sm:max-w-[520px] mx-auto h-[220px] sm:h-[276px] overflow-hidden rounded-none bg-white/95 backdrop-blur-sm shadow-2xl -mt-12 sm:-mt-10 relative z-20">
            <iframe
              title="Simba Academy Salem Branches Map"
              src="https://maps.google.com/maps?q=Simba%20Preschool,%20Salem&t=&z=12&ie=UTF8&iwloc=&output=embed"
              className="w-full h-full border-0"
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </div>
      </section>

      {/* 8. Testimonials (Double Marquee) */}
      <section className="py-24 bg-slate-50 overflow-hidden border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-6 sm:px-12 text-center mb-16">
          <span className="text-xs font-bold tracking-widest text-[#E8AF34] uppercase block mb-3">Testimonials</span>
          <h2 className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">What Parents Say</h2>
          <div className="w-12 h-1 bg-[#E8AF34] mx-auto mt-4 rounded-full" />
        </div>

        {testimonials.length > 0 ? (
          <div className="space-y-8 relative">
            {/* Fade edges */}
            <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-slate-50 to-transparent z-10 pointer-events-none" />
            <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-slate-50 to-transparent z-10 pointer-events-none" />

            {/* Row 1: Scrolls Left */}
            <div className="flex overflow-hidden group">
              <div className="flex animate-scroll-left gap-6 w-max shrink-0 hover:![animation-play-state:paused] group-hover:![animation-play-state:paused]" style={{ animationDuration: '360s' }}>
                {[...row1Testimonials, ...row1Testimonials, ...row1Testimonials].map((t, idx) => (
                  <TestimonialCard key={`${t.id}-1-${idx}`} testimonial={t} />
                ))}
              </div>
            </div>

            {/* Row 2: Scrolls Right */}
            {row2Testimonials.length > 0 && (
              <div className="flex overflow-hidden group">
                <div className="flex animate-scroll-right gap-6 w-max shrink-0 hover:![animation-play-state:paused] group-hover:![animation-play-state:paused]" style={{ animationDuration: '360s' }}>
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

      {/* Portals Link */}
      <section className="min-h-screen flex items-center justify-center py-24 bg-white relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 sm:px-12 text-center w-full">
          <div className="text-center mb-16">
            <span className="text-xs font-bold tracking-widest text-[#E8AF34] uppercase block mb-3">Access Your Dashboard</span>
            <h2 className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">Our Portals</h2>
            <div className="w-12 h-1 bg-[#E8AF34] mx-auto mt-4 rounded-full" />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 max-w-[95%] xl:max-w-7xl mx-auto">
            {/* Student Portal */}
            <div className="relative flex flex-col items-center justify-center text-center w-full aspect-[4/3] sm:aspect-[16/9] md:aspect-[4/3] lg:aspect-[16/9]">
              {/* Wooden Frame Background */}
              <div 
                className="absolute inset-0 bg-contain bg-center bg-no-repeat z-0" 
                style={{ backgroundImage: "url('/Portal.png')" }} 
              />
              
              {/* Inner Content */}
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
            <div className="relative flex flex-col items-center justify-center text-center w-full aspect-[4/3] sm:aspect-[16/9] md:aspect-[4/3] lg:aspect-[16/9]">
              {/* Wooden Frame Background */}
              <div 
                className="absolute inset-0 bg-contain bg-center bg-no-repeat z-0" 
                style={{ backgroundImage: "url('/Portal.png')" }} 
              />
              
              {/* Inner Content */}
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

    </PageShell>
    </>
  );
}

function TestimonialCard({ testimonial }: { testimonial: Testimonial & { role?: string; profilePhotoUrl?: string } }) {
  return (
    <div className="w-[min(300px,calc(100vw-3rem))] sm:w-[350px] md:w-[420px] bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
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
