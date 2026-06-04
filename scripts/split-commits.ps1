# Split workspace changes into ~45 logical commits (run from repo root)
$ErrorActionPreference = "Stop"
Set-Location (Join-Path $PSScriptRoot "..")

function Commit-Files {
    param([string]$Message, [string[]]$Paths)
    if (-not $Paths -or $Paths.Count -eq 0) { return }
    $existing = @()
    foreach ($p in $Paths) {
        if (Test-Path $p) { $existing += $p }
    }
    if ($existing.Count -eq 0) { return }
    git add @existing
    $staged = git diff --cached --name-only
    if (-not $staged) { return }
    git commit -m $Message
    Write-Host "OK: $Message"
}

$commits = @(
    @{ M = "chore: update gitignore for local artifacts"; P = @(".gitignore") },
    @{ M = "docs(backend): document Zoho Payments in env example"; P = @("backend/.env.example") },
    @{ M = "feat(db): extend User account fields and StoryBook audience"; P = @("backend/prisma/schema.prisma") },
    @{ M = "fix(backend): improve Prisma MariaDB adapter configuration"; P = @("backend/src/config/database.ts") },
    @{ M = "feat(backend): add Zoho and Google environment settings"; P = @("backend/src/config/env.ts") },
    @{ M = "feat(backend): expand Zod schemas for admin and library"; P = @("backend/src/config/schemas.ts") },
    @{ M = "refactor(backend): remove legacy Razorpay type definitions"; P = @("backend/src/types/razorpay.d.ts") },
    @{ M = "feat(backend): add Zoho Payments API client service"; P = @("backend/src/services/zohoPayments.ts") },
    @{ M = "feat(backend): migrate payment service to Zoho Payments"; P = @("backend/src/services/payment.ts") },
    @{ M = "feat(backend): update payment routes for Zoho checkout"; P = @("backend/src/routes/payments.ts") },
    @{ M = "feat(backend): add removeStoredFile for WebDAV and local storage"; P = @("backend/src/services/removeStoredFile.ts") },
    @{ M = "feat(backend): add hardDeleteUser for permanent account removal"; P = @("backend/src/services/hardDeleteUser.ts") },
    @{ M = "feat(backend): add library file streaming helper"; P = @("backend/src/services/libraryFile.ts") },
    @{ M = "feat(backend): add library audience access rules"; P = @("backend/src/utils/libraryAudience.ts") },
    @{ M = "feat(backend): add role-aware password reset URL builder"; P = @("backend/src/utils/passwordResetUrl.ts") },
    @{ M = "feat(backend): add Google review shared types"; P = @("backend/src/services/googleReviewTypes.ts") },
    @{ M = "feat(backend): persist Google Business Profile cooldown state"; P = @("backend/src/services/googleBusinessProfileState.ts") },
    @{ M = "feat(backend): add Google Business Profile OAuth client"; P = @("backend/src/services/googleBusinessProfile.ts") },
    @{ M = "feat(backend): add Google reviews snapshot file storage"; P = @("backend/src/services/googleReviewsSnapshot.ts") },
    @{ M = "feat(backend): add Google reviews sync with rate-limit handling"; P = @("backend/src/services/googleReviews.ts") },
    @{ M = "feat(backend): improve email delivery and teacher welcome template"; P = @("backend/src/services/email.ts") },
    @{ M = "feat(backend): improve WebDAV upload and delete handling"; P = @("backend/src/services/webdav.ts") },
    @{ M = "feat(backend): hard-delete users and improve teacher onboarding email"; P = @("backend/src/routes/admin-users.ts") },
    @{ M = "feat(backend): extend admin routes for content and Google reviews"; P = @("backend/src/routes/admin.ts") },
    @{ M = "feat(backend): delete course materials and covers from storage"; P = @("backend/src/routes/courses.ts") },
    @{ M = "feat(backend): remove material files on delete in storage routes"; P = @("backend/src/routes/storage.ts") },
    @{ M = "feat(backend): add story library API routes"; P = @("backend/src/routes/library.ts") },
    @{ M = "feat(backend): add public reviews aggregation route"; P = @("backend/src/routes/reviews.ts") },
    @{ M = "feat(backend): extend public API for gallery and testimonials"; P = @("backend/src/routes/public.ts") },
    @{ M = "feat(backend): extend teacher tasks and library access"; P = @("backend/src/routes/teacher.ts") },
    @{ M = "feat(backend): extend auth for paid registration and password reset"; P = @("backend/src/routes/auth.ts") },
    @{ M = "feat(backend): register library and reviews routes in server"; P = @("backend/src/index.ts") },
    @{ M = "feat(backend): extend JWT auth for library file streaming"; P = @("backend/src/middleware/auth.ts") },
    @{ M = "feat(backend): add demo seed for teachers tasks and leads"; P = @("backend/src/config/seedDemo.ts") },
    @{ M = "chore(backend): add database check and migration scripts"; P = @(
        "backend/scripts/check-storage.mjs",
        "backend/scripts/migrate-payment-columns.mjs",
        "backend/scripts/migrate-storybook-audience.mjs",
        "backend/scripts/rename-payment-columns.sql",
        "backend/scripts/verify-admin-data.mjs"
    ) },
    @{ M = "chore(backend): add Google Places and Business Profile scripts"; P = @(
        "backend/scripts/find-google-place-id.mjs",
        "backend/scripts/google-list-business-account.mjs",
        "backend/scripts/google-sync-reviews.mjs",
        "backend/scripts/print-google-business-auth-url.mjs"
    ) },
    @{ M = "chore(backend): add purge-teachers maintenance script"; P = @("backend/scripts/purge-teachers.mjs") },
    @{ M = "chore(backend): update dependencies for Zoho and Prisma"; P = @("backend/package.json", "backend/package-lock.json") },
    @{ M = "feat(frontend): add admin payments tab route"; P = @("frontend/app/lib/adminRoutes.ts") },
    @{ M = "feat(frontend): extend API client for admin and Zoho flows"; P = @("frontend/app/lib/api.ts") },
    @{ M = "feat(frontend): add platform constants and auth portal paths"; P = @("frontend/app/lib/constants.ts", "frontend/app/lib/authPortalPaths.ts") },
    @{ M = "feat(frontend): add date helpers for task due dates"; P = @("frontend/app/lib/dates.ts") },
    @{ M = "feat(frontend): add library and storage URL helpers"; P = @("frontend/app/lib/library.ts", "frontend/app/lib/storage.ts") },
    @{ M = "feat(frontend): add Zoho checkout client helper"; P = @("frontend/app/lib/zohoCheckout.ts") },
    @{ M = "feat(frontend): add autofill blocking utilities and components"; P = @(
        "frontend/app/lib/disableAutofill.ts",
        "frontend/app/components/AntiAutofillTrap.tsx",
        "frontend/app/components/FormAutofillBlocker.tsx"
    ) },
    @{ M = "feat(frontend): add shared auth UI and toast components"; P = @(
        "frontend/app/components/AuthUi.tsx",
        "frontend/app/components/AuthForgotReset.tsx",
        "frontend/app/components/Toast.tsx",
        "frontend/app/components/PortalSelect.tsx"
    ) },
    @{ M = "feat(frontend): add RecentPaymentCard for dashboard widgets"; P = @("frontend/app/components/RecentPaymentCard.tsx") },
    @{ M = "feat(frontend): add AdminPaymentsPanel with search and pagination"; P = @("frontend/app/components/AdminPaymentsPanel.tsx") },
    @{ M = "feat(frontend): add story book and gallery action components"; P = @(
        "frontend/app/components/StoryBookActions.tsx",
        "frontend/app/components/GalleryItemActions.tsx"
    ) },
    @{ M = "feat(frontend): improve admin list and people management UI"; P = @(
        "frontend/app/components/AdminListUi.tsx",
        "frontend/app/components/AdminPeoplePanel.tsx",
        "frontend/app/components/PasswordInput.tsx"
    ) },
    @{ M = "feat(frontend): improve contact and franchise form modals"; P = @(
        "frontend/app/components/ContactForm.tsx",
        "frontend/app/components/FranchiseForm.tsx"
    ) },
    @{ M = "style(frontend): extend global app styles"; P = @("frontend/app/app.css") },
    @{ M = "feat(frontend): wire new routes in router config"; P = @("frontend/app/routes.ts") },
    @{ M = "feat(frontend): improve root layout and floating actions"; P = @("frontend/app/root.tsx") },
    @{ M = "feat(frontend): add password reset routes for all portals"; P = @(
        "frontend/app/routes/forgot-password.tsx",
        "frontend/app/routes/reset-password.tsx",
        "frontend/app/routes/admin.forgot-password.tsx",
        "frontend/app/routes/admin.reset-password.tsx"
    ) },
    @{ M = "feat(frontend): refactor student and teacher login flows"; P = @(
        "frontend/app/routes/login.tsx",
        "frontend/app/routes/teacher.login.tsx",
        "frontend/app/routes/admin.login.tsx"
    ) },
    @{ M = "feat(frontend): refactor registration with Zoho payment"; P = @("frontend/app/routes/register.tsx") },
    @{ M = "feat(frontend): update student checkout and dashboard"; P = @(
        "frontend/app/routes/student.checkout.tsx",
        "frontend/app/routes/student.dashboard.tsx"
    ) },
    @{ M = "feat(frontend): update teacher portal dashboards and password flows"; P = @(
        "frontend/app/routes/teacher.dashboard.tsx",
        "frontend/app/routes/teacher.change-password.tsx",
        "frontend/app/routes/teacher.forgot-password.tsx",
        "frontend/app/routes/teacher.reset-password.tsx"
    ) },
    @{ M = "feat(frontend): expand admin dashboard with payments and reviews"; P = @("frontend/app/routes/admin.dashboard.tsx") },
    @{ M = "feat(frontend): improve public home gallery and welcome pages"; P = @(
        "frontend/app/routes/home.tsx",
        "frontend/app/routes/gallery.tsx",
        "frontend/app/welcome/welcome.tsx"
    ) }
)

# First commit for .env.example alone was wrong - it's in commit 2 but whole file - split: commit 2 has full env example once
# Fix: merge env example into config commit only once
$commits[1].P = @() # skip duplicate - env in commit 5 area

# Re-order: put .env.example with env.ts commit
$commits = @(
    @{ M = "chore: update gitignore for local artifacts"; P = @(".gitignore") },
    @{ M = "feat(db): extend User account fields and StoryBook audience"; P = @("backend/prisma/schema.prisma") },
    @{ M = "fix(backend): improve Prisma MariaDB adapter configuration"; P = @("backend/src/config/database.ts") },
    @{ M = "feat(backend): add Zoho Google env config and example"; P = @("backend/src/config/env.ts", "backend/.env.example") },
    @{ M = "feat(backend): expand Zod schemas for admin and library"; P = @("backend/src/config/schemas.ts") },
    @{ M = "refactor(backend): remove legacy Razorpay type definitions"; P = @("backend/src/types/razorpay.d.ts") },
    @{ M = "feat(backend): add Zoho Payments API client service"; P = @("backend/src/services/zohoPayments.ts") },
    @{ M = "feat(backend): migrate payment service to Zoho Payments"; P = @("backend/src/services/payment.ts") },
    @{ M = "feat(backend): update payment routes for Zoho checkout"; P = @("backend/src/routes/payments.ts") },
    @{ M = "feat(backend): add removeStoredFile for WebDAV and local storage"; P = @("backend/src/services/removeStoredFile.ts") },
    @{ M = "feat(backend): add hardDeleteUser for permanent account removal"; P = @("backend/src/services/hardDeleteUser.ts") },
    @{ M = "feat(backend): add library file streaming helper"; P = @("backend/src/services/libraryFile.ts") },
    @{ M = "feat(backend): add library audience access rules"; P = @("backend/src/utils/libraryAudience.ts") },
    @{ M = "feat(backend): add role-aware password reset URL builder"; P = @("backend/src/utils/passwordResetUrl.ts") },
    @{ M = "feat(backend): add Google review shared types"; P = @("backend/src/services/googleReviewTypes.ts") },
    @{ M = "feat(backend): persist Google Business Profile cooldown state"; P = @("backend/src/services/googleBusinessProfileState.ts") },
    @{ M = "feat(backend): add Google Business Profile OAuth client"; P = @("backend/src/services/googleBusinessProfile.ts") },
    @{ M = "feat(backend): add Google reviews snapshot file storage"; P = @("backend/src/services/googleReviewsSnapshot.ts") },
    @{ M = "feat(backend): add Google reviews sync with rate-limit handling"; P = @("backend/src/services/googleReviews.ts") },
    @{ M = "feat(backend): improve email delivery and teacher welcome template"; P = @("backend/src/services/email.ts") },
    @{ M = "feat(backend): improve WebDAV upload and delete handling"; P = @("backend/src/services/webdav.ts") },
    @{ M = "feat(backend): hard-delete users and improve teacher onboarding email"; P = @("backend/src/routes/admin-users.ts") },
    @{ M = "feat(backend): extend admin routes for content and Google reviews"; P = @("backend/src/routes/admin.ts") },
    @{ M = "feat(backend): delete course materials and covers from storage"; P = @("backend/src/routes/courses.ts") },
    @{ M = "feat(backend): remove material files on delete in storage routes"; P = @("backend/src/routes/storage.ts") },
    @{ M = "feat(backend): add story library API routes"; P = @("backend/src/routes/library.ts") },
    @{ M = "feat(backend): add public reviews aggregation route"; P = @("backend/src/routes/reviews.ts") },
    @{ M = "feat(backend): extend public API for gallery and testimonials"; P = @("backend/src/routes/public.ts") },
    @{ M = "feat(backend): extend teacher tasks and library access"; P = @("backend/src/routes/teacher.ts") },
    @{ M = "feat(backend): extend auth for paid registration and password reset"; P = @("backend/src/routes/auth.ts") },
    @{ M = "feat(backend): register library and reviews routes in server"; P = @("backend/src/index.ts") },
    @{ M = "feat(backend): extend JWT auth for library file streaming"; P = @("backend/src/middleware/auth.ts") },
    @{ M = "feat(backend): add demo seed for teachers tasks and leads"; P = @("backend/src/config/seedDemo.ts") },
    @{ M = "chore(backend): add database check and migration scripts"; P = @(
        "backend/scripts/check-storage.mjs",
        "backend/scripts/migrate-payment-columns.mjs",
        "backend/scripts/migrate-storybook-audience.mjs",
        "backend/scripts/rename-payment-columns.sql",
        "backend/scripts/verify-admin-data.mjs"
    ) },
    @{ M = "chore(backend): add Google Places and Business Profile scripts"; P = @(
        "backend/scripts/find-google-place-id.mjs",
        "backend/scripts/google-list-business-account.mjs",
        "backend/scripts/google-sync-reviews.mjs",
        "backend/scripts/print-google-business-auth-url.mjs"
    ) },
    @{ M = "chore(backend): add purge-teachers maintenance script"; P = @("backend/scripts/purge-teachers.mjs") },
    @{ M = "chore(backend): update dependencies for Zoho and Prisma"; P = @("backend/package.json", "backend/package-lock.json") },
    @{ M = "feat(frontend): add admin payments tab route"; P = @("frontend/app/lib/adminRoutes.ts") },
    @{ M = "feat(frontend): extend API client for admin and Zoho flows"; P = @("frontend/app/lib/api.ts") },
    @{ M = "feat(frontend): add platform constants and auth portal paths"; P = @("frontend/app/lib/constants.ts", "frontend/app/lib/authPortalPaths.ts") },
    @{ M = "feat(frontend): add date helpers for task due dates"; P = @("frontend/app/lib/dates.ts") },
    @{ M = "feat(frontend): add library and storage URL helpers"; P = @("frontend/app/lib/library.ts", "frontend/app/lib/storage.ts") },
    @{ M = "feat(frontend): add Zoho checkout client helper"; P = @("frontend/app/lib/zohoCheckout.ts") },
    @{ M = "feat(frontend): add autofill blocking utilities and components"; P = @(
        "frontend/app/lib/disableAutofill.ts",
        "frontend/app/components/AntiAutofillTrap.tsx",
        "frontend/app/components/FormAutofillBlocker.tsx"
    ) },
    @{ M = "feat(frontend): add shared auth UI and toast components"; P = @(
        "frontend/app/components/AuthUi.tsx",
        "frontend/app/components/AuthForgotReset.tsx",
        "frontend/app/components/Toast.tsx",
        "frontend/app/components/PortalSelect.tsx"
    ) },
    @{ M = "feat(frontend): add RecentPaymentCard for dashboard widgets"; P = @("frontend/app/components/RecentPaymentCard.tsx") },
    @{ M = "feat(frontend): add AdminPaymentsPanel with search and pagination"; P = @("frontend/app/components/AdminPaymentsPanel.tsx") },
    @{ M = "feat(frontend): add story book and gallery action components"; P = @(
        "frontend/app/components/StoryBookActions.tsx",
        "frontend/app/components/GalleryItemActions.tsx"
    ) },
    @{ M = "feat(frontend): improve admin list and people management UI"; P = @(
        "frontend/app/components/AdminListUi.tsx",
        "frontend/app/components/AdminPeoplePanel.tsx",
        "frontend/app/components/PasswordInput.tsx"
    ) },
    @{ M = "feat(frontend): improve contact and franchise form modals"; P = @(
        "frontend/app/components/ContactForm.tsx",
        "frontend/app/components/FranchiseForm.tsx"
    ) },
    @{ M = "style(frontend): extend global app styles"; P = @("frontend/app/app.css") },
    @{ M = "feat(frontend): wire new routes in router config"; P = @("frontend/app/routes.ts") },
    @{ M = "feat(frontend): improve root layout and floating actions"; P = @("frontend/app/root.tsx") },
    @{ M = "feat(frontend): add password reset routes for all portals"; P = @(
        "frontend/app/routes/forgot-password.tsx",
        "frontend/app/routes/reset-password.tsx",
        "frontend/app/routes/admin.forgot-password.tsx",
        "frontend/app/routes/admin.reset-password.tsx"
    ) },
    @{ M = "feat(frontend): refactor student and teacher login flows"; P = @(
        "frontend/app/routes/login.tsx",
        "frontend/app/routes/teacher.login.tsx",
        "frontend/app/routes/admin.login.tsx"
    ) },
    @{ M = "feat(frontend): refactor registration with Zoho payment"; P = @("frontend/app/routes/register.tsx") },
    @{ M = "feat(frontend): update student checkout and dashboard"; P = @(
        "frontend/app/routes/student.checkout.tsx",
        "frontend/app/routes/student.dashboard.tsx"
    ) },
    @{ M = "feat(frontend): update teacher portal dashboards and password flows"; P = @(
        "frontend/app/routes/teacher.dashboard.tsx",
        "frontend/app/routes/teacher.change-password.tsx",
        "frontend/app/routes/teacher.forgot-password.tsx",
        "frontend/app/routes/teacher.reset-password.tsx"
    ) },
    @{ M = "feat(frontend): expand admin dashboard with payments and reviews"; P = @("frontend/app/routes/admin.dashboard.tsx") },
    @{ M = "feat(frontend): improve public home gallery and welcome pages"; P = @(
        "frontend/app/routes/home.tsx",
        "frontend/app/routes/gallery.tsx",
        "frontend/app/welcome/welcome.tsx"
    ) }
)

$count = 0
foreach ($c in $commits) {
    Commit-Files -Message $c.M -Paths $c.P
    if (git log -1 --format=%s 2>$null) { $count++ }
}

# Stage any remaining
$left = git status --porcelain
if ($left) {
    git add -A
    git commit -m "chore: commit remaining platform changes"
    $count++
}

Write-Host "`nTotal new commits attempted: $($commits.Count)"
git log --oneline -n 5
git status --short
