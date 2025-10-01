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
  isAdmin: boolean("is_admin").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  email: true,
  password: true,
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
  paymentMethod: varchar("payment_method").notNull().default("Bank Transfer"),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertDepositRequestSchema = createInsertSchema(depositRequests).pick({
  userId: true,
  username: true,
  amount: true,
  paymentMethod: true,
});

export type InsertDepositRequest = z.infer<typeof insertDepositRequestSchema>;
export type DepositRequest = typeof depositRequests.$inferSelect;

export const withdrawRequests = pgTable("withdraw_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  username: text("username").notNull(),
  amount: integer("amount").notNull(),
  address: text("address").notNull(),
  paymentMethod: varchar("payment_method").notNull().default("Bank Transfer"),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertWithdrawRequestSchema = createInsertSchema(withdrawRequests).pick({
  userId: true,
  username: true,
  amount: true,
  address: true,
  paymentMethod: true,
});

export type InsertWithdrawRequest = z.infer<typeof insertWithdrawRequestSchema>;
export type WithdrawRequest = typeof withdrawRequests.$inferSelect;

export const paymentSettings = pgTable("payment_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  depositFee: integer("deposit_fee").notNull().default(0),
  withdrawFee: integer("withdraw_fee").notNull().default(0),
  minDeposit: integer("min_deposit").notNull().default(50),
  maxDeposit: integer("max_deposit").notNull().default(50000),
  minWithdraw: integer("min_withdraw").notNull().default(100),
  maxWithdraw: integer("max_withdraw").notNull().default(50000),
  depositAddress: text("deposit_address").notNull().default(""),
  paymentMethod: text("payment_method").notNull().default('["Bank Transfer", "Cryptocurrency", "PayPal"]'),
});

export const insertPaymentSettingsSchema = createInsertSchema(paymentSettings).omit({
  id: true,
});

export type InsertPaymentSettings = z.infer<typeof insertPaymentSettingsSchema>;
export type PaymentSettings = typeof paymentSettings.$inferSelect;