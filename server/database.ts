import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { randomUUID } from "crypto";
import * as schema from "@shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error("❌ DATABASE_URL not set! Please add it in Render environment variables.");
}

// ✅ إعداد الاتصال بقاعدة PostgreSQL (Neon)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false, // ضروري أحياناً مع Neon
  },
});

// ✅ إنشاء Drizzle ORM باستخدام السكيمة
export const db = drizzle(pool, { schema });

// ✅ وظيفة لإنشاء حساب الأدمن تلقائياً إذا ما كان موجود
export async function initializeAdminUser() {
  try {
    const { users } = schema;
    const existing = await db.query.users.findFirst({
      where: (u, { eq }) => eq(u.username, "abodiab"),
    });

    if (!existing) {
      await db.insert(users).values({
        id: randomUUID(),
        username: "abodiab",
        email: "abojafar1327@gmail.com",
        password: "aaa123ddd",
        balance: 50000,
        isAdmin: true,
        referralCode: "ADMIN123",
        createdAt: new Date(),
      });
      console.log("✅ Admin user created successfully.");
    } else {
      console.log("✅ Admin user already exists.");
    }
  } catch (err) {
    console.error("⚠️ Error initializing admin user:", err);
  }
}
