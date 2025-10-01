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
  type InsertPaymentSettings
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
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private passwordRecoveryRequests: Map<string, PasswordRecoveryRequest>;
  private depositRequests: Map<string, DepositRequest>;
  private withdrawRequests: Map<string, WithdrawRequest>;
  private paymentSettings: PaymentSettings;

  constructor() {
    this.users = new Map();
    this.passwordRecoveryRequests = new Map();
    this.depositRequests = new Map();
    this.withdrawRequests = new Map();

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
}

export const storage = new MemStorage();