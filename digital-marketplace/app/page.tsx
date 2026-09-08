import { supabase } from "@/lib/supabase";
import Link from "next/link";

const CATEGORY_LABELS: Record<string, string> = {
  ebook: "Ebooks",
  course: "Courses",
  design_template: "Design Templates",
  business_proposal: "Business Proposals",
  web_template: "Web Templates",
  journal_research: "Journal & Research",
  project_files: "Project Files",
  idea_brief: "Idea Briefs",
};

export default async function HomePage() {
  const { data: products } = await supabase
    .from("products")
    .select("id, title, slug, category, price_kobo, preview_images")
    .eq("is_published", true)
    .order("created_at", { ascending: false });

  const byCategory: Record<string, typeof products> = {};
  for (const p of products ?? []) {
    (byCategory[p.category] ??= []).push(p);
  }

  return (
    <main style={{ maxWidth: 960, margin: "0 auto", padding: "2rem" }}>
      <h1>Digital Goods</h1>
      {Object.entries(byCategory).map(([category, items]) => (
        <section key={category} style={{ marginTop: "2rem" }}>
          <h2>{CATEGORY_LABELS[category] ?? category}</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "1rem" }}>
            {items!.map((p) => (
              <Link key={p.id} href={`/product/${p.slug}`} style={{ border: "1px solid #ddd", borderRadius: 8, padding: "1rem", textDecoration: "none", color: "inherit" }}>
                {p.preview_images?.[0] && (
                  <img src={p.preview_images[0]} alt={p.title} style={{ width: "100%", borderRadius: 4 }} />
                )}
                <h3>{p.title}</h3>
                <p>₦{(p.price_kobo / 100).toLocaleString()}</p>
              </Link>
            ))}
          </div>
        </section>
      ))}
    </main>
  );
}
