import { Link } from "react-router";
import { useEffect, useState, type ReactNode } from "react";
import { api, type PublicReview } from "../lib/api";
import { 
  Palette, 
  Leaf, 
  Users, 
  Quote, 
  Compass, 
  GraduationCap, 
  PawPrint,
  Clock,
  Sparkles,
  ArrowRight,
  Heart,
  Calendar,
  Backpack,
  ShieldCheck,
  Footprints
} from "lucide-react";
import { JungleFooter } from "../components/JungleFooter";
import { FloatingWhatsApp } from "../components/FloatingWhatsApp";

// Custom Animated Floating Butterfly
function Butterfly({ className, color = "#FF70A6", delay = "0s" }: { className?: string; color?: string; delay?: string }) {
  return (
    <div className={`absolute w-8 h-8 pointer-events-none select-none z-10 ${className}`} style={{ animationDelay: delay }}>
      <div className="flex items-center justify-center h-full">
        {/* Left wing */}
        <div className="w-4 h-6 flap-left">
          <svg viewBox="0 0 50 80" fill="none">
            <path d="M50,40 C50,15 20,0 5,15 C-5,25 5,45 50,50 C20,55 10,65 15,75 C20,85 50,70 50,55" fill={color}/>
          </svg>
        </div>
        {/* Body */}
        <div className="w-[2px] h-6 bg-[#3E2723] rounded-lg z-10"></div>
        {/* Right wing */}
        <div className="w-4 h-6 flap-right">
          <svg viewBox="0 0 50 80" fill="none" className="transform scale-x-[-1]">
            <path d="M50,40 C50,15 20,0 5,15 C-5,25 5,45 50,50 C20,55 10,65 15,75 C20,85 50,70 50,55" fill={color}/>
          </svg>
        </div>
      </div>
    </div>
  );
}

// Outpost Definition for the Savanna grounds map
interface Outpost {
  id: string;
  name: string;
  age: string;
  icon: ReactNode;
  color: string;
  badgeBg: string;
  textColor: string;
  focus: string[];
  desc: string;
  highlights: string[];
  ratio: string;
  mapX: string; // Percentages for map coordinates
  mapY: string;
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex justify-center gap-0.5 mb-4" aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <span key={n} className={n <= rating ? "text-[#FF9F1C]" : "text-[#E0E0E0]"}>
          ★
        </span>
      ))}
    </div>
  );
}

const FALLBACK_REVIEW: PublicReview = {
  id: "fallback",
  name: "Mama Sarah Jenkins",
  content:
    "Simba Academy is a magical oasis. Our daughter joins the Little Leopards ridge and comes home reciting nature poems, glowing with social coordination, and carrying gorgeous finger-painted monstera leaves. The rangers are warm, certified educators who truly respect early childhood magic.",
  rating: 5,
  source: "manual",
};

export function Welcome() {
  const [isMascotHovered, setIsMascotHovered] = useState(false);
  const [activeOutpost, setActiveOutpost] = useState<string>("turtles");
  const [publicReviews, setPublicReviews] = useState<PublicReview[]>([]);
  const [activeReviewIndex, setActiveReviewIndex] = useState(0);
  const [googleMeta, setGoogleMeta] = useState<{
    configured: boolean;
    rating?: number;
    totalRatings?: number;
    placeName?: string;
    locationCount?: number;
  }>({ configured: false });

  useEffect(() => {
    api
      .getPublicReviews()
      .then((data) => {
        setPublicReviews(data.reviews);
        setGoogleMeta(data.google);
        setActiveReviewIndex(0);
      })
      .catch(() => {
        setPublicReviews([]);
      });
  }, []);

  const displayReviews =
    publicReviews.filter((r) => r.content && r.content !== "—").length > 0
      ? publicReviews.filter((r) => r.content && r.content !== "—")
      : publicReviews.length > 0
        ? publicReviews
        : [FALLBACK_REVIEW];
  const activeReview = displayReviews[activeReviewIndex] ?? displayReviews[0];

  useEffect(() => {
    if (displayReviews.length <= 1) return;
    const timer = window.setInterval(() => {
      setActiveReviewIndex((i) => (i + 1) % displayReviews.length);
    }, 8000);
    return () => window.clearInterval(timer);
  }, [displayReviews.length]);

  // Outpost Details for Interactive Map
  const outposts: Outpost[] = [
    {
      id: "turtles",
      name: "Turtle Bay Nursery",
      age: "6 - 18 months",
      icon: <Compass className="w-6 h-6" />,
      color: "#FF9F1C",
      badgeBg: "#FFF2D7",
      textColor: "#BA8A2D",
      focus: ["Sensory Stimulation", "Reflex Coordination", "Soothing Textures", "Gentle Language"],
      desc: "A cozy and warm nursery nest designed for our youngest cubs. Our guides focus on early developmental milestones, soft-turf safety, and sensory-guided playsheets.",
      highlights: ["Sensory-based toys & balls", "1:3 Guide-to-Cub ratio", "Dedicated quiet sleeping dens"],
      ratio: "1:3",
      mapX: "18%",
      mapY: "72%"
    },
    {
      id: "leopards",
      name: "Leopard Savanna Hills",
      age: "1.5 - 3 years",
      icon: <Backpack className="w-6 h-6" />,
      color: "#8AC926",
      badgeBg: "#F1F9E8",
      textColor: "#4E8C52",
      focus: ["Dexterity Crafts", "Parallel Storytelling", "Locomotion Pathways", "Social Playtime"],
      desc: "Spurring mobility, initial socialization, and motor confidence. Toddlers run along sand savannas, paint custom leaf art, and sing interactive nursery safari tales.",
      highlights: ["Sand-savanna play yards", "Language & rhythm classes", "Nature-biology crawl spaces"],
      ratio: "1:5",
      mapX: "46%",
      mapY: "48%"
    },
    {
      id: "cubs",
      name: "Lion Peak Academy",
      age: "3 - 5 years",
      icon: <GraduationCap className="w-6 h-6" />,
      color: "#4EA8DE",
      badgeBg: "#E8F5FD",
      textColor: "#2B86C5",
      focus: ["Pre-Math Arithmetic", "Phonics & Alphabets", "Eco Gardening Lab", "Teamwork Operations"],
      desc: "The ultimate pre-kindergarten exploration academy! Cubs explore basic mathematical fractions using tree slices, study flower pollination in our garden, and learn team roleplay.",
      highlights: ["Advanced nature labs", "Mock-school classrooms", "Creative clay workshops"],
      ratio: "1:7",
      mapX: "78%",
      mapY: "25%"
    }
  ];

  const currentOutpost = outposts.find(o => o.id === activeOutpost) || outposts[0];

  // Bright Dandelion Particles Coordinates
  const fireflies = [
    { left: "8%", top: "18%", delay: "0s", duration: "8s" },
    { left: "22%", top: "42%", delay: "2s", duration: "10s" },
    { left: "6%", top: "72%", delay: "4s", duration: "7s" },
    { left: "38%", top: "12%", delay: "1s", duration: "9s" },
    { left: "52%", top: "32%", delay: "3s", duration: "11s" },
    { left: "68%", top: "58%", delay: "5s", duration: "8s" },
    { left: "82%", top: "22%", delay: "1.5s", duration: "12s" },
    { left: "88%", top: "78%", delay: "3.5s", duration: "9s" },
    { left: "14%", top: "82%", delay: "2.5s", duration: "11s" },
    { left: "64%", top: "8%", delay: "0.5s", duration: "10s" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#E3F2FD] via-[#FAF8F5] to-[#FAF8F5] font-sans text-[#3E2723] selection:bg-[#FFD275] selection:text-[#3E2723] overflow-x-hidden relative">
      
      {/* Interactive styles for homepage micro-animations */}
      <style>{`
        @keyframes firefly-drift {
          0% { transform: translate(0, 0) scale(0.6); opacity: 0; }
          50% { opacity: 0.6; }
          100% { transform: translate(35px, -50px) scale(1); opacity: 0; }
        }
        @keyframes sway-leaf {
          0%, 100% { transform: rotate(-5deg); }
          50% { transform: rotate(5deg); }
        }
        @keyframes butterfly-float-1 {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          25% { transform: translate(35px, -15px) rotate(10deg); }
          50% { transform: translate(15px, -35px) rotate(-8deg); }
          75% { transform: translate(-20px, -20px) rotate(15deg); }
        }
        @keyframes butterfly-float-2 {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          30% { transform: translate(-25px, -25px) rotate(-15deg); }
          60% { transform: translate(15px, -40px) rotate(8deg); }
          80% { transform: translate(-8px, -12px) rotate(-10deg); }
        }
        @keyframes butterfly-flap-left {
          0%, 100% { transform: rotateY(0deg); }
          50% { transform: rotateY(70deg); }
        }
        @keyframes butterfly-flap-right {
          0%, 100% { transform: rotateY(0deg); }
          50% { transform: rotateY(-70deg); }
        }
        @keyframes mascot-wink {
          0%, 95%, 100% { transform: scaleY(1); }
          97.5% { transform: scaleY(0.1); }
        }
        @keyframes mascot-tail {
          0%, 100% { transform: rotate(-10deg); }
          50% { transform: rotate(15deg); }
        }
        @keyframes fire-glow {
          0%, 100% { transform: scale(1); filter: drop-shadow(0 0 10px rgba(245, 124, 0, 0.4)); }
          50% { transform: scale(1.06); filter: drop-shadow(0 0 18px rgba(255, 179, 0, 0.6)); }
        }
        @keyframes bubble-pop {
          0% { transform: scale(0.9) translateY(10px); opacity: 0; }
          100% { transform: scale(1) translateY(0); opacity: 1; }
        }
        .animate-firefly {
          animation: firefly-drift 9s ease-in-out infinite;
        }
        .animate-leaf-sway {
          animation: sway-leaf 6s ease-in-out infinite;
          transform-origin: top center;
        }
        .animate-butterfly-1 {
          animation: butterfly-float-1 7s ease-in-out infinite;
        }
        .animate-butterfly-2 {
          animation: butterfly-float-2 9s ease-in-out infinite;
        }
        .flap-left {
          animation: butterfly-flap-left 0.18s ease-in-out infinite;
          transform-origin: right center;
        }
        .flap-right {
          animation: butterfly-flap-right 0.18s ease-in-out infinite;
          transform-origin: left center;
        }
        .blink-mascot {
          animation: mascot-wink 6s ease-in-out infinite;
          transform-origin: center;
        }
        .tail-mascot {
          animation: mascot-tail 3s ease-in-out infinite;
          transform-origin: 30px 75px;
        }
        .animate-fire-glow {
          animation: fire-glow 1.8s ease-in-out infinite;
          transform-origin: bottom center;
        }
        .glass-panel {
          background: rgba(255, 255, 255, 0.85);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 2px solid rgba(138, 201, 38, 0.25);
          box-shadow: 0 10px 30px -5px rgba(74, 46, 27, 0.08), inset 0 0 15px rgba(255, 255, 255, 0.5);
        }
        .glass-panel-hover {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .glass-panel-hover:hover {
          border-color: rgba(138, 201, 38, 0.45);
          transform: translateY(-4px);
          box-shadow: 0 20px 40px 0 rgba(74, 46, 27, 0.12);
        }
        .map-pulse-ring {
          box-shadow: 0 0 0 0 rgba(255, 159, 28, 0.8);
          animation: map-pulse 2s infinite;
        }
        @keyframes map-pulse {
          0% { box-shadow: 0 0 0 0 rgba(255, 159, 28, 0.7); }
          70% { box-shadow: 0 0 0 12px rgba(255, 159, 28, 0); }
          100% { box-shadow: 0 0 0 0 rgba(255, 159, 28, 0); }
        }
        .firefly-glow {
          box-shadow: 0 0 8px rgba(255, 213, 79, 0.6);
        }
      `}</style>

      {/* Floating Warm Golden Sunbeams/Dandelion Particles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden select-none z-0">
        {fireflies.map((f, i) => (
          <div 
            key={i}
            className="absolute w-1.5 h-1.5 bg-[#FFD54F] rounded-lg animate-firefly firefly-glow"
            style={{ 
              left: f.left, 
              top: f.top, 
              animationDelay: f.delay, 
              animationDuration: f.duration 
            }}
          />
        ))}
      </div>

      {/* Overhanging Jungle Canopy Leaves */}
      <div className="absolute top-0 right-0 w-48 md:w-80 h-48 md:h-80 z-30 pointer-events-none origin-top-right animate-leaf-sway opacity-90">
        <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-lg">
          <path d="M100 0 Q 65 15, 45 45 Q 80 45, 100 0" fill="#2E5231" />
          <path d="M100 0 Q 75 35, 60 65 Q 88 55, 100 0" fill="#3B6B3E" />
          <path d="M100 0 Q 85 45, 75 75 Q 92 60, 100 0" fill="#4E8C52" />
          <path d="M100 0 Q 92 60, 85 90 Q 97 72, 100 0" fill="#8AC926" />
        </svg>
      </div>
      <div className="absolute top-0 left-0 w-48 md:w-80 h-48 md:h-80 z-30 pointer-events-none origin-top-left animate-leaf-sway opacity-90" style={{ animationDelay: "1.5s" }}>
        <svg viewBox="0 0 100 100" className="w-full h-full transform scale-x-[-1] drop-shadow-lg">
          <path d="M100 0 Q 65 15, 45 45 Q 80 45, 100 0" fill="#2E5231" />
          <path d="M100 0 Q 75 35, 60 65 Q 88 55, 100 0" fill="#3B6B3E" />
          <path d="M100 0 Q 85 45, 75 75 Q 92 60, 100 0" fill="#4E8C52" />
          <path d="M100 0 Q 92 60, 85 90 Q 97 72, 100 0" fill="#8AC926" />
        </svg>
      </div>

      {/* Floating Butterflies */}
      <Butterfly className="top-24 left-[12%] animate-butterfly-1" color="#FF70A6" />
      <Butterfly className="top-44 right-[20%] animate-butterfly-2" color="#4EA8DE" delay="1s" />
      <Butterfly className="top-72 left-[38%] animate-butterfly-1" color="#FFD275" delay="2.5s" />

      {/* Main Interactive Navbar */}
      <nav className="relative z-40 max-w-7xl mx-auto px-6 pt-6 flex justify-between items-center select-none">
        
        {/* Simba Academy wood carved identity badge */}
        <div className="flex items-center gap-3 bg-[#FFFFFF] border-2 border-[#8AC926]/30 rounded-lg px-5 py-2.5 shadow-lg hover:scale-105 transition-transform cursor-pointer group">
          <div className="w-16 h-16 flex items-center justify-center group-hover:rotate-12 transition-transform duration-300">
            <img src="/Simba Logo 2025.pdf.png" alt="Simba Academy Logo" className="w-full h-full object-contain" />
          </div>
          <div className="text-left">
            <h1 className="font-sans font-bold text-lg leading-none tracking-wide text-[#3E2723]">
              Simba Academy
            </h1>
            <span className="text-[10px] font-bold text-[#4E8C52] tracking-widest uppercase mt-0.5 block">
              Sunny Preschool Savanna
            </span>
          </div>
        </div>

        {/* Action Linkings */}
        <div className="flex gap-4">
          <Link to="/login" className="hidden sm:inline-flex px-6 py-2.5 rounded-md border-2 border-[#8C6239]/40 text-[#5D4037] font-sans font-bold hover:bg-[#FFFFFF] transition-colors text-sm shadow-sm bg-white/50">
            Parent Login
          </Link>
          <Link to="/contact" className="px-6 py-2.5 rounded-md bg-[#FF9F1C] border-b-4 border-[#E07A00] text-white font-sans font-bold text-sm hover:translate-y-[-1px] active:translate-y-[1px] active:border-b-0 shadow-lg transition-all">
            Join Expedition
          </Link>
        </div>
      </nav>

      {/* Hero Section Container */}
      <header className="relative pt-20 pb-32 px-6 overflow-hidden select-none">
        
        {/* Content & Layout split: Left Title, Right Interactive Mascot */}
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-20">
          
          {/* Left Text details */}
          <div className="lg:col-span-7 flex flex-col items-center lg:items-start text-center lg:text-left">
            
            {/* Upper label banner */}
            <div className="inline-flex items-center gap-2.5 px-5 py-2 rounded-lg bg-white border border-[#8AC926]/30 shadow-sm mb-8 hover:scale-105 transition-transform duration-300">
              <Sparkles className="w-4 h-4 text-[#FF9F1C] animate-spin-slow" />
              <span className="font-sans font-bold text-xs uppercase tracking-widest text-[#4E8C52]">
                An Award-Winning Early Childhood Savanna
              </span>
              <Sparkles className="w-4 h-4 text-[#FF9F1C] animate-spin-slow" />
            </div>

            {/* Glowing Title */}
            <div className="relative mb-8 max-w-2xl">
              <h2 className="font-sans text-5.5xl sm:text-6.5xl text-[#3E2723] font-extrabold leading-[1.08] tracking-wide drop-shadow-[0_2px_4px_rgba(74,46,27,0.1)]">
                Where Little Cubs <br/>
                <span className="text-[#8AC926] relative inline-block">
                  Learn to Roar!
                  <svg className="absolute left-0 bottom-[-8px] w-full h-3 text-[#FF9F1C]" viewBox="0 0 100 10" preserveAspectRatio="none">
                    <path d="M0,5 Q50,10 100,5" stroke="currentColor" strokeWidth="4" fill="none" strokeLinecap="round" />
                  </svg>
                </span>
              </h2>
            </div>

            <p className="text-base sm:text-lg text-[#5D4037] max-w-xl font-semibold mb-12 leading-relaxed">
              Step into an immersive, premium, biology-rich learning ecosystem. We blend nature's untamed magic with certified cognitive preschool curriculums, raising kind, brilliant, and confident cubs.
            </p>

            {/* CTA action buttons */}
            <div className="flex flex-col sm:flex-row gap-5 w-full justify-center lg:justify-start">
              <Link to="/contact" className="px-8 py-4.5 rounded-md bg-[#FF9F1C] border-b-6 border-[#E07A00] font-sans font-extrabold text-lg text-white hover:bg-[#FFAE33] hover:translate-y-[-2px] active:translate-y-[2px] active:border-b-0 shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2.5 group">
                <Compass className="w-5.5 h-5.5 text-white group-hover:rotate-45 transition-transform" />
                Book Safari Tour
              </Link>
              <Link to="/register" className="px-8 py-4.5 rounded-md bg-[#8AC926] border-b-6 border-[#6FA31D] font-sans font-extrabold text-lg text-white hover:bg-[#9BE230] hover:translate-y-[-2px] active:translate-y-[2px] active:border-b-0 shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2.5 group">
                <GraduationCap className="w-5.5 h-5.5 text-white group-hover:scale-110 transition-transform" />
                Enroll Your Cub
              </Link>
            </div>

          </div>

          {/* Right Column: Simba Mascot Cub */}
          <div className="lg:col-span-5 flex flex-col items-center relative">
            
            {/* Interactive Speech bubble */}
            <div 
              className={`absolute top-[-40px] z-30 bg-[#FAF3E0] text-[#3E2723] border-3 border-[#8C6239] rounded-lg p-5 max-w-[280px] shadow-xl transition-all duration-300 ${isMascotHovered ? 'scale-100 opacity-100' : 'scale-90 opacity-0 pointer-events-none'}`}
              style={{ animation: isMascotHovered ? 'bubble-pop 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)' : 'none' }}
            >
              <div className="relative">
                <p className="text-xs font-extrabold leading-relaxed text-center">
                  "Roar! Welcome to the Savanna, little explorer! Hover or click the outposts on the map below to discover our adventure trails!"
                </p>
                {/* Speech bubble arrow point */}
                <div className="absolute bottom-[-28px] left-[50%] transform -translate-x-[50%] w-0 h-0 border-x-8 border-x-transparent border-t-12 border-t-[#8C6239]"></div>
              </div>
            </div>

            {/* Simba Mascot Illustration */}
            <div 
              className="w-72 h-72 md:w-80 md:h-80 cursor-pointer relative transition-transform duration-300 hover:scale-105"
              onMouseEnter={() => setIsMascotHovered(true)}
              onMouseLeave={() => setIsMascotHovered(false)}
            >
              <svg viewBox="0 0 120 120" fill="none" className="w-full h-full drop-shadow-xl">
                {/* Wiggling Tail */}
                <path d="M30 75 Q15 65 10 75 C6 83 22 88 32 82 Z" fill="#E07A00" className="tail-mascot" />
                <circle cx="10" cy="75" r="4.5" fill="#3E2723" />
                
                {/* Back Paws */}
                <ellipse cx="45" cy="85" rx="8" ry="5" fill="#FFAE33" />
                <ellipse cx="75" cy="85" rx="8" ry="5" fill="#FFAE33" />
                
                {/* Head Body Connection */}
                <rect x="42" y="55" width="36" height="35" rx="10" fill="#FFAE33" />
                <ellipse cx="60" cy="72" rx="12" ry="10" fill="#FAF3E0" />
                
                {/* Front Paws */}
                <circle cx="50" cy="85" r="6" fill="#FFD275" />
                <circle cx="70" cy="85" r="6" fill="#FFD275" />

                {/* Lion Mane */}
                <path d="M60 15 C85 15 95 32 95 52 C95 72 80 82 60 82 C40 82 25 72 25 52 C25 32 35 15 60 15 Z" fill="#C95A18" />
                <path d="M60 20 C80 20 88 34 88 50 C88 66 76 74 60 74 C44 74 32 66 32 50 C32 34 40 20 60 20 Z" fill="#E07A00" />
                
                {/* Face Mask */}
                <circle cx="60" cy="50" r="24" fill="#FFD275" />

                {/* Ears */}
                <circle cx="42" cy="32" r="10" fill="#E07A00" />
                <circle cx="42" cy="32" r="6" fill="#FAF3E0" />
                <circle cx="78" cy="32" r="10" fill="#E07A00" />
                <circle cx="78" cy="32" r="6" fill="#FAF3E0" />

                {/* Mascot Eyes */}
                {isMascotHovered ? (
                  <>
                    <path d="M72 45 Q76 48 80 45" stroke="#3E2723" strokeWidth="3" strokeLinecap="round" />
                    <circle cx="48" cy="45" r="5" fill="#3E2723" />
                    <circle cx="46.5" cy="43.5" r="1.8" fill="white" />
                  </>
                ) : (
                  <>
                    <circle cx="48" cy="45" r="5" fill="#3E2723" className="blink-mascot" />
                    <circle cx="46.5" cy="43.5" r="1.8" fill="white" className="blink-mascot" />
                    <circle cx="72" cy="45" r="5" fill="#3E2723" className="blink-mascot" />
                    <circle cx="70.5" cy="43.5" r="1.8" fill="white" className="blink-mascot" />
                  </>
                )}

                {/* Cute nose & cheeks */}
                <ellipse cx="56" cy="52" rx="4.5" ry="3.5" fill="#FAF3E0" />
                <ellipse cx="64" cy="52" rx="4.5" ry="3.5" fill="#FAF3E0" />
                <path d="M57 49 L63 49 L60 52 Z" fill="#3E2723" />
                <path d="M55 54 Q60 58 65 54" stroke="#3E2723" strokeWidth="2" strokeLinecap="round" fill="none" />

                {/* Leaf crown */}
                <path d="M48 24 Q60 16 72 24" stroke="#8AC926" strokeWidth="3" strokeLinecap="round" fill="none" />
                <circle cx="50" cy="21" r="2.5" fill="#8AC926" />
                <circle cx="70" cy="21" r="2.5" fill="#8AC926" />
                <circle cx="60" cy="18" r="3" fill="#8AC926" />
              </svg>
            </div>
            
            <span className="text-[11px] font-sans font-bold text-[#4E8C52] tracking-widest mt-2 uppercase">
              Meet Ranger Simba
            </span>
          </div>

        </div>

      </header>

      {/* Illustrated Savanna grounds map */}
      <section className="py-20 px-6 bg-[#EBF5EE] border-t border-b border-[#8AC926]/15 relative z-20">
        
        <Butterfly className="top-12 right-[8%] animate-butterfly-1" color="#8AC926" />

        <div className="max-w-7xl mx-auto">
          
          <div className="text-center max-w-3xl mx-auto mb-16 select-none">
            <h3 className="font-sans text-4xl sm:text-5xl font-extrabold text-[#3E2723] mb-5 tracking-wide">
              Savanna Expedition Map
            </h3>
            <p className="text-[#5D4037] font-semibold text-base sm:text-lg">
              Welcome to the Simba Academy Grounds! Click the blinking outposts on the map trail to inspect our classes, age criteria, and curriculum highlights.
            </p>
          </div>

          {/* Interactive Map Visual Board */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
            
            {/* Left 8 Columns: Illustrated Winding SVG Safari Map */}
            <div className="lg:col-span-8 bg-[#FAF6EE] border-3 border-[#8C6239]/40 rounded-lg p-6 shadow-xl relative select-none overflow-hidden h-[420px] md:h-[480px]">
              
              <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#8C6239 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
              
              <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
                
                {/* Winding Blue River */}
                <path d="M 0,200 Q 200,100 450,220 T 900,150" fill="none" stroke="#B2EBF2" strokeWidth="24" strokeLinecap="round" opacity="0.6" />
                <path d="M 0,200 Q 200,100 450,220 T 900,150" fill="none" stroke="#4EA8DE" strokeWidth="8" strokeLinecap="round" opacity="0.4" />
                
                {/* Mountain Ridge line (Lion Peak) */}
                <path d="M 650,120 L 780,30 L 910,120 Z" fill="#D7CCC8" opacity="0.5" />
                <path d="M 680,120 L 780,50 L 880,120 Z" fill="#D7CCC8" opacity="0.7" />
                <path d="M 755,50 L 780,30 L 805,50 Z" fill="#FFFFFF" opacity="0.9" /> {/* Snowcap */}

                {/* Trees outlines */}
                <circle cx="80" cy="280" r="40" fill="#C8E6C9" opacity="0.6" />
                <circle cx="120" cy="300" r="30" fill="#C8E6C9" opacity="0.6" />
                
                {/* Safari Dashed Map Trail */}
                <path 
                  d="M 180,335 C 240,280 340,300 460,230 C 560,180 660,210 780,120" 
                  fill="none" 
                  stroke="#FF9F1C" 
                  strokeWidth="5" 
                  strokeDasharray="10,10" 
                  strokeLinecap="round"
                  opacity="0.8"
                />
              </svg>

              {/* Map Outposts placement */}
              {outposts.map((outpost) => {
                const isActive = activeOutpost === outpost.id;
                return (
                  <button
                    key={outpost.id}
                    onClick={() => setActiveOutpost(outpost.id)}
                    className="absolute group focus:outline-none transition-all duration-300"
                    style={{ left: outpost.mapX, top: outpost.mapY, transform: 'translate(-50%, -50%)' }}
                  >
                    {/* Ring pulsing animation */}
                    <div className={`absolute -inset-4 rounded-lg transition-all ${isActive ? 'map-pulse-ring scale-110' : 'bg-[#FF9F1C]/25 animate-ping'}`} />
                    
                    {/* Outpost button badge */}
                    <div 
                      className={`w-14 h-14 rounded-full flex items-center justify-center relative z-10 border-3 shadow-lg transition-all ${isActive ? 'scale-110' : 'scale-100 group-hover:scale-105'}`}
                      style={{ 
                        backgroundColor: outpost.color, 
                        borderColor: isActive ? '#FFFFFF' : outpost.textColor,
                        color: outpost.textColor 
                      }}
                    >
                      {outpost.icon}
                    </div>

                    <span 
                      className={`absolute bottom-[-28px] left-[50%] transform -translate-x-[50%] whitespace-nowrap text-2xs font-extrabold px-2.5 py-1 rounded-lg shadow-sm transition-all ${isActive ? 'bg-[#FF9F1C] text-white border-2 border-white' : 'bg-[#FFFFFF] text-[#5D4037] border border-[#8AC926]/30 group-hover:bg-[#FFF8E1]'}`}
                    >
                      {outpost.name.split(" ")[0]} outpost
                    </span>
                  </button>
                );
              })}

              <div className="absolute bottom-[28%] left-[25%] text-4xs font-bold text-[#2B86C5]/50 uppercase tracking-widest pointer-events-none select-none transform -rotate-12">
                Simba River Savanna
              </div>
              <div className="absolute top-[8%] right-[10%] text-4xs font-bold text-[#8C6239]/50 uppercase tracking-widest pointer-events-none select-none">
                Lion Ridge Summit
              </div>

            </div>

            {/* Right 4 Columns: Frosted Glassmorphic Outpost Details Panel */}
            <div className="lg:col-span-4 h-full">
              
              <div 
                className="glass-panel rounded-lg p-8 text-left shadow-xl relative overflow-hidden h-full flex flex-col justify-between"
                style={{ animation: 'bubble-pop 0.5s ease-out' }}
              >
                <div className="absolute top-0 right-0 w-28 h-28 text-[#8AC926]/5 pointer-events-none">
                  <Leaf className="w-full h-full rotate-95" />
                </div>

                <div>
                  
                  {/* Category badging */}
                  <div 
                    className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg font-sans font-extrabold text-xs mb-6"
                    style={{ backgroundColor: currentOutpost.badgeBg, color: currentOutpost.textColor }}
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>{currentOutpost.age} Class</span>
                  </div>

                  <h4 className="font-sans text-3xl font-extrabold text-[#3E2723] mb-4 leading-tight">
                    {currentOutpost.name}
                  </h4>
                  
                  <p className="text-sm text-[#5D4037] font-semibold leading-relaxed mb-6">
                    {currentOutpost.desc}
                  </p>

                  {/* Core curriculum checklist */}
                  <div className="mb-6">
                    <h5 className="text-xs font-bold text-[#4E8C52] uppercase tracking-wider mb-3">Focus Areas</h5>
                    <div className="flex flex-wrap gap-2">
                      {currentOutpost.focus.map((f, idx) => (
                        <span key={idx} className="bg-white border border-[#8AC926]/20 rounded-lg px-2.5 py-1 text-2xs font-extrabold text-[#5D4037] shadow-2xs">
                          {f}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Key daily highlights */}
                  <div className="border-t border-[#8AC926]/10 pt-5 mb-8">
                    <h5 className="text-xs font-bold text-[#3E2723] uppercase tracking-wider mb-3 flex items-center gap-1">
                      <Footprints className="w-3.5 h-3.5" strokeWidth="2.5" /> Savanna Highlights
                    </h5>
                    <ul className="space-y-2.5 text-xs font-semibold text-[#5D4037]">
                      {currentOutpost.highlights.map((h, idx) => (
                        <li key={idx} className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-lg" style={{ backgroundColor: currentOutpost.color }}></span>
                          {h}
                        </li>
                      ))}
                    </ul>
                  </div>

                </div>

                <div className="flex gap-3">
                  <button className="w-full py-4 rounded-md bg-white hover:bg-[#FAF8F5] text-[#3E2723] font-sans font-extrabold text-sm border-2 border-[#8AC926]/20 shadow-md transition-all flex items-center justify-center gap-2">
                    <span>Expedition Curriculum</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>

              </div>

            </div>

          </div>

        </div>
      </section>

      {/* Feature Section */}
      <section className="py-24 px-6 relative z-20 overflow-hidden">
        
        <div className="absolute inset-0 pointer-events-none select-none z-0 opacity-10">
          <div className="absolute top-[10%] left-[5%] w-12 h-12 text-[#8AC926]"><Leaf className="w-full h-full rotate-45" /></div>
          <div className="absolute top-[40%] right-[8%] w-16 h-16 text-[#FF9F1C]"><Leaf className="w-full h-full rotate-90" /></div>
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          
          {/* Wooden signage title */}
          <div className="flex flex-col items-center mb-16 text-center select-none">
            <div className="flex gap-20 justify-center -mb-1">
              <div className="w-1.5 h-8 bg-[#8C6239] rounded-lg"></div>
              <div className="w-1.5 h-8 bg-[#8C6239] rounded-lg"></div>
            </div>
            <div className="bg-[#A8763E] border-4 border-[#5E3A21] rounded-lg px-12 py-4.5 shadow-xl max-w-lg transform -rotate-1 relative overflow-hidden">
              <div className="absolute inset-0 opacity-15 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-amber-900 via-amber-950 to-stone-950"></div>
              <h3 className="font-sans text-2xl sm:text-3xl text-[#FAF3E0] font-extrabold uppercase tracking-widest drop-shadow-[0_2px_2px_rgba(0,0,0,0.5)]">
                Our Savanna Paths
              </h3>
            </div>
          </div>

          {/* Three Elite Glassmorphic features cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* Card 1: Creative Crafts */}
            <div className="group glass-panel glass-panel-hover rounded-lg p-8 shadow-xl flex flex-col items-center text-center relative overflow-hidden select-none">
              <div className="absolute top-0 right-0 w-24 h-24 bg-[#FFD275]/10 rounded-lg pointer-events-none"></div>
              <div className="w-20 h-20 bg-[#FFF8E1] border-2 border-[#FFD275] rounded-lg flex items-center justify-center mb-8 group-hover:scale-110 group-hover:rotate-12 transition-transform duration-300 shadow-sm">
                <Palette className="w-10 h-10 text-[#FF9F1C]" />
              </div>
              <h4 className="font-sans text-2xl font-extrabold text-[#3E2723] mb-4">Creative Crafts</h4>
              <p className="text-sm text-[#5D4037] font-semibold leading-relaxed">
                Finger dexterity is our launchpad! Cubs build tropical clay trees, mold plaster paw prints, and paint beautiful sunrise canvases using natural organic dyes.
              </p>
              <div className="mt-8 flex items-center gap-2 text-xs font-bold text-[#FF9F1C] hover:text-[#E07A00] transition-colors cursor-pointer">
                <span>View Craft Safari</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>

            {/* Card 2: Nature Safaris */}
            <div className="group glass-panel glass-panel-hover rounded-lg p-8 shadow-xl flex flex-col items-center text-center relative overflow-hidden select-none">
              <div className="absolute top-0 right-0 w-24 h-24 bg-[#8AC926]/10 rounded-lg pointer-events-none"></div>
              <div className="w-20 h-20 bg-[#E8F5E9] border-2 border-[#8AC926] rounded-lg flex items-center justify-center mb-8 group-hover:scale-110 group-hover:-rotate-12 transition-transform duration-300 shadow-sm">
                <Leaf className="w-10 h-10 text-[#4CAF50]" />
              </div>
              <h4 className="font-sans text-2xl font-extrabold text-[#3E2723] mb-4">Nature Safaris</h4>
              <p className="text-sm text-[#5D4037] font-semibold leading-relaxed">
                Nature is our live amphitheater. Toddlers trace evolutionary insect timelines, plant climbing sunflowers, and analyze garden soil in our open-air save savanna.
              </p>
              <div className="mt-8 flex items-center gap-2 text-xs font-bold text-[#4CAF50] hover:text-[#2E7D32] transition-colors cursor-pointer">
                <span>Inspect Savannah</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>

            {/* Card 3: Cub Collaboration */}
            <div className="group glass-panel glass-panel-hover rounded-lg p-8 shadow-xl flex flex-col items-center text-center relative overflow-hidden select-none">
              <div className="absolute top-0 right-0 w-24 h-24 bg-[#4EA8DE]/10 rounded-lg pointer-events-none"></div>
              <div className="w-20 h-20 bg-[#E0F7FA] border-2 border-[#4EA8DE] rounded-lg flex items-center justify-center mb-8 group-hover:scale-110 group-hover:rotate-12 transition-transform duration-300 shadow-sm">
                <Users className="w-10 h-10 text-[#00BCD4]" />
              </div>
              <h4 className="font-sans text-2xl font-extrabold text-[#3E2723] mb-4">Cub Collaboration</h4>
              <p className="text-sm text-[#5D4037] font-semibold leading-relaxed">
                Team building begins at the campfire. Children collaborate in groups, coordinate puppet acts, and learn core emotional compassion inside kind group play circles.
              </p>
              <div className="mt-8 flex items-center gap-2 text-xs font-bold text-[#00BCD4] hover:text-[#00838F] transition-colors cursor-pointer">
                <span>Meet Cub Campers</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* Campfire testimonials section */}
      <section className="max-w-6xl mx-auto px-6 py-20 text-center relative z-20 select-none">
        
        <div className="flex flex-col items-center mb-10 animate-float-gentle">
          <div className="relative w-28 h-28">
            <div className="absolute bottom-2 left-2 w-24 h-5 bg-[#5D4037] rounded-lg transform rotate-12 border-2 border-[#3E2723] z-10 shadow-md"></div>
            <div className="absolute bottom-2 left-2 w-24 h-5 bg-[#5D4037] rounded-lg transform -rotate-12 border-2 border-[#3E2723] z-10 shadow-md"></div>
            <div className="absolute bottom-6 left-6 w-16 h-20 bg-gradient-to-t from-[#FF3D00] via-[#FF9100] to-[#FFEA00] rounded-lg rounded-lg transform rotate-45 animate-fire-glow opacity-95"></div>
            <div className="absolute bottom-6 left-8 w-12 h-16 bg-gradient-to-t from-[#FF3D00] via-[#FFD600] to-yellow-200 rounded-lg rounded-lg transform rotate-45 animate-fire-glow opacity-90" style={{ animationDelay: "0.4s" }}></div>
          </div>
          <span className="text-xs uppercase font-sans font-extrabold text-[#FF9F1C] tracking-widest mt-4">Campfire stories</span>
        </div>

        {googleMeta.configured && googleMeta.rating != null && (
          <p className="text-sm font-bold text-[#5D4037] mb-6">
            {googleMeta.placeName && <span>{googleMeta.placeName} · </span>}
            <span className="text-[#FF9F1C]">★ {googleMeta.rating.toFixed(1)}</span>
            {googleMeta.totalRatings != null && (
              <span> ({googleMeta.totalRatings} Google reviews)</span>
            )}
          </p>
        )}

        {/* Testimonial glass placard */}
        <div className="glass-panel rounded-lg p-10 md:p-14 shadow-2xl max-w-4xl mx-auto relative overflow-hidden">
          <div className="absolute top-0 left-0 w-24 h-24 bg-[#FF9F1C]/5 rounded-lg pointer-events-none"></div>
          
          <div className="absolute top-6 left-6 text-[#FF9F1C]/30">
            <Quote className="w-12 h-12 fill-current rotate-180" />
          </div>
          <div className="absolute bottom-6 right-6 text-[#FF9F1C]/30">
            <Quote className="w-12 h-12 fill-current" />
          </div>

          <StarRating rating={activeReview.rating} />

          <p className="text-lg sm:text-xl italic text-[#3E2723] font-semibold leading-relaxed mb-8 relative z-10">
            &ldquo;{activeReview.content}&rdquo;
          </p>
          
          <div className="flex items-center justify-center gap-4 relative z-10">
            {activeReview.profilePhotoUrl ? (
              <img
                src={activeReview.profilePhotoUrl}
                alt=""
                className="w-14 h-14 rounded-full border-2 border-[#8AC926] object-cover shadow-md"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-14 h-14 rounded-full bg-[#8AC926]/20 border-2 border-[#8AC926] flex items-center justify-center shadow-md">
                <Heart className="w-6 h-6 text-[#8AC926] fill-[#8AC926]" />
              </div>
            )}
            <div className="text-left">
              <h5 className="font-sans text-base font-extrabold text-[#3E2723]">{activeReview.name}</h5>
              <p className="text-xs text-[#5D4037] font-extrabold tracking-wide">
                {activeReview.source === "google"
                  ? [
                      activeReview.placeName,
                      activeReview.relativeTime,
                    ]
                      .filter(Boolean)
                      .join(" · ") || "Google Review"
                  : "Simba Academy Parent"}
              </p>
            </div>
          </div>

          {displayReviews.length > 1 && (
            <div className="flex justify-center gap-2 mt-8 relative z-10">
              {displayReviews.map((r, idx) => (
                <button
                  key={r.id}
                  type="button"
                  aria-label={`Show review ${idx + 1}`}
                  onClick={() => setActiveReviewIndex(idx)}
                  className={`w-2.5 h-2.5 rounded-full transition ${
                    idx === activeReviewIndex ? "bg-[#FF9F1C] scale-110" : "bg-[#8AC926]/40"
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Premium Trust Accreditations */}
      <section className="bg-[#EBF5EE] py-16 border-t border-b border-[#8AC926]/15 relative z-20 select-none text-center">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="flex flex-col items-center">
            <ShieldCheck className="w-10 h-10 text-[#4CAF50] mb-3" />
            <h5 className="font-sans font-extrabold text-sm text-[#3E2723]">100% Safe Savanna</h5>
            <p className="text-xs text-[#5D4037] mt-1 font-semibold">Gated perimeter & guard patrols</p>
          </div>
          <div className="flex flex-col items-center">
            <GraduationCap className="w-10 h-10 text-[#FF9F1C] mb-3" />
            <h5 className="font-sans font-extrabold text-sm text-[#3E2723]">Licensed Guides</h5>
            <p className="text-xs text-[#5D4037] mt-1 font-semibold">Degrees in early-ed & bio labs</p>
          </div>
          <div className="flex flex-col items-center">
            <Leaf className="w-10 h-10 text-[#00BCD4] mb-3" />
            <h5 className="font-sans font-extrabold text-sm text-[#3E2723]">Savanna Nutrition</h5>
            <p className="text-xs text-[#5D4037] mt-1 font-semibold">Jungle-fresh healthy meals</p>
          </div>
          <div className="flex flex-col items-center">
            <Calendar className="w-10 h-10 text-[#FF70A6] mb-3" />
            <h5 className="font-sans font-extrabold text-sm text-[#3E2723]">Flexible Expeditions</h5>
            <p className="text-xs text-[#5D4037] mt-1 font-semibold">Full, half-day, & nursery camps</p>
          </div>
        </div>
      </section>

      {/* JungleFooter is embedded beautifully at the bottom */}
      <JungleFooter />
      <FloatingWhatsApp />
    </div>
  );
}
