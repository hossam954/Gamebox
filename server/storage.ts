import {
  type User,
  type InsertUser,
  type PasswordRecoveryRequest,
  type InsertPasswordRecovery,
  type DepositRequest,
  type InsertDepositRequest,
  type WithdrawRequest,
  type InsertWithdrawRequest,
  type PaymentSettings,
  type InsertPaymentSettings,
  type PaymentMethod,
  type InsertPaymentMethod,
  type PromoCode,
  type InsertPromoCode,
  type SupportTicket,
  type InsertSupportTicket,
  type GameSettings,
  type InsertGameSettings,
  type PasswordResetToken,
  type InsertPasswordResetToken
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByUsernameOrEmail(usernameOrEmail: string): Promise<User | undefined>;
  getUserByReferralCode(referralCode: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserBalance(userId: string, amount: number): Promise<void>;
  updateUserStats(userId: string, balance: number, won: boolean): Promise<void>;
  getAllUsers(): Promise<User[]>;
  deleteUser(userId: string): Promise<void>;
  getReferralCount(referralCode: string): Promise<number>;

  createPasswordRecovery(request: InsertPasswordRecovery): Promise<PasswordRecoveryRequest>;
  getPasswordRecoveryRequests(): Promise<PasswordRecoveryRequest[]>;
  updatePasswordRecoveryStatus(id: string, status: string): Promise<void>;

  createPasswordResetToken(userId: string, token: string, expiresAt: Date): Promise<PasswordResetToken>;
  getPasswordResetToken(token: string): Promise<PasswordResetToken | undefined>;
  markTokenAsUsed(token: string): Promise<void>;

  createDepositRequest(request: InsertDepositRequest): Promise<DepositRequest>;
  getDepositRequests(): Promise<DepositRequest[]>;
  updateDepositStatus(id: string, status: string): Promise<void>;

  createWithdrawRequest(request: InsertWithdrawRequest): Promise<WithdrawRequest>;
  getWithdrawRequests(): Promise<WithdrawRequest[]>;
  updateWithdrawStatus(id: string, status: string): Promise<void>;

  getPaymentSettings(): Promise<PaymentSettings>;
  updatePaymentSettings(settings: InsertPaymentSettings): Promise<PaymentSettings>;

  createPaymentMethod(data: InsertPaymentMethod): Promise<PaymentMethod>;
  getPaymentMethods(): Promise<PaymentMethod[]>;
  updatePaymentMethodStatus(id: string, isActive: boolean): Promise<void>;
  deletePaymentMethod(id: string): Promise<void>;

  updateUserPassword(userId: string, newPassword: string): Promise<void>;
  updateUserLanguage(userId: string, language: string): Promise<void>;

  createPromoCode(promoCode: InsertPromoCode): Promise<PromoCode>;
  getPromoCodes(): Promise<PromoCode[]>;
  updatePromoCodeStatus(id: string, isActive: boolean): Promise<void>;
  redeemPromoCode(userId: string, code: string): Promise<{ success: boolean; message?: string; reward?: string }>;

  createSupportTicket(ticket: InsertSupportTicket): Promise<SupportTicket>;
  getSupportTickets(): Promise<SupportTicket[]>;
  updateSupportTicket(id: string, response: string, status: string): Promise<void>;

  createNotification(notification: { userId: string; title: string; message: string }): Promise<any>;
  getNotificationsByUserId(userId: string): Promise<any[]>;
  markNotificationAsRead(id: string): Promise<void>;
  clearAllNotifications(userId: string): Promise<void>;

  // إدارة إعدادات اللعبة
  getGameSettings(): Promise<GameSettings>;
  updateGameSettings(settings: Partial<InsertGameSettings>): Promise<GameSettings>;

  // تحديث إحصائيات اللاعب المتقدمة
  updateUserGameStats(userId: string, stats: {
    betAmount: number;
    won: boolean;
    multiplier: number | null;
    newBalance: number;
  }): Promise<void>;
}

import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const db = new Database(join(__dirname, '../data.db'));

// إنشاء الجداول إذا لم تكن موجودة
db.exec(`
  CREATE TABLE IF NOT EXISTS users_cache (
    id TEXT PRIMARY KEY,
    data TEXT NOT NULL,
    updated_at INTEGER NOT NULL
  )
`);

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private passwordRecoveryRequests: Map<string, PasswordRecoveryRequest>;
  private passwordResetTokens: Map<string, PasswordResetToken>;
  private depositRequests: Map<string, DepositRequest>;
  private withdrawRequests: Map<string, WithdrawRequest>;
  private paymentSettings: PaymentSettings;
  private gameSettings: GameSettings;
  private paymentMethods: Map<string, PaymentMethod>;
  private promoCodes: Map<string, PromoCode>;
  private supportTickets: Map<string, SupportTicket>;
  private notifications: Map<string, any>;

  constructor() {
    this.users = new Map();
    this.loadUsersFromDB();
    this.passwordRecoveryRequests = new Map();
    this.passwordResetTokens = new Map();
    this.depositRequests = new Map();
    this.withdrawRequests = new Map();
    this.paymentMethods = new Map();
    this.promoCodes = new Map();
    this.supportTickets = new Map();
    this.notifications = new Map();

    const adminId = randomUUID();
    const adminUser: User = {
      id: adminId,
      username: "abodiab",
      email: "abojafar1327@gmail.com",
      password: "aaa123ddd",
      balance: 50000,
      totalWins: 0,
      totalLosses: 0,
      isAdmin: true,
      referralCode: this.generateReferralCode("abodiab"),
      referredBy: null,
      language: "en",
      currentStreak: 0,
      longestStreak: 0,
      totalBetsCount: 0,
      totalWagered: 0,
      lifetimeProfit: 0,
      sessionStartBalance: 50000,
      sessionBetsCount: 0,
      lastBetAmount: 0,
      lastGameResult: "",
      createdAt: new Date(),
    };
    this.users.set(adminId, adminUser);

    this.paymentSettings = {
      id: randomUUID(),
      withdrawFee: 5,
      minDeposit: 50,
      maxDeposit: 50000,
      minWithdraw: 100,
      maxWithdraw: 50000,
      depositAddress: "SYP-WALLET-ADDRESS-12345",
      paymentMethod: "Bank Transfer / Mobile Wallet",
      winRate: 50, // نسبة الربح الافتراضية 50%
      usdDepositRate: 15000, // سعر صرف الدولار للإيداع (150.00 ل.س)
      usdWithdrawRate: 15000, // سعر صرف الدولار للسحب (150.00 ل.س)
    };

    this.gameSettings = {
      id: randomUUID(),
      baseWinRate: 9,
      targetLossRate: 95,
      maxMultiplier: 50,
      strategy: "hopeful",
      phase1Rounds: 9,
      phase2Rounds: 18,
      multiplier2to5Chance: 80,
      multiplier5to10Chance: 29,
      multiplier10to25Chance: 7,
      multiplier25to50Chance: 2,
      multiplier50PlusChance: 1,
      highBetThreshold: 500,
      highBetMaxMultiplier: 5,
      updatedAt: new Date(),
    };

    const defaultPaymentMethod1: PaymentMethod = {
      id: randomUUID(),
      name: "Bank Transfer (SYP)",
      type: "both",
      currency: "SYP",
      minAmount: 50,
      maxAmount: 50000,
      fee: 0,
      noteEn: "Please use your username as reference.",
      noteAr: "يرجى استخدام اسم المستخدم الخاص بك كمرجع.",
      isActive: true,
      createdAt: new Date(),
    };
    this.paymentMethods.set(defaultPaymentMethod1.id, defaultPaymentMethod1);

    const defaultPaymentMethod2: PaymentMethod = {
      id: randomUUID(),
      name: "Mobile Wallet (SYP)",
      type: "both",
      currency: "SYP",
      minAmount: 50,
      maxAmount: 10000,
      fee: 0,
      noteEn: "Please provide your mobile number.",
      noteAr: "يرجى تقديم رقم الهاتف المحمول الخاص بك.",
      isActive: true,
      createdAt: new Date(),
    };
    this.paymentMethods.set(defaultPaymentMethod2.id, defaultPaymentMethod2);

    const defaultPaymentMethod3: PaymentMethod = {
      id: randomUUID(),
      name: "USDT (TRC20)",
      type: "both",
      currency: "USD",
      minAmount: 5,
      maxAmount: 1000,
      fee: 0,
      noteEn: "Send USDT (TRC20) to the provided address.",
      noteAr: "أرسل USDT (TRC20) إلى العنوان المقدم.",
      isActive: true,
      createdAt: new Date(),
    };
    this.paymentMethods.set(defaultPaymentMethod3.id, defaultPaymentMethod3);
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email,
    );
  }

  async getUserByUsernameOrEmail(usernameOrEmail: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === usernameOrEmail || user.email === usernameOrEmail,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const referralCode = this.generateReferralCode(insertUser.username);
    const user: User = {
      ...insertUser,
      id,
      balance: 0,
      totalWins: 0,
      totalLosses: 0,
      isAdmin: false,
      referralCode,
      referredBy: insertUser.referredBy || null,
      language: insertUser.language || "en",
      currentStreak: 0,
      longestStreak: 0,
      totalBetsCount: 0,
      totalWagered: 0,
      lifetimeProfit: 0,
      sessionStartBalance: 0,
      sessionBetsCount: 0,
      lastBetAmount: 0,
      lastGameResult: "",
      createdAt: new Date(),
    };
    this.users.set(id, user);
    this.saveUserToDB(user);
    return user;
  }

  private generateReferralCode(username: string): string {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return code;
  }

  async getUserByReferralCode(referralCode: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.referralCode === referralCode,
    );
  }

  async updateUserBalance(userId: string, amount: number): Promise<void> {
    const user = this.users.get(userId);
    if (user) {
      user.balance = amount;
      this.users.set(userId, user);
      this.saveUserToDB(user);
    }
  }

  async updateUserStats(userId: string, balance: number, won: boolean): Promise<void> {
    const user = this.users.get(userId);
    if (user) {
      user.balance = balance;
      if (won) {
        user.totalWins += 1;
      } else {
        user.totalLosses += 1;
      }
      this.users.set(userId, user);
      this.saveUserToDB(user);
    }
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async deleteUser(userId: string): Promise<void> {
    this.users.delete(userId);

    this.passwordRecoveryRequests.forEach((req, key) => {
      if (req.userId === userId) {
        this.passwordRecoveryRequests.delete(key);
      }
    });

    this.depositRequests.forEach((req, key) => {
      if (req.userId === userId) {
        this.depositRequests.delete(key);
      }
    });

    this.withdrawRequests.forEach((req, key) => {
      if (req.userId === userId) {
        this.withdrawRequests.delete(key);
      }
    });

    this.supportTickets.forEach((ticket, key) => {
      if (ticket.userId === userId) {
        this.supportTickets.delete(key);
      }
    });

    this.notifications.forEach((notification: any, key: string) => {
      if (notification.userId === userId) {
        this.notifications.delete(key);
      }
    });
  }

  async getReferralCount(referralCode: string): Promise<number> {
    const users = Array.from(this.users.values());
    return users.filter(user => user.referredBy === referralCode).length;
  }

  async createPasswordRecovery(request: InsertPasswordRecovery): Promise<PasswordRecoveryRequest> {
    const id = randomUUID();
    const recovery: PasswordRecoveryRequest = {
      ...request,
      id,
      status: "pending",
      createdAt: new Date(),
    };
    this.passwordRecoveryRequests.set(id, recovery);
    return recovery;
  }

  async getPasswordRecoveryRequests(): Promise<PasswordRecoveryRequest[]> {
    return Array.from(this.passwordRecoveryRequests.values());
  }

  async updatePasswordRecoveryStatus(id: string, status: string): Promise<void> {
    const request = this.passwordRecoveryRequests.get(id);
    if (request) {
      request.status = status;
      this.passwordRecoveryRequests.set(id, request);
    }
  }

  async createPasswordResetToken(userId: string, token: string, expiresAt: Date): Promise<PasswordResetToken> {
    const id = randomUUID();
    const resetToken: PasswordResetToken = {
      id,
      userId,
      token,
      expiresAt,
      used: false,
      createdAt: new Date(),
    };
    this.passwordResetTokens.set(token, resetToken);
    return resetToken;
  }

  async getPasswordResetToken(token: string): Promise<PasswordResetToken | undefined> {
    return this.passwordResetTokens.get(token);
  }

  async markTokenAsUsed(token: string): Promise<void> {
    const resetToken = this.passwordResetTokens.get(token);
    if (resetToken) {
      resetToken.used = true;
      this.passwordResetTokens.set(token, resetToken);
    }
  }

  async createDepositRequest(request: InsertDepositRequest): Promise<DepositRequest> {
    const id = randomUUID();
    const deposit: DepositRequest = {
      userId: request.userId,
      username: request.username,
      amount: request.amount,
      paymentMethodId: request.paymentMethodId || null,
      transactionNumber: request.transactionNumber || null,
      id,
      status: "pending",
      createdAt: new Date(),
    };
    this.depositRequests.set(id, deposit);
    return deposit;
  }

  async getDepositRequests(): Promise<DepositRequest[]> {
    return Array.from(this.depositRequests.values());
  }

  async updateDepositStatus(id: string, status: string): Promise<void> {
    const request = this.depositRequests.get(id);
    if (request) {
      request.status = status;
      this.depositRequests.set(id, request);
    }
  }

  async createWithdrawRequest(request: InsertWithdrawRequest): Promise<WithdrawRequest> {
    const id = randomUUID();
    const withdraw: WithdrawRequest = {
      userId: request.userId,
      username: request.username,
      amount: request.amount,
      paymentMethodId: request.paymentMethodId || null,
      address: request.address,
      id,
      status: "pending",
      createdAt: new Date(),
    };
    this.withdrawRequests.set(id, withdraw);
    return withdraw;
  }

  async getWithdrawRequests(): Promise<WithdrawRequest[]> {
    return Array.from(this.withdrawRequests.values());
  }

  async updateWithdrawStatus(id: string, status: string): Promise<void> {
    const request = this.withdrawRequests.get(id);
    if (request) {
      request.status = status;
      this.withdrawRequests.set(id, request);
    }
  }

  async getPaymentSettings(): Promise<PaymentSettings> {
    return this.paymentSettings;
  }

  async updatePaymentSettings(settings: InsertPaymentSettings): Promise<PaymentSettings> {
    this.paymentSettings = {
      ...this.paymentSettings,
      ...settings,
    };
    return this.paymentSettings;
  }

  async createPaymentMethod(data: InsertPaymentMethod): Promise<PaymentMethod> {
    const id = randomUUID();
    const paymentMethod: PaymentMethod = {
      id,
      name: data.name,
      type: data.type || "both",
      currency: data.currency || "SYP",
      minAmount: data.minAmount || 0,
      maxAmount: data.maxAmount || 100000,
      fee: data.fee || 0,
      noteEn: data.noteEn || "",
      noteAr: data.noteAr || "",
      isActive: true,
      createdAt: new Date(),
    };
    this.paymentMethods.set(id, paymentMethod);
    return paymentMethod;
  }

  async getPaymentMethods(): Promise<PaymentMethod[]> {
    return Array.from(this.paymentMethods.values());
  }

  async updatePaymentMethodStatus(id: string, isActive: boolean): Promise<void> {
    const paymentMethod = this.paymentMethods.get(id);
    if (paymentMethod) {
      paymentMethod.isActive = isActive;
      this.paymentMethods.set(id, paymentMethod);
    }
  }

  async deletePaymentMethod(id: string): Promise<void> {
    this.paymentMethods.delete(id);
  }

  async updateUserPassword(userId: string, newPassword: string): Promise<void> {
    const user = this.users.get(userId);
    if (user) {
      user.password = newPassword;
      this.users.set(userId, user);
      this.saveUserToDB(user);
    }
  }

  async updateUserLanguage(userId: string, language: string): Promise<void> {
    const user = this.users.get(userId);
    if (user) {
      user.language = language;
      this.users.set(userId, user);
      this.saveUserToDB(user);
    }
  }

  async createPromoCode(promoCode: InsertPromoCode): Promise<PromoCode> {
    const id = randomUUID();
    const newPromoCode: PromoCode = {
      id,
      code: promoCode.code,
      value: promoCode.value,
      type: promoCode.type || "balance",
      usageLimit: promoCode.usageLimit || 1,
      usedCount: 0,
      isActive: true,
      createdAt: new Date(),
    };
    this.promoCodes.set(id, newPromoCode);
    return newPromoCode;
  }

  async getPromoCodes(): Promise<PromoCode[]> {
    return Array.from(this.promoCodes.values());
  }

  async updatePromoCodeStatus(id: string, isActive: boolean): Promise<void> {
    const promoCode = this.promoCodes.get(id);
    if (promoCode) {
      promoCode.isActive = isActive;
      this.promoCodes.set(id, promoCode);
    }
  }

  async redeemPromoCode(userId: string, code: string): Promise<{ success: boolean; message?: string; reward?: string }> {
    const promoCode = Array.from(this.promoCodes.values()).find(p => p.code === code);

    if (!promoCode) {
      return { success: false, message: "Invalid promo code" };
    }

    if (!promoCode.isActive) {
      return { success: false, message: "Promo code is disabled" };
    }

    if (promoCode.usedCount >= promoCode.usageLimit) {
      return { success: false, message: "Promo code has reached usage limit" };
    }

    const user = this.users.get(userId);
    if (!user) {
      return { success: false, message: "User not found" };
    }

    // Apply reward
    let reward = "";
    if (promoCode.type === "balance") {
      user.balance += promoCode.value;
      reward = `£${promoCode.value}`;
    } else if (promoCode.type === "percentage") {
      const bonus = Math.floor(user.balance * (promoCode.value / 100));
      user.balance += bonus;
      reward = `${promoCode.value}% bonus (£${bonus})`;
    }

    // Update usage count
    promoCode.usedCount += 1;
    this.promoCodes.set(promoCode.id, promoCode);
    this.users.set(userId, user);
    this.saveUserToDB(user);

    return { success: true, reward };
  }

  async createSupportTicket(ticket: InsertSupportTicket): Promise<SupportTicket> {
    const id = randomUUID();
    const newTicket: SupportTicket = {
      id,
      userId: ticket.userId,
      username: ticket.username,
      subject: ticket.subject,
      message: ticket.message,
      response: null,
      status: "open",
      createdAt: new Date(),
    };
    this.supportTickets.set(id, newTicket);
    return newTicket;
  }

  async getSupportTickets(): Promise<SupportTicket[]> {
    return Array.from(this.supportTickets.values());
  }

  async updateSupportTicket(id: string, response: string, status: string): Promise<void> {
    const ticket = this.supportTickets.get(id);
    if (ticket) {
      ticket.response = response;
      ticket.status = status;
      this.supportTickets.set(id, ticket);
    }
  }

  async createNotification(notification: { userId: string; title: string; message: string }) {
    const id = randomUUID();
    const newNotification = {
      ...notification,
      id,
      read: false,
      createdAt: new Date(),
    };
    this.notifications.set(id, newNotification);
    return newNotification;
  }

  async getNotificationsByUserId(userId: string) {
    return Array.from(this.notifications.values()).filter((n: any) => n.userId === userId);
  }

  async markNotificationAsRead(id: string) {
    const notification = this.notifications.get(id);
    if (notification) {
      notification.read = true;
      this.notifications.set(id, notification);
    }
  }

  async clearAllNotifications(userId: string) {
    this.notifications.forEach((notification: any, key: string) => {
      if (notification.userId === userId) {
        this.notifications.delete(key);
      }
    });
  }

  async getGameSettings(): Promise<GameSettings> {
    return this.gameSettings;
  }

  async updateGameSettings(settings: Partial<InsertGameSettings>): Promise<GameSettings> {
    this.gameSettings = {
      ...this.gameSettings,
      ...settings,
      updatedAt: new Date(),
    };
    return this.gameSettings;
  }

  async updateUserGameStats(userId: string, stats: {
    betAmount: number;
    won: boolean;
    multiplier: number | null;
    newBalance: number;
  }): Promise<void> {
    const user = this.users.get(userId);
    if (!user) return;

    const profit = stats.won
      ? (stats.betAmount * (stats.multiplier || 0)) - stats.betAmount
      : -stats.betAmount;

    // تحديث الإحصائيات
    user.balance = stats.newBalance;
    user.totalBetsCount += 1;
    user.totalWagered += stats.betAmount;
    user.lifetimeProfit += profit;
    user.sessionBetsCount += 1;
    user.lastBetAmount = stats.betAmount;
    user.lastGameResult = stats.won ? "win" : "loss";

    if (stats.won) {
      user.totalWins += 1;
      user.currentStreak += 1;
      if (user.currentStreak > user.longestStreak) {
        user.longestStreak = user.currentStreak;
      }
    } else {
      user.totalLosses += 1;
      user.currentStreak = 0;
    }

    this.users.set(userId, user);
    this.saveUserToDB(user);
  }

  async updateUserBalance(userId: string, amount: number): Promise<void> {
    const user = this.users.get(userId);
    if (user) {
      user.balance = amount;
      this.users.set(userId, user);
      this.saveUserToDB(user);
    }
  }

  async updateUserStats(userId: string, balance: number, won: boolean): Promise<void> {
    const user = this.users.get(userId);
    if (user) {
      user.balance = balance;
      if (won) {
        user.totalWins += 1;
      } else {
        user.totalLosses += 1;
      }
      this.users.set(userId, user);
      this.saveUserToDB(user);
    }
  }
}

private loadUsersFromDB() {
    const stmt = db.prepare('SELECT * FROM users_cache');
    const rows = stmt.all() as { id: string; data: string }[];

    for (const row of rows) {
      try {
        const user = JSON.parse(row.data);
        this.users.set(row.id, user);
      } catch (e) {
        console.error('Failed to parse user data:', e);
      }
    }
  }

  private saveUserToDB(user: User) {
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO users_cache (id, data, updated_at)
      VALUES (?, ?, ?)
    `);
    stmt.run(user.id, JSON.stringify(user), Date.now());
  }
}

export const storage = new MemStorage();
