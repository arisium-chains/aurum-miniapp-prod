import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth/session";
import { getEventService } from "@/lib/services/event-service";
import { z } from "zod";

// Event schema
const eventSchema = z.object({
  name: z.string(),
  description: z.string(),
  date: z.string().transform((str) => new Date(str)),
  location: z.string(),
  maxTickets: z.number().positive(),
  ticketPrice: z.number().positive().optional(),
  imageUrl: z.string().url().optional(),
  isPublic: z.boolean().default(true),
});

// Ticket schema
const ticketSchema = z.object({
  eventId: z.string(),
  quantity: z.number().min(1).default(1),
});

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") as any;
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    const eventService = getEventService();
    const result = await eventService.getAllEvents({
      status,
      limit,
      offset,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("❌ Failed to get events:", error);
    return NextResponse.json(
      { error: "Failed to get events" },
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
    const validatedData = eventSchema.parse(body);

    const eventService = getEventService();
    const event = await eventService.createEvent(validatedData, user.id);

    return NextResponse.json({ event }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid data", details: error.errors },
        { status: 400 }
      );
    }

    console.error("❌ Failed to create event:", error);
    return NextResponse.json(
      { error: "Failed to create event" },
      { status: 500 }
    );
  }
}
