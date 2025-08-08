import { z } from "zod";

// Event schema
const eventSchema = z.object({
  name: z.string(),
  description: z.string(),
  date: z.date(),
  location: z.string(),
  maxTickets: z.number().positive(),
  ticketPrice: z.number().positive().optional(),
  imageUrl: z.string().url().optional(),
  isPublic: z.boolean().default(true),
});

// Ticket schema
const ticketSchema = z.object({
  eventId: z.string(),
  userId: z.string(),
  quantity: z.number().min(1).default(1),
});

// Event status enum
const EventStatus = {
  UPCOMING: "upcoming",
  ONGOING: "ongoing",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
} as const;

type EventStatus = (typeof EventStatus)[keyof typeof EventStatus];

export interface Event {
  id: string;
  name: string;
  description: string;
  date: Date;
  location: string;
  maxTickets: number;
  ticketPrice?: number;
  imageUrl?: string;
  isPublic: boolean;
  status: EventStatus;
  createdAt: Date;
  updatedAt: Date;
  ticketsSold: number;
  organizerId: string;
}

export interface Ticket {
  id: string;
  eventId: string;
  userId: string;
  quantity: number;
  mintedAt: Date;
  txHash?: string;
  status: "minted" | "transferred" | "burned" | "refunded";
  nftTokenId?: string;
}

export class EventService {
  // In-memory storage for demo purposes
  private events: Map<string, Event> = new Map();
  private tickets: Map<string, Ticket> = new Map();

  /**
   * Create a new event
   */
  async createEvent(
    data: z.infer<typeof eventSchema>,
    organizerId: string
  ): Promise<Event> {
    const event: Event = {
      id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...data,
      status: EventStatus.UPCOMING,
      createdAt: new Date(),
      updatedAt: new Date(),
      ticketsSold: 0,
      organizerId,
    };

    this.events.set(event.id, event);
    console.log(`✅ Event created: ${event.name} (${event.id})`);

    return event;
  }

  /**
   * Get all events
   */
  async getAllEvents(
    options: {
      status?: EventStatus;
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<{ events: Event[]; total: number }> {
    const { status, limit = 50, offset = 0 } = options;

    let events = Array.from(this.events.values());

    // Filter by status if provided
    if (status) {
      events = events.filter((event) => event.status === status);
    }

    // Sort by date (newest first)
    events.sort((a, b) => b.date.getTime() - a.date.getTime());

    // Apply pagination
    const paginatedEvents = events.slice(offset, offset + limit);

    return {
      events: paginatedEvents,
      total: events.length,
    };
  }

  /**
   * Get event by ID
   */
  async getEventById(id: string): Promise<Event | null> {
    return this.events.get(id) || null;
  }

  /**
   * Get events for a specific organizer
   */
  async getEventsByOrganizer(organizerId: string): Promise<Event[]> {
    return Array.from(this.events.values()).filter(
      (event) => event.organizerId === organizerId
    );
  }

  /**
   * Update an event
   */
  async updateEvent(
    id: string,
    data: Partial<z.infer<typeof eventSchema>>
  ): Promise<Event | null> {
    const event = this.events.get(id);
    if (!event) {
      return null;
    }

    const updatedEvent: Event = {
      ...event,
      ...data,
      updatedAt: new Date(),
    };

    this.events.set(id, updatedEvent);
    console.log(`✅ Event updated: ${updatedEvent.name} (${id})`);

    return updatedEvent;
  }

  /**
   * Delete an event
   */
  async deleteEvent(id: string): Promise<boolean> {
    const event = this.events.get(id);
    if (!event) {
      return false;
    }

    // Check if event has tickets
    const hasTickets = Array.from(this.tickets.values()).some(
      (ticket) => ticket.eventId === id
    );
    if (hasTickets) {
      throw new Error("Cannot delete event with existing tickets");
    }

    this.events.delete(id);
    console.log(`✅ Event deleted: ${event.name} (${id})`);

    return true;
  }

  /**
   * Create tickets for an event
   */
  async createTickets(data: z.infer<typeof ticketSchema>): Promise<Ticket[]> {
    const event = this.events.get(data.eventId);
    if (!event) {
      throw new Error("Event not found");
    }

    // Check if there are enough tickets available
    const availableTickets = event.maxTickets - event.ticketsSold;
    if (availableTickets < data.quantity) {
      throw new Error("Not enough tickets available");
    }

    const tickets: Ticket[] = [];

    for (let i = 0; i < data.quantity; i++) {
      const ticket: Ticket = {
        id: `ticket_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        eventId: data.eventId,
        userId: data.userId,
        quantity: 1,
        mintedAt: new Date(),
        status: "minted",
      };

      this.tickets.set(ticket.id, ticket);
      tickets.push(ticket);
    }

    // Update event ticket count
    event.ticketsSold += data.quantity;
    this.events.set(data.eventId, event);

    console.log(
      `✅ ${data.quantity} ticket(s) created for event ${data.eventId}`
    );

    return tickets;
  }

  /**
   * Get tickets for a user
   */
  async getUserTickets(userId: string): Promise<Ticket[]> {
    return Array.from(this.tickets.values()).filter(
      (ticket) => ticket.userId === userId
    );
  }

  /**
   * Get tickets for an event
   */
  async getEventTickets(eventId: string): Promise<Ticket[]> {
    return Array.from(this.tickets.values()).filter(
      (ticket) => ticket.eventId === eventId
    );
  }

  /**
   * Update ticket status (e.g., after NFT transfer)
   */
  async updateTicketStatus(
    ticketId: string,
    status: Ticket["status"],
    txHash?: string
  ): Promise<boolean> {
    const ticket = this.tickets.get(ticketId);
    if (!ticket) {
      return false;
    }

    ticket.status = status;
    if (txHash) {
      ticket.txHash = txHash;
    }

    this.tickets.set(ticketId, ticket);
    console.log(`✅ Ticket ${ticketId} status updated to ${status}`);

    return true;
  }

  /**
   * Refund tickets
   */
  async refundTickets(
    ticketIds: string[]
  ): Promise<{ success: boolean; refunded: string[]; failed: string[] }> {
    const refunded: string[] = [];
    const failed: string[] = [];

    for (const ticketId of ticketIds) {
      const ticket = this.tickets.get(ticketId);
      if (!ticket) {
        failed.push(ticketId);
        continue;
      }

      if (ticket.status !== "minted") {
        failed.push(ticketId);
        continue;
      }

      // Update ticket status
      ticket.status = "refunded";
      this.tickets.set(ticketId, ticket);

      // Update event ticket count
      const event = this.events.get(ticket.eventId);
      if (event) {
        event.ticketsSold = Math.max(0, event.ticketsSold - 1);
        this.events.set(ticket.eventId, event);
      }

      refunded.push(ticketId);
    }

    console.log(
      `✅ ${refunded.length} ticket(s) refunded, ${failed.length} failed`
    );

    return {
      success: failed.length === 0,
      refunded,
      failed,
    };
  }

  /**
   * Check if event is still open for ticket sales
   */
  isEventOpenForSales(event: Event): boolean {
    const now = new Date();
    const eventDate = new Date(event.date);

    // Event is open if it's upcoming and hasn't started yet
    return event.status === EventStatus.UPCOMING && now < eventDate;
  }

  /**
   * Get event countdown
   */
  getEventCountdown(
    event: Event
  ): { days: number; hours: number; minutes: number; seconds: number } | null {
    const now = new Date();
    const eventDate = new Date(event.date);

    if (now >= eventDate) {
      return null;
    }

    const diff = eventDate.getTime() - now.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    return { days, hours, minutes, seconds };
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      // Test basic operations
      const testEvent = await this.createEvent(
        {
          name: "Test Event",
          description: "Test event for health check",
          date: new Date(Date.now() + 24 * 60 * 60 * 1000),
          location: "Test Location",
          maxTickets: 100,
          isPublic: true,
        },
        "test-organizer"
      );

      const testTicket = await this.createTickets({
        eventId: testEvent.id,
        userId: "test-user",
        quantity: 1,
      });

      await this.updateTicketStatus(testTicket[0].id, "burned");
      await this.deleteEvent(testEvent.id);

      return true;
    } catch (error) {
      console.error("❌ Event service health check failed:", error);
      return false;
    }
  }
}

// Singleton instance
let eventServiceInstance: EventService | null = null;

export function getEventService(): EventService {
  if (!eventServiceInstance) {
    eventServiceInstance = new EventService();
  }
  return eventServiceInstance;
}

// Export for direct use
export default EventService;
