import type { Route } from "./+types/about";
import { PageShell } from "../components/PageShell";
import { ShieldCheck, Users, Quote, CheckCircle2 } from "lucide-react";

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
          <source media="(min-width: 1024px)" srcSet="/About%20Hero.webp" />
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
          <div className="space-y-3 sm:space-y-4 md:space-y-6 flex flex-col items-center max-w-4xl mx-auto translate-y-28 sm:translate-y-12 md:translate-y-16">
            <h1 className="text-4xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold text-slate-800 tracking-tight leading-[1.1] drop-shadow-sm">
              About <span className="text-[#E8AF34]">Simba Preschool</span>
            </h1>
            <p className="text-sm sm:text-sm md:text-base lg:text-lg text-slate-700 font-medium leading-relaxed max-w-2xl drop-shadow-sm px-2 md:px-4">
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
        {/* Responsive Background Images */}
        <picture className="absolute inset-0 w-full h-full pointer-events-none">
          <source media="(min-width: 1024px)" srcSet="/About%20Page.webp" />
          <source media="(min-width: 640px)" srcSet="/About%20Tab.png" />
          <img loading="lazy" decoding="async" 
            src="/About%20Mobile.png" 
            alt="Founder Background" 
            className="w-full h-full object-cover object-center"
            loading="lazy"
            decoding="async"
          />
        </picture>
        
        {/* Content at the right */}
        <div className="relative z-10 w-full max-w-7xl mx-auto px-6 sm:px-12 flex justify-end">
          <div className="max-w-lg p-8 sm:p-12 mr-4 sm:mr-12 md:mr-24 lg:mr-32 translate-y-32 sm:translate-y-0">
            <Quote className="w-8 h-8 text-[#E8AF34] mb-6" />
            <h3 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-4">Founder&apos;s Message</h3>
            <p className="text-slate-800 text-sm sm:text-base leading-relaxed italic mb-8 font-medium">
              &ldquo;Every child is born with natural curiosity, eager to explore a vast and exciting world. At Simba Academy, our role is not to restrict that curiosity with standard benches and walls, but to provide a secure, guidance-rich environment where they can discover, make mistakes, and learn to thrive. We are committed to making their first educational steps unforgettable, creative, and safe.&rdquo;
            </p>
            <div>
              <h4 className="text-xl font-bold text-slate-900">Ms. Nirmala Umesh</h4>
              <p className="text-xs font-bold text-slate-600 mt-1 uppercase tracking-wider">Founder</p>
            </div>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
