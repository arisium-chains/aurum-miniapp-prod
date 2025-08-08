import { NextRequest, NextResponse } from "next/server";
import webpush from "web-push";

// Initialize webpush with VAPID keys
if (
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY &&
  process.env.VAPID_PRIVATE_KEY &&
  process.env.VAPID_SUBJECT
) {
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT,
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

// In-memory storage for subscriptions (in production, use Redis or database)
const subscriptions = new Map<string, any>();

export async function POST(request: NextRequest) {
  try {
    const { subscription, userId } = await request.json();

    if (!subscription || !userId) {
      return NextResponse.json(
        { error: "Subscription and userId are required" },
        { status: 400 }
      );
    }

    // Store the subscription
    subscriptions.set(userId, subscription);

    // Send a test notification
    try {
      await webpush.sendNotification(
        subscription,
        JSON.stringify({
          title: "Welcome to Aurum Circle!",
          body: "You have successfully subscribed to notifications.",
          icon: "/icon-192x192.png",
          badge: "/icon-192x192.png",
          tag: "welcome",
          data: {
            url: "/discover",
            timestamp: Date.now(),
          },
        })
      );
    } catch (error) {
      console.error("Error sending test notification:", error);
    }

    return NextResponse.json({
      success: true,
      message: "Subscription saved successfully",
    });
  } catch (error) {
    console.error("Error handling subscription:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "userId parameter is required" },
        { status: 400 }
      );
    }

    const subscription = subscriptions.get(userId);
    if (!subscription) {
      return NextResponse.json(
        { error: "No subscription found for this user" },
        { status: 404 }
      );
    }

    return NextResponse.json({ subscription });
  } catch (error) {
    console.error("Error retrieving subscription:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "userId parameter is required" },
        { status: 400 }
      );
    }

    const deleted = subscriptions.delete(userId);
    if (!deleted) {
      return NextResponse.json(
        { error: "No subscription found for this user" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Subscription removed successfully",
    });
  } catch (error) {
    console.error("Error removing subscription:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
