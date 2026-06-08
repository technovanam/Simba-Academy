import { useEffect, useState } from "react";
import type { Route } from "./+types/landing";
import { PageShell } from "../components/PageShell";
import { ContactForm } from "../components/ContactForm";
import { FranchiseForm } from "../components/FranchiseForm";
import { api, type PublicReview, type GalleryItem } from "../lib/api";
import { GoogleReviewCard } from "../components/GoogleReviewCard";
import { resolveStorageUrl } from "../lib/storage";
import { Award, Image as ImageIcon, MessageSquare, Sparkles } from "lucide-react";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Welcome to Simba Academy | Preschool & Franchise" },
    {
      name: "description",
      content:
        "Welcome to Simba Academy. Explore parent reviews, view our school activities, and submit general or franchise inquiries.",
    },
  ];
}

export default function LandingPage() {
  const [activeTab, setActiveTab] = useState<"general" | "franchise">("general");
  const [reviews, setReviews] = useState<PublicReview[]>([]);
  const [gallery, setGallery] = useState<GalleryItem[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [loadingGallery, setLoadingGallery] = useState(true);

  useEffect(() => {
    // Fetch parent reviews
    api
      .getPublicReviews()
      .then((res) => {
        setReviews(res.reviews || []);
      })
      .catch((err) => {
        console.error("Failed to load public reviews:", err);
        setReviews([]);
      })
      .finally(() => setLoadingReviews(false));

    // Fetch media gallery
    api
      .getGallery()
      .then((res) => {
        setGallery(res || []);
      })
      .catch((err) => {
        console.error("Failed to load gallery:", err);
        setGallery([]);
      })
      .finally(() => setLoadingGallery(false));
  }, []);

  return (
    <PageShell>
      {/* ── HERO SECTION ── */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#E3F2FD] via-[#FAF8F5] to-white py-20 px-6">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-96 h-96 bg-[#8AC926]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-96 h-96 bg-[#FF9F1C]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-5xl mx-auto text-center relative z-10 space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#8AC926]/10 border border-[#8AC926]/20 text-[#6B9E1A] font-extrabold text-2xs uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            Discover Simba Academy
          </div>

          <h1 className="font-sans text-4xl md:text-6xl font-black text-[#3E2723] leading-tight tracking-tight">
            Where Little Learners <br />
            <span className="text-[#8AC926]">Grow &amp; Achieve</span>
          </h1>

          <p className="text-[#5D4037] font-semibold text-lg max-w-2xl mx-auto leading-relaxed">
            Welcome to Simba Academy's inquiry portal. Learn more about our premium preschool
            education, view our media archives, read reviews from parents, or submit an inquiry to
            join our family.
          </p>

          <div className="flex flex-wrap justify-center gap-4 pt-4">
            <a
              href="#inquire"
              className="px-8 py-4 rounded-xl bg-[#FF9F1C] border-b-4 border-[#E07A00] text-white font-sans font-extrabold text-base hover:bg-[#FFAE33] transition-all transform hover:-translate-y-0.5 shadow-lg shadow-[#FF9F1C]/20"
            >
              Inquire Now
            </a>
            <a
              href="#reviews"
              className="px-8 py-4 rounded-xl bg-white border-2 border-slate-200 text-[#3E2723] font-sans font-extrabold text-base hover:bg-slate-50 transition-all transform hover:-translate-y-0.5"
            >
              Read Parent Reviews
            </a>
          </div>
        </div>
      </section>

      {/* ── INQUIRY FORMS SECTION ── */}
      <section id="inquire" className="py-20 px-6 bg-white relative">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10 space-y-3">
            <h2 className="font-sans text-3xl md:text-4xl font-extrabold text-[#3E2723]">
              Send Us an Inquiry
            </h2>
            <p className="text-[#5D4037] font-semibold">
              Fill out the form below, and we will get back to you shortly via email.
            </p>
          </div>

          {/* Form Tab Switcher */}
          <div className="flex bg-slate-100 p-1.5 rounded-2xl mb-8 max-w-md mx-auto border border-slate-200/60 shadow-inner">
            <button
              onClick={() => setActiveTab("general")}
              className={`flex-1 py-3 px-4 rounded-xl font-sans font-extrabold text-sm tracking-wide transition-all ${
                activeTab === "general"
                  ? "bg-white text-[#3E2723] shadow-md"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              General Enquiry
            </button>
            <button
              onClick={() => setActiveTab("franchise")}
              className={`flex-1 py-3 px-4 rounded-xl font-sans font-extrabold text-sm tracking-wide transition-all ${
                activeTab === "franchise"
                  ? "bg-white text-[#3E2723] shadow-md"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Franchise Enquiry
            </button>
          </div>

          {/* Render Active Form */}
          <div className="transition-all duration-300 transform">
            {activeTab === "general" ? (
              <div className="animate-fade-in">
                <ContactForm defaultType="Preschool" />
              </div>
            ) : (
              <div className="animate-fade-in">
                <FranchiseForm />
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── PARENT REVIEWS SECTION ── */}
      <section id="reviews" className="py-20 px-6 bg-[#FAF8F5] border-t border-b border-slate-100">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-100 text-[#E07A00] font-extrabold text-3xs uppercase tracking-wider">
                <Award className="w-3.5 h-3.5" />
                Parent Testimonials
              </div>
              <h2 className="font-sans text-3xl md:text-4xl font-extrabold text-[#3E2723]">
                What Our Community Says
              </h2>
              <p className="text-[#5D4037] font-semibold max-w-2xl">
                Read authentic feedback and reviews shared by parents of children at Simba Academy.
              </p>
            </div>
          </div>

          {loadingReviews ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <div className="w-8 h-8 rounded-full border-4 border-slate-200 border-t-[#8AC926] animate-spin" />
              <p className="font-semibold text-slate-500 text-sm">Loading reviews...</p>
            </div>
          ) : reviews.length === 0 ? (
            <div className="glass-panel rounded-2xl p-12 text-center max-w-xl mx-auto bg-white">
              <MessageSquare className="w-12 h-12 mx-auto mb-4 text-[#8AC926]/40" />
              <p className="font-semibold text-[#5D4037]">
                Reviews will appear here once approved by our administrator team.
              </p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {reviews.slice(0, 6).map((review, idx) => (
                <div key={idx} className="transition-transform duration-300 hover:scale-[1.02]">
                  <GoogleReviewCard review={review} />
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── MEDIA GALLERY SECTION ── */}
      <section id="gallery" className="py-20 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12 space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-600 font-extrabold text-3xs uppercase tracking-wider">
              <ImageIcon className="w-3.5 h-3.5" />
              Moments Showcase
            </div>
            <h2 className="font-sans text-3xl md:text-4xl font-extrabold text-[#3E2723]">
              Savanna Media Gallery
            </h2>
            <p className="text-[#5D4037] font-semibold max-w-xl mx-auto">
              A look into our classrooms, field trips, celebrations, and interactive learning
              moments.
            </p>
          </div>

          {loadingGallery ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <div className="w-8 h-8 rounded-full border-4 border-slate-200 border-t-[#8AC926] animate-spin" />
              <p className="font-semibold text-slate-500 text-sm">Loading media gallery...</p>
            </div>
          ) : gallery.length === 0 ? (
            <div className="glass-panel rounded-2xl p-12 text-center max-w-xl mx-auto bg-white">
              <ImageIcon className="w-12 h-12 mx-auto mb-4 text-[#8AC926]/40" />
              <p className="font-semibold text-[#5D4037]">Photos will be available here soon.</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {gallery
                .filter((item) => item.type === "IMAGE")
                .slice(0, 6)
                .map((item) => (
                  <div
                    key={item.id}
                    className="group relative overflow-hidden rounded-2xl border-2 border-slate-100 bg-slate-50 shadow-md transition-all duration-300 hover:shadow-xl hover:border-[#8AC926]/40"
                  >
                    <div className="overflow-hidden aspect-video relative">
                      <img
                        src={resolveStorageUrl(item.imageUrl)}
                        alt={item.title ?? "Gallery Momemt"}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-slate-900/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4" />
                    </div>
                    {item.title && (
                      <div className="p-4 bg-white border-t border-slate-100">
                        <p className="font-extrabold text-sm text-[#3E2723]">{item.title}</p>
                      </div>
                    )}
                  </div>
                ))}
            </div>
          )}
        </div>
      </section>
    </PageShell>
  );
}
