import { Link, useParams } from "react-router";
import type { Route } from "./+types/branches.$slug";
import { PageShell } from "../components/PageShell";
import { JsonLd } from "../components/JsonLd";
import { BranchCard } from "../components/branch/BranchCard";
import {
  BranchBreadcrumb,
  BranchPageCanvas,
  BranchPageHero,
} from "../components/branch/BranchPagesUi";
import { PRESCHOOL_BRANCHES } from "../lib/constants";
import {
  branchPageJsonLd,
  branchPagePath,
  buildPageMeta,
  getBranchBySlug,
} from "../lib/seo";

export function meta({ params }: Route.MetaArgs) {
  const branch = getBranchBySlug(params.slug ?? "");
  if (!branch) {
    return [{ title: "Branch Not Found | Simba Preschool" }];
  }

  const aliasText =
    branch.searchAliases && branch.searchAliases.length > 0
      ? ` Also known as ${branch.searchAliases.map((alias) => `Simba Preschool ${alias}`).join(", ")}.`
      : "";

  return buildPageMeta({
    title: `${branch.seoTitle} Salem | Admissions & Contact`,
    description: `${branch.seoDescription}${aliasText}`,
    path: branchPagePath(branch),
    keywords: [
      branch.seoTitle,
      `${branch.seoTitle} Salem`,
      `preschool ${branch.areaName} Salem`,
      ...(branch.searchAliases?.flatMap((alias) => [
        `Simba Preschool ${alias}`,
        `preschool ${alias} Salem`,
      ]) ?? []),
    ],
  });
}

export default function BranchPage() {
  const { slug = "" } = useParams();
  const branch = getBranchBySlug(slug);

  if (!branch) {
    return (
      <PageShell headerVariant="overlay">
        <div className="flex min-h-screen flex-col items-center justify-center px-6 py-24 text-center">
          <h1 className="text-3xl font-extrabold text-slate-900">Branch not found</h1>
          <p className="mt-3 max-w-md text-slate-600">
            We could not find that campus. Browse all Simba Preschool locations in Salem.
          </p>
          <Link
            to="/branches"
            className="mt-8 inline-flex rounded-full bg-[#E8AF34] px-6 py-3 text-sm font-extrabold text-[#2C1810] hover:bg-[#D9A42E]"
          >
            View all branches
          </Link>
        </div>
      </PageShell>
    );
  }

  const branchIndex = PRESCHOOL_BRANCHES.findIndex((item) => item.slug === branch.slug);
  const aliasNote =
    branch.searchAliases && branch.searchAliases.length > 0
      ? ` Also searched as ${branch.searchAliases.join(" · ")}.`
      : "";

  return (
    <PageShell headerVariant="overlay">
      <JsonLd data={branchPageJsonLd(branch)} />

      <BranchPageCanvas>
        <BranchPageHero
          eyebrow={branch.areaName}
          title={branch.seoTitle}
          description={`Playgroup, Pre-KG, LKG, and UKG in ${branch.locationLabel}.${aliasNote}`}
          breadcrumb={
            <BranchBreadcrumb
              items={[
                { label: "Home", to: "/" },
                { label: "Branches", to: "/branches" },
                { label: branch.areaName },
              ]}
            />
          }
        />

        <section className="branch-detail-section mx-auto max-w-5xl px-6 pb-14 pt-6 sm:px-12 sm:pb-16 sm:pt-8">
          <BranchCard branch={branch} index={branchIndex} variant="featured" />
        </section>
      </BranchPageCanvas>
    </PageShell>
  );
}
