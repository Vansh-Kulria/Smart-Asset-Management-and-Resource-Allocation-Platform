const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const QRCode = require("qrcode");
const { Pool } = require("pg");
const { PrismaPg } = require("@prisma/adapter-pg");
require("dotenv").config({ override: true });

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is not defined in .env file.");
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding database starting...");

  // Clean existing tables (in order of relations)
  await prisma.auditLog.deleteMany({});
  await prisma.notification.deleteMany({});
  await prisma.maintenanceLog.deleteMany({});
  await prisma.returnLog.deleteMany({});
  await prisma.booking.deleteMany({});
  await prisma.account.deleteMany({});
  await prisma.session.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.asset.deleteMany({});

  console.log("Cleared existing database tables.");

  // Hash passwords
  const adminHash = await bcrypt.hash("AdminPassword123", 10);
  const memberHash = await bcrypt.hash("MemberPassword123", 10);

  // 1. Create Users
  const admin = await prisma.user.create({
    data: {
      name: "Main Council Admin",
      email: "admin@cultural.iitr.ac.in",
      password: adminHash,
      role: "ADMIN",
      section: "Cultural Council",
    },
  });

  const secAdmin = await prisma.user.create({
    data: {
      name: "CineSec President",
      email: "camera.admin@cultural.iitr.ac.in",
      password: adminHash,
      role: "ADMIN",
      section: "CineSec",
    },
  });

  const member1 = await prisma.user.create({
    data: {
      name: "Rohan Sharma",
      email: "rohan@cultural.iitr.ac.in",
      password: memberHash,
      role: "CONSUMER",
      section: "CineSec",
    },
  });

  const member2 = await prisma.user.create({
    data: {
      name: "Priya Patel",
      email: "priya@cultural.iitr.ac.in",
      password: memberHash,
      role: "CONSUMER",
      section: "MusicSec",
    },
  });

  const member3 = await prisma.user.create({
    data: {
      name: "Aman Gupta",
      email: "aman@cultural.iitr.ac.in",
      password: memberHash,
      role: "CONSUMER",
      section: "Choreography",
    },
  });

  console.log("Created users successfully.");

  // 2. Mock Assets list
  const assetsData = [
    {
      name: "Sony FX3 Cinema Camera",
      category: "Cameras",
      description: "Full-frame Cinema Line Camera, perfect for cinematic video and high-end photography.",
      totalQuantity: 3,
      condition: "EXCELLENT",
      status: "AVAILABLE",
    },
    {
      name: "Canon EOS R5",
      category: "Cameras",
      description: "8K Video Mirrorless Camera with 45MP sensor, excellent for general media coverage.",
      totalQuantity: 5,
      condition: "GOOD",
      status: "AVAILABLE",
    },
    {
      name: "Aputure 600d Pro LED Light",
      category: "Lighting",
      description: "High-output daylight LED light storm, comes with softbox and light stand.",
      totalQuantity: 4,
      condition: "EXCELLENT",
      status: "AVAILABLE",
    },
    {
      name: "Godox SL60W Video Light",
      category: "Lighting",
      description: "Compact 60W LED light source, suitable for indoor interviews and background lighting.",
      totalQuantity: 8,
      condition: "GOOD",
      status: "AVAILABLE",
    },
    {
      name: "Sennheiser EW 112P G4 Lavalier Mic",
      category: "Audio Systems",
      description: "Wireless lapel microphone system with transmitter and receiver, crystal-clear audio.",
      totalQuantity: 6,
      condition: "GOOD",
      status: "AVAILABLE",
    },
    {
      name: "Zoom H6 Handy Recorder",
      category: "Audio Systems",
      description: "6-channel portable audio recorder with interchangeable capsule system.",
      totalQuantity: 4,
      condition: "GOOD",
      status: "AVAILABLE",
    },
    {
      name: "Classical Dance Costumes Set",
      category: "Costumes",
      description: "Bharatnatyam/Kathak dance costumes, set of 12 complete dresses.",
      totalQuantity: 12,
      condition: "GOOD",
      status: "AVAILABLE",
    },
    {
      name: "Heavy Metal Stage Props Sword",
      category: "Stage Props",
      description: "Safe blunt metallic swords and shields for historical stage dramas.",
      totalQuantity: 15,
      condition: "FAIR",
      status: "AVAILABLE",
    },
    {
      name: "JBL PRX915 Powered Speaker",
      category: "Event Infrastructure",
      description: "15-inch 2000W professional stage monitor/PA speaker.",
      totalQuantity: 4,
      condition: "EXCELLENT",
      status: "AVAILABLE",
    },
  ];

  const createdAssets = [];
  for (const item of assetsData) {
    // Generate placeholder ID to encode in QR
    const asset = await prisma.asset.create({
      data: {
        name: item.name,
        category: item.category,
        description: item.description,
        totalQuantity: item.totalQuantity,
        availableQuantity: item.totalQuantity, // Initially all are in stock
        condition: item.condition,
        status: item.status,
      },
    });

    // Generate base64 QR code and save it
    const qrData = JSON.stringify({
      id: asset.id,
      name: asset.name,
      category: asset.category,
    });
    const qrCodeBase64 = await QRCode.toDataURL(qrData);

    const updatedAsset = await prisma.asset.update({
      where: { id: asset.id },
      data: { qrCode: qrCodeBase64 },
    });

    createdAssets.push(updatedAsset);
  }

  console.log(`Created ${createdAssets.length} assets with QR Codes.`);

  // 3. Create some sample bookings
  // A. Completed booking (requested, approved, issued, returned)
  const fx3 = createdAssets[0];
  const b1 = await prisma.booking.create({
    data: {
      userId: member1.id,
      assetId: fx3.id,
      quantity: 1,
      startDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
      endDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
      purpose: "Shoot for CineSec Orientation video.",
      status: "RETURNED",
    },
  });

  await prisma.returnLog.create({
    data: {
      bookingId: b1.id,
      returnedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      conditionOnReturn: "EXCELLENT",
      comments: "Returned on time. Cleaned lens.",
      recordedBy: secAdmin.id,
    },
  });

  // B. Active issued booking
  const aputure = createdAssets[2];
  const b2 = await prisma.booking.create({
    data: {
      userId: member1.id,
      assetId: aputure.id,
      quantity: 1,
      startDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
      endDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
      purpose: "Indoor lighting setup for CineSec interview.",
      status: "ISSUED",
    },
  });
  // Decrease available quantity for the active issued asset
  await prisma.asset.update({
    where: { id: aputure.id },
    data: { availableQuantity: aputure.totalQuantity - 1 },
  });

  // C. Pending booking request
  const zoomH6 = createdAssets[5];
  await prisma.booking.create({
    data: {
      userId: member2.id,
      assetId: zoomH6.id,
      quantity: 1,
      startDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // 1 day from now
      endDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
      purpose: "Recording vocals for upcoming council anthem.",
      status: "PENDING",
    },
  });

  // D. Overdue booking request
  const r5 = createdAssets[1];
  const b4 = await prisma.booking.create({
    data: {
      userId: member3.id,
      assetId: r5.id,
      quantity: 1,
      startDate: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), // 4 days ago
      endDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // Overdue by 1 day
      purpose: "Choreography section promo shoot.",
      status: "OVERDUE",
    },
  });
  // Decrease available quantity for active overdue asset
  await prisma.asset.update({
    where: { id: r5.id },
    data: { availableQuantity: r5.totalQuantity - 1 },
  });

  // 4. Create some audit logs
  await prisma.auditLog.createMany({
    data: [
      {
        userId: admin.id,
        action: "CREATE_ASSET",
        details: JSON.stringify({ assetName: fx3.name, category: fx3.category, quantity: fx3.totalQuantity }),
      },
      {
        userId: secAdmin.id,
        action: "ISSUE_ASSET",
        details: JSON.stringify({ bookingId: b2.id, assetName: aputure.name, quantity: 1, borrower: member1.name }),
      },
      {
        userId: secAdmin.id,
        action: "RETURN_ASSET",
        details: JSON.stringify({ bookingId: b1.id, assetName: fx3.name, condition: "EXCELLENT" }),
      },
    ],
  });

  // 5. Create notifications
  await prisma.notification.createMany({
    data: [
      {
        userId: member1.id,
        title: "Booking Approved",
        message: "Your booking for Sony FX3 Cinema Camera has been approved by the CineSec Admin.",
        type: "SUCCESS",
      },
      {
        userId: member3.id,
        title: "Asset Overdue Notice",
        message: "Your booking for Canon EOS R5 was due back on yesterday. Please return it immediately.",
        type: "DANGER",
      },
    ],
  });

  console.log("Database seeded successfully!");
}

main()
  .catch((e) => {
    console.error("Error during seeding database: ", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
