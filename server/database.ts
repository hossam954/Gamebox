
import Database from "better-sqlite3";
import { randomUUID } from "crypto";
import type {
  User,
  InsertUser,
  PasswordRecoveryRequest,
  InsertPasswordRecovery,
  DepositRequest,
  InsertDepositRequest,
  WithdrawRequest,
  InsertWithdrawRequest,
  PaymentSettings,
  InsertPaymentSettings,
  PaymentMethod,
  InsertPaymentMethod,
  PromoCode,
  InsertPromoCode,
  SupportTicket,
  InsertSupportTicket,
  PasswordResetToken,
  InsertPasswordResetToken,
  GameSettings,
  InsertGameSettings
} from "@shared/schema";

const db = new Database("database.db");

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    balance INTEGER DEFAULT 0,
    totalWins INTEGER DEFAULT 0,
    totalLosses INTEGER DEFAULT 0,
    isAdmin INTEGER DEFAULT 0,
    referralCode TEXT UNIQUE,
    referredBy TEXT,
    language TEXT DEFAULT 'en',
    currentStreak INTEGER DEFAULT 0,
    longestStreak INTEGER DEFAULT 0,
    totalBetsCount INTEGER DEFAULT 0,
    totalWagered INTEGER DEFAULT 0,
    lifetimeProfit INTEGER DEFAULT 0,
    sessionStartBalance INTEGER DEFAULT 0,
    sessionBetsCount INTEGER DEFAULT 0,
    lastBetAmount INTEGER DEFAULT 0,
    lastGameResult TEXT DEFAULT '',
    createdAt TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS password_recovery (
    id TEXT PRIMARY KEY,
    userId TEXT NOT NULL,
    username TEXT NOT NULL,
    email TEXT NOT NULL,
    message TEXT DEFAULT '',
    status TEXT DEFAULT 'pending',
    createdAt TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS deposit_requests (
    id TEXT PRIMARY KEY,
    userId TEXT NOT NULL,
    username TEXT NOT NULL,
    amount INTEGER NOT NULL,
    paymentMethodId TEXT,
    transactionNumber TEXT,
    status TEXT DEFAULT 'pending',
    createdAt TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS withdraw_requests (
    id TEXT PRIMARY KEY,
    userId TEXT NOT NULL,
    username TEXT NOT NULL,
    amount INTEGER NOT NULL,
    paymentMethodId TEXT,
    address TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    createdAt TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS payment_settings (
    id TEXT PRIMARY KEY,
    withdrawFee INTEGER DEFAULT 5,
    minDeposit INTEGER DEFAULT 50,
    maxDeposit INTEGER DEFAULT 50000,
    minWithdraw INTEGER DEFAULT 100,
    maxWithdraw INTEGER DEFAULT 50000,
    depositAddress TEXT DEFAULT '',
    paymentMethod TEXT DEFAULT 'Bank Transfer',
    winRate INTEGER DEFAULT 50,
    usdDepositRate INTEGER DEFAULT 11400,
    usdWithdrawRate INTEGER DEFAULT 11700
  );

  CREATE TABLE IF NOT EXISTS payment_methods (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    currency TEXT DEFAULT 'SYP',
    minAmount INTEGER DEFAULT 0,
    maxAmount INTEGER DEFAULT 100000,
    fee INTEGER DEFAULT 0,
    noteEn TEXT DEFAULT '',
    noteAr TEXT DEFAULT '',
    isActive INTEGER DEFAULT 1,
    createdAt TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS promo_codes (
    id TEXT PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    value INTEGER NOT NULL,
    type TEXT DEFAULT 'balance',
    usageLimit INTEGER DEFAULT 1,
    usedCount INTEGER DEFAULT 0,
    isActive INTEGER DEFAULT 1,
    createdAt TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS support_tickets (
    id TEXT PRIMARY KEY,
    userId TEXT NOT NULL,
    username TEXT NOT NULL,
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    response TEXT,
    status TEXT DEFAULT 'open',
    createdAt TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY,
    userId TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    read INTEGER DEFAULT 0,
    createdAt TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id TEXT PRIMARY KEY,
    userId TEXT NOT NULL,
    token TEXT UNIQUE NOT NULL,
    expiresAt TEXT NOT NULL,
    used INTEGER DEFAULT 0,
    createdAt TEXT NOT NULL
  );
`);

// Initialize admin user if not exists
const adminExists = db.prepare("SELECT * FROM users WHERE username = ?").get("abodiab");
if (!adminExists) {
  const adminId = randomUUID();
  db.prepare(`
    INSERT INTO users (
      id, username, email, password, balance, totalWins, totalLosses, isAdmin, 
      referralCode, language, currentStreak, longestStreak, totalBetsCount, 
      totalWagered, lifetimeProfit, sessionStartBalance, sessionBetsCount, 
      lastBetAmount, lastGameResult, createdAt
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    adminId, "abodiab", "abojafar1327@gmail.com", "aaa123ddd", 50000, 0, 0, 1,
    "ADMIN123", "en", 0, 0, 0, 0, 0, 50000, 0, 0, "", new Date().toISOString()
  );
}

// Add USD columns to payment_methods if they don't exist
try {
  db.prepare("ALTER TABLE payment_methods ADD COLUMN min_amount_usd INTEGER DEFAULT 0").run();
} catch (e) {
  // Column already exists
}
try {
  db.prepare("ALTER TABLE payment_methods ADD COLUMN max_amount_usd INTEGER DEFAULT 1000").run();
} catch (e) {
  // Column already exists
}

// Add winRate column if it doesn't exist
try {
  db.prepare("ALTER TABLE payment_settings ADD COLUMN winRate INTEGER DEFAULT 50").run();
} catch (e) {
  // Column already exists
}

// Initialize payment settings if not exists
const settingsExists = db.prepare("SELECT * FROM payment_settings").get();
if (!settingsExists) {
  const settingsId = randomUUID();
  db.prepare(`
    INSERT INTO payment_settings (id, withdrawFee, minDeposit, maxDeposit, minWithdraw, maxWithdraw, depositAddress, paymentMethod, winRate, usdDepositRate, usdWithdrawRate)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(settingsId, 5, 50, 50000, 100, 50000, "SYP-WALLET-ADDRESS-12345", "Bank Transfer / Mobile Wallet", 50, 11400, 11700);
}

export class SQLiteStorage {
  async getUser(id: string): Promise<User | undefined> {
    const user = db.prepare("SELECT * FROM users WHERE id = ?").get(id) as any;
    if (user) {
      return {
        ...user,
        isAdmin: Boolean(user.isAdmin),
        createdAt: new Date(user.createdAt)
      };
    }
    return undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const user = db.prepare("SELECT * FROM users WHERE username = ?").get(username) as any;
    if (user) {
      return {
        ...user,
        isAdmin: Boolean(user.isAdmin),
        createdAt: new Date(user.createdAt)
      };
    }
    return undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email) as any;
    if (user) {
      return {
        ...user,
        isAdmin: Boolean(user.isAdmin),
        createdAt: new Date(user.createdAt)
      };
    }
    return undefined;
  }

  async getUserByUsernameOrEmail(usernameOrEmail: string): Promise<User | undefined> {
    const user = db.prepare("SELECT * FROM users WHERE username = ? OR email = ?").get(usernameOrEmail, usernameOrEmail) as any;
    if (user) {
      return {
        ...user,
        isAdmin: Boolean(user.isAdmin),
        createdAt: new Date(user.createdAt)
      };
    }
    return undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const createdAt = new Date().toISOString();
    const referralCode = this.generateReferralCode();
    const referredBy = insertUser.referredBy && insertUser.referredBy.trim() !== "" ? insertUser.referredBy : null;
    const language = insertUser.language || "en";
    
    db.prepare(`
      INSERT INTO users (
        id, username, email, password, balance, totalWins, totalLosses, isAdmin, 
        referralCode, referredBy, language, currentStreak, longestStreak, totalBetsCount, 
        totalWagered, lifetimeProfit, sessionStartBalance, sessionBetsCount, 
        lastBetAmount, lastGameResult, createdAt
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id, insertUser.username, insertUser.email, insertUser.password, 0, 0, 0, 0,
      referralCode, referredBy, language, 0, 0, 0, 0, 0, 0, 0, 0, "", createdAt
    );

    return {
      id,
      username: insertUser.username,
      email: insertUser.email,
      password: insertUser.password,
      balance: 0,
      totalWins: 0,
      totalLosses: 0,
      isAdmin: false,
      referralCode,
      referredBy: referredBy,
      language,
      currentStreak: 0,
      longestStreak: 0,
      totalBetsCount: 0,
      totalWagered: 0,
      lifetimeProfit: 0,
      sessionStartBalance: 0,
      sessionBetsCount: 0,
      lastBetAmount: 0,
      lastGameResult: "",
      createdAt: new Date(createdAt)
    };
  }

  private generateReferralCode(): string {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return code;
  }

  async updateUserBalance(userId: string, amount: number): Promise<void> {
    db.prepare("UPDATE users SET balance = ? WHERE id = ?").run(amount, userId);
  }

  async updateUserStatus(userId: string, status: string): Promise<void> {
    db.prepare("UPDATE users SET status = ? WHERE id = ?").run(status, userId);
  }

  async updateUserStats(userId: string, balance: number, won: boolean): Promise<void> {
    if (won) {
      db.prepare("UPDATE users SET balance = ?, totalWins = totalWins + 1 WHERE id = ?").run(balance, userId);
    } else {
      db.prepare("UPDATE users SET balance = ?, totalLosses = totalLosses + 1 WHERE id = ?").run(balance, userId);
    }
  }

  async getAllUsers(): Promise<User[]> {
    const users = db.prepare("SELECT * FROM users").all() as any[];
    return users.map(user => ({
      ...user,
      isAdmin: Boolean(user.isAdmin),
      createdAt: new Date(user.createdAt)
    }));
  }

  async getUserByReferralCode(referralCode: string): Promise<User | undefined> {
    const user = db.prepare("SELECT * FROM users WHERE referralCode = ?").get(referralCode) as any;
    if (user) {
      return {
        ...user,
        isAdmin: Boolean(user.isAdmin),
        createdAt: new Date(user.createdAt)
      };
    }
    return undefined;
  }

  async deleteUser(userId: string): Promise<void> {
    // Delete all user-related data
    db.prepare("DELETE FROM password_recovery WHERE userId = ?").run(userId);
    db.prepare("DELETE FROM deposit_requests WHERE userId = ?").run(userId);
    db.prepare("DELETE FROM withdraw_requests WHERE userId = ?").run(userId);
    db.prepare("DELETE FROM support_tickets WHERE userId = ?").run(userId);
    db.prepare("DELETE FROM notifications WHERE userId = ?").run(userId);
    db.prepare("DELETE FROM users WHERE id = ?").run(userId);
  }

  async getReferralCount(referralCode: string): Promise<number> {
    const result = db.prepare("SELECT COUNT(*) as count FROM users WHERE referredBy = ?").get(referralCode) as any;
    return result?.count || 0;
  }

  async createPasswordRecovery(request: InsertPasswordRecovery): Promise<PasswordRecoveryRequest> {
    const id = randomUUID();
    const createdAt = new Date().toISOString();
    const message = request.message || '';
    db.prepare(`
      INSERT INTO password_recovery (id, userId, username, email, message, status, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(id, request.userId, request.username, request.email, message, 'pending', createdAt);

    return {
      id,
      userId: request.userId,
      username: request.username,
      email: request.email,
      message,
      status: 'pending',
      createdAt: new Date(createdAt)
    };
  }

  async getPasswordRecoveryRequests(): Promise<PasswordRecoveryRequest[]> {
    const requests = db.prepare("SELECT * FROM password_recovery").all() as any[];
    return requests.map(req => ({
      ...req,
      createdAt: new Date(req.createdAt)
    }));
  }

  async updatePasswordRecoveryStatus(id: string, status: string): Promise<void> {
    db.prepare("UPDATE password_recovery SET status = ? WHERE id = ?").run(status, id);
  }

  async createDepositRequest(request: InsertDepositRequest): Promise<DepositRequest> {
    const id = randomUUID();
    const createdAt = new Date().toISOString();
    db.prepare(`
      INSERT INTO deposit_requests (id, userId, username, amount, paymentMethodId, transactionNumber, status, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, request.userId, request.username, request.amount, request.paymentMethodId || null, request.transactionNumber || null, 'pending', createdAt);

    return {
      id,
      userId: request.userId,
      username: request.username,
      amount: request.amount,
      paymentMethodId: request.paymentMethodId || null,
      transactionNumber: request.transactionNumber || null,
      status: 'pending',
      createdAt: new Date(createdAt)
    };
  }

  async getDepositRequests(): Promise<DepositRequest[]> {
    const requests = db.prepare("SELECT * FROM deposit_requests").all() as any[];
    return requests.map(req => ({
      ...req,
      createdAt: new Date(req.createdAt)
    }));
  }

  async updateDepositStatus(id: string, status: string): Promise<void> {
    db.prepare("UPDATE deposit_requests SET status = ? WHERE id = ?").run(status, id);
  }

  async createWithdrawRequest(request: InsertWithdrawRequest): Promise<WithdrawRequest> {
    const id = randomUUID();
    const createdAt = new Date().toISOString();
    db.prepare(`
      INSERT INTO withdraw_requests (id, userId, username, amount, paymentMethodId, address, status, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, request.userId, request.username, request.amount, request.paymentMethodId || null, request.address, 'pending', createdAt);

    return {
      id,
      userId: request.userId,
      username: request.username,
      amount: request.amount,
      paymentMethodId: request.paymentMethodId || null,
      address: request.address,
      status: 'pending',
      createdAt: new Date(createdAt)
    };
  }

  async getWithdrawRequests(): Promise<WithdrawRequest[]> {
    const requests = db.prepare("SELECT * FROM withdraw_requests").all() as any[];
    return requests.map(req => ({
      ...req,
      createdAt: new Date(req.createdAt)
    }));
  }

  async updateWithdrawStatus(id: string, status: string): Promise<void> {
    db.prepare("UPDATE withdraw_requests SET status = ? WHERE id = ?").run(status, id);
  }

  async getPaymentSettings(): Promise<PaymentSettings> {
    const settings = db.prepare("SELECT * FROM payment_settings LIMIT 1").get() as any;
    return settings;
  }

  async updatePaymentSettings(settings: InsertPaymentSettings): Promise<PaymentSettings> {
    const current = await this.getPaymentSettings();
    
    const updatedSettings = {
      withdrawFee: settings.withdrawFee ?? current.withdrawFee,
      minDeposit: settings.minDeposit ?? current.minDeposit,
      maxDeposit: settings.maxDeposit ?? current.maxDeposit,
      minWithdraw: settings.minWithdraw ?? current.minWithdraw,
      maxWithdraw: settings.maxWithdraw ?? current.maxWithdraw,
      depositAddress: settings.depositAddress ?? current.depositAddress,
      paymentMethod: settings.paymentMethod ?? current.paymentMethod,
      winRate: settings.winRate ?? current.winRate,
      usdDepositRate: settings.usdDepositRate ?? current.usdDepositRate,
      usdWithdrawRate: settings.usdWithdrawRate ?? current.usdWithdrawRate,
    };

    db.prepare(`
      UPDATE payment_settings 
      SET withdrawFee = ?, minDeposit = ?, maxDeposit = ?, minWithdraw = ?, maxWithdraw = ?, depositAddress = ?, paymentMethod = ?, winRate = ?, usdDepositRate = ?, usdWithdrawRate = ?
      WHERE id = ?
    `).run(
      updatedSettings.withdrawFee,
      updatedSettings.minDeposit,
      updatedSettings.maxDeposit,
      updatedSettings.minWithdraw,
      updatedSettings.maxWithdraw,
      updatedSettings.depositAddress,
      updatedSettings.paymentMethod,
      updatedSettings.winRate,
      updatedSettings.usdDepositRate,
      updatedSettings.usdWithdrawRate,
      current.id
    );

    return { id: current.id, ...updatedSettings };
  }

  async createPaymentMethod(data: InsertPaymentMethod): Promise<PaymentMethod> {
    const id = randomUUID();
    const createdAt = new Date().toISOString();
    db.prepare(`
      INSERT INTO payment_methods (id, name, type, currency, minAmount, maxAmount, min_amount_usd, max_amount_usd, fee, noteEn, noteAr, isActive, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id, 
      data.name, 
      data.type || "both", 
      data.currency || "SYP", 
      data.minAmount || 0, 
      data.maxAmount || 100000,
      data.minAmountUSD || 0,
      data.maxAmountUSD || 1000,
      data.fee || 0, 
      data.noteEn || "", 
      data.noteAr || "", 
      1, 
      createdAt
    );

    return {
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
      createdAt: new Date(createdAt)
    };
  }

  async getPaymentMethods(): Promise<PaymentMethod[]> {
    const methods = db.prepare("SELECT * FROM payment_methods").all() as any[];
    return methods.map(method => ({
      ...method,
      isActive: Boolean(method.isActive),
      createdAt: new Date(method.createdAt)
    }));
  }

  async updatePaymentMethodStatus(id: string, isActive: boolean): Promise<void> {
    db.prepare("UPDATE payment_methods SET isActive = ? WHERE id = ?").run(isActive ? 1 : 0, id);
  }

  async deletePaymentMethod(id: string): Promise<void> {
    db.prepare("DELETE FROM payment_methods WHERE id = ?").run(id);
  }

  async updateUserPassword(userId: string, newPassword: string): Promise<void> {
    db.prepare("UPDATE users SET password = ? WHERE id = ?").run(newPassword, userId);
  }

  async createPromoCode(promoCode: InsertPromoCode): Promise<PromoCode> {
    const id = randomUUID();
    const createdAt = new Date().toISOString();
    db.prepare(`
      INSERT INTO promo_codes (id, code, value, type, usageLimit, usedCount, isActive, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, promoCode.code, promoCode.value, promoCode.type || "balance", promoCode.usageLimit || 1, 0, 1, createdAt);

    return {
      id,
      code: promoCode.code,
      value: promoCode.value,
      type: promoCode.type || "balance",
      usageLimit: promoCode.usageLimit || 1,
      usedCount: 0,
      isActive: true,
      createdAt: new Date(createdAt)
    };
  }

  async getPromoCodes(): Promise<PromoCode[]> {
    const codes = db.prepare("SELECT * FROM promo_codes").all() as any[];
    return codes.map(code => ({
      ...code,
      isActive: Boolean(code.isActive),
      createdAt: new Date(code.createdAt)
    }));
  }

  async updatePromoCodeStatus(id: string, isActive: boolean): Promise<void> {
    db.prepare("UPDATE promo_codes SET isActive = ? WHERE id = ?").run(isActive ? 1 : 0, id);
  }

  async redeemPromoCode(userId: string, code: string): Promise<{ success: boolean; message?: string; reward?: string }> {
    const promoCode = db.prepare("SELECT * FROM promo_codes WHERE code = ?").get(code) as any;

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
    if (promoCode.type === "balance") {
      await this.updateUserBalance(userId, user.balance + promoCode.value);
      reward = `£${promoCode.value}`;
    } else if (promoCode.type === "percentage") {
      const bonus = Math.floor(user.balance * (promoCode.value / 100));
      await this.updateUserBalance(userId, user.balance + bonus);
      reward = `${promoCode.value}% bonus (£${bonus})`;
    }

    db.prepare("UPDATE promo_codes SET usedCount = usedCount + 1 WHERE id = ?").run(promoCode.id);

    return { success: true, reward };
  }

  async createSupportTicket(ticket: InsertSupportTicket): Promise<SupportTicket> {
    const id = randomUUID();
    const createdAt = new Date().toISOString();
    db.prepare(`
      INSERT INTO support_tickets (id, userId, username, subject, message, status, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(id, ticket.userId, ticket.username, ticket.subject, ticket.message, 'open', createdAt);

    return {
      id,
      userId: ticket.userId,
      username: ticket.username,
      subject: ticket.subject,
      message: ticket.message,
      response: null,
      status: 'open',
      createdAt: new Date(createdAt)
    };
  }

  async getSupportTickets(): Promise<SupportTicket[]> {
    const tickets = db.prepare("SELECT * FROM support_tickets").all() as any[];
    return tickets.map(ticket => ({
      ...ticket,
      createdAt: new Date(ticket.createdAt)
    }));
  }

  async updateSupportTicket(id: string, response: string, status: string): Promise<void> {
    db.prepare("UPDATE support_tickets SET response = ?, status = ? WHERE id = ?").run(response, status, id);
  }

  async createNotification(data: { userId: string; title: string; message: string }): Promise<void> {
    const id = randomUUID();
    const createdAt = new Date().toISOString();
    db.prepare(`
      INSERT INTO notifications (id, userId, title, message, read, createdAt)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, data.userId, data.title, data.message, 0, createdAt);
  }

  async getNotificationsByUserId(userId: string): Promise<any[]> {
    const notifications = db.prepare("SELECT * FROM notifications WHERE userId = ? ORDER BY createdAt DESC").all(userId) as any[];
    return notifications.map(notif => ({
      ...notif,
      read: Boolean(notif.read),
      createdAt: new Date(notif.createdAt)
    }));
  }

  async markNotificationAsRead(id: string): Promise<void> {
    db.prepare("UPDATE notifications SET read = 1 WHERE id = ?").run(id);
  }

  async clearAllNotifications(userId: string): Promise<void> {
    db.prepare("DELETE FROM notifications WHERE userId = ?").run(userId);
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
    
    db.prepare(`
      INSERT INTO password_reset_tokens (id, userId, token, expiresAt, used, createdAt)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, userId, token, expiresAt.toISOString(), 0, new Date().toISOString());
    
    return resetToken;
  }

  async getPasswordResetToken(token: string): Promise<PasswordResetToken | undefined> {
    const resetToken = db.prepare("SELECT * FROM password_reset_tokens WHERE token = ?").get(token) as any;
    if (resetToken) {
      return {
        ...resetToken,
        used: Boolean(resetToken.used),
        expiresAt: new Date(resetToken.expiresAt),
        createdAt: new Date(resetToken.createdAt)
      };
    }
    return undefined;
  }

  async markTokenAsUsed(token: string): Promise<void> {
    db.prepare("UPDATE password_reset_tokens SET used = 1 WHERE token = ?").run(token);
  }

  async updateUserLanguage(userId: string, language: string): Promise<void> {
    db.prepare("UPDATE users SET language = ? WHERE id = ?").run(language, userId);
  }

  async getGameSettings(): Promise<GameSettings> {
    return {
      id: randomUUID(),
      baseWinRate: 50,
      targetLossRate: 70,
      maxMultiplier: 50,
      strategy: "balanced",
      phase1Rounds: 10,
      phase2Rounds: 20,
      multiplier2to5Chance: 40,
      multiplier5to10Chance: 30,
      multiplier10to25Chance: 20,
      multiplier25to50Chance: 8,
      multiplier50PlusChance: 2,
      highBetThreshold: 5000,
      highBetMaxMultiplier: 20,
      updatedAt: new Date(),
    };
  }

  async updateGameSettings(settings: Partial<InsertGameSettings>): Promise<GameSettings> {
    return this.getGameSettings();
  }

  async updateUserGameStats(userId: string, stats: {
    betAmount: number;
    won: boolean;
    multiplier: number | null;
    newBalance: number;
  }): Promise<void> {
    const user = await this.getUser(userId);
    if (!user) return;

    const profit = stats.won
      ? (stats.betAmount * (stats.multiplier || 0)) - stats.betAmount
      : -stats.betAmount;

    // تحديث الإحصائيات
    const currentStreak = stats.won ? (user.currentStreak + 1) : 0;
    const longestStreak = stats.won && currentStreak > user.longestStreak ? currentStreak : user.longestStreak;

    db.prepare(`
      UPDATE users 
      SET balance = ?,
          totalWins = totalWins + ?,
          totalLosses = totalLosses + ?,
          totalBetsCount = totalBetsCount + 1,
          totalWagered = totalWagered + ?,
          lifetimeProfit = lifetimeProfit + ?,
          sessionBetsCount = sessionBetsCount + 1,
          lastBetAmount = ?,
          lastGameResult = ?,
          currentStreak = ?,
          longestStreak = ?
      WHERE id = ?
    `).run(
      stats.newBalance,
      stats.won ? 1 : 0,
      stats.won ? 0 : 1,
      stats.betAmount,
      profit,
      stats.betAmount,
      stats.won ? "win" : "loss",
      currentStreak,
      longestStreak,
      userId
    );
  }
}

export const storage = new SQLiteStorage();
