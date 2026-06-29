import type { Route } from "./+types/franchise";
import { PageShell } from "../components/PageShell";
import { FranchiseForm } from "../components/FranchiseForm";
import { ShieldCheck, Award, TrendingUp, HelpCircle, Phone, ArrowRight, BookOpen, Users, Compass, Laptop } from "lucide-react";
import { WHATSAPP_URL } from "../lib/constants";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Franchise Opportunity | Simba Academy" },
    { name: "description", content: "Partner with Simba Academy to bring a premium learning experience to your city. Explore franchise benefits, support, and apply today." },
  ];
}

const BENEFITS = [
  {
    title: "Established Brand Trust",
    desc: "Leverage Simba Academy's premium brand name and parent-approved educational model.",
    icon: Award,
    color: "text-blue-600",
    bg: "bg-blue-50"
  },
  {
    title: "High Returns (ROI)",
    desc: "Enjoy rapid break-even and highly attractive returns driven by our high retention rates.",
    icon: TrendingUp,
    color: "text-emerald-600",
    bg: "bg-emerald-50"
  },
  {
    title: "Proprietary Software Suite",
    desc: "Full automated platform covering fee payments, lesson plans, portals, and teacher checks.",
    icon: Laptop,
    color: "text-indigo-600",
    bg: "bg-indigo-50"
  },
  {
    title: "Zero-Risk Curriculum",
    desc: "Acquire full rights to our accredited early childhood and science syllabus.",
    icon: ShieldCheck,
    color: "text-purple-600",
    bg: "bg-purple-50"
  }
];

const SUPPORTS = [
  {
    title: "Architectural Setup",
    desc: "Complete interior blueprints, specifications, sourcing, and classroom safety layout plans.",
    icon: Compass
  },
  {
    title: "Teacher Recruitment & Training",
    desc: "Standard screening protocols, guide manuals, child care workshops, and onboarding programs.",
    icon: Users
  },
  {
    title: "Admissions Marketing Kit",
    desc: "Localized launch plans, brochures, digital media templates, and customized flyers.",
    icon: BookOpen
  }
];

const FAQS = [
  {
    q: "What is the typical property area required?",
    a: "A minimum carpet area of 1,500 - 2,500 sq.ft. on a ground floor property with secure access and play area."
  },
  {
    q: "How long does it take to launch a branch?",
    a: "Usually between 45 to 60 days once property leasing and agreements are finalized."
  },
  {
    q: "Do I get exclusive regional rights?",
    a: "Yes! We secure territorial rights for each partner to ensure zero internal competition within designated bounds."
  }
];

export default function FranchisePage() {
  return (
    <PageShell headerVariant="overlay">
      {/* Hero Section */}
      <section className="relative w-full min-h-screen flex items-center justify-center bg-[#FFFAF0]">
        {/* Responsive Background Images */}
        <picture className="absolute inset-0 w-full h-full">
          <source media="(min-width: 1024px)" srcSet="/Franchise.webp" />
          <source media="(min-width: 640px)" srcSet="/Franchise%20tab.webp" />
          <img loading="lazy" decoding="async" 
            src="/Franchise%20Phone.webp" 
            alt="Franchise Background" 
            className="w-full h-full object-cover object-center"
            fetchPriority="high"
            decoding="async"
          />
        </picture>
        
        {/* Text Overlay */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6 sm:px-12 z-10 pt-[2%] sm:pt-[4%]">
          <div className="space-y-4 md:space-y-6 flex flex-col items-center max-w-4xl mx-auto">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.2] drop-shadow-sm">
              Bring <br className="sm:hidden" />
              <span className="text-slate-900">Simba Preschool</span> <br className="sm:hidden" />
              <span className="hidden sm:inline"> to </span>
              <span className="sm:hidden">To </span><br/>
              Your City
            </h1>
            <p className="text-sm sm:text-base lg:text-lg text-slate-800 font-medium leading-relaxed max-w-[min(100%,20rem)] sm:max-w-2xl mx-auto drop-shadow-sm px-2 md:px-4">
              <span className="sm:hidden">Join our premium preschool network with all the tools you need to succeed.</span>
              <span className="hidden sm:inline">Join a fast-growing network of premium preschools. We provide all the tools, curriculum, and technology required to run a successful center.</span>
            </p>
          </div>
        </div>

        {/* Curved Bottom Divider */}
        <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-[0] z-20">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320" preserveAspectRatio="none" className="w-full h-[40px] sm:h-[60px] lg:h-[80px]">
            <path fill="#FFFAF0" d="M0,128 C360,256 1080,256 1440,128 L1440,320 L0,320 Z"></path>
          </svg>
        </div>
      </section>

      <div className="py-20 px-6 sm:px-12 w-full bg-[#FFFAF0]">
        <div className="max-w-7xl mx-auto">
          {/* Franchise Inquiry Form */}
          <div className="max-w-3xl mx-auto">
            <div className="bg-white border border-slate-200 rounded-3xl p-8 sm:p-12 shadow-sm">
              <h3 className="text-2xl font-bold text-slate-900 mb-2">Franchise Inquiry Form</h3>
              <p className="text-slate-600 mb-8">
                Fill out the form below to receive our detailed curriculum booklet and financial model spreadsheets.
              </p>
              <FranchiseForm />
            </div>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
