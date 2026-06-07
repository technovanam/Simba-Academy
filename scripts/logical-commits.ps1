# Creates logical commits from the current working tree (run from repo root).
$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot/..

function Commit-Group([string]$Message, [string[]]$Paths) {
  $existing = @()
  foreach ($p in $Paths) {
    if (Test-Path $p) { $existing += $p }
  }
  if ($existing.Count -eq 0) {
    Write-Host "skip (no paths): $Message"
    return
  }
  git add -- $existing
  $status = git diff --cached --quiet; if ($LASTEXITCODE -ne 0) {
    git commit -m $Message
    Write-Host "OK: $Message"
  } else {
    Write-Host "skip (empty): $Message"
  }
}

Commit-Group "test: add Playwright E2E harness at repo root" @(
  "package.json", "package-lock.json", "playwright.config.ts", "tests"
)
Commit-Group "ci: add GitHub Actions workflow" @(".github")
Commit-Group "chore: extend gitignore for Vercel and deploy artifacts" @(".gitignore")
Commit-Group "feat(backend): extend Prisma schema for portal features" @("backend/prisma/schema.prisma")
Commit-Group "feat(backend): reuse Prisma client in serverless runtimes" @("backend/src/config/database.ts")
Commit-Group "feat(backend): expand env config and request schemas" @(
  "backend/src/config/env.ts", "backend/src/config/schemas.ts", "backend/.env.example"
)
Commit-Group "feat(backend): refresh demo seed accounts for QA" @("backend/src/config/seedDemo.ts")
Commit-Group "refactor(backend): split Express app from server bootstrap" @(
  "backend/src/app.ts", "backend/src/index.ts", "backend/src/instrument.ts"
)
Commit-Group "feat(backend): add Vercel serverless deploy entry" @(
  "backend/api", "backend/vercel.json", "backend/DEPLOY-VERCEL.md", "backend/.env.vercel.example"
)
Commit-Group "feat(backend): add cPanel deploy scripts and guide" @(
  "backend/DEPLOY-CPANEL.md", "backend/scripts/cpanel-deploy.sh", "backend/scripts/cpanel-pack.mjs", ".cpanel.yml"
)
Commit-Group "feat(backend): add SQL and diagnostic maintenance scripts" @(
  "backend/scripts/add-student-class.sql",
  "backend/scripts/create-lesson-plans.sql",
  "backend/scripts/migrate-schema.mjs",
  "backend/scripts/reviews-report.mjs",
  "backend/scripts/verify-all-features.mjs",
  "backend/scripts/production-readiness.mjs"
)
Commit-Group "feat(backend): improve Google reviews and Business Profile sync" @(
  "backend/src/services/googleBusinessProfile.ts",
  "backend/src/services/googleReviews.ts",
  "backend/src/routes/reviews.ts"
)
Commit-Group "feat(backend): add student portal API routes" @("backend/src/routes/student.ts")
Commit-Group "feat(backend): add portal email and notification services" @(
  "backend/src/services/portalEmails.ts",
  "backend/src/services/portalNotifications.ts"
)
Commit-Group "feat(backend): expand admin API for tasks and lesson plans" @("backend/src/routes/admin.ts")
Commit-Group "feat(backend): harden auth flows and API rate limiting" @(
  "backend/src/routes/auth.ts",
  "backend/src/middleware/rateLimiter.ts"
)
Commit-Group "feat(backend): improve library, teacher, and storage routes" @(
  "backend/src/routes/library.ts",
  "backend/src/routes/teacher.ts",
  "backend/src/routes/storage.ts"
)
Commit-Group "feat(backend): update Zoho payment routes and services" @(
  "backend/src/routes/payments.ts",
  "backend/src/services/payment.ts",
  "backend/src/services/zohoPayments.ts"
)
Commit-Group "chore(backend): update dependencies for deploy targets" @(
  "backend/package.json", "backend/package-lock.json"
)
Commit-Group "feat(frontend): split admin portal into dedicated routes" @(
  "frontend/app/routes/admin",
  "frontend/app/routes/admin.dashboard.tsx",
  "frontend/app/lib/adminRoutes.ts",
  "frontend/app/routes.ts"
)
Commit-Group "feat(frontend): split student portal into tabbed routes" @(
  "frontend/app/routes/student",
  "frontend/app/routes/student.dashboard.tsx",
  "frontend/app/lib/studentRoutes.ts",
  "frontend/app/lib/studentTheme.ts"
)
Commit-Group "feat(frontend): split teacher portal into tabbed routes" @(
  "frontend/app/routes/teacher",
  "frontend/app/routes/teacher.dashboard.tsx",
  "frontend/app/lib/teacherRoutes.ts"
)
Commit-Group "feat(frontend): add Google-style review cards on home page" @(
  "frontend/app/components/GoogleReviewCard.tsx",
  "frontend/app/welcome/welcome.tsx",
  "frontend/app/routes/home.tsx"
)
Commit-Group "feat(frontend): add admin tab shell and management panels" @(
  "frontend/app/components/admin",
  "frontend/app/components/AdminListUi.tsx",
  "frontend/app/components/AdminPaymentsPanel.tsx",
  "frontend/app/components/AdminPeoplePanel.tsx",
  "frontend/app/components/AdminLessonPlansPanel.tsx",
  "frontend/app/components/LessonPlanViewerModal.tsx"
)
Commit-Group "feat(frontend): add student portal layout and tab bodies" @(
  "frontend/app/components/student",
  "frontend/app/components/PortalPageShell.tsx"
)
Commit-Group "feat(frontend): add teacher portal pages and inline story viewer" @(
  "frontend/app/components/teacher",
  "frontend/app/components/TeacherSettingsPanel.tsx",
  "frontend/app/components/StoryBookInlineViewer.tsx"
)
Commit-Group "feat(frontend): improve auth UI, forms, and checkout flow" @(
  "frontend/app/components/AuthUi.tsx",
  "frontend/app/components/ContactForm.tsx",
  "frontend/app/components/FranchiseForm.tsx",
  "frontend/app/components/PasswordInput.tsx",
  "frontend/app/components/PortalSelect.tsx",
  "frontend/app/components/FormPillSelect.tsx",
  "frontend/app/components/MockPaymentModal.tsx",
  "frontend/app/lib/useMockPaymentGateway.tsx",
  "frontend/app/lib/zohoCheckout.ts",
  "frontend/app/routes/login.tsx",
  "frontend/app/routes/register.tsx",
  "frontend/app/routes/student.checkout.tsx",
  "frontend/app/routes/admin.login.tsx",
  "frontend/app/routes/teacher.login.tsx"
)
Commit-Group "feat(frontend): add monitoring helpers and API client updates" @(
  "frontend/app/lib/monitoring.ts",
  "frontend/app/lib/actionGuard.ts",
  "frontend/app/lib/api.ts",
  "frontend/app/lib/constants.ts",
  "frontend/app/root.tsx"
)
Commit-Group "feat(frontend): configure Vercel preset and deploy docs" @(
  "frontend/react-router.config.ts",
  "frontend/vercel.json",
  "frontend/DEPLOY-VERCEL.md",
  "frontend/.env.example",
  "frontend/package.json",
  "frontend/package-lock.json"
)
Commit-Group "feat(frontend): add SEO robots.txt and sitemap" @(
  "frontend/public/robots.txt",
  "frontend/public/sitemap.xml"
)
Commit-Group "feat(frontend): add student auth and marketing image assets" @(
  "frontend/public/ChatGPT Image Jun 5, 2026, 03_01_58 PM.png",
  "frontend/public/ChatGPT Image Jun 5, 2026, 03_04_26 PM.png",
  "frontend/public/Login & SignUp.avif",
  "frontend/public/student-auth-bg-desktop.png",
  "frontend/public/student-auth-bg-mobile.png",
  "frontend/public/student-auth-jungle.avif"
)
Commit-Group "chore(frontend): add admin tab codegen script" @("frontend/scripts")
Commit-Group "docs: add monorepo Vercel deployment overview" @("DEPLOY-VERCEL.md")
Commit-Group "chore(frontend): add route types shim for production builds" @("frontend/app/+types-shim.d.ts")

$left = git status --short
if ($left) {
  Write-Host "`nRemaining uncommitted files:"
  Write-Host $left
  git add -A
  git commit -m "chore: commit remaining platform files from working tree"
}

Write-Host "`nDone. Commit count on branch:"
git rev-list --count HEAD
