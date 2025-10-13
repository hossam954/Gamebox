import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { eq, sql } from "drizzle-orm";
import { randomUUID } from "crypto";
import * as schema from "@shared/schema";

// تأكد أن DATABASE_URL مضافة في Render
if (!process.env.DATABASE_URL) {
  throw new Error("❌ DATABASE_URL not set! Please add it in Render environment variables.");
}

// ✅ إعداد الاتصال بقاعدة PostgreSQL (Neon) عبر HTTP
const neonClient = neon(process.env.DATABASE_URL);

// ✅ إنشاء Drizzle ORM باستخدام السكيمة
export const db = drizzle(neonClient, { schema });

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
    await db.update(schema.users).set({ balance: newBalance }).where(eq(schema.users.id, userId));
  },

  async updateUserPassword(userId: string, newPassword: string) {
    await db.update(schema.users).set({ password: newPassword }).where(eq(schema.users.id, userId));
  },

  async updateUserLanguage(userId: string, language: string) {
    await db.update(schema.users).set({ language }).where(eq(schema.users.id, userId));
  },

  async updateUserStats(userId: string, balance: number, won: boolean) {
    await db.update(schema.users)
      .set({
        balance,
        totalWins: won ? sql`${schema.users.totalWins} + 1` : undefined,
        totalLosses: !won ? sql`${schema.users.totalLosses} + 1` : undefined,
      })
      .where(eq(schema.users.id, userId));
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
    await db.delete(schema.users).where(eq(schema.users.id, id));
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
    await db.update(schema.depositRequests).set({ status }).where(eq(schema.depositRequests.id, id));
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
    await db.update(schema.withdrawRequests).set({ status }).where(eq(schema.withdrawRequests.id, id));
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
    await db.update(schema.paymentSettings).set(data).where(eq(schema.paymentSettings.id, settings.id));
    return { ...settings, ...data };
  },

  // 💳 طرق الدفع
  async createPaymentMethod(data: any) {
    const id = randomUUID();
    const createdAt = new Date();
    const paymentMethod = {
      id,
      name: data.name,
      type: data.type || "both",
      currency: data.currency || "SYP",
      minAmount: data.minAmount || 0,
      maxAmount: data.maxAmount || 100000,
      minAmountUSD: data.minAmountUSD || 0,
      maxAmountUSD: data.maxAmountUSD || 1000,
      fee: data.fee || 0,
      noteEn: data.noteEn || "",
      noteAr: data.noteAr || "",
      isActive: true,
      createdAt,
    };
    
    await db.insert(schema.paymentMethods).values(paymentMethod);
    return paymentMethod;
  },

  async getPaymentMethods() {
    return await db.select().from(schema.paymentMethods);
  },

  async updatePaymentMethodStatus(id: string, isActive: boolean) {
    await db.update(schema.paymentMethods).set({ isActive }).where(eq(schema.paymentMethods.id, id));
  },

  async deletePaymentMethod(id: string) {
    await db.delete(schema.paymentMethods).where(eq(schema.paymentMethods.id, id));
  },

  async updatePaymentMethod(id: string, data: any) {
    await db.update(schema.paymentMethods).set(data).where(eq(schema.paymentMethods.id, id));
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
    await db.update(schema.promoCodes).set({ isActive }).where(eq(schema.promoCodes.id, id));
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
      .where(eq(schema.supportTickets.id, id));
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
    await db.update(schema.notifications).set({ read: true }).where(eq(schema.notifications.id, id));
  },

  async clearAllNotifications(userId: string) {
    await db.delete(schema.notifications).where(eq(schema.notifications.userId, userId));
  },

  // ⚙️ إعدادات اللعبة
  async getGameSettings() {
    const settings = await db.select().from(schema.gameSettings).limit(1);
    return settings[0];
  },

  async updateGameSettings(data: any) {
    const settings = await this.getGameSettings();
    if (!settings) {
      const id = randomUUID();
      await db.insert(schema.gameSettings).values({ id, ...data, updatedAt: new Date() });
      return { id, ...data, updatedAt: new Date() };
    }
    await db.update(schema.gameSettings).set({ ...data, updatedAt: new Date() }).where(eq(schema.gameSettings.id, settings.id));
    return { ...settings, ...data, updatedAt: new Date() };
  },

  // 📊 تحديث إحصائيات اللاعب المتقدمة
  async updateUserGameStats(userId: string, stats: {
    betAmount: number;
    won: boolean;
    multiplier: number | null;
    newBalance: number;
  }) {
    const user = await this.getUser(userId);
    if (!user) return;

    const profit = stats.won
      ? (stats.betAmount * (stats.multiplier || 0)) - stats.betAmount
      : -stats.betAmount;

    await db.update(schema.users).set({
      balance: stats.newBalance,
      totalBetsCount: sql`${schema.users.totalBetsCount} + 1`,
      totalWagered: sql`${schema.users.totalWagered} + ${stats.betAmount}`,
      lifetimeProfit: sql`${schema.users.lifetimeProfit} + ${profit}`,
      sessionBetsCount: sql`${schema.users.sessionBetsCount} + 1`,
      lastBetAmount: stats.betAmount,
      lastGameResult: stats.won ? "win" : "loss",
      totalWins: stats.won ? sql`${schema.users.totalWins} + 1` : undefined,
      totalLosses: !stats.won ? sql`${schema.users.totalLosses} + 1` : undefined,
      currentStreak: stats.won ? sql`${schema.users.currentStreak} + 1` : 0,
      longestStreak: stats.won ? sql`GREATEST(${schema.users.longestStreak}, ${schema.users.currentStreak} + 1)` : undefined,
    }).where(eq(schema.users.id, userId));
  },

  // 🔑 Password Reset Tokens
  async createPasswordResetToken(userId: string, token: string, expiresAt: Date) {
    const id = randomUUID();
    await db.insert(schema.passwordResetTokens).values({
      id,
      userId,
      token,
      expiresAt,
      used: false,
      createdAt: new Date(),
    });
    return { id, userId, token, expiresAt, used: false, createdAt: new Date() };
  },

  async getPasswordResetToken(token: string) {
    return await db.query.passwordResetTokens.findFirst({ where: (t, { eq }) => eq(t.token, token) });
  },

  async markTokenAsUsed(token: string) {
    await db.update(schema.passwordResetTokens).set({ used: true }).where(eq(schema.passwordResetTokens.token, token));
  },

  // 📝 Password Recovery Requests
  async createPasswordRecovery(data: any) {
    const id = randomUUID();
    await db.insert(schema.passwordRecoveryRequests).values({
      id,
      ...data,
      status: "pending",
      createdAt: new Date(),
    });
    return { id, ...data, status: "pending", createdAt: new Date() };
  },

  async getPasswordRecoveryRequests() {
    return await db.select().from(schema.passwordRecoveryRequests);
  },

  async updatePasswordRecoveryStatus(id: string, status: string) {
    await db.update(schema.passwordRecoveryRequests).set({ status }).where(eq(schema.passwordRecoveryRequests.id, id));
  },

  // 🎁 Promo Codes
  async redeemPromoCode(userId: string, code: string) {
    const promoCode = await db.query.promoCodes.findFirst({ where: (p, { eq }) => eq(p.code, code) });

    if (!promoCode) {
      return { success: false, message: "Invalid promo code" };
    }

    if (!promoCode.isActive) {
      return { success: false, message: "Promo code is disabled" };
    }

    if (promoCode.usedCount >= promoCode.usageLimit) {
      return { success: false, message: "Promo code has reached usage limit" };
    }

    const user = await this.getUser(userId);
    if (!user) {
      return { success: false, message: "User not found" };
    }

    let reward = "";
    let newBalance = user.balance;

    if (promoCode.type === "balance") {
      newBalance += promoCode.value;
      reward = `£${promoCode.value}`;
    } else if (promoCode.type === "percentage") {
      const bonus = Math.floor(user.balance * (promoCode.value / 100));
      newBalance += bonus;
      reward = `${promoCode.value}% bonus (£${bonus})`;
    }

    await db.update(schema.users).set({ balance: newBalance }).where(eq(schema.users.id, userId));
    await db.update(schema.promoCodes).set({ usedCount: sql`${schema.promoCodes.usedCount} + 1` }).where(eq(schema.promoCodes.id, promoCode.id));

    return { success: true, reward };
  },

  // 🔄 تحديث حالة المستخدم
  async updateUserStatus(userId: string, status: string) {
    await db.update(schema.users).set({ status } as any).where(eq(schema.users.id, userId));
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