import { NextRequest, NextResponse } from 'next/server';
import type { ApiResponse } from '@shared/types';

interface SubmissionRequest {
  name: string;
  email: string;
  message?: string;
}

interface SubmissionData {
  id: string;
  name: string;
  email: string;
  message?: string;
  timestamp: string;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * @description Handles waitlist form submissions
 * @param request Next.js request object
 * @returns API response with submission status
 */
export async function POST(
  request: NextRequest
): Promise<NextResponse<ApiResponse<SubmissionData>>> {
  try {
    // Parse request body
    const body: SubmissionRequest = await request.json();

    // Validate required fields
    if (!body.name || !body.email) {
      return NextResponse.json(
        {
          status: 'error',
          message: 'Name and email are required fields.',
          data: undefined,
        },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.email)) {
      return NextResponse.json(
        {
          status: 'error',
          message: 'Please provide a valid email address.',
          data: undefined,
        },
        { status: 400 }
      );
    }

    // Validate name length
    if (body.name.trim().length < 2) {
      return NextResponse.json(
        {
          status: 'error',
          message: 'Name must be at least 2 characters long.',
          data: undefined,
        },
        { status: 400 }
      );
    }

    // Get client information
    const ipAddress =
      request.headers.get('x-forwarded-for') ||
      request.headers.get('x-real-ip') ||
      'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // Create submission data
    const submissionData: SubmissionData = {
      id: `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: body.name.trim(),
      email: body.email.toLowerCase().trim(),
      message: body.message?.trim() || '',
      timestamp: new Date().toISOString(),
      ipAddress,
      userAgent,
    };

    // Store submission (multiple storage methods for redundancy)
    const storageResults = await Promise.allSettled([
      storeInCloudflareR2(submissionData),
      storeLocally(submissionData),
      sendNotification(submissionData),
    ]);

    // Check if at least one storage method succeeded
    const hasSuccessfulStorage = storageResults.some(
      result => result.status === 'fulfilled'
    );

    if (!hasSuccessfulStorage) {
      console.error('All storage methods failed:', storageResults);
      return NextResponse.json(
        {
          status: 'error',
          message:
            'Unable to process your submission at this time. Please try again later.',
          data: undefined,
        },
        { status: 500 }
      );
    }

    // Log any partial failures
    storageResults.forEach((result, index) => {
      if (result.status === 'rejected') {
        console.warn(`Storage method ${index} failed:`, result.reason);
      }
    });

    return NextResponse.json(
      {
        status: 'success',
        message: "Thank you for joining our waitlist! We'll be in touch soon.",
        data: {
          id: submissionData.id,
          name: submissionData.name,
          email: submissionData.email,
          message: submissionData.message,
          timestamp: submissionData.timestamp,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Submission error:', error);

    return NextResponse.json(
      {
        status: 'error',
        message: 'An unexpected error occurred. Please try again later.',
        data: undefined,
      },
      { status: 500 }
    );
  }
}

/**
 * @description Stores submission data in Cloudflare R2
 * @param data Submission data to store
 * @returns Promise that resolves when storage is complete
 */
async function storeInCloudflareR2(data: SubmissionData): Promise<void> {
  if (
    !process.env.R2_ACCOUNT_ID ||
    !process.env.R2_ACCESS_KEY_ID ||
    !process.env.R2_SECRET_ACCESS_KEY ||
    !process.env.R2_BUCKET_NAME
  ) {
    throw new Error('Cloudflare R2 configuration missing');
  }

  // For now, we'll use a simple approach
  // In production, you'd want to use the AWS SDK or Cloudflare Workers
  const filename = `submissions/${data.timestamp.split('T')[0]}/${data.id}.json`;

  // This is a placeholder - implement actual R2 storage
  console.log('Would store to R2:', { filename, data });

  // Simulate storage delay
  await new Promise(resolve => setTimeout(resolve, 100));
}

/**
 * @description Stores submission data locally as backup
 * @param data Submission data to store
 * @returns Promise that resolves when storage is complete
 */
async function storeLocally(data: SubmissionData): Promise<void> {
  // In a real implementation, you might store to a local database
  // For now, we'll just log it
  console.log('Storing submission locally:', {
    id: data.id,
    name: data.name,
    email: data.email,
    timestamp: data.timestamp,
  });

  // Simulate storage delay
  await new Promise(resolve => setTimeout(resolve, 50));
}

/**
 * @description Sends notification about new submission
 * @param data Submission data
 * @returns Promise that resolves when notification is sent
 */
async function sendNotification(data: SubmissionData): Promise<void> {
  const webhookUrl = process.env.NOTIFICATION_WEBHOOK_URL;

  if (!webhookUrl) {
    throw new Error('Notification webhook URL not configured');
  }

  const payload = {
    text: `New waitlist submission from ${data.name} (${data.email})`,
    attachments: [
      {
        color: 'good',
        fields: [
          {
            title: 'Name',
            value: data.name,
            short: true,
          },
          {
            title: 'Email',
            value: data.email,
            short: true,
          },
          {
            title: 'Message',
            value: data.message || 'No message provided',
            short: false,
          },
          {
            title: 'Timestamp',
            value: data.timestamp,
            short: true,
          },
        ],
      },
    ],
  };

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Webhook failed: ${response.status}`);
    }
  } catch (error) {
    console.error('Notification webhook failed:', error);
    throw error;
  }
}

/**
 * @description Handles GET requests (not supported)
 */
export async function GET(): Promise<NextResponse<ApiResponse<undefined>>> {
  return NextResponse.json(
    {
      status: 'error',
      message: 'Method not allowed. Use POST to submit forms.',
      data: undefined,
    },
    { status: 405 }
  );
}
