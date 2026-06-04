import bcrypt from "bcryptjs";
import fs from "node:fs";
import path from "node:path";
import { prisma } from "./database.js";
import { env } from "./env.js";

const DEMO_PASSWORD = process.env.DEMO_SEED_PASSWORD ?? "Simba@Demo2026";

const TEACHERS = [
  {
    email: "priya.teacher@simbapreschool.in",
    name: "Priya Lakshmi",
    firstName: "Priya",
    lastName: "Lakshmi",
    employeeId: "TCH-001",
  },
  {
    email: "karthik.teacher@simbapreschool.in",
    name: "Karthik Murugan",
    firstName: "Karthik",
    lastName: "Murugan",
    employeeId: "TCH-002",
  },
] as const;

const DEMO_UPLOAD = "/uploads/demo-seed-worksheet.pdf";
const DEMO_PROOF = "/uploads/demo-seed-task-proof.pdf";

function ensureDemoUploadFiles(): void {
  const storageRoot = path.resolve(env.STORAGE_PATH);
  const uploadsDir = path.join(storageRoot, "uploads");
  fs.mkdirSync(uploadsDir, { recursive: true });
  const placeholder = "%PDF-1.4\n% Simba Academy demo file for approval testing\n";
  for (const rel of [DEMO_UPLOAD, DEMO_PROOF]) {
    const filename = rel.replace("/uploads/", "");
    const full = path.join(uploadsDir, filename);
    if (!fs.existsSync(full)) {
      fs.writeFileSync(full, placeholder);
    }
  }
}

async function upsertTeacher(teacher: (typeof TEACHERS)[number]) {
  const hashed = await bcrypt.hash(DEMO_PASSWORD, 12);
  const email = teacher.email.toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return prisma.user.update({
      where: { email },
      data: {
        name: teacher.name,
        firstName: teacher.firstName,
        lastName: teacher.lastName,
        employeeId: teacher.employeeId,
        role: "TEACHER",
        status: "ACTIVE",
        isDeleted: false,
      },
    });
  }
  return prisma.user.create({
    data: {
      email,
      password: hashed,
      name: teacher.name,
      firstName: teacher.firstName,
      lastName: teacher.lastName,
      employeeId: teacher.employeeId,
      role: "TEACHER",
      status: "ACTIVE",
    },
  });
}

export async function seedDemoData(): Promise<void> {
  ensureDemoUploadFiles();

  const teachers = [];
  for (const t of TEACHERS) {
    teachers.push(await upsertTeacher(t));
  }
  const [priya, karthik] = teachers;

  let course = await prisma.course.findFirst({
    where: { slug: "playgroup-foundations" },
  });
  if (!course) {
    course = await prisma.course.create({
      data: {
        title: "Playgroup Foundations",
        slug: "playgroup-foundations",
        description: "Demo course for material approval testing",
        level: "Playgroup",
        price: 15000,
        isActive: true,
      },
    });
  }

  const materialSeeds = [
    {
      title: "Phonics Worksheet — Week 1",
      description: "Uploaded by teacher for admin approval",
      type: "PDF",
      teacherId: priya.id,
    },
    {
      title: "Circle Time Activity Plan",
      description: "PPT lesson plan pending review",
      type: "PPT",
      teacherId: karthik.id,
    },
  ];

  for (const m of materialSeeds) {
    const exists = await prisma.material.findFirst({
      where: { title: m.title, uploadedById: m.teacherId },
    });
    if (!exists) {
      await prisma.material.create({
        data: {
          title: m.title,
          description: m.description,
          type: m.type,
          fileUrl: DEMO_UPLOAD,
          fileSize: 1200,
          isApproved: false,
          courseId: course.id,
          uploadedById: m.teacherId,
        },
      });
    }
  }

  const taskWithProofTitle = "Upload weekly classroom photos";
  let proofTask = await prisma.task.findFirst({
    where: { title: taskWithProofTitle, teacherId: priya.id },
  });
  if (!proofTask) {
    proofTask = await prisma.task.create({
      data: {
        title: taskWithProofTitle,
        description: "Share photos from this week's activities.",
        dueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        teacherId: priya.id,
        status: "COMPLETED",
        proofUrl: DEMO_PROOF,
        proofDesc: "Uploaded 6 classroom photos for admin review (demo seed).",
      },
    });
  } else if (!proofTask.proofUrl) {
    await prisma.task.update({
      where: { id: proofTask.id },
      data: {
        status: "COMPLETED",
        proofUrl: DEMO_PROOF,
        proofDesc: "Uploaded 6 classroom photos for admin review (demo seed).",
      },
    });
  }

  const futureTaskTitle = "Prepare Annual Day rehearsal plan";
  const futureDue = new Date();
  futureDue.setDate(futureDue.getDate() + 14);
  const futureExists = await prisma.task.findFirst({
    where: { title: futureTaskTitle, teacherId: karthik.id },
  });
  if (!futureExists) {
    await prisma.task.create({
      data: {
        title: futureTaskTitle,
        description: "Draft rehearsal schedule and send to admin.",
        dueDate: futureDue,
        teacherId: karthik.id,
        status: "PENDING",
      },
    });
  }

  const admissionSeeds = [
    {
      name: "Meera & Ravi Kumar",
      email: "meera.parent@example.com",
      phone: "+91 98765 43210",
      message:
        "Interested in Playgroup admission for our 2-year-old. Please share fee structure and visit timings.",
      isRead: false,
    },
    {
      name: "Anitha Subramanian",
      email: "anitha.s@example.com",
      phone: "+91 94430 11223",
      message: "Looking for LKG seat for June 2026. Kuranguchavadi branch preferred.",
      isRead: false,
    },
  ];

  for (const row of admissionSeeds) {
    const exists = await prisma.inquiry.findFirst({ where: { email: row.email } });
    if (!exists) {
      await prisma.inquiry.create({ data: row });
    }
  }

  const franchiseSeeds = [
    {
      name: "Rajesh Venkataraman",
      email: "rajesh.franchise@example.com",
      phone: "+91 98420 55661",
      location: "Coimbatore, Tamil Nadu",
      message: "Interested in Simba Preschool franchise. Please share investment and support details.",
      isRead: false,
    },
    {
      name: "Deepa & Mohan",
      email: "deepa.mohan@example.com",
      phone: "+91 63800 99001",
      location: "Salem — Steel Plant Road area",
      message: "We have commercial space available and want to discuss franchise partnership.",
      isRead: false,
    },
  ];

  for (const row of franchiseSeeds) {
    const exists = await prisma.franchiseInquiry.findFirst({ where: { email: row.email } });
    if (!exists) {
      await prisma.franchiseInquiry.create({ data: row });
    }
  }

  console.log("\n✅ Demo seed complete\n");
  console.log("Teachers (password for all):", DEMO_PASSWORD);
  for (const t of TEACHERS) {
    console.log(`  • ${t.email}`);
  }
  console.log("\nAdmin portal checks:");
  console.log("  • Assign Tasks — due date cannot be in the past");
  console.log("  • Approve Uploads — 2 pending materials + 1 task proof");
  console.log("  • Admissions Leads — 2 admissions + 2 franchise inquiries");
  console.log(`  • Teacher login: http://localhost:5173/teacher/login\n`);
}

if (process.argv[1]?.includes("seedDemo")) {
  seedDemoData()
    .then(async () => {
      await prisma.$disconnect();
      process.exit(0);
    })
    .catch(async (err) => {
      console.error(err);
      await prisma.$disconnect();
      process.exit(1);
    });
}
