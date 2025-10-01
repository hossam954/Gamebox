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
  createUser(user: InsertUser): Promise<User>;
  updateUserBalance(userId: string, amount: number): Promise<void>;
  getAllUsers(): Promise<User[]>;

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

  updateUserPassword(userId: string, newPassword: string): Promise<void>;

  createPromoCode(promoCode: InsertPromoCode): Promise<PromoCode>;
  getPromoCodes(): Promise<PromoCode[]>;
  updatePromoCodeStatus(id: string, isActive: boolean): Promise<void>;
  redeemPromoCode(userId: string, code: string): Promise<{ success: boolean; message?: string; reward?: string }>;

  createSupportTicket(ticket: InsertSupportTicket): Promise<SupportTicket>;
  getSupportTickets(): Promise<SupportTicket[]>;
  updateSupportTicket(id: string, response: string, status: string): Promise<void>;
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

  constructor() {
    this.users = new Map();
    this.passwordRecoveryRequests = new Map();
    this.depositRequests = new Map();
    this.withdrawRequests = new Map();
    this.paymentMethods = new Map();
    this.promoCodes = new Map();
    this.supportTickets = new Map();

    const adminId = randomUUID();
    const adminUser: User = {
      id: adminId,
      username: "abodiab",
      email: "abojafar1327@gmail.com",
      password: "aaa123ddd",
      balance: 50000,
      isAdmin: true,
      createdAt: new Date(),
    };
    this.users.set(adminId, adminUser);

    this.paymentSettings = {
      id: randomUUID(),
      depositFee: 0,
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
    const user: User = {
      ...insertUser,
      id,
      balance: 1000,
      isAdmin: false,
      createdAt: new Date(),
    };
    this.users.set(id, user);
    return user;
  }

  async updateUserBalance(userId: string, amount: number): Promise<void> {
    const user = this.users.get(userId);
    if (user) {
      user.balance = amount;
      this.users.set(userId, user);
    }
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
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
      ...request,
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
      ...request,
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
      ...data,
      id,
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
      ...promoCode,
      id,
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
      ...ticket,
      id,
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
}

export const storage = new MemStorage();