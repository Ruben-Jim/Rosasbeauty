import { 
  services, 
  staff, 
  clients, 
  appointments, 
  type Service, 
  type Staff, 
  type Client, 
  type Appointment, 
  type InsertService, 
  type InsertStaff, 
  type InsertClient, 
  type InsertAppointment,
  type AppointmentWithDetails 
} from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

export interface IStorage {
  // Services
  getAllServices(): Promise<Service[]>;
  getServiceById(id: number): Promise<Service | undefined>;
  createService(service: InsertService): Promise<Service>;

  // Staff
  getAllStaff(): Promise<Staff[]>;
  getStaffById(id: number): Promise<Staff | undefined>;
  createStaff(staff: InsertStaff): Promise<Staff>;

  // Clients
  getClientById(id: number): Promise<Client | undefined>;
  getClientByEmail(email: string): Promise<Client | undefined>;
  createClient(client: InsertClient): Promise<Client>;

  // Appointments
  getAllAppointments(): Promise<AppointmentWithDetails[]>;
  getAppointmentById(id: number): Promise<AppointmentWithDetails | undefined>;
  createAppointment(appointment: InsertAppointment): Promise<Appointment>;
  updateAppointmentPayment(id: number, paymentIntentId: string, paid: boolean): Promise<void>;
  updateAppointmentStatus(id: number, status: string): Promise<void>;
}

export class MemStorage implements IStorage {
  private services: Map<number, Service>;
  private staff: Map<number, Staff>;
  private clients: Map<number, Client>;
  private appointments: Map<number, Appointment>;
  private currentServiceId: number;
  private currentStaffId: number;
  private currentClientId: number;
  private currentAppointmentId: number;

  constructor() {
    this.services = new Map();
    this.staff = new Map();
    this.clients = new Map();
    this.appointments = new Map();
    this.currentServiceId = 1;
    this.currentStaffId = 1;
    this.currentClientId = 1;
    this.currentAppointmentId = 1;

    this.initializeData();
  }

  private initializeData() {
    // Initialize services
    const hairServices: InsertService[] = [
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

    const nailServices: InsertService[] = [
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

    [...hairServices, ...nailServices].forEach(service => {
      this.createService(service);
    });

    // Initialize staff
    const staffMembers: InsertStaff[] = [
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

    staffMembers.forEach(staff => {
      this.createStaff(staff);
    });
  }

  async getAllServices(): Promise<Service[]> {
    return Array.from(this.services.values());
  }

  async getServiceById(id: number): Promise<Service | undefined> {
    return this.services.get(id);
  }

  async createService(insertService: InsertService): Promise<Service> {
    const id = this.currentServiceId++;
    const service: Service = { 
      ...insertService, 
      id,
      requiresDownPayment: insertService.requiresDownPayment ?? false,
      downPaymentAmount: insertService.downPaymentAmount ?? null,
      imageUrl: insertService.imageUrl ?? null
    };
    this.services.set(id, service);
    return service;
  }

  async getAllStaff(): Promise<Staff[]> {
    return Array.from(this.staff.values());
  }

  async getStaffById(id: number): Promise<Staff | undefined> {
    return this.staff.get(id);
  }

  async createStaff(insertStaff: InsertStaff): Promise<Staff> {
    const id = this.currentStaffId++;
    const staff: Staff = { 
      ...insertStaff, 
      id,
      imageUrl: insertStaff.imageUrl ?? null,
      specialties: insertStaff.specialties ?? null
    };
    this.staff.set(id, staff);
    return staff;
  }

  async getClientById(id: number): Promise<Client | undefined> {
    return this.clients.get(id);
  }

  async getClientByEmail(email: string): Promise<Client | undefined> {
    return Array.from(this.clients.values()).find(client => client.email === email);
  }

  async createClient(insertClient: InsertClient): Promise<Client> {
    const id = this.currentClientId++;
    const client: Client = { ...insertClient, id };
    this.clients.set(id, client);
    return client;
  }

  async getAllAppointments(): Promise<AppointmentWithDetails[]> {
    const appointmentsList = Array.from(this.appointments.values());
    return appointmentsList.map(appointment => ({
      ...appointment,
      client: this.clients.get(appointment.clientId)!,
      service: this.services.get(appointment.serviceId)!,
      staff: this.staff.get(appointment.staffId)!,
    }));
  }

  async getAppointmentById(id: number): Promise<AppointmentWithDetails | undefined> {
    const appointment = this.appointments.get(id);
    if (!appointment) return undefined;

    return {
      ...appointment,
      client: this.clients.get(appointment.clientId)!,
      service: this.services.get(appointment.serviceId)!,
      staff: this.staff.get(appointment.staffId)!,
    };
  }

  async createAppointment(insertAppointment: InsertAppointment): Promise<Appointment> {
    const id = this.currentAppointmentId++;
    const appointment: Appointment = { 
      ...insertAppointment, 
      id,
      createdAt: new Date(),
      status: insertAppointment.status ?? "pending",
      downPaymentPaid: insertAppointment.downPaymentPaid ?? false,
      downPaymentAmount: insertAppointment.downPaymentAmount ?? null,
      stripePaymentIntentId: insertAppointment.stripePaymentIntentId ?? null,
      notes: insertAppointment.notes ?? null
    };
    this.appointments.set(id, appointment);
    return appointment;
  }

  async updateAppointmentPayment(id: number, paymentIntentId: string, paid: boolean): Promise<void> {
    const appointment = this.appointments.get(id);
    if (appointment) {
      appointment.stripePaymentIntentId = paymentIntentId;
      appointment.downPaymentPaid = paid;
      if (paid) {
        appointment.status = "confirmed";
      }
    }
  }

  async updateAppointmentStatus(id: number, status: string): Promise<void> {
    const appointment = this.appointments.get(id);
    if (appointment) {
      appointment.status = status;
    }
  }
}

export class DatabaseStorage implements IStorage {
  async getAllServices(): Promise<Service[]> {
    return await db.select().from(services);
  }

  async getServiceById(id: number): Promise<Service | undefined> {
    const [service] = await db.select().from(services).where(eq(services.id, id));
    return service || undefined;
  }

  async createService(insertService: InsertService): Promise<Service> {
    const [service] = await db
      .insert(services)
      .values(insertService)
      .returning();
    return service;
  }

  async getAllStaff(): Promise<Staff[]> {
    return await db.select().from(staff);
  }

  async getStaffById(id: number): Promise<Staff | undefined> {
    const [staffMember] = await db.select().from(staff).where(eq(staff.id, id));
    return staffMember || undefined;
  }

  async createStaff(insertStaff: InsertStaff): Promise<Staff> {
    const [staffMember] = await db
      .insert(staff)
      .values(insertStaff)
      .returning();
    return staffMember;
  }

  async getClientById(id: number): Promise<Client | undefined> {
    const [client] = await db.select().from(clients).where(eq(clients.id, id));
    return client || undefined;
  }

  async getClientByEmail(email: string): Promise<Client | undefined> {
    const [client] = await db.select().from(clients).where(eq(clients.email, email));
    return client || undefined;
  }

  async createClient(insertClient: InsertClient): Promise<Client> {
    const [client] = await db
      .insert(clients)
      .values(insertClient)
      .returning();
    return client;
  }

  async getAllAppointments(): Promise<AppointmentWithDetails[]> {
    return await db.query.appointments.findMany({
      with: {
        client: true,
        service: true,
        staff: true,
      },
    });
  }

  async getAppointmentById(id: number): Promise<AppointmentWithDetails | undefined> {
    const appointment = await db.query.appointments.findFirst({
      where: eq(appointments.id, id),
      with: {
        client: true,
        service: true,
        staff: true,
      },
    });
    return appointment || undefined;
  }

  async createAppointment(insertAppointment: InsertAppointment): Promise<Appointment> {
    const [appointment] = await db
      .insert(appointments)
      .values(insertAppointment)
      .returning();
    return appointment;
  }

  async updateAppointmentPayment(id: number, paymentIntentId: string, paid: boolean): Promise<void> {
    await db
      .update(appointments)
      .set({
        stripePaymentIntentId: paymentIntentId,
        downPaymentPaid: paid,
        status: paid ? "confirmed" : "pending",
      })
      .where(eq(appointments.id, id));
  }

  async updateAppointmentStatus(id: number, status: string): Promise<void> {
    await db
      .update(appointments)
      .set({ status })
      .where(eq(appointments.id, id));
  }
}

// Initialize with sample data
async function initializeDatabase() {
  try {
    // Check if data already exists
    const existingServices = await db.select().from(services);
    if (existingServices.length > 0) {
      return; // Data already exists
    }

    // Initialize services
    const hairServices: InsertService[] = [
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

    const nailServices: InsertService[] = [
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

    // Insert services
    await db.insert(services).values([...hairServices, ...nailServices]);

    // Initialize staff
    const staffMembers: InsertStaff[] = [
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

    // Insert staff
    await db.insert(staff).values(staffMembers);
    
    console.log("Database initialized with sample data");
  } catch (error) {
    console.error("Error initializing database:", error);
  }
}

export const storage = new MemStorage();
