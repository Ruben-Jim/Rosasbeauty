var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// server/index.ts
import express2 from "express";

// server/routes.ts
import { createServer } from "http";
import Stripe from "stripe";

// shared/schema.ts
var schema_exports = {};
__export(schema_exports, {
  appointments: () => appointments,
  appointmentsRelations: () => appointmentsRelations,
  bookingFormSchema: () => bookingFormSchema,
  clients: () => clients,
  clientsRelations: () => clientsRelations,
  insertAppointmentSchema: () => insertAppointmentSchema,
  insertClientSchema: () => insertClientSchema,
  insertServiceSchema: () => insertServiceSchema,
  insertStaffSchema: () => insertStaffSchema,
  services: () => services,
  servicesRelations: () => servicesRelations,
  staff: () => staff,
  staffRelations: () => staffRelations
});
import { pgTable, text, serial, integer, boolean, timestamp, decimal } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
var services = pgTable("services", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  duration: integer("duration").notNull(),
  // duration in minutes
  category: text("category").notNull(),
  // 'hair' or 'nails'
  requiresDownPayment: boolean("requires_down_payment").notNull().default(false),
  downPaymentAmount: decimal("down_payment_amount", { precision: 10, scale: 2 }),
  imageUrl: text("image_url")
});
var staff = pgTable("staff", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  title: text("title").notNull(),
  experience: text("experience").notNull(),
  imageUrl: text("image_url"),
  specialties: text("specialties").array()
});
var clients = pgTable("clients", {
  id: serial("id").primaryKey(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull()
});
var appointments = pgTable("appointments", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").references(() => clients.id).notNull(),
  serviceId: integer("service_id").references(() => services.id).notNull(),
  staffId: integer("staff_id").references(() => staff.id).notNull(),
  appointmentDate: timestamp("appointment_date").notNull(),
  status: text("status").notNull().default("pending"),
  // 'pending', 'confirmed', 'completed', 'cancelled'
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  downPaymentAmount: decimal("down_payment_amount", { precision: 10, scale: 2 }),
  downPaymentPaid: boolean("down_payment_paid").notNull().default(false),
  remainingAmount: decimal("remaining_amount", { precision: 10, scale: 2 }).notNull(),
  stripePaymentIntentId: text("stripe_payment_intent_id"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow()
});
var insertServiceSchema = createInsertSchema(services).omit({
  id: true
});
var insertStaffSchema = createInsertSchema(staff).omit({
  id: true
});
var insertClientSchema = createInsertSchema(clients).omit({
  id: true
});
var insertAppointmentSchema = createInsertSchema(appointments).omit({
  id: true,
  createdAt: true
});
var bookingFormSchema = z.object({
  serviceId: z.number(),
  staffId: z.number(),
  appointmentDate: z.string(),
  appointmentTime: z.string(),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Valid email is required"),
  phone: z.string().min(10, "Valid phone number is required")
});
var servicesRelations = relations(services, ({ many }) => ({
  appointments: many(appointments)
}));
var staffRelations = relations(staff, ({ many }) => ({
  appointments: many(appointments)
}));
var clientsRelations = relations(clients, ({ many }) => ({
  appointments: many(appointments)
}));
var appointmentsRelations = relations(appointments, ({ one }) => ({
  client: one(clients, {
    fields: [appointments.clientId],
    references: [clients.id]
  }),
  service: one(services, {
    fields: [appointments.serviceId],
    references: [services.id]
  }),
  staff: one(staff, {
    fields: [appointments.staffId],
    references: [staff.id]
  })
}));

// server/db.ts
import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?"
  );
}
var pool = new Pool({ connectionString: process.env.DATABASE_URL });
var db = drizzle({ client: pool, schema: schema_exports });

// server/storage.ts
import { eq } from "drizzle-orm";
var MemStorage = class {
  services;
  staff;
  clients;
  appointments;
  currentServiceId;
  currentStaffId;
  currentClientId;
  currentAppointmentId;
  constructor() {
    this.services = /* @__PURE__ */ new Map();
    this.staff = /* @__PURE__ */ new Map();
    this.clients = /* @__PURE__ */ new Map();
    this.appointments = /* @__PURE__ */ new Map();
    this.currentServiceId = 1;
    this.currentStaffId = 1;
    this.currentClientId = 1;
    this.currentAppointmentId = 1;
    this.initializeData();
  }
  initializeData() {
    const hairServices = [
      {
        name: "Full Color & Style",
        description: "Complete hair transformation with professional coloring and styling",
        price: "120.00",
        duration: 150,
        category: "hair",
        requiresDownPayment: true,
        downPaymentAmount: "30.00",
        imageUrl: "https://images.unsplash.com/photo-1562322140-8baeececf3df?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=200"
      },
      {
        name: "Highlights & Lowlights",
        description: "Add dimension with professional highlighting techniques",
        price: "90.00",
        duration: 120,
        category: "hair",
        requiresDownPayment: true,
        downPaymentAmount: "25.00",
        imageUrl: "https://images.unsplash.com/photo-1580618672591-eb180b1a973f?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=200"
      }
    ];
    const nailServices = [
      {
        name: "Gel Manicure",
        description: "Long-lasting gel polish with cuticle care and nail shaping",
        price: "45.00",
        duration: 60,
        category: "nails",
        requiresDownPayment: false,
        imageUrl: "https://images.unsplash.com/photo-1604654894610-df63bc536371?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=200"
      },
      {
        name: "Nail Art & Design",
        description: "Custom nail art with intricate designs and premium finishes",
        price: "65.00",
        duration: 90,
        category: "nails",
        requiresDownPayment: false,
        imageUrl: "https://images.unsplash.com/photo-1610992015732-2449b76344bc?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=200"
      }
    ];
    [...hairServices, ...nailServices].forEach((service) => {
      this.createService(service);
    });
    const staffMembers = [
      {
        name: "Sarah Johnson",
        title: "Senior Stylist",
        experience: "8 years experience",
        imageUrl: "https://images.unsplash.com/photo-1595475207225-428b62bda831?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=300",
        specialties: ["Color", "Highlights", "Styling"]
      },
      {
        name: "Mike Chen",
        title: "Color Specialist",
        experience: "6 years experience",
        imageUrl: "https://images.unsplash.com/photo-1582750433449-648ed127bb54?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=300",
        specialties: ["Color", "Balayage", "Hair Treatment"]
      },
      {
        name: "Lisa Rodriguez",
        title: "Nail Artist",
        experience: "5 years experience",
        imageUrl: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=300",
        specialties: ["Nail Art", "Gel Manicure", "Nail Design"]
      }
    ];
    staffMembers.forEach((staff2) => {
      this.createStaff(staff2);
    });
  }
  async getAllServices() {
    return Array.from(this.services.values());
  }
  async getServiceById(id) {
    return this.services.get(id);
  }
  async createService(insertService) {
    const id = this.currentServiceId++;
    const service = {
      ...insertService,
      id,
      requiresDownPayment: insertService.requiresDownPayment ?? false,
      downPaymentAmount: insertService.downPaymentAmount ?? null,
      imageUrl: insertService.imageUrl ?? null
    };
    this.services.set(id, service);
    return service;
  }
  async getAllStaff() {
    return Array.from(this.staff.values());
  }
  async getStaffById(id) {
    return this.staff.get(id);
  }
  async createStaff(insertStaff) {
    const id = this.currentStaffId++;
    const staff2 = {
      ...insertStaff,
      id,
      imageUrl: insertStaff.imageUrl ?? null,
      specialties: insertStaff.specialties ?? null
    };
    this.staff.set(id, staff2);
    return staff2;
  }
  async getClientById(id) {
    return this.clients.get(id);
  }
  async getClientByEmail(email) {
    return Array.from(this.clients.values()).find((client) => client.email === email);
  }
  async createClient(insertClient) {
    const id = this.currentClientId++;
    const client = { ...insertClient, id };
    this.clients.set(id, client);
    return client;
  }
  async getAllAppointments() {
    const appointmentsList = Array.from(this.appointments.values());
    return appointmentsList.map((appointment) => ({
      ...appointment,
      client: this.clients.get(appointment.clientId),
      service: this.services.get(appointment.serviceId),
      staff: this.staff.get(appointment.staffId)
    }));
  }
  async getAppointmentById(id) {
    const appointment = this.appointments.get(id);
    if (!appointment) return void 0;
    return {
      ...appointment,
      client: this.clients.get(appointment.clientId),
      service: this.services.get(appointment.serviceId),
      staff: this.staff.get(appointment.staffId)
    };
  }
  async createAppointment(insertAppointment) {
    const id = this.currentAppointmentId++;
    const appointment = {
      ...insertAppointment,
      id,
      createdAt: /* @__PURE__ */ new Date(),
      status: insertAppointment.status ?? "pending",
      downPaymentPaid: insertAppointment.downPaymentPaid ?? false,
      downPaymentAmount: insertAppointment.downPaymentAmount ?? null,
      stripePaymentIntentId: insertAppointment.stripePaymentIntentId ?? null,
      notes: insertAppointment.notes ?? null
    };
    this.appointments.set(id, appointment);
    return appointment;
  }
  async updateAppointmentPayment(id, paymentIntentId, paid) {
    const appointment = this.appointments.get(id);
    if (appointment) {
      appointment.stripePaymentIntentId = paymentIntentId;
      appointment.downPaymentPaid = paid;
      if (paid) {
        appointment.status = "confirmed";
      }
    }
  }
  async updateAppointmentStatus(id, status) {
    const appointment = this.appointments.get(id);
    if (appointment) {
      appointment.status = status;
    }
  }
};
var storage = new MemStorage();

// server/routes.ts
if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("Missing required Stripe secret: STRIPE_SECRET_KEY");
}
var stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-06-30.basil"
});
async function registerRoutes(app2) {
  app2.get("/api/services", async (req, res) => {
    try {
      const services2 = await storage.getAllServices();
      res.json(services2);
    } catch (error) {
      res.status(500).json({ message: "Error fetching services: " + error.message });
    }
  });
  app2.get("/api/staff", async (req, res) => {
    try {
      const staff2 = await storage.getAllStaff();
      res.json(staff2);
    } catch (error) {
      res.status(500).json({ message: "Error fetching staff: " + error.message });
    }
  });
  app2.get("/api/appointments", async (req, res) => {
    try {
      const appointments2 = await storage.getAllAppointments();
      res.json(appointments2);
    } catch (error) {
      res.status(500).json({ message: "Error fetching appointments: " + error.message });
    }
  });
  app2.post("/api/appointments", async (req, res) => {
    try {
      const bookingData = bookingFormSchema.parse(req.body);
      let client = await storage.getClientByEmail(bookingData.email);
      if (!client) {
        client = await storage.createClient({
          firstName: bookingData.firstName,
          lastName: bookingData.lastName,
          email: bookingData.email,
          phone: bookingData.phone
        });
      }
      const service = await storage.getServiceById(bookingData.serviceId);
      if (!service) {
        return res.status(404).json({ message: "Service not found" });
      }
      const convertTo24Hour = (time12) => {
        const [time, modifier] = time12.split(" ");
        let [hours, minutes] = time.split(":");
        if (hours === "12") {
          hours = modifier === "AM" ? "00" : "12";
        } else if (modifier === "PM") {
          hours = String(parseInt(hours, 10) + 12);
        }
        return `${hours.padStart(2, "0")}:${minutes}`;
      };
      const time24 = convertTo24Hour(bookingData.appointmentTime);
      const appointmentDateTime = /* @__PURE__ */ new Date(`${bookingData.appointmentDate}T${time24}:00`);
      const downPaymentAmount = service.requiresDownPayment ? parseFloat(service.downPaymentAmount || "0") : 0;
      const totalAmount = parseFloat(service.price);
      const remainingAmount = totalAmount - downPaymentAmount;
      const appointment = await storage.createAppointment({
        clientId: client.id,
        serviceId: service.id,
        staffId: bookingData.staffId,
        appointmentDate: appointmentDateTime,
        status: service.requiresDownPayment ? "pending" : "confirmed",
        totalAmount: service.price,
        downPaymentAmount: service.downPaymentAmount,
        downPaymentPaid: !service.requiresDownPayment,
        remainingAmount: remainingAmount.toString()
      });
      res.json(appointment);
    } catch (error) {
      res.status(400).json({ message: "Error creating appointment: " + error.message });
    }
  });
  app2.post("/api/create-payment-intent", async (req, res) => {
    try {
      const { appointmentId } = req.body;
      const appointment = await storage.getAppointmentById(appointmentId);
      if (!appointment) {
        return res.status(404).json({ message: "Appointment not found" });
      }
      const amount = parseFloat(appointment.downPaymentAmount || "0");
      if (amount <= 0) {
        return res.status(400).json({ message: "No down payment required for this service" });
      }
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100),
        // Convert to cents
        currency: "usd",
        metadata: {
          appointmentId: appointmentId.toString()
        }
      });
      res.json({ clientSecret: paymentIntent.client_secret });
    } catch (error) {
      res.status(500).json({ message: "Error creating payment intent: " + error.message });
    }
  });
  app2.post("/api/confirm-payment", async (req, res) => {
    try {
      const { appointmentId, paymentIntentId } = req.body;
      await storage.updateAppointmentPayment(appointmentId, paymentIntentId, true);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Error confirming payment: " + error.message });
    }
  });
  app2.patch("/api/appointments/:id/status", async (req, res) => {
    try {
      const appointmentId = parseInt(req.params.id);
      const { status } = req.body;
      await storage.updateAppointmentStatus(appointmentId, status);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Error updating appointment status: " + error.message });
    }
  });
  const httpServer = createServer(app2);
  return httpServer;
}

// server/vite.ts
import express from "express";
import fs from "fs";
import path2 from "path";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
var vite_config_default = defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    ...process.env.NODE_ENV !== "production" && process.env.REPL_ID !== void 0 ? [
      await import("@replit/vite-plugin-cartographer").then(
        (m) => m.cartographer()
      )
    ] : []
  ],
  base: "/Rosasbeauty",
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets")
    }
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true
  },
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"]
    }
  }
});

// server/vite.ts
import { nanoid } from "nanoid";
var viteLogger = createLogger();
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app2, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    },
    server: serverOptions,
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path2.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html"
      );
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app2) {
  const distPath = path2.resolve(import.meta.dirname, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path2.resolve(distPath, "index.html"));
  });
}

// server/index.ts
var app = express2();
app.use(express2.json());
app.use(express2.urlencoded({ extended: false }));
app.use((req, res, next) => {
  const start = Date.now();
  const path3 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path3.startsWith("/api")) {
      let logLine = `${req.method} ${path3} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    }
  });
  next();
});
(async () => {
  const server = await registerRoutes(app);
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  const port = parseInt(process.env.PORT || "5000", 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true
  }, () => {
    log(`serving on port ${port}`);
  });
})();
