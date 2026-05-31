import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";

const app = express();
const PORT = 3000;

// Database file setup
const DB_DIR = path.join(process.cwd(), "database");
const DB_FILE = path.join(DB_DIR, "gym_db.json");

// Ensure database folder exists
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

// Initial default database structure
const defaultDb = {
  sports: [
    { id: "s1", nameAr: "كمال الأجسام", nameEn: "Bodybuilding", monthlyFee: 250 },
    { id: "s2", nameAr: "كاراتيه", nameEn: "Karate", monthlyFee: 200 },
    { id: "s3", nameAr: "كيك بوكسينغ", nameEn: "Kickboxing", monthlyFee: 220 },
    { id: "s4", nameAr: "فتنس و ايروبيك", nameEn: "Fitness & Aerobics", monthlyFee: 180 }
  ],
  members: [
    {
      id: "m1",
      fullName: "أحمد العتيبي",
      phone: "+212600112233",
      email: "ahmed@example.com",
      sportId: "s1",
      joinDate: "2026-01-10",
      subscriptionDay: 10, // Must pay on the 10th of every month
      monthlyFee: 250,
      photo: "",
      isActive: true,
      trainerId: "الكابتن بدر"
    },
    {
      id: "m2",
      fullName: "ياسين العلمي",
      phone: "+212611223344",
      email: "yassine@example.com",
      sportId: "s3",
      joinDate: "2026-02-15",
      subscriptionDay: 15, // Subscription due on the 15th
      monthlyFee: 220,
      photo: "",
      isActive: true,
      trainerId: "الكابتن كمال"
    },
    {
      id: "m3",
      fullName: "سارة الإدريسي",
      phone: "+212622334455",
      email: "sara@example.com",
      sportId: "s4",
      joinDate: "2026-03-28",
      subscriptionDay: 28, // Due on the 28th (Today is 30th, late by 2 days - perfect for WhatsApp alert)
      monthlyFee: 180,
      photo: "",
      isActive: true,
      trainerId: "المدربة ليلى"
    },
    {
      id: "m4",
      fullName: "خالد التازي",
      phone: "+212633009988",
      email: "khaled@example.com",
      sportId: "s2",
      joinDate: "2026-04-05",
      subscriptionDay: 5, // Due on the 5th (Late by 25 days!)
      monthlyFee: 200,
      photo: "",
      isActive: false, // Inactive example
      trainerId: "الكابتن بدر"
    }
  ],
  payments: [
    // احمد العتيبي paid for 2026-05
    {
      id: "p1",
      memberId: "m1",
      sportId: "s1",
      amount: 250,
      paymentMonth: "05",
      paymentYear: "2026",
      paymentDate: "2026-05-09",
      receiptNo: "REC-2026-0001"
    },
    // ياسين العلمي paid for 2026-04 but missed 2026-05
    {
      id: "p2",
      memberId: "m2",
      sportId: "s3",
      amount: 220,
      paymentMonth: "04",
      paymentYear: "2026",
      paymentDate: "2026-04-14",
      receiptNo: "REC-2026-0002"
    }
  ],
  config: {
    adminPasscode: "1234",
    clubNameAr: "نادي أيت عمر للياقة البدنية",
    clubNameEn: "Ait Omar Fitness Gym",
    currencyAr: "درهم",
    currencyEn: "MAD"
  }
};

// Helper function to read database files
function readDatabase() {
  try {
    if (!fs.existsSync(DB_FILE)) {
      fs.writeFileSync(DB_FILE, JSON.stringify(defaultDb, null, 2), "utf8");
      return defaultDb;
    }
    const data = fs.readFileSync(DB_FILE, "utf8");
    return JSON.parse(data);
  } catch (err) {
    console.error("Error reading database:", err);
    return defaultDb;
  }
}

// Helper function to write to database files
function writeDatabase(data: any) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf8");
    return true;
  } catch (err) {
    console.error("Error writing database:", err);
    return false;
  }
}

// Enable JSON parse middle-ware
app.use(express.json({ limit: "50mb" })); // high limit for uploading trainee photo as base64

// API Endpoints:

// 1. Get database details (dashboard & all lists)
app.get("/api/db", (req, res) => {
  const db = readDatabase();
  res.json(db);
});

// 2. Auth passcode verification
app.post("/api/auth", (req, res) => {
  const { passcode } = req.body;
  const db = readDatabase();
  if (db.config.adminPasscode === passcode) {
    res.json({ success: true });
  } else {
    res.status(401).json({ success: false, message: "Invalid Passcode / الرقم السري خاطئ" });
  }
});

// Update passcode
app.post("/api/config/passcode", (req, res) => {
  const { oldPasscode, newPasscode } = req.body;
  const db = readDatabase();
  if (db.config.adminPasscode !== oldPasscode) {
    return res.status(400).json({ success: false, message: "Current passcode is incorrect / الرمز السري الحالي غير صحيح" });
  }
  db.config.adminPasscode = newPasscode;
  writeDatabase(db);
  res.json({ success: true, message: "Passcode updated / تم تحديث الرمز السري" });
});

// Update general config
app.post("/api/config/update", (req, res) => {
  const { clubNameAr, clubNameEn, currencyAr, currencyEn } = req.body;
  const db = readDatabase();
  db.config.clubNameAr = clubNameAr || db.config.clubNameAr;
  db.config.clubNameEn = clubNameEn || db.config.clubNameEn;
  db.config.currencyAr = currencyAr || db.config.currencyAr;
  db.config.currencyEn = currencyEn || db.config.currencyEn;
  writeDatabase(db);
  res.json({ success: true, db });
});

// 3. Sports CRUD
app.get("/api/sports", (req, res) => {
  const db = readDatabase();
  res.json(db.sports);
});

app.post("/api/sports", (req, res) => {
  const { nameAr, nameEn, monthlyFee, id } = req.body;
  const db = readDatabase();
  if (id) {
    // Edit existing
    db.sports = db.sports.map((s: any) => s.id === id ? { ...s, nameAr, nameEn, monthlyFee: Number(monthlyFee) } : s);
  } else {
    // Create new
    const newSport = {
      id: "s_" + Date.now().toString(),
      nameAr,
      nameEn,
      monthlyFee: Number(monthlyFee)
    };
    db.sports.push(newSport);
  }
  writeDatabase(db);
  res.json({ success: true, sports: db.sports });
});

app.delete("/api/sports/:id", (req, res) => {
  const { id } = req.params;
  const db = readDatabase();
  db.sports = db.sports.filter((s: any) => s.id !== id);
  writeDatabase(db);
  res.json({ success: true, sports: db.sports });
});

// 4. Members CRUD
app.get("/api/members", (req, res) => {
  const db = readDatabase();
  res.json(db.members);
});

app.post("/api/members", (req, res) => {
  const { id, fullName, phone, email, sportId, joinDate, subscriptionDay, monthlyFee, photo, isActive, trainerId } = req.body;
  const db = readDatabase();

  const memberData = {
    id: id || "m_" + Date.now().toString(),
    fullName,
    phone,
    email: email || "",
    sportId,
    joinDate: joinDate || new Date().toISOString().split("T")[0],
    subscriptionDay: Number(subscriptionDay) || 1,
    monthlyFee: Number(monthlyFee) || 0,
    photo: photo || "",
    isActive: isActive !== undefined ? isActive : true,
    trainerId: trainerId || ""
  };

  if (id) {
    // Update
    db.members = db.members.map((m: any) => m.id === id ? memberData : m);
  } else {
    // Insert new
    db.members.push(memberData);
  }

  writeDatabase(db);
  res.json({ success: true, members: db.members });
});

app.delete("/api/members/:id", (req, res) => {
  const { id } = req.params;
  const db = readDatabase();
  db.members = db.members.filter((m: any) => m.id !== id);
  // Also delete payments for this member to keep the DB clean (optional but clean)
  db.payments = db.payments.filter((p: any) => p.memberId !== id);
  writeDatabase(db);
  res.json({ success: true, members: db.members, payments: db.payments });
});

// 5. Payments Billing Collection
app.get("/api/payments", (req, res) => {
  const db = readDatabase();
  res.json(db.payments);
});

app.post("/api/payments", (req, res) => {
  const { memberId, sportId, amount, paymentMonth, paymentYear, paymentDate } = req.body;
  const db = readDatabase();

  // Validate duplicate payment for same month + year
  const duplicate = db.payments.find((p: any) => p.memberId === memberId && p.sportId === sportId && p.paymentMonth === paymentMonth && p.paymentYear === paymentYear);
  if (duplicate) {
    return res.status(400).json({ success: false, message: "Subscription for this month is already paid! / لقد تم دفع الاشتراك لهذا الشهر مسبقاً" });
  }

  const receiptNo = `REC-${paymentYear}-${String(db.payments.length + 1).padStart(4, "0")}`;
  const newPayment = {
    id: "p_" + Date.now().toString(),
    memberId,
    sportId,
    amount: Number(amount),
    paymentMonth,
    paymentYear,
    paymentDate: paymentDate || new Date().toISOString().split("T")[0],
    receiptNo
  };

  db.payments.push(newPayment);
  writeDatabase(db);
  res.json({ success: true, payments: db.payments, receipt: newPayment });
});

app.delete("/api/payments/:id", (req, res) => {
  const { id } = req.params;
  const db = readDatabase();
  db.payments = db.payments.filter((p: any) => p.id !== id);
  writeDatabase(db);
  res.json({ success: true, payments: db.payments });
});

// Serve frontend build static files & configure Vite middleware
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Bilingual GYM Manager listening on http://localhost:${PORT}`);
  });
}

startServer();
