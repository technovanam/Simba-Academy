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
    <PageShell>
      <div className="py-20 px-6 sm:px-12 max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto pt-10 mb-20">
          <span className="text-sm font-bold uppercase tracking-wider text-blue-600 block mb-3">
            Partnerships
          </span>
          <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 tracking-tight mb-6">
            Bring Simba Academy to Your City
          </h1>
          <p className="text-lg text-slate-600 leading-relaxed">
            Join a fast-growing network of premium preschools. We provide all the tools, curriculum, and technology required to run a successful center.
          </p>
        </div>

        {/* Section 1: Why Partner & Benefits */}
        <div className="mb-24 grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
          <div className="lg:col-span-5 space-y-6">
            <h3 className="text-3xl font-bold text-slate-900 tracking-tight leading-tight mb-4">
              An Innovative Early Education Business Model
            </h3>
            <p className="text-slate-600 text-base leading-relaxed">
              The early learning industry is shifting rapidly toward experiential and modern education. Simba Academy is at the forefront of this shift, offering a premium preschool model. 
            </p>
            <p className="text-slate-600 text-base leading-relaxed">
              By franchising with us, you are introducing a top-tier educational ecosystem. Our automated student portal and cloud-integrated billing systems reduce admin friction, allowing you to focus entirely on school quality and growth.
            </p>
          </div>

          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-6">
            {BENEFITS.map((benefit, idx) => {
              const Icon = benefit.icon;
              return (
                <div 
                  key={idx}
                  className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow flex flex-col items-start"
                >
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-6 border border-slate-100 shadow-sm ${benefit.bg} ${benefit.color}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <h4 className="text-lg font-bold text-slate-900 mb-2">{benefit.title}</h4>
                  <p className="text-sm text-slate-600 leading-relaxed">{benefit.desc}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Section 2: Support Provided & Business Growth */}
        <div className="mb-24 bg-slate-50 border border-slate-200 rounded-3xl p-10 sm:p-14 shadow-sm">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
            
            <div className="lg:col-span-6 space-y-8">
              <div>
                <h3 className="text-2xl font-bold text-slate-900 mb-3">Support Provided to Partners</h3>
                <p className="text-slate-600 leading-relaxed">
                  Our support team is with you at every stage, from the day you sign your agreement to daily operational reviews.
                </p>
              </div>
              
              <div className="space-y-6">
                {SUPPORTS.map((support, idx) => {
                  const Icon = support.icon;
                  return (
                    <div key={idx} className="flex gap-5">
                      <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 flex items-center justify-center shrink-0 text-slate-700 shadow-sm">
                        <Icon className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="text-base font-bold text-slate-900 mb-1">{support.title}</h4>
                        <p className="text-sm text-slate-600 leading-relaxed">{support.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="lg:col-span-6 space-y-8">
              <div>
                <h3 className="text-2xl font-bold text-slate-900 mb-3">Business Growth Opportunities</h3>
                <p className="text-slate-600 leading-relaxed">
                  With early preschool demand steadily climbing, expanding your footprint is extremely straightforward.
                </p>
              </div>
              
              <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm space-y-6">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm">1</div>
                    <h4 className="text-base font-bold text-slate-900">Multi-Center Expansion</h4>
                  </div>
                  <p className="text-sm text-slate-600 leading-relaxed pl-11">
                    Once your primary branch breaks even, our territorial agreements support setting up smaller feeder nurseries in satellite suburbs.
                  </p>
                </div>
                
                <div className="border-t border-slate-100 pt-6">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-sm">2</div>
                    <h4 className="text-base font-bold text-slate-900">Integrated Daycare Add-on</h4>
                  </div>
                  <p className="text-sm text-slate-600 leading-relaxed pl-11">
                    Enrich your revenue model by adding our certified daycare program, keeping classrooms active until evening hours.
                  </p>
                </div>
              </div>
            </div>
            
          </div>
        </div>

        {/* Section 3: Franchise Inquiry Form & FAQ */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">
          {/* Inquiry form */}
          <div className="lg:col-span-7 bg-white border border-slate-200 rounded-3xl p-8 sm:p-12 shadow-sm">
            <h3 className="text-2xl font-bold text-slate-900 mb-2">Franchise Inquiry Form</h3>
            <p className="text-slate-600 mb-8">
              Fill out the form below to receive our detailed curriculum booklet and financial model spreadsheets.
            </p>
            <FranchiseForm />
          </div>

          {/* Sidebar FAQs */}
          <div className="lg:col-span-5 space-y-8 bg-slate-50 border border-slate-200 rounded-3xl p-8 sm:p-10 shadow-sm">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center text-orange-600 border border-orange-100">
                <HelpCircle className="w-6 h-6" />
              </div>
              <h4 className="text-xl font-bold text-slate-900">Partnership FAQs</h4>
            </div>
            
            <div className="space-y-6">
              {FAQS.map((faq, idx) => (
                <div key={idx} className="space-y-2">
                  <h5 className="text-sm font-bold text-slate-900 flex items-start gap-2">
                    <ArrowRight className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
                    {faq.q}
                  </h5>
                  <p className="text-sm text-slate-600 leading-relaxed pl-6">
                    {faq.a}
                  </p>
                </div>
              ))}
            </div>

            <div className="border-t border-slate-200 pt-6 mt-6">
              <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Need Immediate Answers?</h5>
              <p className="text-sm text-slate-600 leading-relaxed mb-4">
                Connect directly with our franchise coordinators for a friendly introductory conversation.
              </p>
              <a
                href={WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm font-bold text-blue-600 hover:text-blue-700 transition-colors"
              >
                Chat on WhatsApp <Phone className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>

      </div>
    </PageShell>
  );
}
