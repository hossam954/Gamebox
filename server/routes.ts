import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./database";
import {
  insertUserSchema,
  insertPasswordRecoverySchema,
  insertDepositRequestSchema,
  insertWithdrawRequestSchema,
  insertPaymentSettingsSchema,
  insertPaymentMethodSchema,
  insertPromoCodeSchema,
  insertSupportTicketSchema,
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // ✅ تسجيل مستخدم جديد
  app.post("/api/auth/register", async (req, res) => {
    try {
      const result = insertUserSchema.safeParse(req.body);
      if (!result.success)
        return res.status(400).json({ message: "Invalid input", errors: result.error });

      const existingUsername = await storage.getUserByUsername(result.data.username);
      if (existingUsername)
        return res.status(400).json({ message: "Username already exists" });

      const existingEmail = await storage.getUserByEmail(result.data.email);
      if (existingEmail)
        return res.status(400).json({ message: "Email already exists" });

      const user = await storage.createUser(result.data);

      // إشعار الإحالة إذا وجد
      if (result.data.referredBy && result.data.referredBy.trim() !== "") {
        const referrer = await storage.getUserByReferralCode(result.data.referredBy);
        if (referrer) {
          const userLang = result.data.language || "en";
          const referrerLang = referrer.language || "en";

          await storage.createNotification({
            userId: user.id,
            title:
              userLang === "ar" ? "تم التسجيل من خلال إحالة 💜" : "Registered via Referral 💜",
            message:
              userLang === "ar"
                ? `لقد قمت بالتسجيل من خلال إحالة صديقك: ${referrer.username}\nأهلاً وسهلاً 💜`
                : `You registered through your friend: ${referrer.username}\nWelcome 💜`,
          });

          await storage.createNotification({
            userId: referrer.id,
            title:
              referrerLang === "ar" ? "مستخدم جديد من إحالتك 💜" : "New Referral 💜",
            message:
              referrerLang === "ar"
                ? `انضم المستخدم ${user.username} من خلال رابط إحالتك، ستحصل الآن على 5% من أي عملية شحن يقوم بها 💜`
                : `User ${user.username} joined through your referral link. You’ll now earn 5% from their deposits 💜`,
          });
        }
      }

      res.json({
        userId: user.id,
        referralCode: user.referralCode,
        message: "Account created successfully",
      });
    } catch (err) {
      console.error("Registration error:", err);
      res.status(500).json({ message: "Server error" });
    }
  });

  // ✅ تسجيل الدخول
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { usernameOrEmail, password } = req.body;
      const user = await storage.getUserByUsernameOrEmail(usernameOrEmail);

      if (!user || user.password !== password)
        return res.status(401).json({ message: "Invalid credentials" });

      res.json({
        userId: user.id,
        username: user.username,
        email: user.email,
        isAdmin: user.isAdmin,
        referralCode: user.referralCode,
      });
    } catch (err) {
      res.status(500).json({ message: "Server error" });
    }
  });

  // ✅ تغيير كلمة المرور
  app.post("/api/auth/change-password", async (req, res) => {
    try {
      const { userId, currentPassword, newPassword } = req.body;
      const user = await storage.getUser(userId);
      if (!user || user.password !== currentPassword)
        return res.status(401).json({ message: "Current password incorrect" });

      await storage.updateUserPassword(userId, newPassword);
      res.json({ message: "Password updated successfully" });
    } catch (err) {
      res.status(500).json({ message: "Server error" });
    }
  });

  // ✅ تحديث اللغة
  app.post("/api/users/language", async (req, res) => {
    try {
      const { userId, language } = req.body;
      await storage.updateUserLanguage(userId, language);
      res.json({ message: "Language updated successfully" });
    } catch (err) {
      res.status(500).json({ message: "Server error" });
    }
  });

  // ✅ طلب استرجاع كلمة المرور
  app.post("/api/auth/password-recovery", async (req, res) => {
    try {
      const { usernameOrEmail, message } = req.body;
      const user = await storage.getUserByUsernameOrEmail(usernameOrEmail);
      if (!user) return res.status(404).json({ message: "User not found" });

      const recovery = await storage.createPasswordRecovery({
        userId: user.id,
        username: user.username,
        email: user.email,
        message,
      });

      res.json({ message: "Recovery request submitted", id: recovery.id });
    } catch (err) {
      res.status(500).json({ message: "Server error" });
    }
  });

  app.get("/api/password-recovery", async (_req, res) => {
    try {
      const requests = await storage.getPasswordRecoveryRequests();
      res.json(requests);
    } catch (err) {
      res.status(500).json({ message: "Server error" });
    }
  });

  app.patch("/api/password-recovery/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      await storage.updatePasswordRecoveryStatus(id, status);
      res.json({ message: "Status updated" });
    } catch (err) {
      res.status(500).json({ message: "Server error" });
    // ✅ إنشاء توكن إعادة تعيين كلمة المرور
  app.post("/api/auth/generate-reset-token", async (req, res) => {
    try {
      const { userId } = req.body;
      const { randomBytes } = await import("crypto");
      const token = randomBytes(32).toString("base64url");
      const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

      await storage.createPasswordResetToken(userId, token, expiresAt);

      res.json({
        token,
        resetLink: `${req.protocol}://${req.get("host")}/reset-password?token=${token}`,
      });
    } catch (err) {
      res.status(500).json({ message: "Server error" });
    }
  });

  // ✅ إعادة تعيين كلمة المرور
  app.post("/api/auth/reset-password", async (req, res) => {
    try {
      const { token, newPassword } = req.body;
      if (!token || !newPassword)
        return res.status(400).json({ message: "Token and new password are required" });

      const resetToken = await storage.getPasswordResetToken(token);
      if (!resetToken) return res.status(404).json({ message: "Invalid reset token" });
      if (resetToken.used)
        return res.status(400).json({ message: "This reset link has already been used" });
      if (new Date() > resetToken.expiresAt)
        return res.status(400).json({ message: "This reset link has expired" });

      await storage.updateUserPassword(resetToken.userId, newPassword);
      await storage.markTokenAsUsed(token);

      res.json({ message: "Password reset successfully" });
    } catch (err) {
      res.status(500).json({ message: "Server error" });
    }
  });

  // ✅ إنشاء طلب إيداع
  app.post("/api/deposit", async (req, res) => {
    try {
      const result = insertDepositRequestSchema.safeParse(req.body);
      if (!result.success)
        return res.status(400).json({ message: "Invalid input", errors: result.error });

      const deposit = await storage.createDepositRequest(result.data);
      res.json({ message: "Deposit request submitted", id: deposit.id });
    } catch (err) {
      res.status(500).json({ message: "Server error" });
    }
  });

  app.get("/api/deposit", async (_req, res) => {
    try {
      const requests = await storage.getDepositRequests();
      res.json(requests);
    } catch (err) {
      res.status(500).json({ message: "Server error" });
    }
  });

  // ✅ تحديث حالة الإيداع
  app.patch("/api/deposit/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      const requests = await storage.getDepositRequests();
      const request = requests.find((r: any) => r.id === id);

      if (request && request.status === "pending") {
        const user = await storage.getUserByUsername(request.username);
        if (user) {
          const methods = await storage.getPaymentMethods();
          const paymentMethod = methods.find((m: any) => m.id === request.paymentMethodId);
          const methodName = paymentMethod?.name || "غير محدد";

          if (status === "approved") {
            let amountInSYP = request.amount;
            let conversionMessage = "";
            let displayAmount = `£${request.amount.toLocaleString()}`;

            const depositCurrency = (request as any).currency || paymentMethod?.currency;
            if (depositCurrency === "USD") {
              const settings = await storage.getPaymentSettings();
              const rate = settings.usdDepositRate;
              amountInSYP = Math.floor(request.amount * rate);
              const userLang = user.language || "en";
              displayAmount = `$${request.amount}`;
              conversionMessage =
                userLang === "ar"
                  ? `\n💵 تم التحويل: $${request.amount} × ${rate.toLocaleString()} = £${amountInSYP.toLocaleString()}`
                  : `\n💵 Converted: $${request.amount} × ${rate.toLocaleString()} = £${amountInSYP.toLocaleString()}`;
            }

            let totalAmount = amountInSYP;

            if (paymentMethod && paymentMethod.fee > 0) {
              const bonusAmount = Math.floor((amountInSYP * paymentMethod.fee) / 100);
              totalAmount += bonusAmount;

              const userLang = user.language || "en";
              await storage.createNotification({
                userId: user.id,
                title: userLang === "ar" ? "بونص إضافي 💜" : "Extra Bonus 💜",
                message:
                  userLang === "ar"
                    ? `لقد حصلت على بونص إضافي بقيمة £${bonusAmount.toLocaleString()} من آخر عملية إيداع 💜`
                    : `You received a bonus of £${bonusAmount.toLocaleString()} from your last deposit 💜`,
              });
            }

            await storage.updateUserBalance(user.id, user.balance + totalAmount);

            if (user.referredBy) {
              const referrer = await storage.getUserByReferralCode(user.referredBy);
              if (referrer) {
                const referralBonus = Math.floor((request.amount * 5) / 100);
                await storage.updateUserBalance(referrer.id, referrer.balance + referralBonus);

                const refLang = referrer.language || "en";
                await storage.createNotification({
                  userId: referrer.id,
                  title:
                    refLang === "ar"
                      ? "مكافأة من نظام الإحالة 💜"
                      : "Referral Reward 💜",
                  message:
                    refLang === "ar"
                      ? `لقد حصلت على £${referralBonus.toLocaleString()} من نظام الإحالة 💜`
                      : `You received £${referralBonus.toLocaleString()} from referrals 💜`,
                });
              }
            }

            const userLang = user.language || "en";
            await storage.createNotification({
              userId: user.id,
              title:
                userLang === "ar"
                  ? "تم قبول عملية الإيداع ✅"
                  : "Deposit Approved ✅",
              message:
                userLang === "ar"
                  ? `تم قبول عملية الإيداع عبر ${methodName}\nالمبلغ: ${displayAmount}${conversionMessage}\nتم إضافة £${totalAmount.toLocaleString()} إلى رصيدك ✅`
                  : `Your deposit via ${methodName} has been approved.\nAmount: ${displayAmount}${conversionMessage}\n£${totalAmount.toLocaleString()} added to your balance ✅`,
            });
          } else if (status === "rejected") {
            const userLang = user.language || "en";
            await storage.createNotification({
              userId: user.id,
              title:
                userLang === "ar" ? "تم رفض عملية الإيداع 🚫" : "Deposit Rejected 🚫",
              message:
                userLang === "ar"
                  ? `تم رفض الإيداع عبر ${methodName}\nالمبلغ: £${request.amount.toLocaleString()}`
                  : `Your deposit via ${methodName} was rejected.\nAmount: £${request.amount.toLocaleString()}`,
            });
          }
        }
      }

      await storage.updateDepositStatus(id, status);
      res.json({ message: "Deposit status updated" });
    } catch (err) {
      res.status(500).json({ message: "Server error" });
    }
  });
  });// ✅ إنشاء طلب سحب
  app.post("/api/withdraw", async (req, res) => {
    try {
      const result = insertWithdrawRequestSchema.safeParse(req.body);
      if (!result.success)
        return res.status(400).json({ message: "Invalid input", errors: result.error });

      const user = await storage.getUserByUsername(result.data.username);
      if (!user) return res.status(404).json({ message: "User not found" });
      if (user.balance < result.data.amount)
        return res.status(400).json({ message: "Insufficient balance" });

      await storage.updateUserBalance(user.id, user.balance - result.data.amount);
      const withdraw = await storage.createWithdrawRequest(result.data);
      res.json({ message: "Withdrawal request submitted", id: withdraw.id });
    } catch (err) {
      res.status(500).json({ message: "Server error" });
    }
  });

  app.get("/api/withdraw", async (_req, res) => {
    try {
      const requests = await storage.getWithdrawRequests();
      res.json(requests);
    } catch (err) {
      res.status(500).json({ message: "Server error" });
    }
  });

  // ✅ تحديث حالة السحب
  app.patch("/api/withdraw/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      const requests = await storage.getWithdrawRequests();
      const request = requests.find((r: any) => r.id === id);

      if (request && request.status === "pending") {
        const user = await storage.getUserByUsername(request.username);
        if (user) {
          const methods = await storage.getPaymentMethods();
          const paymentMethod = methods.find((m: any) => m.id === request.paymentMethodId);
          const methodName = paymentMethod?.name || "غير محدد";

          if (status === "approved") {
            let withdrawMessage = "";
            let displayAmount = `£${request.amount.toLocaleString()}`;

            if (paymentMethod && paymentMethod.currency === "USD") {
              const settings = await storage.getPaymentSettings();
              const rate = settings.usdWithdrawRate;
              const amountInUSD = Math.floor(request.amount / rate);
              const userLang = user.language || "en";
              displayAmount = `£${request.amount.toLocaleString()} → $${amountInUSD}`;
              withdrawMessage =
                userLang === "ar"
                  ? `\n💵 سيتم السحب: $${amountInUSD} (£${request.amount.toLocaleString()} ÷ ${rate.toFixed(2)})`
                  : `\n💵 Withdrawing: $${amountInUSD} (£${request.amount.toLocaleString()} ÷ ${rate.toFixed(2)})`;
            }

            const userLang = user.language || "en";
            await storage.createNotification({
              userId: user.id,
              title: userLang === "ar" ? "تمت الموافقة على طلب السحب 💜" : "Withdrawal Approved 💜",
              message:
                userLang === "ar"
                  ? `تمت الموافقة على طلب السحب:\nالمبلغ: ${displayAmount}${withdrawMessage}\nطريقة السحب: ${methodName}\nعنوان الاستلام: ${request.address}\nسيتم التحويل خلال 24 ساعة. 💜`
                  : `Withdrawal approved:\nAmount: ${displayAmount}${withdrawMessage}\nMethod: ${methodName}\nAddress: ${request.address}\nFunds will arrive within 24h 💜`,
            });
          } else if (status === "rejected") {
            await storage.updateUserBalance(user.id, user.balance + request.amount);
            const userLang = user.language || "en";
            await storage.createNotification({
              userId: user.id,
              title: userLang === "ar" ? "تم رفض طلب السحب 🚫" : "Withdrawal Rejected 🚫",
              message:
                userLang === "ar"
                  ? `تم رفض طلب سحب £${request.amount.toLocaleString()} عبر ${methodName}\nتم إعادة المبلغ إلى رصيدك. 🚫`
                  : `Withdrawal £${request.amount.toLocaleString()} via ${methodName} was rejected.\nFunds returned to your balance 🚫`,
            });
          }
        }
      }

      await storage.updateWithdrawStatus(id, status);
      res.json({ message: "Withdrawal status updated" });
    } catch (err) {
      res.status(500).json({ message: "Server error" });
    }
  });

  // ✅ إعدادات الدفع
  app.get("/api/payment-settings", async (_req, res) => {
    try {
      const settings = await storage.getPaymentSettings();
      res.json(settings);
    } catch (err) {
      res.status(500).json({ message: "Server error" });
    }
  });

  app.post("/api/payment-settings", async (req, res) => {
    try {
      const settings = await storage.updatePaymentSettings(req.body);
      res.json(settings);
    } catch (err) {
      res.status(500).json({ message: "Server error" });
    }
  });

  // ✅ إعدادات اللعبة
  app.get("/api/game-settings", async (_req, res) => {
    try {
      const settings = await storage.getGameSettings();
      res.json(settings);
    } catch (err) {
      res.status(500).json({ message: "Server error" });
    }
  });

  app.put("/api/game-settings", async (req, res) => {
    try {
      const settings = await storage.updateGameSettings(req.body);
      res.json(settings);
    } catch (err) {
      res.status(500).json({ message: "Server error" });
    }
  });

  // ✅ المستخدمين
  app.get("/api/users", async (_req, res) => {
    try {
      const users = await storage.getAllUsers();
      const safeUsers = users.map(({ password, ...u }: any) => u);
      res.json(safeUsers);
    } catch (err) {
      res.status(500).json({ message: "Server error" });
    }
  });

  app.patch("/api/users/:id/balance", async (req, res) => {
    try {
      const { id } = req.params;
      const { balance } = req.body;
      await storage.updateUserBalance(id, balance);
      res.json({ message: "Balance updated" });
    } catch (err) {
      res.status(500).json({ message: "Server error" });
    }
  });app.patch("/api/users/:id/status", async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      await storage.updateUserStatus(id, status);
      res.json({ message: "User status updated" });
    } catch (err) {
      res.status(500).json({ message: "Server error" });
    }
  });

  app.delete("/api/users/:id", async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteUser(id);
      res.json({ message: "User deleted successfully", userId: id });
    } catch (err) {
      res.status(500).json({ message: "Server error" });
    }
  });

  // ✅ نظام الإحالات
  app.get("/api/referrals/:referralCode/count", async (req, res) => {
    try {
      const { referralCode } = req.params;
      const count = await storage.getReferralCount(referralCode);
      res.json({ count });
    } catch (err) {
      res.status(500).json({ message: "Server error" });
    }
  });

  // ✅ نتائج اللعبة
  app.post("/api/users/:id/game-result", async (req, res) => {
    try {
      const { id } = req.params;
      const { betAmount, won, multiplier, newBalance } = req.body;

      if (betAmount !== undefined && multiplier !== undefined && newBalance !== undefined) {
        await storage.updateUserGameStats(id, { betAmount, won, multiplier, newBalance });
      } else {
        const { balance } = req.body;
        await storage.updateUserStats(id, balance, won);
      }

      res.json({ message: "Stats updated" });
    } catch (err) {
      res.status(500).json({ message: "Server error" });
    }
  });

  // ✅ أكواد الخصم
  app.post("/api/promo-codes", async (req, res) => {
    try {
      const result = insertPromoCodeSchema.safeParse(req.body);
      if (!result.success)
        return res.status(400).json({ message: "Invalid input", errors: result.error });
      const promo = await storage.createPromoCode(result.data);
      res.json({ message: "Promo code created", promo });
    } catch (err) {
      res.status(500).json({ message: "Server error" });
    }
  });

  app.get("/api/promo-codes", async (_req, res) => {
    try {
      const codes = await storage.getPromoCodes();
      res.json(codes);
    } catch (err) {
      res.status(500).json({ message: "Server error" });
    }
  });

  app.patch("/api/promo-codes/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { isActive } = req.body;
      await storage.updatePromoCodeStatus(id, isActive);
      res.json({ message: "Promo code updated" });
    } catch (err) {
      res.status(500).json({ message: "Server error" });
    }
  });

  app.post("/api/promo-codes/redeem", async (req, res) => {
    try {
      const { userId, code } = req.body;
      const result = await storage.redeemPromoCode(userId, code);
      if (result.success)
        res.json({ message: "Promo code redeemed", reward: result.reward });
      else res.status(400).json({ message: result.message });
    } catch (err) {
      res.status(500).json({ message: "Server error" });
    }
  });

  // ✅ نظام الدعم الفني
  app.post("/api/support", async (req, res) => {
    try {
      const result = insertSupportTicketSchema.safeParse(req.body);
      if (!result.success)
        return res.status(400).json({ message: "Invalid input", errors: result.error });
      const ticket = await storage.createSupportTicket(result.data);
      res.json({ message: "Support ticket created", ticket });
    } catch (err) {
      res.status(500).json({ message: "Server error" });
    }
  });

  app.get("/api/support", async (_req, res) => {
    try {
      const tickets = await storage.getSupportTickets();
      res.json(tickets);
    } catch (err) {
      res.status(500).json({ message: "Server error" });
    }
  });

  app.patch("/api/support/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { response, status } = req.body;
      await storage.updateSupportTicket(id, response, status);
      res.json({ message: "Support ticket updated" });
    } catch (err) {
      res.status(500).json({ message: "Server error" });
    }
  });

  // ✅ الإشعارات
  app.get("/api/notifications/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      const list = await storage.getNotificationsByUserId(userId);
      res.json(list);
    } catch (err) {
      res.status(500).json({ message: "Server error" });
    }
  });

  app.patch("/api/notifications/:id/read", async (req, res) => {
    try {
      const { id } = req.params;
      await storage.markNotificationAsRead(id);
      res.json({ message: "Notification marked as read" });
    } catch (err) {
      res.status(500).json({ message: "Server error" });
    }
  });

  app.delete("/api/notifications/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      await storage.clearAllNotifications(userId);
      res.json({ message: "All notifications cleared" });
    } catch (err) {
      res.status(500).json({ message: "Server error" });
    }
  });

  // ✅ بث إشعار جماعي
  app.post("/api/broadcast", async (req, res) => {
    try {
      const { title, message } = req.body;
      const users = await storage.getAllUsers();
      for (const user of users) {
        await storage.createNotification({ userId: user.id, title, message });
      }
      res.json({ message: "Broadcast sent", count: users.length });
    } catch (err) {
      res.status(500).json({ message: "Server error" });
    }
  });

  // ✅ إرسال رسالة لمستخدم
  app.post("/api/send-message", async (req, res) => {
    try {
      const { usernameOrEmail, title, message } = req.body;
      const user = await storage.getUserByUsernameOrEmail(usernameOrEmail);
      if (!user) return res.status(404).json({ message: "User not found" });
      await storage.createNotification({ userId: user.id, title, message });
      res.json({ message: "Message sent successfully" });
    } catch (err) {
      res.status(500).json({ message: "Server error" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}