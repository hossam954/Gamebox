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
  type InsertSupportTicket
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
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private passwordRecoveryRequests: Map<string, PasswordRecoveryRequest>;
  private depositRequests: Map<string, DepositRequest>;
  private withdrawRequests: Map<string, WithdrawRequest>;
  private paymentSettings: PaymentSettings;
  private paymentMethods: Map<string, PaymentMethod>;
  private promoCodes: Map<string, PromoCode>;
  private supportTickets: Map<string, SupportTicket>;
  private notifications: Map<string, any>;

  constructor() {
    this.users = new Map();
    this.passwordRecoveryRequests = new Map();
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
    };

    const defaultPaymentMethod1: PaymentMethod = {
      id: randomUUID(),
      name: "Bank Transfer",
      type: "bank",
      minAmount: 50,
      maxAmount: 50000,
      fee: 0,
      note: "Please use your username as reference.",
      isActive: true,
      createdAt: new Date(),
    };
    this.paymentMethods.set(defaultPaymentMethod1.id, defaultPaymentMethod1);

    const defaultPaymentMethod2: PaymentMethod = {
      id: randomUUID(),
      name: "Mobile Wallet",
      type: "mobile",
      minAmount: 50,
      maxAmount: 10000,
      fee: 0,
      note: "Please provide your mobile number.",
      isActive: true,
      createdAt: new Date(),
    };
    this.paymentMethods.set(defaultPaymentMethod2.id, defaultPaymentMethod2);
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
      createdAt: new Date(),
    };
    this.users.set(id, user);
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
      minAmount: data.minAmount || 0,
      maxAmount: data.maxAmount || 100000,
      fee: data.fee || 0,
      note: data.note || "",
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
}

export const storage = new MemStorage();