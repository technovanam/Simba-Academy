import { Link } from "react-router";
import type { Route } from "./+types/branches._index";
import { PageShell } from "../components/PageShell";
import { BranchesSection } from "../components/BranchesSection";
import { JsonLd } from "../components/JsonLd";
import {
  BranchBreadcrumb,
  BranchPageCanvas,
  BranchPageHero,
} from "../components/branch/BranchPagesUi";
import { BRANCHES_INDEX_SEO, branchesIndexJsonLd, buildPageMeta } from "../lib/seo";

export function meta({}: Route.MetaArgs) {
  return buildPageMeta(BRANCHES_INDEX_SEO);
}

export default function BranchesIndexPage() {
  return (
    <PageShell headerVariant="overlay">
      <JsonLd data={branchesIndexJsonLd()} />

      <BranchPageCanvas>
        <BranchPageHero
          eyebrow="Our campuses"
          title="Simba Preschool branches in Salem"
          description="Explore all five campuses, view maps, and connect with the branch team nearest to you."
          breadcrumb={
            <BranchBreadcrumb
              items={[
                { label: "Home", to: "/" },
                { label: "Branches" },
              ]}
            />
          }
        />

        <div className="branch-page-grid-wrap px-6 pb-14 sm:px-12 sm:pb-16">
          <BranchesSection showHeader={false} embedded />
          <p className="mt-10 text-center text-sm font-medium text-slate-600">
            Need help choosing a campus?{" "}
            <Link to="/contact" className="font-bold text-[#9A6B1A] hover:underline">
              Speak with admissions
            </Link>
          </p>
        </div>
      </BranchPageCanvas>
    </PageShell>
  );
}
