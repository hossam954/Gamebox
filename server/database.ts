import { drizzle } from "drizzle-orm/neon-serverless";
import { Pool } from "@neondatabase/serverless";
import ws from "ws";
import { randomUUID } from "crypto";
import * as schema from "@shared/schema";

// تأكد أن DATABASE_URL مضافة في Render
if (!process.env.DATABASE_URL) {
  throw new Error("❌ DATABASE_URL not set! Please add it in Render environment variables.");
}

// ✅ إعداد الاتصال بقاعدة PostgreSQL (Neon)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
pool.neonConfig.webSocketConstructor = ws;

// ✅ إنشاء Drizzle ORM باستخدام السكيمة
export const db = drizzle(pool, { schema });

// 🟣 كائن مماثل لـ storage السابق حتى ما يتغير أي شيء في routes.ts
export const storage = {
  // 🧍‍♂️ المستخدمين
  async getUser(id: string) {
    return await db.query.users.findFirst({ where: (u, { eq }) => eq(u.id, id) });
  },

  async getUserByUsername(username: string) {
    return await db.query.users.findFirst({ where: (u, { eq }) => eq(u.username, username) });
  },

  async getUserByEmail(email: string) {
    return await db.query.users.findFirst({ where: (u, { eq }) => eq(u.email, email) });
  },

  async getUserByUsernameOrEmail(usernameOrEmail: string) {
    return await db.query.users.findFirst({
      where: (u, { or, eq }) => or(eq(u.username, usernameOrEmail), eq(u.email, usernameOrEmail)),
    });
  },

  async createUser(data: any) {
    const id = randomUUID();
    const createdAt = new Date();
    const referralCode = data.referralCode || Math.random().toString(36).substring(2, 10).toUpperCase();
    await db.insert(schema.users).values({
      id,
      username: data.username,
      email: data.email,
      password: data.password,
      balance: 0,
      totalWins: 0,
      totalLosses: 0,
      isAdmin: false,
      referralCode,
      referredBy: data.referredBy || null,
      language: data.language || "en",
      createdAt,
    });
    return { id, referralCode, createdAt };
  },

  async updateUserBalance(userId: string, newBalance: number) {
    await db.update(schema.users).set({ balance: newBalance }).where(schema.users.id.eq(userId));
  },

  async updateUserPassword(userId: string, newPassword: string) {
    await db.update(schema.users).set({ password: newPassword }).where(schema.users.id.eq(userId));
  },

  async updateUserLanguage(userId: string, language: string) {
    await db.update(schema.users).set({ language }).where(schema.users.id.eq(userId));
  },

  async updateUserStats(userId: string, balance: number, won: boolean) {
    await db.update(schema.users)
      .set({
        balance,
        totalWins: won ? db.sql`${schema.users.totalWins} + 1` : undefined,
        totalLosses: !won ? db.sql`${schema.users.totalLosses} + 1` : undefined,
      })
      .where(schema.users.id.eq(userId));
  },

  async getAllUsers() {
    return await db.select().from(schema.users);
  },

  async getUserByReferralCode(referralCode: string) {
    return await db.query.users.findFirst({ where: (u, { eq }) => eq(u.referralCode, referralCode) });
  },

  async getReferralCount(referralCode: string) {
    const users = await db.query.users.findMany({ where: (u, { eq }) => eq(u.referredBy, referralCode) });
    return users.length;
  },

  async deleteUser(id: string) {
    await db.delete(schema.users).where(schema.users.id.eq(id));
  },

  // 💰 الإيداعات
  async createDepositRequest(data: any) {
    const id = randomUUID();
    const createdAt = new Date();
    await db.insert(schema.depositRequests).values({
      id,
      ...data,
      createdAt,
      status: "pending",
    });
    return { id };
  },

  async getDepositRequests() {
    return await db.select().from(schema.depositRequests);
  },

  async updateDepositStatus(id: string, status: string) {
    await db.update(schema.depositRequests).set({ status }).where(schema.depositRequests.id.eq(id));
  },

  // 💸 السحب
  async createWithdrawRequest(data: any) {
    const id = randomUUID();
    const createdAt = new Date();
    await db.insert(schema.withdrawRequests).values({
      id,
      ...data,
      createdAt,
      status: "pending",
    });
    return { id };
  },

  async getWithdrawRequests() {
    return await db.select().from(schema.withdrawRequests);
  },

  async updateWithdrawStatus(id: string, status: string) {
    await db.update(schema.withdrawRequests).set({ status }).where(schema.withdrawRequests.id.eq(id));
  },

  // ⚙️ إعدادات الدفع
  async getPaymentSettings() {
    const settings = await db.select().from(schema.paymentSettings).limit(1);
    return settings[0];
  },

  async updatePaymentSettings(data: any) {
    const settings = await this.getPaymentSettings();
    if (!settings) {
      const id = randomUUID();
      await db.insert(schema.paymentSettings).values({ id, ...data });
      return { id, ...data };
    }
    await db.update(schema.paymentSettings).set(data).where(schema.paymentSettings.id.eq(settings.id));
    return { ...settings, ...data };
  },

  // 💳 طرق الدفع
  async createPaymentMethod(data: any) {
    const id = randomUUID();
    const createdAt = new Date();
    await db.insert(schema.paymentMethods).values({
      id,
      ...data,
      createdAt,
      isActive: true,
    });
    return { id };
  },

  async getPaymentMethods() {
    return await db.select().from(schema.paymentMethods);
  },

  async updatePaymentMethodStatus(id: string, isActive: boolean) {
    await db.update(schema.paymentMethods).set({ isActive }).where(schema.paymentMethods.id.eq(id));
  },

  async deletePaymentMethod(id: string) {
    await db.delete(schema.paymentMethods).where(schema.paymentMethods.id.eq(id));
  },

  // 🏷️ أكواد الخصم
  async createPromoCode(data: any) {
    const id = randomUUID();
    const createdAt = new Date();
    await db.insert(schema.promoCodes).values({
      id,
      ...data,
      createdAt,
      isActive: true,
      usedCount: 0,
    });
    return { id };
  },

  async getPromoCodes() {
    return await db.select().from(schema.promoCodes);
  },

  async updatePromoCodeStatus(id: string, isActive: boolean) {
    await db.update(schema.promoCodes).set({ isActive }).where(schema.promoCodes.id.eq(id));
  },

  // 🎟️ الدعم الفني
  async createSupportTicket(data: any) {
    const id = randomUUID();
    const createdAt = new Date();
    await db.insert(schema.supportTickets).values({ id, ...data, createdAt });
    return { id };
  },

  async getSupportTickets() {
    return await db.select().from(schema.supportTickets);
  },

  async updateSupportTicket(id: string, response: string, status: string) {
    await db.update(schema.supportTickets)
      .set({ response, status })
      .where(schema.supportTickets.id.eq(id));
  },

  // 🔔 الإشعارات
  async createNotification(data: any) {
    const id = randomUUID();
    const createdAt = new Date();
    await db.insert(schema.notifications).values({ id, ...data, createdAt });
    return { id };
  },

  async getNotificationsByUserId(userId: string) {
    return await db.query.notifications.findMany({ where: (n, { eq }) => eq(n.userId, userId) });
  },

  async markNotificationAsRead(id: string) {
    await db.update(schema.notifications).set({ read: true }).where(schema.notifications.id.eq(id));
  },

  async clearAllNotifications(userId: string) {
    await db.delete(schema.notifications).where(schema.notifications.userId.eq(userId));
  },
};

// ✅ إنشاء الأدمن تلقائيًا
export async function initializeAdminUser() {
  try {
    const existing = await db.query.users.findFirst({
      where: (u, { eq }) => eq(u.username, "abodiab"),
    });

    if (!existing) {
      await db.insert(schema.users).values({
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