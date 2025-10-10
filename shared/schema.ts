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
  language: text("language").notNull().default("en"),
  
  // إحصائيات اللعبة المتقدمة
  currentStreak: integer("current_streak").notNull().default(0), // عدد الانتصارات المتتالية
  longestStreak: integer("longest_streak").notNull().default(0), // أطول سلسلة انتصارات
  totalBetsCount: integer("total_bets_count").notNull().default(0), // إجمالي عدد المراهنات
  totalWagered: integer("total_wagered").notNull().default(0), // إجمالي المبالغ المراهن بها
  lifetimeProfit: integer("lifetime_profit").notNull().default(0), // الربح/الخسارة الإجمالية
  sessionStartBalance: integer("session_start_balance").notNull().default(0), // الرصيد عند بداية الجلسة
  sessionBetsCount: integer("session_bets_count").notNull().default(0), // عدد المراهنات في الجلسة الحالية
  lastBetAmount: integer("last_bet_amount").notNull().default(0), // آخر مبلغ مراهنة
  lastGameResult: text("last_game_result").default(""), // "win" أو "loss"
  
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  email: true,
  password: true,
  referredBy: true,
  language: true,
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
  usdDepositRate: integer("usd_deposit_rate").notNull().default(15000), // سعر صرف الدولار للإيداع (مضروب في 100 لتجنب الكسور العشرية)
  usdWithdrawRate: integer("usd_withdraw_rate").notNull().default(15000), // سعر صرف الدولار للسحب (مضروب في 100)
});

export const insertPaymentSettingsSchema = createInsertSchema(paymentSettings).omit({
  id: true,
});

export type InsertPaymentSettings = z.infer<typeof insertPaymentSettingsSchema>;
export type PaymentSettings = typeof paymentSettings.$inferSelect;

export const gameSettings = pgTable("game_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // الإعدادات الأساسية
  baseWinRate: integer("base_win_rate").notNull().default(50), // نسبة الربح الأساسية 0-100
  targetLossRate: integer("target_loss_rate").notNull().default(70), // نسبة الخسارة المستهدفة 0-100
  maxMultiplier: integer("max_multiplier").notNull().default(50), // أقصى مضاعف
  
  // استراتيجية اللعب
  strategy: text("strategy").notNull().default("balanced"), // "aggressive", "balanced", "soft"
  
  // إعدادات المراحل
  phase1Rounds: integer("phase1_rounds").notNull().default(10), // عدد الجولات في المرحلة 1 (التعليق)
  phase2Rounds: integer("phase2_rounds").notNull().default(20), // عدد الجولات في المرحلة 2 (التذبذب)
  
  // توزيع المضاعفات (نسب مئوية)
  multiplier2to5Chance: integer("multiplier_2to5_chance").notNull().default(40), // x2-x5
  multiplier5to10Chance: integer("multiplier_5to10_chance").notNull().default(30), // x5-x10
  multiplier10to25Chance: integer("multiplier_10to25_chance").notNull().default(20), // x10-x25
  multiplier25to50Chance: integer("multiplier_25to50_chance").notNull().default(8), // x25-x50
  multiplier50PlusChance: integer("multiplier_50plus_chance").notNull().default(2), // x50+
  
  // حدود ديناميكية بناءً على قيمة الرهان
  highBetThreshold: integer("high_bet_threshold").notNull().default(5000), // إذا كان الرهان أكبر من هذا
  highBetMaxMultiplier: integer("high_bet_max_multiplier").notNull().default(20), // أقصى مضاعف للرهانات الكبيرة
  
  // تتبع سلوك اللاعب
  behaviorTrackingEnabled: boolean("behavior_tracking_enabled").notNull().default(true), // تفعيل تتبع السلوك
  betIncreaseAfterWinPenalty: integer("bet_increase_after_win_penalty").notNull().default(15), // نسبة تقليل فرصة الربح عند زيادة الرهان بعد الربح (0-50)
  consecutiveWinsPenalty: integer("consecutive_wins_penalty").notNull().default(10), // تقليل إضافي لكل انتصار متتالي (0-30)
  houseEdgeBoost: integer("house_edge_boost").notNull().default(5), // زيادة ميزة الموقع (0-20)
  
  // وضع الخسارة الدائمة
  alwaysLose: boolean("always_lose").notNull().default(false), // عند التفعيل: الصندوق فقط خسارة بدون أي ربح
  
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertGameSettingsSchema = createInsertSchema(gameSettings).omit({
  id: true,
  updatedAt: true,
});

export type InsertGameSettings = z.infer<typeof insertGameSettingsSchema>;
export type GameSettings = typeof gameSettings.$inferSelect;

export const paymentMethods = pgTable("payment_methods", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  type: text("type").notNull().default("both"), // "deposit", "withdraw", "both"
  currency: text("currency").notNull().default("SYP"), // "SYP", "USD", or "both"
  minAmount: integer("min_amount").notNull().default(0),
  maxAmount: integer("max_amount").notNull().default(100000),
  minAmountUSD: integer("min_amount_usd").notNull().default(0),
  maxAmountUSD: integer("max_amount_usd").notNull().default(1000),
  fee: integer("fee").notNull().default(0),
  noteEn: text("note_en").notNull().default(""),
  noteAr: text("note_ar").notNull().default(""),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertPaymentMethodSchema = createInsertSchema(paymentMethods).pick({
  name: true,
  type: true,
  currency: true,
  minAmount: true,
  maxAmount: true,
  fee: true,
  noteEn: true,
  noteAr: true,
}).extend({
  minAmountUSD: z.number().optional(),
  maxAmountUSD: z.number().optional(),
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

export const passwordResetTokens = pgTable("password_reset_tokens", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  used: boolean("used").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertPasswordResetTokenSchema = createInsertSchema(passwordResetTokens).pick({
  userId: true,
  token: true,
  expiresAt: true,
});

export type InsertPasswordResetToken = z.infer<typeof insertPasswordResetTokenSchema>;
export type PasswordResetToken = typeof passwordResetTokens.$inferSelect;