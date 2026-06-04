import { useEffect, useState } from "react";
import type { Route } from "./+types/gallery";
import { PageShell } from "../components/PageShell";
import { api, type GalleryItem } from "../lib/api";
import { resolveStorageUrl } from "../lib/storage";
import { ImageIcon } from "lucide-react";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Gallery | Simba Academy Preschool" },
    { name: "description", content: "View photos and moments from Simba Academy preschool activities and events." },
  ];
}

export default function GalleryPage() {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getGallery()
      .then(setItems)
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <PageShell>
      <section className="max-w-6xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h1 className="font-sans text-4xl md:text-5xl font-extrabold text-[#3E2723] mb-4">Gallery</h1>
          <p className="text-[#5D4037] font-semibold">Snapshots from our savanna — crafts, celebrations, and daily adventures.</p>
        </div>

        {loading ? (
          <p className="text-center font-semibold text-[#5D4037]">Loading gallery...</p>
        ) : items.length === 0 ? (
          <div className="glass-panel rounded-lg p-12 text-center max-w-xl mx-auto">
            <ImageIcon className="w-16 h-16 mx-auto mb-4 text-[#8AC926]/50" />
            <p className="font-semibold text-[#5D4037]">Gallery photos will appear here once uploaded by the admin team.</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.filter((item) => item.type === "IMAGE").map((item) => (
              <div key={item.id} className="glass-panel rounded-lg overflow-hidden">
                <img src={resolveStorageUrl(item.imageUrl)} alt={item.title ?? "Gallery"} className="w-full h-56 object-cover" />
                {item.title && <p className="p-4 font-bold text-sm">{item.title}</p>}
              </div>
            ))}
          </div>
        )}
      </section>
    </PageShell>
  );
}
