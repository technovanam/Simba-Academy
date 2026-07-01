import type { Route } from "./+types/about";
import { PageShell } from "../components/PageShell";
import { Quote } from "lucide-react";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "About Us | Simba Academy" },
    { name: "description", content: "Discover Simba Academy's mission, vision, core values, and message from our founder." },
  ];
}




export default function AboutPage() {
  return (
    <PageShell headerVariant="overlay">
      {/* Hero Section */}
      <section className="relative w-full min-h-screen flex items-center justify-center bg-[#fdfcf8]">
        {/* Responsive Background Images */}
        <picture className="absolute inset-0 w-full h-full">
          <source media="(min-width: 1024px)" srcSet="/About%20Hero.png" />
          <source media="(min-width: 640px)" srcSet="/About%20Hero%20Tab.png" />
          <img loading="lazy" decoding="async" 
            src="/About%20Hero%20Mobile.png" 
            alt="About Simba Academy Hero" 
            className="w-full h-full object-cover object-bottom"
            fetchPriority="high"
            decoding="async"
          />
        </picture>
        
        {/* Text Overlay */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6 sm:px-12 z-10 pt-[25%] sm:pt-[12%] md:pt-[10%]">
          <div className="space-y-3 sm:space-y-4 md:space-y-6 flex flex-col items-center max-w-4xl mx-auto translate-y-16 sm:translate-y-12 md:translate-y-16">
            <h1 className="text-4xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold text-black tracking-tight leading-[1.1] drop-shadow-sm">
              About <span className="text-[#E8AF34]">Simba Preschool</span>
            </h1>
            <p className="text-sm sm:text-sm md:text-base lg:text-lg text-black font-medium leading-relaxed max-w-2xl drop-shadow-sm px-2 md:px-4">
              <span className="sm:hidden">A vibrant, secure preschool where untamed curiosity meets premium early childhood standards.</span>
              <span className="hidden sm:inline">A state-of-the-art preschool where untamed curiosity meets premium early childhood academic standards. We provide a vibrant, secure, and guidance-rich environment for young explorers.</span>
            </p>
          </div>
        </div>

        {/* Curved Bottom Divider to blend into the next section */}
        <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-[0] z-20">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320" preserveAspectRatio="none" className="w-full h-[40px] sm:h-[60px] lg:h-[80px]">
            <path fill="#ffffff" d="M0,128 C360,256 1080,256 1440,128 L1440,320 L0,320 Z"></path>
          </svg>
        </div>
      </section>

      {/* Section 2: Founder Message */}
      <section className="relative w-full min-h-screen flex items-center justify-end overflow-hidden">
        <img
          src="/Founder.png"
          alt=""
          aria-hidden
          className="absolute inset-0 w-full h-full object-cover object-center pointer-events-none select-none"
          loading="lazy"
          decoding="async"
        />
        
        {/* Content at the right */}
        <div className="relative z-10 w-full max-w-7xl mx-auto px-6 sm:px-12 flex justify-center sm:justify-end">
          <div className="max-w-lg sm:max-w-xl p-6 sm:p-12 sm:mr-12 md:mr-24 lg:mr-32 translate-y-8 sm:translate-y-0 bg-white/90 sm:bg-transparent rounded-2xl sm:rounded-none backdrop-blur-sm sm:backdrop-blur-none">
            <Quote className="w-8 h-8 text-[#E8AF34] mb-6" />
            <h3 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-4">Founder&apos;s Message</h3>
            <div className="space-y-3.5 text-slate-800 text-sm sm:text-base leading-relaxed font-medium">
              <p>
                Children have always held a special place in my heart. Their innocence, curiosity, and joyful smiles remind me why I chose early childhood education.
              </p>
              <p>
                Teaching is my passion, not just my profession. At Simba Preschool, we create a home away from home where every child feels safe, valued, and loved.
              </p>
              <p>
                Our classrooms are filled with laughter, exploration, and meaningful learning. We celebrate every achievement and nurture each child&apos;s talents with warmth and compassion.
              </p>
              <p>
                To every parent who trusts us, thank you. We are honoured to be part of your child&apos;s early years and committed to a joyful environment where they learn with confidence and grow with happiness.
              </p>
              <p>
                Together, let us nurture kind hearts, curious minds, and confident little learners.
              </p>
            </div>
            <div className="mt-6 sm:mt-8">
              <p className="text-slate-700 text-sm sm:text-base font-medium italic">With love,</p>
              <h4 className="text-xl font-bold text-slate-900 mt-2">Founder</h4>
              <p className="text-xs font-bold text-[#9A6B1A] mt-1 uppercase tracking-wider">Simba Preschool</p>
            </div>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
