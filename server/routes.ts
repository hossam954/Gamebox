import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertPasswordRecoverySchema, insertDepositRequestSchema, insertWithdrawRequestSchema, insertPaymentSettingsSchema } from "@shared/schema";

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
      res.json({ userId: user.id, message: "Account created successfully" });
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

      res.json({ userId: user.id, username: user.username, isAdmin: user.isAdmin });
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
      await storage.updateDepositStatus(id, status);

      if (status === "approved") {
        const requests = await storage.getDepositRequests();
        const request = requests.find((r) => r.id === id);
        if (request) {
          const user = await storage.getUserByUsername(request.username);
          if (user) {
            await storage.updateUserBalance(user.id, user.balance + request.amount);
          }
        }
      }

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

  app.patch("/api/withdraw/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      await storage.updateWithdrawStatus(id, status);

      if (status === "approved") {
        const requests = await storage.getWithdrawRequests();
        const request = requests.find((r) => r.id === id);
        if (request) {
          const user = await storage.getUserByUsername(request.username);
          if (user) {
            await storage.updateUserBalance(user.id, user.balance - request.amount);
          }
        }
      }

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

  const httpServer = createServer(app);

  return httpServer;
}
