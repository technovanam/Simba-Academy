import { useEffect, useState, useMemo } from "react";
import type { Route } from "./+types/home";
import { Link } from "react-router";
import { PageShell } from "../components/PageShell";
import { api, type GalleryItem, type Testimonial } from "../lib/api";
import { WHATSAPP_NUMBER, WHATSAPP_URL } from "../lib/constants";
import { resolveStorageUrl } from "../lib/storage";
import { 
  ArrowRight,
  Star,
  PlayCircle,
  CheckCircle2,
  Phone,
  Palette,
  Users,
  Rocket,
  Pencil,
  Home,
  Smartphone,
  QrCode,
  Shield,
  GraduationCap,
  Heart,
  Handshake,
  Sparkles,
} from "lucide-react";

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

const programsList = [
  {
    title: "Play Group",
    age: "2 – 3 Years",
    icon: Users,
    intro:
      "A joyful introduction to school through music, movement, storytelling, and play.",
    learnLabel: "Children learn:",
    highlights: [
      "Social interaction",
      "Basic communication",
      "Motor skills",
      "Sensory exploration",
    ],
    whatsappMsg: "Hi, I am interested in enrolling my child in Play Group. Please share details.",
  },
  {
    title: "Pre-KG",
    age: "3 – 4 Years",
    icon: Pencil,
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
    title: "LKG",
    age: "4 – 5 Years",
    icon: Palette,
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
    title: "UKG",
    age: "5 – 6 Years",
    icon: Rocket,
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

const parentAppFeatures = [
  "Activity photos",
  "Learning activities",
  "Snacks & meals",
  "Water intake",
  "Potty/Loo routine",
  "Nap time",
  "Mood & well-being",
  "Teacher's notes",
  "Daily achievements & milestones",
];

const whyChooseSimba = [
  {
    icon: Home,
    title: "A Home Away From Home",
    description:
      "A warm, loving, and nurturing environment where every Little Simbian feels safe, valued, and happy.",
  },
  {
    icon: Smartphone,
    title: "Live Parent Updates",
    description:
      "Never miss a precious moment! Through our Simba Parent App, receive real-time updates on your child's day, including:",
    features: parentAppFeatures,
    wide: true,
  },
  {
    icon: QrCode,
    title: "QR-Based Check-In & Check-Out",
    description:
      "Every child is issued a unique ID card with a QR code. Secure scan-in and scan-out ensure accurate attendance records and provide parents with instant notifications when their child arrives at or leaves the preschool.",
  },
  {
    icon: Shield,
    title: "Safety First",
    description:
      "A secure campus with caring staff and child-friendly facilities, ensuring your little one is always safe and well cared for.",
  },
  {
    icon: Palette,
    title: "Play-Based Learning",
    description:
      "Fun, engaging activities that inspire creativity, confidence, communication, and lifelong learning.",
  },
  {
    icon: GraduationCap,
    title: "Passionate Educators",
    description:
      "Dedicated teachers who nurture every child with love, patience, encouragement, and individual attention.",
  },
  {
    icon: Heart,
    title: "Health & Well-being",
    description:
      "We care for every child's physical and emotional well-being through healthy routines, nutritious snacks, and attentive care.",
  },
  {
    icon: Handshake,
    title: "Parent Partnership",
    description:
      "Strong communication, transparency, and daily updates help parents stay involved in every step of their child's learning journey.",
  },
  {
    icon: Sparkles,
    title: "Happy Childhood, Bright Future",
    description:
      "We nurture curious minds, kind hearts, and confident learners—giving every Little Simbian the happiest start and the strongest foundation for life.",
    wide: true,
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
  const [activeProgramIndex, setActiveProgramIndex] = useState(0);
  const [activeWhyChooseIndex, setActiveWhyChooseIndex] = useState(0);

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

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveProgramIndex((prev) => (prev + 1) % programsList.length);
    }, 2000);

    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveWhyChooseIndex((prev) => (prev + 1) % whyChooseSimba.length);
    }, 4000);

    return () => window.clearInterval(timer);
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

  return (
    <>
      <PageShell headerVariant="overlay">
        {/* 1. Hero Section */}
        <section className="relative overflow-hidden min-h-screen flex items-center pt-24 pb-12 bg-black">
          {/* Responsive Background Images */}
          <picture className="absolute inset-0 w-full h-full">
            <source media="(min-width: 1024px)" srcSet="/Hero%20Section.png" />
            <source
              media="(min-width: 640px) and (max-width: 1023px) and (orientation: portrait)"
              srcSet="/Hero%20Section%20Tab%20Potrait.png"
            />
            <source media="(min-width: 640px)" srcSet="/Hero%20Section%20Tab.png" />
            <img loading="lazy" decoding="async" 
              src="/Hero%20Section%20Mobile.png"
              alt="Simba Academy Background" 
              className="w-full h-full object-cover object-center"
              fetchPriority="high"
              decoding="async"
            />
          </picture>
        
        <div className="hero-content max-w-6xl mx-auto px-6 sm:px-12 w-full relative z-10 flex flex-col items-center justify-center text-center">
          <div className="space-y-6 flex flex-col items-center w-full">
            <div className="flex flex-col items-center gap-1 sm:gap-1.5">
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-black tracking-tight leading-[1.1]">
                Welcome to <span className="text-[#E8AF34]">Simba Preschool</span>
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
      <section className="min-h-screen flex items-center py-20 relative overflow-hidden">
        {/* Responsive Background Images */}
        <picture className="absolute inset-0 w-full h-full pointer-events-none">
          <source media="(min-width: 1024px)" srcSet="/About.png" />
          <source
            media="(min-width: 640px) and (max-width: 1023px) and (orientation: portrait)"
            srcSet="/About%20Section%20Tab%20Potrait.png"
          />
          <source media="(min-width: 640px)" srcSet="/About%20Section%20Tab.png" />
          <img
            src="/About%20Section%20Mobile.png"
            alt="About Simba Academy Background"
            className="w-full h-full object-cover object-center"
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
      <section className="relative h-screen w-full bg-white overflow-hidden">
        <picture className="absolute inset-0 w-full h-full pointer-events-none select-none">
          <source media="(min-width: 1024px)" srcSet="/Vision%20Mission.png" />
          <source
            media="(min-width: 640px) and (max-width: 1023px) and (orientation: portrait)"
            srcSet="/Vision%20Mission%20Tab%20Potrait.png"
          />
          <source media="(min-width: 640px)" srcSet="/Vision%20Mission%20Tab.png" />
          <img
            src="/Vission%20Mission%20Mobile.png"
            alt=""
            aria-hidden
            className="absolute inset-0 w-full h-full object-cover object-center"
            loading="lazy"
            decoding="async"
          />
        </picture>

        <div className="absolute inset-0 z-10 font-sans flex flex-col items-center px-5 pt-[31vh] sm:max-lg:portrait:pt-[28vh] sm:max-lg:landscape:block sm:max-lg:landscape:p-0 lg:block lg:p-0">
          <div className="vision-mission-header-block w-full max-w-[21rem] max-lg:portrait:max-w-[26rem] text-center px-3 mb-7 mx-auto sm:max-lg:landscape:absolute sm:max-lg:landscape:left-1/2 sm:max-lg:landscape:-translate-x-1/2 sm:max-lg:landscape:top-[43%] sm:max-lg:landscape:translate-y-3 sm:max-lg:landscape:w-[min(66%,30rem)] sm:max-lg:landscape:max-w-none sm:max-lg:landscape:mb-0 sm:max-lg:landscape:mx-0 lg:absolute lg:left-1/2 lg:-translate-x-1/2 lg:top-[42%] lg:translate-y-3 lg:w-[min(66%,30rem)] lg:max-w-none lg:mb-0 lg:mx-0 lg:px-4">
            <span className="text-sm font-bold tracking-widest text-[#8B6914] uppercase block mb-2 lg:text-sm lg:mb-2">
              Our Purpose
            </span>
            <h2 className="text-3xl max-lg:portrait:text-4xl sm:max-lg:landscape:text-4xl lg:text-5xl font-extrabold text-[#4A3728] tracking-tight leading-tight">
              Vision & Mission
            </h2>
          </div>

          <div className="vision-mission-vision-block w-full max-w-[19rem] sm:max-lg:portrait:max-w-[24rem] mx-auto mb-6 mt-10 lg:mt-0 text-center px-2 sm:max-lg:landscape:absolute sm:max-lg:landscape:left-[14%] sm:max-lg:landscape:top-[70%] sm:max-lg:landscape:translate-y-8 sm:max-lg:landscape:translate-x-3 sm:max-lg:landscape:w-[32%] sm:max-lg:landscape:max-w-none sm:max-lg:landscape:mb-0 sm:max-lg:landscape:mx-0 lg:absolute lg:left-[16%] lg:top-[69%] lg:translate-y-8 lg:translate-x-3 lg:w-[30%] lg:max-w-none lg:mb-0 lg:mx-0 lg:px-3 lg:flex lg:flex-col lg:items-center lg:justify-center">
            <h3 className="text-lg sm:max-lg:portrait:text-3xl sm:max-lg:landscape:text-base lg:text-lg font-extrabold text-[#4A3728] mb-2 sm:max-lg:landscape:mb-1.5 lg:mb-1.5 leading-tight">
              Vision
            </h3>
            <p className="text-xs sm:max-lg:portrait:text-base sm:max-lg:landscape:text-[10px] sm:max-lg:landscape:leading-snug lg:text-sm text-[#5C4033] font-semibold leading-relaxed lg:leading-relaxed">
              To create a world where every Little Simbian feels loved, valued, and inspired to learn by building 100+ Simba Preschool centres across India that become a second home for children and a trusted partner for families.
            </p>
          </div>

          <div className="vision-mission-mission-block w-full max-w-[19rem] sm:max-lg:portrait:max-w-[24rem] mx-auto text-center px-2 sm:max-lg:landscape:absolute sm:max-lg:landscape:right-[14%] sm:max-lg:landscape:top-[70%] sm:max-lg:landscape:translate-y-8 sm:max-lg:landscape:-translate-x-5 sm:max-lg:landscape:w-[32%] sm:max-lg:landscape:max-w-none sm:max-lg:landscape:mx-0 lg:absolute lg:right-[16%] lg:top-[69%] lg:translate-y-8 lg:-translate-x-5 lg:w-[30%] lg:max-w-none lg:mx-0 lg:px-3 lg:flex lg:flex-col lg:items-center lg:justify-center">
            <h3 className="text-lg sm:max-lg:portrait:text-3xl sm:max-lg:landscape:text-base lg:text-lg font-extrabold text-[#4A3728] mb-2 sm:max-lg:landscape:mb-1.5 lg:mb-1.5 leading-tight">
              Mission
            </h3>
            <p className="text-xs sm:max-lg:portrait:text-base sm:max-lg:landscape:text-[10px] sm:max-lg:landscape:leading-snug lg:text-sm text-[#5C4033] font-semibold leading-relaxed lg:leading-relaxed">
              At Simba Preschool, every child is loved, celebrated, and encouraged to shine. We nurture safe, joyful learning through love and play, helping every Little Simbian thrive with educators and parents across India.
            </p>
          </div>
        </div>
      </section>

      {/* 4. Our Programs */}
      <section id="programs" className="relative h-screen w-full bg-white overflow-hidden">
        <picture className="absolute inset-0 w-full h-full pointer-events-none select-none">
          <source media="(min-width: 1024px)" srcSet="/Our%20Programs.png" />
          <source
            media="(min-width: 640px) and (max-width: 1023px) and (orientation: portrait)"
            srcSet="/Our%20Programs%20Tab%20Potrait.png"
          />
          <source media="(min-width: 640px)" srcSet="/Our%20Programs%20Tab.png" />
          <img
            src="/Our%20Programs%20Mobile.png"
            alt=""
            aria-hidden
            className="absolute inset-0 w-full h-full object-cover object-bottom"
            loading="lazy"
            decoding="async"
          />
        </picture>

        <div className="absolute inset-x-0 top-0 z-10 text-center pt-5 sm:pt-7 lg:pt-8 px-6">
          <span className="text-xs font-bold tracking-widest text-[#E8AF34] uppercase block mb-3">What We Offer</span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight">Our Programs</h2>
        </div>

        <div className="programs-carousel-slot z-20 h-[28rem] sm:max-lg:portrait:h-[37rem] sm:max-lg:landscape:h-[29.5rem] lg:h-[21.25rem] max-w-[13rem] sm:max-lg:portrait:max-w-[25.5rem] sm:max-lg:landscape:max-w-[42rem] lg:max-w-[38rem] px-4 sm:max-lg:portrait:px-5 sm:max-lg:landscape:px-10 lg:px-12">
          {programsList.map((program, idx) => {
            const isActive = activeProgramIndex === idx;
            return (
              <div
                key={program.title}
                className={`absolute inset-0 flex flex-col items-center justify-center transition-all duration-700 ease-in-out ${
                  isActive
                    ? "opacity-100 translate-y-0 scale-100 z-10"
                    : "opacity-0 translate-y-3 scale-[0.98] pointer-events-none z-0"
                }`}
                aria-hidden={!isActive}
              >
                <ProgramCard program={program} />
              </div>
            );
          })}

        </div>
      </section>

      {/* 5. Why Parents Choose Us */}
      <section className="relative h-screen w-full bg-white overflow-hidden">
        <picture className="absolute inset-0 w-full h-full pointer-events-none select-none">
          <source media="(min-width: 1024px)" srcSet="/Parent%20Choose%20Us.png" />
          <source
            media="(min-width: 640px) and (max-width: 1023px) and (orientation: portrait)"
            srcSet="/Parent%20Choose%20Us%20Tab%20Potrait.png"
          />
          <source media="(min-width: 640px)" srcSet="/Parent%20Choose%20Us%20Tab.png" />
          <img
            src="/Parent%20Choose%20Us%20Mobile.png"
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
      <section className="relative h-screen max-h-screen w-full bg-[#FDF5E5] overflow-hidden flex flex-col">
        <div className="text-center pt-5 sm:pt-7 lg:pt-8 px-6 shrink-0">
          <span className="text-xs font-bold tracking-widest text-[#E8AF34] uppercase block mb-2">Why Simba</span>
          <h2 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight">
            Why Choose Simba Preschool?
          </h2>
          <div className="w-12 h-1 bg-[#E8AF34] mx-auto mt-2 sm:mt-3 rounded-full" />
        </div>

        <div className="relative flex-1 min-h-0 w-full max-w-4xl mx-auto px-6 sm:px-10 pb-6 sm:pb-8">
          {whyChooseSimba.map((item, idx) => {
            const isActive = activeWhyChooseIndex === idx;
            return (
              <div
                key={item.title}
                className={`absolute inset-x-6 sm:inset-x-10 top-0 bottom-0 transition-all duration-700 ease-in-out ${
                  isActive
                    ? "opacity-100 translate-y-0 z-10"
                    : "opacity-0 translate-y-3 pointer-events-none z-0"
                }`}
                aria-hidden={!isActive}
              >
                <WhyChooseCard item={item} />
              </div>
            );
          })}

        </div>
      </section>

      {/* 6. Our Learning Approach */}
      <section className="relative h-screen w-full bg-white overflow-hidden">
        <picture className="absolute inset-0 w-full h-full pointer-events-none select-none">
          <source media="(min-width: 1024px)" srcSet="/Learning%20Approach.png" />
          <source
            media="(min-width: 640px) and (max-width: 1023px) and (orientation: portrait)"
            srcSet="/Learning%20Apprach%20Tab%20Potrait.png"
          />
          <source media="(min-width: 640px)" srcSet="/Learning%20Apprach%20Tab.png" />
          <img
            src="/Learning%20Apprach%20Mobile.png"
            alt=""
            aria-hidden
            className="absolute inset-0 w-full h-full object-cover object-center"
            loading="lazy"
            decoding="async"
          />
        </picture>

        <div className="relative z-10 text-center pt-8 sm:pt-10 lg:pt-12 px-6 sm:px-10">
          <span className="text-xs font-bold tracking-widest text-[#E8AF34] uppercase block mb-3">How We Teach</span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight">Our Learning Approach</h2>
        </div>
      </section>

      <div className="w-full h-10 sm:h-14 lg:h-16 bg-[#FDF5E5]" aria-hidden />

      {/* 7. Facilities */}
      <section className="relative h-screen w-full bg-[#FDF5E5] overflow-hidden">
        <picture className="absolute inset-0 w-full h-full pointer-events-none select-none">
          <source media="(min-width: 1024px)" srcSet="/Facilities.png" />
          <source
            media="(min-width: 640px) and (max-width: 1023px) and (orientation: portrait)"
            srcSet="/Facilities%20Tab%20Potrait.png"
          />
          <source media="(min-width: 640px)" srcSet="/Facilities%20Tab.png" />
          <img
            src="/Facilities%20Mobile.png"
            alt=""
            aria-hidden
            className="absolute inset-0 w-full h-full object-cover object-center"
            loading="lazy"
            decoding="async"
          />
        </picture>

        <div className="relative z-10 text-center pt-0 sm:pt-0.5 lg:pt-1 px-6 -translate-y-1 sm:-translate-y-1.5">
          <span className="text-xs font-bold tracking-widest text-[#E8AF34] uppercase block mb-3">Our Campus</span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight">Facilities</h2>
        </div>
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
              <div 
                className="absolute inset-0 bg-contain bg-center bg-no-repeat z-0" 
                style={{ backgroundImage: "url('/Portal.png')" }} 
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
            <div className="relative flex flex-col items-center justify-center text-center w-full aspect-[4/3] sm:aspect-[16/9] md:aspect-[4/3] lg:aspect-[16/9]">
              <div 
                className="absolute inset-0 bg-contain bg-center bg-no-repeat z-0" 
                style={{ backgroundImage: "url('/Portal.png')" }} 
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
      <section className="py-24 bg-slate-50 overflow-hidden border-t border-slate-200">
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
              <div className="flex animate-scroll-left gap-6 w-max shrink-0 hover:![animation-play-state:paused] group-hover:![animation-play-state:paused]" style={{ animationDuration: '360s' }}>
                {[...row1Testimonials, ...row1Testimonials, ...row1Testimonials].map((t, idx) => (
                  <TestimonialCard key={`${t.id}-1-${idx}`} testimonial={t} />
                ))}
              </div>
            </div>

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

      {/* 11. Contact & Location */}
      <section className="min-h-screen flex items-center py-24 relative overflow-hidden">
        <picture className="absolute inset-0 w-full h-full pointer-events-none">
          <source media="(min-width: 1024px)" srcSet="/Map.webp" />
          <source media="(min-width: 640px)" srcSet="/Map%20Tab.png" />
          <img loading="lazy" decoding="async" 
            src="/Map%20Mobile.png" 
            alt="Simba Academy Branches Map Background" 
            className="w-full h-full object-cover object-center"
            decoding="async"
          />
        </picture>

        <div className="absolute inset-0 bg-slate-950/5 pointer-events-none" />

        <div className="max-w-7xl mx-auto px-6 sm:px-12 w-full text-center relative z-10">
          <div className="relative -translate-y-20 sm:-translate-y-16">
            <div className="text-center mb-10">
              <span className="text-xs font-bold tracking-widest text-[#E8AF34] uppercase block mb-3">Get in Touch</span>
              <h2 className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">Contact Us</h2>
              <div className="w-12 h-1 bg-[#E8AF34] mx-auto mt-4 rounded-full" />
            </div>

            <p className="text-slate-800 sm:text-slate-700 font-semibold text-base sm:text-lg max-w-2xl mx-auto mb-10 drop-shadow-sm bg-white/85 sm:bg-transparent px-4 py-3 rounded-xl sm:px-0 sm:py-0">
              Simba Preschool — Salem. Reach us for admissions, campus visits, and program details.
            </p>
          </div>

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

function WhyChooseCard({ item }: { item: (typeof whyChooseSimba)[number] }) {
  const ItemIcon = item.icon;

  return (
    <article className="program-card w-full h-full max-h-full mx-auto flex flex-col items-center text-center px-4 sm:px-6 py-3 sm:py-4 min-h-0 overflow-hidden">
      <span className="inline-flex items-center justify-center w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-[#E8AF34]/25 border border-[#C59124]/50 shadow-sm mb-2 sm:mb-3 shrink-0">
        <ItemIcon className="w-5 h-5 text-[#7A4F10]" strokeWidth={2.25} />
      </span>

      <h3 className="text-base sm:text-xl lg:text-2xl font-extrabold text-[#2C1810] mb-1.5 sm:mb-2 leading-tight shrink-0 px-2">
        {item.title}
      </h3>

      <div className="w-10 h-0.5 rounded-full bg-[#E8AF34]/70 mb-2 shrink-0" aria-hidden />

      <div className="flex-1 min-h-0 w-full overflow-y-auto flex flex-col items-center px-1 sm:px-2">
        <p className="text-xs sm:text-sm lg:text-base leading-snug text-[#4A3728] font-medium max-w-2xl">
          {item.description}
        </p>

        {item.features ? (
          <ul className="mt-2 sm:mt-3 grid grid-cols-2 sm:grid-cols-3 gap-x-2 sm:gap-x-3 gap-y-1 sm:gap-y-1.5 w-full max-w-2xl text-left">
            {item.features.map((feature) => (
              <li key={feature} className="flex items-start gap-1 text-[11px] sm:text-xs lg:text-sm text-[#2C1810] font-semibold">
                <CheckCircle2
                  className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#FFFBF5] fill-[#C59124] shrink-0 mt-0.5"
                  strokeWidth={2.5}
                />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </article>
  );
}

function ProgramCard({ program }: { program: (typeof programsList)[number] }) {
  const ProgramIcon = program.icon;

  return (
    <article className="program-card w-full h-full mx-auto flex flex-col items-center text-center px-4 py-4 sm:max-lg:landscape:px-6 sm:max-lg:landscape:py-5 lg:px-6 lg:py-5 font-sans min-h-0 overflow-hidden">
      <div className="program-card-header flex flex-col items-center gap-2 mb-2 sm:max-lg:landscape:flex-row sm:max-lg:landscape:gap-2.5 lg:flex-row lg:gap-2.5 sm:max-lg:landscape:mb-3 lg:mb-3 shrink-0">
        <span className="inline-flex items-center justify-center w-9 h-9 sm:max-lg:portrait:w-10 sm:max-lg:portrait:h-10 sm:max-lg:landscape:w-10 sm:max-lg:landscape:h-10 lg:w-11 lg:h-11 rounded-full bg-[#E8AF34]/25 border border-[#C59124]/50 shadow-sm">
          <ProgramIcon className="w-5 h-5 sm:max-lg:portrait:w-[1.35rem] sm:max-lg:portrait:h-[1.35rem] lg:w-6 lg:h-6 text-[#7A4F10]" strokeWidth={2.25} />
        </span>
        <p className="font-extrabold text-sm sm:max-lg:portrait:text-lg sm:max-lg:landscape:text-xl lg:text-2xl leading-tight text-[#2C1810]">
          {program.title}{" "}
          <span className="text-[#9A6B1A] font-bold">({program.age})</span>
        </p>
      </div>

      <div className="w-10 h-0.5 rounded-full bg-[#E8AF34]/70 mb-2 sm:max-lg:landscape:mb-2.5 shrink-0" aria-hidden />

      <div className="program-card-body flex flex-1 min-h-0 w-full flex-col items-center overflow-hidden">
      {program.intro ? (
        <p className="text-xs sm:max-lg:portrait:text-base sm:max-lg:landscape:text-lg lg:text-lg leading-snug text-[#4A3728] font-medium mb-2 w-full shrink-0 px-1">
          {program.intro}
        </p>
      ) : null}

      <p className="text-[11px] sm:max-lg:portrait:text-sm sm:max-lg:landscape:text-base lg:text-base font-bold uppercase tracking-wider text-[#9A6B1A] mb-1.5 sm:max-lg:landscape:mb-2 shrink-0">
        {program.learnLabel}
      </p>

      <ul className="program-card-highlights w-full space-y-1.5 list-none columns-1 sm:max-lg:landscape:columns-2 lg:columns-2 gap-x-5 text-left max-w-[12.5rem] sm:max-lg:portrait:max-w-[18.5rem] sm:max-lg:landscape:max-w-sm lg:max-w-md mx-auto shrink-0">
        {program.highlights.map((item) => (
          <li key={item} className="flex items-start gap-2 text-xs sm:max-lg:portrait:text-base sm:max-lg:landscape:text-lg lg:text-lg break-inside-avoid mb-0.5 text-[#2C1810] font-semibold">
            <CheckCircle2 className="w-3.5 h-3.5 sm:max-lg:portrait:w-4 sm:max-lg:portrait:h-4 sm:max-lg:landscape:w-[1.125rem] sm:max-lg:landscape:h-[1.125rem] lg:w-5 lg:h-5 text-[#FFFBF5] fill-[#C59124] shrink-0 mt-0.5" strokeWidth={2.5} />
            <span>{item}</span>
          </li>
        ))}
      </ul>

      {program.closing ? (
        <p className="text-xs sm:max-lg:portrait:text-base sm:max-lg:landscape:text-lg lg:text-lg leading-snug text-[#5C4033] font-medium italic mt-2 mb-2 w-full shrink-0 px-1">
          {program.closing}
        </p>
      ) : null}
      </div>

      <a
        href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(program.whatsappMsg)}`}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center justify-center gap-2 px-6 py-2 sm:max-lg:portrait:px-7 sm:max-lg:portrait:py-2.5 sm:max-lg:landscape:px-8 sm:max-lg:landscape:py-3 lg:px-8 lg:py-3 rounded-full bg-[#E8AF34] border-2 border-[#A67C1A] text-[#2C1810] font-extrabold text-xs sm:max-lg:portrait:text-base sm:max-lg:landscape:text-lg lg:text-lg hover:bg-[#D9A42E] hover:-translate-y-0.5 transition-all shadow-[0_4px_14px_rgba(198,145,36,0.45)] shrink-0 mt-auto"
      >
        Enroll <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 lg:w-5 lg:h-5" />
      </a>
    </article>
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
