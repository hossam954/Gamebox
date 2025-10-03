
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
  InsertSupportTicket
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
    createdAt TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS password_recovery (
    id TEXT PRIMARY KEY,
    userId TEXT NOT NULL,
    username TEXT NOT NULL,
    email TEXT NOT NULL,
    message TEXT NOT NULL,
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
    paymentMethod TEXT DEFAULT 'Bank Transfer'
  );

  CREATE TABLE IF NOT EXISTS payment_methods (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    minAmount INTEGER DEFAULT 0,
    maxAmount INTEGER DEFAULT 100000,
    fee INTEGER DEFAULT 0,
    note TEXT DEFAULT '',
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
`);

// Initialize admin user if not exists
const adminExists = db.prepare("SELECT * FROM users WHERE username = ?").get("abodiab");
if (!adminExists) {
  const adminId = randomUUID();
  db.prepare(`
    INSERT INTO users (id, username, email, password, balance, totalWins, totalLosses, isAdmin, createdAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(adminId, "abodiab", "abojafar1327@gmail.com", "aaa123ddd", 0, 0, 0, 1, new Date().toISOString());
}

// Initialize payment settings if not exists
const settingsExists = db.prepare("SELECT * FROM payment_settings").get();
if (!settingsExists) {
  const settingsId = randomUUID();
  db.prepare(`
    INSERT INTO payment_settings (id, withdrawFee, minDeposit, maxDeposit, minWithdraw, maxWithdraw, depositAddress, paymentMethod)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(settingsId, 5, 50, 50000, 100, 50000, "SYP-WALLET-ADDRESS-12345", "Bank Transfer / Mobile Wallet");
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
    db.prepare(`
      INSERT INTO users (id, username, email, password, balance, totalWins, totalLosses, isAdmin, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, insertUser.username, insertUser.email, insertUser.password, 0, 0, 0, 0, createdAt);

    return {
      id,
      ...insertUser,
      balance: 0,
      totalWins: 0,
      totalLosses: 0,
      isAdmin: false,
      createdAt: new Date(createdAt)
    };
  }

  async updateUserBalance(userId: string, amount: number): Promise<void> {
    db.prepare("UPDATE users SET balance = ? WHERE id = ?").run(amount, userId);
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

  async createPasswordRecovery(request: InsertPasswordRecovery): Promise<PasswordRecoveryRequest> {
    const id = randomUUID();
    const createdAt = new Date().toISOString();
    db.prepare(`
      INSERT INTO password_recovery (id, userId, username, email, message, status, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(id, request.userId, request.username, request.email, request.message, 'pending', createdAt);

    return {
      id,
      ...request,
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
    db.prepare(`
      UPDATE payment_settings 
      SET withdrawFee = ?, minDeposit = ?, maxDeposit = ?, minWithdraw = ?, maxWithdraw = ?, depositAddress = ?, paymentMethod = ?
      WHERE id = ?
    `).run(
      settings.withdrawFee,
      settings.minDeposit,
      settings.maxDeposit,
      settings.minWithdraw,
      settings.maxWithdraw,
      settings.depositAddress,
      settings.paymentMethod,
      current.id
    );

    return { ...current, ...settings };
  }

  async createPaymentMethod(data: InsertPaymentMethod): Promise<PaymentMethod> {
    const id = randomUUID();
    const createdAt = new Date().toISOString();
    db.prepare(`
      INSERT INTO payment_methods (id, name, type, minAmount, maxAmount, fee, note, isActive, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, data.name, data.type || "both", data.minAmount || 0, data.maxAmount || 100000, data.fee || 0, data.note || "", 1, createdAt);

    return {
      id,
      name: data.name,
      type: data.type || "both",
      minAmount: data.minAmount || 0,
      maxAmount: data.maxAmount || 100000,
      fee: data.fee || 0,
      note: data.note || "",
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
}

export const storage = new SQLiteStorage();
