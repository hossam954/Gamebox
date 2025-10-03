import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./database";
import { insertUserSchema, insertPasswordRecoverySchema, insertDepositRequestSchema, insertWithdrawRequestSchema, insertPaymentSettingsSchema, insertPaymentMethodSchema, insertPromoCodeSchema, insertSupportTicketSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  app.post("/api/auth/register", async (req, res) => {
    try {
      const result = insertUserSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid input", errors: result.error });
      }

      const existingUsername = await storage.getUserByUsername(result.data.username);
      if (existingUsername) {
        return res.status(400).json({ message: "Username already exists" });
      }

      const existingEmail = await storage.getUserByEmail(result.data.email);
      if (existingEmail) {
        return res.status(400).json({ message: "Email already exists" });
      }

      const user = await storage.createUser(result.data);
      
      // إرسال إشعار للمستخدم الجديد إذا كان لديه محيل
      if (result.data.referredBy) {
        const referrer = await storage.getUserByReferralCode(result.data.referredBy);
        if (referrer) {
          await storage.createNotification({
            userId: user.id,
            title: "تم التسجيل من خلال إحالة 💜",
            message: `لقد قمت بالتسجيل من خلال إحالة صديقك: ${referrer.username}\nأهلاً وسهلاً 💜`
          });
          
          // إرسال إشعار للمحيل
          await storage.createNotification({
            userId: referrer.id,
            title: "مستخدم جديد من إحالتك 💜",
            message: `انضم المستخدم ${user.username} من خلال رابط إحالتك ستحصل الآن على 5% من أي عملية شحن يقوم بها 💜`
          });
        }
      }
      
      res.json({ userId: user.id, referralCode: user.referralCode, message: "Account created successfully" });
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { usernameOrEmail, password } = req.body;
      const user = await storage.getUserByUsernameOrEmail(usernameOrEmail);

      if (!user || user.password !== password) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      res.json({ 
        userId: user.id, 
        username: user.username, 
        email: user.email,
        isAdmin: user.isAdmin,
        referralCode: user.referralCode 
      });
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  app.post("/api/auth/change-password", async (req, res) => {
    try {
      const { userId, currentPassword, newPassword } = req.body;
      const user = await storage.getUser(userId);

      if (!user || user.password !== currentPassword) {
        return res.status(401).json({ message: "Current password is incorrect" });
      }

      await storage.updateUserPassword(userId, newPassword);
      res.json({ message: "Password updated successfully" });
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  app.post("/api/auth/password-recovery", async (req, res) => {
    try {
      const { usernameOrEmail, message } = req.body;
      const user = await storage.getUserByUsernameOrEmail(usernameOrEmail);

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const recovery = await storage.createPasswordRecovery({
        userId: user.id,
        username: user.username,
        email: user.email,
        message,
      });

      res.json({ message: "Recovery request submitted", id: recovery.id });
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  app.get("/api/password-recovery", async (req, res) => {
    try {
      const requests = await storage.getPasswordRecoveryRequests();
      res.json(requests);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  app.patch("/api/password-recovery/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      await storage.updatePasswordRecoveryStatus(id, status);
      res.json({ message: "Status updated" });
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  app.post("/api/deposit", async (req, res) => {
    try {
      const result = insertDepositRequestSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid input", errors: result.error });
      }

      const deposit = await storage.createDepositRequest(result.data);
      res.json({ message: "Deposit request submitted", id: deposit.id });
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  app.get("/api/deposit", async (req, res) => {
    try {
      const requests = await storage.getDepositRequests();
      res.json(requests);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  app.patch("/api/deposit/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      
      const requests = await storage.getDepositRequests();
      const request = requests.find((r) => r.id === id);
      
      if (request && request.status === "pending") {
        const user = await storage.getUserByUsername(request.username);
        if (user) {
          const methods = await storage.getPaymentMethods();
          const paymentMethod = methods.find(m => m.id === request.paymentMethodId);
          const methodName = paymentMethod?.name || "غير محدد";

          if (status === "approved") {
            // إضافة الرصيد فوريًا
            let totalAmount = request.amount;
            
            // التحقق من وجود بونص
            if (paymentMethod && paymentMethod.fee > 0) {
              const bonusAmount = Math.floor((request.amount * paymentMethod.fee) / 100);
              totalAmount += bonusAmount;
              
              await storage.createNotification({
                userId: user.id,
                title: "بونص إضافي 💜",
                message: `لقد حصلت على بونص إضافي بقيمة £${bonusAmount.toLocaleString()} من آخر عملية إيداع أهلاً وسهلاً 💜✅`
              });
            }
            
            await storage.updateUserBalance(user.id, user.balance + totalAmount);
            
            // معالجة مكافأة الإحالة
            if (user.referredBy) {
              const referrer = await storage.getUserByReferralCode(user.referredBy);
              if (referrer) {
                const referralBonus = Math.floor((request.amount * 5) / 100);
                await storage.updateUserBalance(referrer.id, referrer.balance + referralBonus);
                
                await storage.createNotification({
                  userId: referrer.id,
                  title: "مكافأة من نظام الإحالة 💜",
                  message: `لقد حصلت على £${referralBonus.toLocaleString()} من نظام الإحالة\n💜 بالتوفيق`
                });
              }
            }
            
            await storage.createNotification({
              userId: user.id,
              title: "تم قبول عملية الإيداع ✅",
              message: `تم قبول عملية إيداع بواسطة ${methodName} برقم عملية ${request.transactionNumber || "غير متوفر"} وتم إضافة مبلغ £${request.amount.toLocaleString()} إلى رصيدك بنجاح ✅`
            });
          } else if (status === "rejected") {
            await storage.createNotification({
              userId: user.id,
              title: "تم رفض عملية الإيداع 🚫",
              message: `🚫 تم رفض عملية إيداع بواسطة ${methodName}\nرقم العملية: ${request.transactionNumber || "غير متوفر"}\nالمبلغ: £${request.amount.toLocaleString()}\nإذا كان هذا عن طريق الخطأ تواصل مع الدعم من خلال الموقع أو البوت.`
            });
          }
        }
      }

      await storage.updateDepositStatus(id, status);
      res.json({ message: "Deposit status updated" });
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  app.post("/api/withdraw", async (req, res) => {
    try {
      const result = insertWithdrawRequestSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid input", errors: result.error });
      }

      const withdraw = await storage.createWithdrawRequest(result.data);
      res.json({ message: "Withdrawal request submitted", id: withdraw.id });
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  app.get("/api/withdraw", async (req, res) => {
    try {
      const requests = await storage.getWithdrawRequests();
      res.json(requests);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  app.post("/api/withdraw", async (req, res) => {
    try {
      const result = insertWithdrawRequestSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid input", errors: result.error });
      }

      // خصم الرصيد فوريًا عند تقديم الطلب
      const user = await storage.getUserByUsername(result.data.username);
      if (user && user.balance >= result.data.amount) {
        await storage.updateUserBalance(user.id, user.balance - result.data.amount);
      }

      const withdraw = await storage.createWithdrawRequest(result.data);
      res.json({ message: "Withdrawal request submitted", id: withdraw.id });
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  app.get("/api/withdraw", async (req, res) => {
    try {
      const requests = await storage.getWithdrawRequests();
      res.json(requests);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  app.patch("/api/withdraw/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      const requests = await storage.getWithdrawRequests();
      const request = requests.find((r) => r.id === id);
      
      if (request && request.status === "pending") {
        const user = await storage.getUserByUsername(request.username);
        if (user) {
          const methods = await storage.getPaymentMethods();
          const paymentMethod = methods.find(m => m.id === request.paymentMethodId);
          const methodName = paymentMethod?.name || "غير محدد";

          if (status === "approved") {
            await storage.createNotification({
              userId: user.id,
              title: "تمت الموافقة على طلب السحب 💜",
              message: `تمت الموافقة على طلب السحب الخاص بك:\nالمبلغ: £${request.amount.toLocaleString()}\nطريقة السحب: ${methodName}\nعنوان الاستلام: ${request.address}\n\nسيتم تحويل المبلغ إلى حسابك في غضون 24 ساعة.\nمبارك لك 💜`
            });
          } else if (status === "rejected") {
            // إعادة المبلغ للمستخدم
            await storage.updateUserBalance(user.id, user.balance + request.amount);
            
            await storage.createNotification({
              userId: user.id,
              title: "تم رفض طلب السحب 🚫",
              message: `تم رفض طلب سحب £${request.amount.toLocaleString()} عبر ${methodName} 🚫🚫🚫\nتم إعادة المبلغ إلى رصيدك.\nإذا استمرت المشكلة تواصل مع الدعم من خلال الموقع أو البوت.`
            });
          }
        }
      }

      await storage.updateWithdrawStatus(id, status);
      res.json({ message: "Withdrawal status updated" });
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  app.get("/api/payment-settings", async (req, res) => {
    try {
      const settings = await storage.getPaymentSettings();
      res.json(settings);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  app.put("/api/payment-settings", async (req, res) => {
    try {
      const result = insertPaymentSettingsSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid input", errors: result.error });
      }

      const settings = await storage.updatePaymentSettings(result.data);
      res.json(settings);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  app.get("/api/users", async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      // Remove password from response for security
      const safeUsers = users.map(({ password, ...user }) => user);
      res.json(safeUsers);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  app.patch("/api/users/:id/balance", async (req, res) => {
    try {
      const { id } = req.params;
      const { balance } = req.body;
      await storage.updateUserBalance(id, balance);
      res.json({ message: "Balance updated" });
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  app.post("/api/users/:id/game-result", async (req, res) => {
    try {
      const { id } = req.params;
      const { balance, won } = req.body;
      await storage.updateUserStats(id, balance, won);
      res.json({ message: "Stats updated" });
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  app.post("/api/promo-codes", async (req, res) => {
    try {
      const result = insertPromoCodeSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid input", errors: result.error });
      }

      const promoCode = await storage.createPromoCode(result.data);
      res.json({ message: "Promo code created", promoCode });
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  app.get("/api/promo-codes", async (req, res) => {
    try {
      const promoCodes = await storage.getPromoCodes();
      res.json(promoCodes);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  app.patch("/api/promo-codes/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { isActive } = req.body;
      await storage.updatePromoCodeStatus(id, isActive);
      res.json({ message: "Promo code updated" });
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  app.post("/api/promo-codes/redeem", async (req, res) => {
    try {
      const { userId, code } = req.body;
      const result = await storage.redeemPromoCode(userId, code);
      
      if (result.success) {
        res.json({ message: "Promo code redeemed", reward: result.reward });
      } else {
        res.status(400).json({ message: result.message });
      }
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  app.post("/api/support", async (req, res) => {
    try {
      const result = insertSupportTicketSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid input", errors: result.error });
      }

      const ticket = await storage.createSupportTicket(result.data);
      res.json({ message: "Support ticket created", ticket });
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  app.get("/api/support", async (req, res) => {
    try {
      const tickets = await storage.getSupportTickets();
      res.json(tickets);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  app.patch("/api/support/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { response, status } = req.body;
      await storage.updateSupportTicket(id, response, status);
      res.json({ message: "Support ticket updated" });
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  app.post("/api/payment-methods", async (req, res) => {
    try {
      const result = insertPaymentMethodSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid input", errors: result.error });
      }

      const paymentMethod = await storage.createPaymentMethod(result.data);
      res.json({ message: "Payment method created", paymentMethod });
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  app.get("/api/payment-methods", async (req, res) => {
    try {
      const methods = await storage.getPaymentMethods();
      res.json(methods);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  app.patch("/api/payment-methods/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { isActive } = req.body;
      await storage.updatePaymentMethodStatus(id, isActive);
      res.json({ message: "Payment method updated" });
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  app.delete("/api/payment-methods/:id", async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deletePaymentMethod(id);
      res.json({ message: "Payment method deleted" });
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  app.get("/api/notifications/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      const userNotifications = await storage.getNotificationsByUserId(userId);
      res.json(userNotifications);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  app.patch("/api/notifications/:id/read", async (req, res) => {
    try {
      const { id } = req.params;
      await storage.markNotificationAsRead(id);
      res.json({ message: "Notification marked as read" });
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  app.delete("/api/notifications/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      await storage.clearAllNotifications(userId);
      res.json({ message: "All notifications cleared" });
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  app.post("/api/broadcast", async (req, res) => {
    try {
      const { title, message } = req.body;
      const users = await storage.getAllUsers();
      
      for (const user of users) {
        await storage.createNotification({
          userId: user.id,
          title,
          message
        });
      }
      
      res.json({ message: "Broadcast sent to all users", count: users.length });
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  app.post("/api/send-message", async (req, res) => {
    try {
      const { usernameOrEmail, title, message } = req.body;
      const user = await storage.getUserByUsernameOrEmail(usernameOrEmail);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      await storage.createNotification({
        userId: user.id,
        title,
        message
      });
      
      res.json({ message: "Message sent successfully" });
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
