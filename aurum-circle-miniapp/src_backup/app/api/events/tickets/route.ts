import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth/session";
import { getEventService } from "@/lib/services/event-service";
import { z } from "zod";

// Ticket purchase schema
const purchaseSchema = z.object({
  eventId: z.string(),
  quantity: z.number().min(1).max(10).default(1),
});

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get("eventId");

    const eventService = getEventService();

    if (eventId) {
      // Get tickets for a specific event
      const tickets = await eventService.getEventTickets(eventId);
      const userTickets = tickets.filter((ticket) => ticket.userId === user.id);
      return NextResponse.json({ tickets: userTickets });
    } else {
      // Get all tickets for the user
      const tickets = await eventService.getUserTickets(user.id);
      return NextResponse.json({ tickets });
    }
  } catch (error) {
    console.error("❌ Failed to get tickets:", error);
    return NextResponse.json(
      { error: "Failed to get tickets" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = purchaseSchema.parse(body);

    const eventService = getEventService();

    // Check if event exists and is open for sales
    const event = await eventService.getEventById(validatedData.eventId);
    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    if (!eventService.isEventOpenForSales(event)) {
      return NextResponse.json(
        { error: "Event is not open for ticket sales" },
        { status: 400 }
      );
    }

    // Create tickets
    const tickets = await eventService.createTickets({
      eventId: validatedData.eventId,
      userId: user.id,
      quantity: validatedData.quantity,
    });

    return NextResponse.json(
      {
        success: true,
        message: `Successfully purchased ${validatedData.quantity} ticket(s) for ${event.name}`,
        tickets,
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid data", details: error.errors },
        { status: 400 }
      );
    }

    if (error instanceof Error) {
      if (error.message.includes("Not enough tickets available")) {
        return NextResponse.json(
          { error: "Not enough tickets available" },
          { status: 400 }
        );
      }
      if (error.message.includes("Event not found")) {
        return NextResponse.json({ error: "Event not found" }, { status: 404 });
      }
    }

    console.error("❌ Failed to purchase tickets:", error);
    return NextResponse.json(
      { error: "Failed to purchase tickets" },
      { status: 500 }
    );
  }
}
