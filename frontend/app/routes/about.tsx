import type { Route } from "./+types/about";
import { PageShell } from "../components/PageShell";
import { JsonLd } from "../components/JsonLd";
import { Quote } from "lucide-react";
import { ABOUT_SEO, aboutPageJsonLd, buildPageMeta } from "../lib/seo";

export function meta({}: Route.MetaArgs) {
  return buildPageMeta(ABOUT_SEO);
}




export default function AboutPage() {
  return (
    <PageShell headerVariant="overlay">
      <JsonLd data={aboutPageJsonLd()} />
      {/* Hero Section */}
      <section className="about-hero-section relative w-full min-h-screen flex items-center justify-center bg-[#fdfcf8]">
        {/* Responsive Background Images */}
        <picture className="absolute inset-0 w-full h-full">
          <source media="(min-width: 1024px)" srcSet="/About%20Hero.webp" />
          <source
            media="(min-width: 768px) and (max-width: 1023px) and (orientation: portrait)"
            srcSet="/About%20Hero%20Tab%20Potrait.webp"
          />
          <source media="(min-width: 640px)" srcSet="/About%20Hero%20Tab.webp" />
          <img
            src="/About%20Hero%20Mobile.webp"
            alt="About Simba Preschool Hero"
            className="w-full h-full object-cover object-bottom"
            loading="eager"
            decoding="async"
            fetchPriority="high"
          />
        </picture>
        
        {/* Text Overlay */}
        <div className="about-hero-overlay absolute inset-0 z-10 px-6 sm:px-12">
          <div className="about-hero-text">
            <h1 className="about-hero-title text-3xl font-extrabold tracking-tight text-black leading-[1.1] drop-shadow-sm sm:whitespace-nowrap sm:text-4xl md:text-5xl lg:text-6xl">
              <span className="block sm:inline">About</span>{" "}
              <span className="block text-[#E8AF34] sm:inline">Simba Preschool</span>
            </h1>
            <p className="max-w-[16.5rem] text-sm font-medium leading-relaxed text-black drop-shadow-sm sm:max-w-2xl sm:px-2 sm:text-sm md:px-4 md:text-base lg:text-lg">
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
      <section className="about-founder-section relative w-full min-h-screen flex items-center justify-end overflow-hidden">
        <picture className="absolute inset-0 w-full h-full pointer-events-none select-none">
          <source media="(min-width: 1024px)" srcSet="/Founder.webp" />
          <source
            media="(min-width: 768px) and (max-width: 1023px) and (orientation: portrait)"
            srcSet="/Founder%20Tab%20Potrait.webp"
          />
          <source media="(min-width: 640px)" srcSet="/Founder%20Tab.webp" />
          <img
            src="/Founder%20Mobile.webp"
            alt=""
            aria-hidden
            className="absolute inset-0 h-full w-full object-cover object-top"
            loading="lazy"
            decoding="async"
          />
        </picture>
        
        {/* Content at the right */}
        <div className="about-founder-content relative z-10 w-full max-w-7xl mx-auto px-6 sm:px-12 flex justify-center sm:justify-end">
          <div className="about-founder-card max-w-lg sm:max-w-xl p-6 sm:p-12 sm:mr-12 md:mr-24 lg:mr-32">
            <Quote className="w-8 h-8 text-[#E8AF34] mb-6" />
            <h3 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-4">Founder&apos;s Message</h3>
            <div className="about-founder-body space-y-3.5 text-slate-800 text-sm sm:text-base leading-relaxed font-medium">
              <p>
                Children have always held a special place in my heart. Their innocence, curiosity, and Joyful Smiles remind me why I chose early childhood education.
              </p>
              <p>
                Teaching is my passion, not just my profession. At Simba Preschool, we create a home away from home where every child feels safe, valued, and loved.
              </p>
              <p>
                Our classrooms are filled with laughter, exploration, and meaningful learning.{" "}
                <span className="hidden sm:inline">We celebrate every achievement and nurture each child&apos;s talents with warmth and compassion.</span>
              </p>
              <p>
                To every parent who trusts us, thank you. We are honoured to be part of your child&apos;s early years{" "}
                <span className="hidden sm:inline">and committed to a joyful environment where they learn with confidence and grow with happiness.</span>
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
