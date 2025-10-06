import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  balance: integer("balance").notNull().default(0),
  totalWins: integer("total_wins").notNull().default(0),
  totalLosses: integer("total_losses").notNull().default(0),
  isAdmin: boolean("is_admin").notNull().default(false),
  referralCode: text("referral_code").unique(),
  referredBy: text("referred_by"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  email: true,
  password: true,
  referredBy: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export const passwordRecoveryRequests = pgTable("password_recovery_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  username: text("username").notNull(),
  email: text("email").notNull(),
  message: text("message").notNull(),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertPasswordRecoverySchema = createInsertSchema(passwordRecoveryRequests).pick({
  userId: true,
  username: true,
  email: true,
  message: true,
});

export type InsertPasswordRecovery = z.infer<typeof insertPasswordRecoverySchema>;
export type PasswordRecoveryRequest = typeof passwordRecoveryRequests.$inferSelect;

export const depositRequests = pgTable("deposit_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  username: text("username").notNull(),
  amount: integer("amount").notNull(),
  paymentMethodId: varchar("payment_method_id"),
  transactionNumber: text("transaction_number"),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertDepositRequestSchema = createInsertSchema(depositRequests).pick({
  userId: true,
  username: true,
  amount: true,
  paymentMethodId: true,
  transactionNumber: true,
});

export type InsertDepositRequest = z.infer<typeof insertDepositRequestSchema>;
export type DepositRequest = typeof depositRequests.$inferSelect;

export const withdrawRequests = pgTable("withdraw_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  username: text("username").notNull(),
  amount: integer("amount").notNull(),
  paymentMethodId: varchar("payment_method_id"),
  address: text("address").notNull(),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertWithdrawRequestSchema = createInsertSchema(withdrawRequests).pick({
  userId: true,
  username: true,
  amount: true,
  paymentMethodId: true,
  address: true,
});

export type InsertWithdrawRequest = z.infer<typeof insertWithdrawRequestSchema>;
export type WithdrawRequest = typeof withdrawRequests.$inferSelect;

export const paymentSettings = pgTable("payment_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  withdrawFee: integer("withdraw_fee").notNull().default(0),
  minDeposit: integer("min_deposit").notNull().default(50),
  maxDeposit: integer("max_deposit").notNull().default(50000),
  minWithdraw: integer("min_withdraw").notNull().default(100),
  maxWithdraw: integer("max_withdraw").notNull().default(50000),
  depositAddress: text("deposit_address").notNull().default(""),
  paymentMethod: text("payment_method").notNull().default("Bank Transfer"),
  winRate: integer("win_rate").notNull().default(50), // 0-100: نسبة الربح
});

export const insertPaymentSettingsSchema = createInsertSchema(paymentSettings).omit({
  id: true,
});

export type InsertPaymentSettings = z.infer<typeof insertPaymentSettingsSchema>;
export type PaymentSettings = typeof paymentSettings.$inferSelect;

export const paymentMethods = pgTable("payment_methods", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  type: text("type").notNull().default("both"), // "deposit", "withdraw", "both"
  minAmount: integer("min_amount").notNull().default(0),
  maxAmount: integer("max_amount").notNull().default(100000),
  fee: integer("fee").notNull().default(0),
  note: text("note").notNull().default(""),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertPaymentMethodSchema = createInsertSchema(paymentMethods).pick({
  name: true,
  type: true,
  minAmount: true,
  maxAmount: true,
  fee: true,
  note: true,
});

export type InsertPaymentMethod = z.infer<typeof insertPaymentMethodSchema>;
export type PaymentMethod = typeof paymentMethods.$inferSelect;

export const promoCodes = pgTable("promo_codes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  code: text("code").notNull().unique(),
  value: integer("value").notNull(),
  type: text("type").notNull().default("balance"), // "balance" or "percentage"
  usageLimit: integer("usage_limit").notNull().default(1),
  usedCount: integer("used_count").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertPromoCodeSchema = createInsertSchema(promoCodes).pick({
  code: true,
  value: true,
  type: true,
  usageLimit: true,
});

export type InsertPromoCode = z.infer<typeof insertPromoCodeSchema>;
export type PromoCode = typeof promoCodes.$inferSelect;

export const supportTickets = pgTable("support_tickets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  username: text("username").notNull(),
  subject: text("subject").notNull(),
  message: text("message").notNull(),
  response: text("response"),
  status: text("status").notNull().default("open"), // "open", "in_progress", "closed"
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertSupportTicketSchema = createInsertSchema(supportTickets).pick({
  userId: true,
  username: true,
  subject: true,
  message: true,
});

export type InsertSupportTicket = z.infer<typeof insertSupportTicketSchema>;
export type SupportTicket = typeof supportTickets.$inferSelect;

export const notifications = pgTable("notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  read: boolean("read").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertNotificationSchema = createInsertSchema(notifications).pick({
  userId: true,
  title: true,
  message: true,
});

export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Notification = typeof notifications.$inferSelect;