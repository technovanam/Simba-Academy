import { Link } from "react-router";
import { useState } from "react";
import { 
  MapPin, 
  Phone, 
  Mail, 
  Clock,
  Compass,
  GraduationCap,
  ArrowUp,
  Heart,
  Sparkles,
  ChevronRight,
  PawPrint
} from "lucide-react";
import { FOOTER_QUICK_LINKS, SOCIAL_LINKS, COURSE_LEVELS, BRANCHES } from "../lib/constants";

export function JungleFooter() {
  const [isLionHovered, setIsLionHovered] = useState(false);
  const [isGiraffeHovered, setIsGiraffeHovered] = useState(false);
  const [isElephantHovered, setIsElephantHovered] = useState(false);
  const [isToucanHovered, setIsToucanHovered] = useState(false);
  const [isLanternHovered, setIsLanternHovered] = useState(false);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Twilight Footer Fireflies Coordinates (Restyled to Sunbeam particles)
  const footerFireflies = [
    { left: "10%", bottom: "8%", delay: "0s", duration: "10s" },
    { left: "28%", bottom: "22%", delay: "3s", duration: "9s" },
    { left: "54%", bottom: "12%", delay: "1.5s", duration: "11s" },
    { left: "76%", bottom: "32%", delay: "4s", duration: "10s" },
    { left: "90%", bottom: "18%", delay: "2.5s", duration: "8s" },
    { left: "18%", bottom: "38%", delay: "5s", duration: "11s" },
    { left: "46%", bottom: "28%", delay: "0.5s", duration: "9s" },
    { left: "84%", bottom: "8%", delay: "2s", duration: "10s" }
  ];

  return (
    <footer className="relative w-full overflow-hidden font-sans bg-gradient-to-b from-[#FAF8F5] via-[#EAEFEA] to-[#DCE3DC] mt-32 text-[#3E2723] border-t border-[#8AC926]/20">
      <style>{`
        @keyframes jungle-swing {
          0%, 100% { transform: rotate(-8deg); }
          50% { transform: rotate(8deg); }
        }
        @keyframes balloon-float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-12px); }
        }
        @keyframes toucan-tail {
          0%, 100% { transform: rotate(-5deg); }
          50% { transform: rotate(5deg); }
        }
        @keyframes eye-blink {
          0%, 95%, 100% { transform: scaleY(1); }
          97.5% { transform: scaleY(0.1); }
        }
        @keyframes water-spray-1 {
          0% { transform: translate(0, 0) scale(0.3); opacity: 0; }
          40% { transform: translate(-30px, -45px) scale(1); opacity: 0.9; }
          100% { transform: translate(-60px, -20px) scale(0.4); opacity: 0; }
        }
        @keyframes water-spray-2 {
          0% { transform: translate(0, 0) scale(0.3); opacity: 0; }
          40% { transform: translate(-10px, -60px) scale(1.1); opacity: 0.9; }
          100% { transform: translate(-20px, -30px) scale(0.4); opacity: 0; }
        }
        @keyframes water-spray-3 {
          0% { transform: translate(0, 0) scale(0.3); opacity: 0; }
          40% { transform: translate(15px, -50px) scale(1); opacity: 0.9; }
          100% { transform: translate(30px, -15px) scale(0.4); opacity: 0; }
        }
        @keyframes elephant-ear-left {
          0%, 100% { transform: rotate(0deg); }
          50% { transform: rotate(-10deg); }
        }
        @keyframes elephant-ear-right {
          0%, 100% { transform: rotate(0deg); }
          50% { transform: rotate(10deg); }
        }
        @keyframes firefly-drift-footer {
          0% { transform: translateY(50px) translateX(0); opacity: 0; }
          50% { opacity: 0.6; }
          100% { transform: translateY(-250px) translateX(25px); opacity: 0; }
        }
        @keyframes lantern-swing {
          0%, 100% { transform: rotate(-5deg); }
          50% { transform: rotate(5deg); }
        }
        @keyframes note-float {
          0% { transform: translate(0, 0) scale(0.5); opacity: 0; }
          40% { opacity: 0.9; }
          100% { transform: translate(25px, -45px) scale(1); opacity: 0; }
        }
        .animate-jungle-swing {
          animation: jungle-swing 6s ease-in-out infinite;
          transform-origin: top center;
        }
        .animate-balloon-float {
          animation: balloon-float 4.5s ease-in-out infinite;
        }
        .wood-token {
          transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          transform-origin: center;
        }
        .wood-token:hover {
          transform: scale(1.15) rotate(8deg);
          box-shadow: 0 10px 20px rgba(74, 46, 27, 0.15);
        }
        .toucan-tail-move {
          animation: toucan-tail 3s ease-in-out infinite;
          transform-origin: top left;
        }
        .blink-eye {
          animation: eye-blink 5s ease-in-out infinite;
          transform-origin: center;
        }
        .animate-spray-1 {
          animation: water-spray-1 0.8s infinite linear;
        }
        .animate-spray-2 {
          animation: water-spray-2 0.8s infinite linear;
          animation-delay: 0.15s;
        }
        .animate-spray-3 {
          animation: water-spray-3 0.8s infinite linear;
          animation-delay: 0.3s;
        }
        .elephant-ear-l {
          transform-origin: 30px 45px;
        }
        .elephant-ear-r {
          transform-origin: 70px 45px;
        }
        .hover-elephant:hover .elephant-ear-l {
          animation: elephant-ear-left 0.8s ease-in-out infinite;
        }
        .hover-elephant:hover .elephant-ear-r {
          animation: elephant-ear-right 0.8s ease-in-out infinite;
        }
        .animate-firefly-footer {
          animation: firefly-drift-footer 8s ease-in-out infinite;
        }
        .animate-lantern-swing {
          animation: lantern-swing 3s ease-in-out infinite;
          transform-origin: top center;
        }
        .animate-note-float {
          animation: note-float 1.2s ease-out infinite;
        }
        .safari-link {
          position: relative;
        }
        .safari-link::after {
          content: '';
          position: absolute;
          width: 0;
          height: 2px;
          bottom: -4px;
          left: 0;
          border-bottom: 2px dashed #8AC926;
          transition: width 0.3s ease;
        }
        .safari-link:hover::after {
          width: 100%;
        }
        .glass-panel-footer {
          background: rgba(255, 255, 255, 0.85);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          border: 2px solid rgba(138, 201, 38, 0.25);
          box-shadow: 0 10px 30px -5px rgba(74, 46, 27, 0.08), inset 0 0 15px rgba(255, 255, 255, 0.5);
        }
      `}</style>

      {/* Floating Sunbeam Particles inside Footer */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden select-none z-0">
        {footerFireflies.map((f, i) => (
          <div 
            key={i}
            className="absolute w-1.5 h-1.5 bg-[#FFD54F] rounded-lg animate-firefly-footer firefly-glow"
            style={{ 
              left: f.left, 
              bottom: f.bottom, 
              animationDelay: f.delay, 
              animationDuration: f.duration 
            }}
          />
        ))}
      </div>

      {/* Layer 0: Sky background transition matching homepage cream */}
      <div className="absolute top-0 left-0 w-full h-40 bg-gradient-to-b from-[#FAF8F5] to-transparent pointer-events-none z-0 border-none"></div>

      {/* Left Hanging Vine with Swinging Gymnastic Monkey */}
      <div className="absolute top-0 left-[8%] md:left-[15%] z-30 animate-jungle-swing pointer-events-none">
        <svg width="40" height="150" viewBox="0 0 40 150" fill="none">
          <path d="M20,0 Q10,50 25,100 T15,150" stroke="#3b6b3e" strokeWidth="4" fill="none" strokeLinecap="round"/>
          <path d="M20,20 Q10,30 25,35" stroke="#4e8c52" strokeWidth="6" strokeLinecap="round"/>
          <path d="M25,80 Q35,90 20,95" stroke="#4e8c52" strokeWidth="6" strokeLinecap="round"/>
        </svg>
        <div className="absolute bottom-[-30px] left-[-20px] w-20 h-20 pointer-events-auto cursor-pointer transition-transform duration-700 hover:rotate-[360deg] hover:scale-115">
          <svg viewBox="0 0 100 100" fill="none">
            <circle cx="50" cy="50" r="30" fill="#8c5a3c"/>
            <circle cx="35" cy="55" r="15" fill="#d4a373"/>
            <circle cx="65" cy="55" r="15" fill="#d4a373"/>
            <circle cx="50" cy="68" r="16" fill="#d4a373"/>
            <circle cx="42" cy="45" r="4.5" fill="#3b2818" className="blink-eye"/>
            <circle cx="58" cy="45" r="4.5" fill="#3b2818" className="blink-eye"/>
            <path d="M45,58 Q50,62 55,58" stroke="#3b2818" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
          </svg>
        </div>
      </div>

      {/* Right Hanging Vine with Swinging Chirping Toucan */}
      <div className="absolute top-0 right-[8%] md:right-[15%] z-30 animate-jungle-swing pointer-events-none" style={{ animationDelay: "1.5s" }}>
        <svg width="40" height="150" viewBox="0 0 40 150" fill="none">
          <path d="M20,0 Q30,50 15,100 T25,150" stroke="#3b6b3e" strokeWidth="4" fill="none" strokeLinecap="round"/>
          <path d="M15,40 Q25,50 10,55" stroke="#4e8c52" strokeWidth="6" strokeLinecap="round"/>
          <path d="M22,95 Q12,105 27,110" stroke="#4e8c52" strokeWidth="6" strokeLinecap="round"/>
        </svg>
        <div 
          className="absolute bottom-[-35px] left-[-25px] w-22 h-22 pointer-events-auto cursor-pointer transition-transform duration-300 hover:scale-115 relative"
          onMouseEnter={() => setIsToucanHovered(true)}
          onMouseLeave={() => setIsToucanHovered(false)}
        >
          {/* Animated floating musical chirps on hover */}
          {isToucanHovered && (
            <div className="absolute top-[-10px] right-[10px] w-5 h-5 pointer-events-none animate-note-float">
              <svg viewBox="0 0 24 24" fill="currentColor" className="text-[#FF70A6] w-full h-full">
                <path d="M9 18V5l12-2v13M9 15c0-1.66-1.34-3-3-3s-3 1.34-3 3 1.34 3 3 3 3-1.34 3-3zm12-2c0-1.66-1.34-3-3-3s-3 1.34-3 3 1.34 3 3 3 3-1.34 3-3z"/>
              </svg>
            </div>
          )}

          <svg viewBox="0 0 100 100" fill="none">
            <path d="M35 65 L25 80 L35 80 Z" fill="#FF70A6" className="toucan-tail-move" />
            <circle cx="50" cy="50" r="22" fill="#1b3820" />
            <path d="M50 28 C62 28 72 38 72 50 C72 54 62 68 50 68 Z" fill="#F4F1E1" />
            <circle cx="55" cy="40" r="3.5" fill="#3D5A80" />
            <circle cx="55" cy="40" r="1.5" fill="#FAF3E0" />
            <path 
              d="M52 35 C52 35 75 22 88 35 C92 39 88 52 70 52 Z" 
              fill="#FF9F1C" 
              className="transition-transform duration-300 origin-[52px_43px]"
              style={{ transform: isToucanHovered ? 'rotate(-10deg)' : 'rotate(0deg)' }}
            />
            <path d="M78 31 C83 34 88 35 88 35 C88 35 83 45 74 46 Z" fill="#E07A00" />
            <circle cx="45" cy="72" r="3" fill="#D68C45" />
            <circle cx="55" cy="72" r="3" fill="#D68C45" />
          </svg>
        </div>
      </div>

      {/* Parallax Canopy Transition */}
      <div className="relative w-full h-32 md:h-48 z-10 select-none">
        <svg viewBox="0 0 1440 200" className="absolute bottom-0 w-full h-full" preserveAspectRatio="none">
          <path d="M0,80 Q150,0 300,80 T600,60 T900,90 T1200,40 T1440,80 L1440,200 L0,200 Z" fill="#EAEFEA" opacity="0.6"/>
          <path d="M0,120 Q200,40 400,100 T800,80 T1100,120 T1440,100 L1440,200 L0,200 Z" fill="#DCE3DC" opacity="0.8"/>
          <path d="M0,150 Q100,90 250,140 T550,110 T850,150 T1250,120 T1440,140 L1440,200 L0,200 Z" fill="#DCE3DC"/>
        </svg>

        {/* Interactive Peeping Lion */}
        <div 
          className={`absolute bottom-[-10px] left-[45%] md:left-[50%] w-24 h-24 transition-transform duration-500 z-0 cursor-pointer ${isLionHovered ? 'translate-y-[-45px]' : 'translate-y-[10px]'}`}
          onMouseEnter={() => setIsLionHovered(true)}
          onMouseLeave={() => setIsLionHovered(false)}
        >
          <svg viewBox="0 0 100 100" fill="none">
            <path d="M50 10 Q80 10 90 40 Q100 70 50 90 Q0 70 10 40 Q20 10 50 10Z" fill="#d68c45"/>
            <circle cx="50" cy="50" r="30" fill="#f4d06f"/>
            {isLionHovered ? (
              <>
                <path d="M58 45 Q62 48 66 45" stroke="#3b2818" strokeWidth="3" fill="none" strokeLinecap="round"/>
                <circle cx="38" cy="45" r="4.5" fill="#3b2818"/>
              </>
            ) : (
              <>
                <circle cx="38" cy="45" r="4.5" fill="#3b2818" className="blink-eye"/>
                <circle cx="62" cy="45" r="4.5" fill="#3b2818" className="blink-eye"/>
              </>
            )}
            <path d="M45 55 L55 55 L50 62 Z" fill="#3b2818"/>
            <path d="M40 65 Q50 73 60 65" stroke="#3b2818" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
            {isLionHovered && <path d="M47 68 Q50 77 53 68 Z" fill="#e07a5f"/>}
          </svg>
        </div>

        {/* Interactive Peeping Giraffe */}
        <div 
          className={`absolute bottom-[-15px] left-[3%] md:left-[22%] w-32 h-40 transition-all duration-500 z-0 cursor-pointer ${isGiraffeHovered ? 'rotate-[3deg] translate-y-[-25px]' : 'rotate-[-3deg] translate-y-[20px]'}`}
          onMouseEnter={() => setIsGiraffeHovered(true)}
          onMouseLeave={() => setIsGiraffeHovered(false)}
        >
          <svg viewBox="0 0 100 150" fill="none">
            <rect x="35" y="60" width="30" height="90" rx="10" fill="#f4d06f"/>
            <circle cx="45" cy="82" r="5" fill="#d68c45"/>
            <circle cx="56" cy="105" r="7" fill="#d68c45"/>
            <circle cx="43" cy="132" r="6" fill="#d68c45"/>
            <g style={{ transform: isGiraffeHovered ? 'translateY(-2px)' : 'none', transition: 'transform 0.3s' }}>
              <path d="M15 35 Q10 20 25 32 Z" fill="#d68c45" />
              <path d="M85 35 Q90 20 75 32 Z" fill="#d68c45" />
              <path d="M20 40 Q50 20 80 40 L70 70 Q50 80 30 70 Z" fill="#f4d06f"/>
              <rect x="36" y="10" width="5" height="22" rx="2" fill="#d68c45"/>
              <circle cx="38.5" cy="10" r="5" fill="#3b2818"/>
              <rect x="59" y="10" width="5" height="22" rx="2" fill="#d68c45"/>
              <circle cx="61.5" cy="10" r="5" fill="#3b2818"/>
              <circle cx="40" cy="45" r="3.5" fill="#3b2818" className="blink-eye"/>
              <circle cx="60" cy="45" r="3.5" fill="#3b2818" className="blink-eye"/>
              {isGiraffeHovered ? (
                <path d="M42 58 Q50 66 58 58" stroke="#3b2818" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
              ) : (
                <path d="M45 58 Q50 61 55 58" stroke="#3b2818" strokeWidth="2" strokeLinecap="round" fill="none"/>
              )}
            </g>
          </svg>
        </div>

        {/* Interactive Peeping Baby Elephant */}
        <div 
          className={`absolute bottom-[-20px] left-[74%] md:left-[78%] w-32 h-36 transition-all duration-500 z-0 cursor-pointer hover-elephant ${isElephantHovered ? 'translate-y-[-25px]' : 'translate-y-[15px]'}`}
          onMouseEnter={() => setIsElephantHovered(true)}
          onMouseLeave={() => setIsElephantHovered(false)}
        >
          {isElephantHovered && (
            <div className="absolute top-[-30px] left-[20px] w-20 h-20 pointer-events-none">
              <div className="absolute top-[35px] left-[35px] w-2.5 h-2.5 bg-[#B3E5FC] rounded-lg animate-spray-1 shadow-xs"></div>
              <div className="absolute top-[35px] left-[35px] w-3 h-3 bg-[#81D4FA] rounded-lg animate-spray-2 shadow-xs"></div>
              <div className="absolute top-[35px] left-[35px] w-2 h-2 bg-[#B3E5FC] rounded-lg animate-spray-3 shadow-xs"></div>
            </div>
          )}
          <svg viewBox="0 0 100 100" fill="none">
            <path d="M35 25 C10 25 15 65 35 55 Z" fill="#90A4AE" className="elephant-ear-l" />
            <path d="M65 25 C90 25 85 65 65 55 Z" fill="#90A4AE" className="elephant-ear-r" />
            <circle cx="50" cy="45" r="20" fill="#B0BEC5" />
            <circle cx="43" cy="40" r="3" fill="#37474F" className="blink-eye" />
            <circle cx="57" cy="40" r="3" fill="#37474F" className="blink-eye" />
            <circle cx="37" cy="48" r="3.5" fill="#FF8A80" opacity="0.6" />
            <circle cx="63" cy="48" r="3.5" fill="#FF8A80" opacity="0.6" />
            <path 
              d="M50 53 C50 53 42 68 45 74 C47 78 55 76 52 70 C50 66 52 58 52 53 Z" 
              fill="#90A4AE"
              className="transition-transform duration-300 origin-[50px_53px]"
              style={{ transform: isElephantHovered ? 'scaleY(1.05) rotate(-3deg)' : 'none' }}
            />
            <circle cx="47" cy="74" r="1" fill="#37474F" />
            <circle cx="50" cy="73" r="1" fill="#37474F" />
          </svg>
        </div>

      </div>

      {/* Main Footer Content */}
      <div className="relative z-20 w-full bg-[#DCE3DC] select-none text-[#3E2723] pb-14 pt-12">
        <div className="max-w-[1400px] mx-auto px-6 md:px-12">
          
          {/* Main 5-Column Grid Layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-6 items-start">
          
            {/* Column 1: School Info & Socials (Spans 3) */}
            <div className="lg:col-span-3 flex flex-col items-center lg:items-start text-center lg:text-left">
              {/* Simba Academy Custom Logo Frame */}
              <div className="inline-block max-w-[180px] mb-5 hover:scale-105 hover:rotate-2 transition-all duration-300 cursor-pointer">
                <img 
                  src="/Simba Logo 2025.pdf.png" 
                  alt="Simba Academy Logo" 
                  className="w-full h-auto object-contain" 
                />
              </div>

              {/* Tagline */}
              <h5 className="font-sans text-[15px] text-[#3E2723] font-extrabold italic mb-2 tracking-wide leading-snug">
                "Nurturing Young Minds for a Brighter Future"
              </h5>
              
              {/* Brief Description */}
              <p className="text-[#5D4037] text-xs font-semibold leading-relaxed mb-6 max-w-xs">
                A premier preschool savanna blending nature-guided discovery with certified early academic excellence.
              </p>
              
              {/* Premium Wooden Token Social Media Buttons */}
              <div className="flex gap-3">
                {/* Facebook Wood Token */}
                <a 
                  href={SOCIAL_LINKS.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="wood-token w-10.5 h-10.5 rounded-md bg-[#EADAC2] border-3 border-[#8C6239] flex items-center justify-center relative shadow-sm group"
                  aria-label="Facebook"
                >
                  <div className="absolute inset-0.5 rounded-lg border border-[#8C6239]/40 opacity-70"></div>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-4.5 h-4.5 text-[#5D4037] relative z-10 group-hover:text-white transition-colors">
                    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
                  </svg>
                </a>

                {/* Instagram Wood Token */}
                <a 
                  href={SOCIAL_LINKS.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="wood-token w-10.5 h-10.5 rounded-md bg-[#EADAC2] border-3 border-[#8C6239] flex items-center justify-center relative shadow-sm group"
                  aria-label="Instagram"
                >
                  <div className="absolute inset-0.5 rounded-lg border border-[#8C6239]/40 opacity-70"></div>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-4.5 h-4.5 text-[#5D4037] relative z-10 group-hover:text-white transition-colors">
                    <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/>
                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
                    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
                  </svg>
                </a>

                {/* Youtube Wood Token */}
                <a 
                  href={SOCIAL_LINKS.youtube}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="wood-token w-10.5 h-10.5 rounded-md bg-[#EADAC2] border-3 border-[#8C6239] flex items-center justify-center relative shadow-sm group"
                  aria-label="YouTube"
                >
                  <div className="absolute inset-0.5 rounded-lg border border-[#8C6239]/40 opacity-70"></div>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-4.5 h-4.5 text-[#5D4037] relative z-10 group-hover:text-white transition-colors">
                    <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"/>
                    <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" fill="currentColor"/>
                  </svg>
                </a>

                {/* WhatsApp Wood Token */}
                <a 
                  href={SOCIAL_LINKS.whatsapp}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="wood-token w-10.5 h-10.5 rounded-md bg-[#EADAC2] border-3 border-[#8C6239] flex items-center justify-center relative shadow-sm group"
                  aria-label="WhatsApp"
                >
                  <div className="absolute inset-0.5 rounded-lg border border-[#8C6239]/40 opacity-70"></div>
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4.5 h-4.5 text-[#5D4037] relative z-10 group-hover:text-white transition-colors">
                    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.003 5.324 5.328 0 11.859 0c3.166.001 6.141 1.233 8.377 3.469 2.235 2.237 3.465 5.214 3.464 8.384-.003 6.536-5.328 11.86-11.859 11.86-2.002-.001-3.973-.509-5.714-1.486L0 24zm6.529-3.722l.379.225c1.462.868 3.093 1.325 4.767 1.326 5.37 0 9.739-4.37 9.742-9.743.002-2.602-1.01-5.05-2.85-6.892-1.84-1.84-4.29-2.853-6.897-2.853-5.372 0-9.744 4.373-9.747 9.747-.001 1.769.467 3.498 1.354 5.023l.247.428-1.012 3.693 3.788-.992zm10.231-6.862c-.276-.139-1.636-.807-1.89-.899-.254-.093-.439-.139-.624.139-.185.276-.717.899-.878 1.084-.162.185-.323.208-.599.069-.276-.139-1.168-.43-2.223-1.372-.821-.733-1.376-1.639-1.537-1.916-.162-.276-.017-.426.121-.563.125-.124.276-.323.415-.485.139-.162.185-.276.276-.462.093-.185.046-.347-.023-.485-.069-.139-.624-1.503-.856-2.058-.225-.54-.452-.466-.624-.475-.162-.009-.346-.01-.53-.01-.185 0-.485.069-.739.347-.254.276-.97 1.018-.97 2.483 0 1.465 1.063 2.879 1.202 3.064.139.185 2.092 3.194 5.068 4.48.708.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.636-.668 1.867-1.317.23-1.5.23-1.1.161-1.316.03-.227-.2-.27-.47-.41z"/>
                  </svg>
                </a>
              </div>
            </div>

            {/* Column 2: Quick Links (Spans 2) */}
            <div className="lg:col-span-2">
              <h4 className="font-sans text-lg text-[#3E2723] mb-5 flex items-center justify-center lg:justify-start gap-2">
                <Compass className="w-5 h-5 text-[#FF9F1C]" /> Quick Links
              </h4>
              
              <div className="flex flex-col select-none">
                {/* Hanging Ropes */}
                <div className="flex gap-14 justify-center lg:justify-start lg:pl-10 -mb-1 z-10">
                  <div className="w-1 h-5 bg-[#8C6239]/50 rounded-lg"></div>
                  <div className="w-1 h-5 bg-[#8C6239]/50 rounded-lg"></div>
                </div>
                
                {/* Wooden Board */}
                <div className="bg-[#FFF8E1] border-3 border-[#D4A373]/80 rounded-lg p-5 shadow-md relative overflow-hidden group">
                  <div className="absolute inset-0 opacity-15 pointer-events-none" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'100\' height=\'20\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M0,10 Q25,0 50,10 T100,10\' stroke=\'%238C6239\' stroke-width=\'1.5\' fill=\'none\'/%3E%3C/svg%3E")' }}></div>
                  
                  <ul className="space-y-3.5 relative z-10 text-center lg:text-left">
                    {FOOTER_QUICK_LINKS.map((link) => (
                      <li key={link.to}>
                        <Link to={link.to} className="text-[13px] text-[#5D4037] hover:text-[#3E2723] safari-link pb-0.5 transition-all font-extrabold inline-flex items-center justify-center lg:justify-start gap-2 group/link">
                          <Sparkles className="w-3 h-3 text-[#8AC926] group-hover/link:text-[#FF9F1C] transition-colors" /> 
                          {link.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Column 3: Courses (Spans 2) */}
            <div className="lg:col-span-2">
              <h4 className="font-sans text-lg text-[#3E2723] mb-5 flex items-center justify-center lg:justify-start gap-2 select-none">
                <GraduationCap className="w-5 h-5 text-[#FF9F1C]" /> Courses
              </h4>
              <div className="space-y-3">
                {COURSE_LEVELS.map((course, idx) => (
                  <div 
                    key={idx}
                    className="group cursor-pointer bg-white/70 border-2 border-[#8AC926]/20 hover:border-[#8AC926]/45 p-2 rounded-lg hover:bg-white transition-all duration-300 shadow-xs hover:-translate-y-0.5 hover:rotate-1"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-7.5 h-7.5 rounded-lg bg-[#FAF8F5] flex items-center justify-center shrink-0 border border-[#8AC926]/20 group-hover:scale-110 group-hover:rotate-6 transition-transform">
                        <Compass className="w-4 h-4 text-[#8AC926]" />
                      </div>
                      <h5 className="font-bold text-[#5D4037] group-hover:text-[#3E2723] text-xs leading-tight text-left">
                        {course}
                      </h5>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Column 4: Contact Information (Spans 3) */}
            <div className="lg:col-span-3">
              <h4 className="font-sans text-lg text-[#3E2723] mb-5 flex items-center justify-center lg:justify-start gap-2 select-none">
                <MapPin className="w-5 h-5 text-[#FF9F1C]" /> Contact Info
              </h4>
              <div 
                className="glass-panel-footer rounded-lg p-5 relative overflow-hidden shadow-md group cursor-pointer"
                onMouseEnter={() => setIsLanternHovered(true)}
                onMouseLeave={() => setIsLanternHovered(false)}
              >
                {/* Wooden support beam for lantern */}
                <div className="absolute top-2.5 left-7 w-12 h-1.5 bg-[#8C6239]/50 rounded-lg border border-[#3B2110]/30 z-20 shadow-md"></div>
                
                {/* Detailed Hanging, Swinging and Glowing Lantern SVG */}
                <div className="absolute top-3.5 left-10 w-9 h-14 z-20 animate-lantern-swing">
                  <svg viewBox="0 0 40 60" fill="none" className="w-full h-full drop-shadow-md">
                    <line x1="20" y1="0" x2="20" y2="15" stroke="#3B2110" strokeWidth="3" />
                    <path d="M8 15 L32 15 L34 22 L6 22 Z" fill="#5D4037" stroke="#3B2110" strokeWidth="1.5" />
                    <rect 
                      x="9" 
                      y="22" 
                      width="22" 
                      height="24" 
                      rx="4" 
                      fill={isLanternHovered ? "url(#lantern-glow-bright)" : "url(#lantern-glow-normal)"} 
                      stroke="#3B2110" 
                      strokeWidth="1.5" 
                      className="transition-all duration-300"
                    />
                    <line x1="16" y1="22" x2="16" y2="46" stroke="#3B2110" strokeWidth="1.2" />
                    <line x1="24" y1="22" x2="24" y2="46" stroke="#3B2110" strokeWidth="1.2" />
                    <rect x="7" y="46" width="26" height="5" rx="2" fill="#5D4037" stroke="#3B2110" strokeWidth="1.5" />
                    <defs>
                      <radialGradient id="lantern-glow-normal" cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stopColor="#FFF9C4" />
                        <stop offset="60%" stopColor="#FBC02D" />
                        <stop offset="100%" stopColor="#E65100" />
                      </radialGradient>
                      <radialGradient id="lantern-glow-bright" cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stopColor="#FFFFFF" />
                        <stop offset="40%" stopColor="#FFEE58" />
                        <stop offset="100%" stopColor="#F57C00" />
                      </radialGradient>
                    </defs>
                  </svg>
                </div>

                <svg className="absolute bottom-[-10px] right-[-10px] w-12 h-12 text-[#8AC926] opacity-15 group-hover:scale-110 transition-transform duration-500" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17 8C8 10 5.9 16.17 3.82 21.34L5.71 22l1-2.3A13.89 13.89 0 0 0 20.25 6.05 13.56 13.56 0 0 0 22 2C17.38 2.06 17 8 17 8z"/>
                </svg>
                
                {/* Contact data shifted down */}
                <ul className="space-y-4 relative z-10 text-left pt-11">
                  <li className="flex items-start gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shrink-0 text-[#3E2723] border border-[#8AC926]/20 shadow-xs">
                      <MapPin className="w-4 h-4 text-[#FF9F1C]" />
                    </div>
                    <div className="text-[11.5px] text-[#5D4037] font-semibold leading-relaxed pt-0.5">
                      81, Anna Street, Ammapet Road, Salem - 636001
                    </div>
                  </li>
                  
                  <li className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shrink-0 text-[#3E2723] border border-[#8AC926]/20 shadow-xs">
                      <Phone className="w-4 h-4 text-[#FF9F1C]" />
                    </div>
                    <a href="tel:+919884866727" className="text-[12px] text-[#5D4037] hover:text-[#3E2723] transition-colors font-semibold">
                      +91 98848 66727
                    </a>
                  </li>
                  
                  <li className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shrink-0 text-[#3E2723] border border-[#8AC926]/20 shadow-xs">
                      <Mail className="w-4 h-4 text-[#FF9F1C]" />
                    </div>
                    <a href="mailto:info@simbaacademy.com" className="text-[12px] text-[#5D4037] hover:text-[#3E2723] transition-colors font-semibold truncate">
                      info@simbaacademy.com
                    </a>
                  </li>

                  <li className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shrink-0 text-[#3E2723] border border-[#8AC926]/20 shadow-xs">
                      <Clock className="w-4 h-4 text-[#FF9F1C]" />
                    </div>
                    <div className="text-[11.5px] text-[#5D4037] font-semibold">
                      Mon - Sat: 8:00 AM - 6:00 PM
                    </div>
                  </li>
                </ul>
              </div>
            </div>

            {/* Column 5: Branch Locations (Spans 2) */}
            <div className="lg:col-span-2">
              <h4 className="font-sans text-lg text-[#3E2723] mb-5 flex items-center justify-center lg:justify-start gap-2 select-none">
                <Compass className="w-5 h-5 text-[#FF9F1C]" /> Branches
              </h4>
              
              <div className="flex flex-col select-none">
                {/* Hanging Ropes */}
                <div className="flex gap-14 justify-center lg:justify-start lg:pl-10 -mb-1 z-10">
                  <div className="w-1 h-5 bg-[#8C6239]/50 rounded-lg"></div>
                  <div className="w-1 h-5 bg-[#8C6239]/50 rounded-lg"></div>
                </div>
                
                {/* Wooden Board */}
                <div className="bg-[#FFF8E1] border-3 border-[#D4A373]/80 rounded-lg p-5 shadow-md relative overflow-hidden group">
                  <div className="absolute inset-0 opacity-15 pointer-events-none" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'100\' height=\'20\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M0,10 Q25,0 50,10 T100,10\' stroke=\'%238C6239\' stroke-width=\'1.5\' fill=\'none\'/%3E%3C/svg%3E")' }}></div>
                  
                  <ul className="space-y-3.5 relative z-10 text-center lg:text-left">
                    {BRANCHES.map((branch) => (
                      <li key={branch.name}>
                        <Link to="/contact" className="text-[13px] text-[#5D4037] hover:text-[#3E2723] safari-link pb-0.5 transition-all font-extrabold inline-flex items-center justify-center lg:justify-start gap-2 group/branch">
                          <Sparkles className="w-3 h-3 text-[#8AC926] group-hover/branch:text-[#FF9F1C] transition-colors" /> 
                          {branch.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

          </div>

          {/* Bottom Bar: Copyright, Privacy links & Techno Vanam Attribution */}
          <div className="mt-16 pt-8 border-t border-[#2d5231]/20 flex flex-col md:flex-row justify-between items-center gap-6 relative">
            
            {/* Paw footprints leading through bottom bar */}
            <div className="absolute top-[-15px] left-[8%] flex gap-6 text-[#8AC926]/30 pointer-events-none select-none animate-footprint">
               <PawPrint className="w-5 h-5 transform rotate-[25deg]" />
               <PawPrint className="w-5 h-5 transform rotate-[-25deg] mt-3" />
            </div>

            {/* Copyright */}
            <p className="text-[13px] text-[#83a886] font-extrabold tracking-wide select-none">
              &copy; 2026 Simba Academy. All Rights Reserved.
            </p>
            
            {/* Legal Links */}
            <div className="flex gap-6 text-[13px] text-[#83a886] font-bold">
              <Link to="/contact" className="hover:text-[#3E2723] transition-colors flex items-center gap-1">
                <ChevronRight className="w-3.5 h-3.5 text-[#E0EFE0]" /> Privacy Policy
              </Link>
              <Link to="/contact" className="hover:text-[#3E2723] transition-colors flex items-center gap-1">
                <ChevronRight className="w-3.5 h-3.5 text-[#E0EFE0]" /> Terms & Conditions
              </Link>
            </div>

            {/* Techno Vanam Attribution */}
            <div className="text-[13px] text-[#3E2723] font-sans font-extrabold flex items-center gap-1.5 select-none hover:scale-105 transition-transform duration-300">
              <span>Designed & Developed by</span>
              <a 
                href="https://technovanam.com" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-[#4E8C52] hover:text-[#FF9F1C] transition-colors flex items-center gap-1 relative font-extrabold tracking-wide"
              >
                Techno Vanam
                <Heart className="w-3.5 h-3.5 text-[#FF70A6] fill-[#FF70A6] animate-pulse ml-0.5" />
              </a>
            </div>

          </div>
        </div>
      </div>

      {/* Floating Flat-Vector Hot-Air Balloon Scroll-to-Top (Emoji-Free) */}
      <button 
        onClick={scrollToTop}
        className="fixed bottom-6 right-6 z-50 animate-balloon-float hover:scale-115 active:scale-95 transition-transform duration-300 focus:outline-none drop-shadow-lg group"
        aria-label="Fly to top"
      >
        <svg width="70" height="95" viewBox="0 0 100 130" fill="none">
          {/* Basket */}
          <rect x="40" y="100" width="20" height="15" rx="3" fill="#8c5a3c" stroke="#5e3a21" strokeWidth="1.5" />
          {/* Support ropes */}
          <path d="M41 100 L44 88 M59 100 L56 88" stroke="#5e3a21" strokeWidth="2"/>
          {/* Balloon Body with beautiful vibrant stripes */}
          <path d="M50 10 C80 10 92 40 92 60 C92 78 62 88 50 88 C38 88 8 78 8 60 C8 40 20 10 50 10 Z" fill="#e07a5f"/>
          {/* Yellow Stripe */}
          <path d="M50 10 C68 20 68 78 50 88 C32 78 32 20 50 10 Z" fill="#f4d06f"/>
          {/* Center Blue Stripe */}
          <path d="M50 10 C58 18 58 80 50 88 C42 80 42 18 50 10 Z" fill="#3D5A80"/>
          
          {/* Little flying wind flag */}
          <path d="M50 10 L50 -2 L62 3 L50 8" fill="#8AC926"/>
        </svg>
        
        {/* Glow indicator with ArrowUp from Lucide in the center */}
        <div className="absolute top-[40%] left-[34%] z-20 w-6 h-6 rounded-lg bg-[#FAF3E0] shadow-sm flex items-center justify-center border border-[#8c5a3c]/30 group-hover:bg-white group-hover:scale-110 transition-all duration-300">
          <ArrowUp className="w-3.5 h-3.5 text-[#5e3a21] stroke-[2.5]" />
        </div>
      </button>

    </footer>
  );
}
