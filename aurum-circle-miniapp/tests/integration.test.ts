import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { getEventService } from "../src/lib/services/event-service";
import { getInviteStorage } from "../src/lib/storage/invite-storage";
import { getR2Client } from "../src/lib/storage/r2-client";
import { getUserProfileStorage } from "../src/lib/storage/user-profile-storage";

describe("Integration Tests - Aurum Circle MVP", () => {
  let eventService: any;
  let inviteStorage: any;
  let profileStorage: any;
  let r2Client: any;

  beforeAll(async () => {
    // Initialize services
    eventService = getEventService();
    inviteStorage = getInviteStorage();
    profileStorage = getUserProfileStorage();
    r2Client = getR2Client();

    // Wait for services to initialize
    await new Promise((resolve) => setTimeout(resolve, 1000));
  });

  afterAll(async () => {
    // Cleanup test data
    try {
      // Clean up test events
      const events = await eventService.getAllEvents();
      for (const event of events.events) {
        if (event.name.includes("Test Event")) {
          await eventService.deleteEvent(event.id);
        }
      }

      // Clean up test profiles
      const profiles = await profileStorage.getAllProfiles();
      for (const profile of profiles.profiles) {
        if (profile.userId.startsWith("test-user-")) {
          await profileStorage.deleteProfile(profile.userId);
        }
      }

      // Clean up test invites
      const invites = await inviteStorage.getAllInviteCodes();
      for (const invite of invites.invites) {
        if (invite.code.startsWith("TEST_")) {
          await inviteStorage.deleteInviteCode(invite.code);
        }
      }
    } catch (error) {
      console.warn("Cleanup failed:", error);
    }
  });

  describe("Event Service", () => {
    it("should create and retrieve events", async () => {
      const eventData = {
        name: "Test Integration Event",
        description: "A test event for integration testing",
        date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        location: "Test Venue",
        maxTickets: 100,
        isPublic: true,
      };

      const event = await eventService.createEvent(eventData, "test-user-1");

      expect(event).toBeDefined();
      expect(event.name).toBe(eventData.name);
      expect(event.id).toBeDefined();
      expect(event.organizerId).toBe("test-user-1");
      expect(event.status).toBe("upcoming");
      expect(event.ticketsSold).toBe(0);
    });

    it("should get all events with pagination", async () => {
      // Create multiple test events
      for (let i = 0; i < 5; i++) {
        await eventService.createEvent(
          {
            name: `Test Event ${i}`,
            description: `Test event ${i}`,
            date: new Date(
              Date.now() + (i + 1) * 24 * 60 * 60 * 1000
            ).toISOString(),
            location: `Venue ${i}`,
            maxTickets: 50,
            isPublic: true,
          },
          "test-user-1"
        );
      }

      const result = await eventService.getAllEvents({ limit: 3, offset: 0 });
      expect(result.events.length).toBeLessThanOrEqual(3);
      expect(result.total).toBeGreaterThanOrEqual(5);
    });

    it("should create and manage tickets", async () => {
      const event = await eventService.createEvent(
        {
          name: "Ticket Test Event",
          description: "Event for testing ticket creation",
          date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
          location: "Test Venue",
          maxTickets: 10,
          isPublic: true,
        },
        "test-user-1"
      );

      const tickets = await eventService.createTickets({
        eventId: event.id,
        userId: "test-user-2",
        quantity: 3,
      });

      expect(tickets.length).toBe(3);
      expect(tickets[0].eventId).toBe(event.id);
      expect(tickets[0].userId).toBe("test-user-2");
      expect(tickets[0].status).toBe("minted");

      // Check that event ticket count updated
      const updatedEvent = await eventService.getEventById(event.id);
      expect(updatedEvent.ticketsSold).toBe(3);
    });

    it("should handle ticket refunds", async () => {
      const event = await eventService.createEvent(
        {
          name: "Refund Test Event",
          description: "Event for testing refunds",
          date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
          location: "Test Venue",
          maxTickets: 20,
          isPublic: true,
        },
        "test-user-1"
      );

      const tickets = await eventService.createTickets({
        eventId: event.id,
        userId: "test-user-3",
        quantity: 2,
      });

      const refundResult = await eventService.refundTickets([tickets[0].id]);
      expect(refundResult.success).toBe(true);
      expect(refundResult.refunded.length).toBe(1);

      // Check ticket status
      const updatedTicket = tickets[0];
      expect(updatedTicket.status).toBe("refunded");

      // Check event ticket count
      const updatedEvent = await eventService.getEventById(event.id);
      expect(updatedEvent.ticketsSold).toBe(1);
    });

    it("should provide event countdown", async () => {
      const futureDate = new Date(
        Date.now() + 2 * 24 * 60 * 60 * 1000 + 5 * 60 * 60 * 1000
      );
      const event = await eventService.createEvent(
        {
          name: "Countdown Test Event",
          description: "Event for testing countdown",
          date: futureDate.toISOString(),
          location: "Test Venue",
          maxTickets: 50,
          isPublic: true,
        },
        "test-user-1"
      );

      const countdown = eventService.getEventCountdown(event);
      expect(countdown).toBeDefined();
      expect(countdown!.days).toBe(2);
      expect(countdown!.hours).toBe(5);
    });

    it("should check if event is open for sales", async () => {
      const futureEvent = await eventService.createEvent(
        {
          name: "Future Event",
          description: "Event in the future",
          date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          location: "Test Venue",
          maxTickets: 50,
          isPublic: true,
        },
        "test-user-1"
      );

      const pastEvent = await eventService.createEvent(
        {
          name: "Past Event",
          description: "Event in the past",
          date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          location: "Test Venue",
          maxTickets: 50,
          isPublic: true,
        },
        "test-user-1"
      );

      expect(eventService.isEventOpenForSales(futureEvent)).toBe(true);
      expect(eventService.isEventOpenForSales(pastEvent)).toBe(false);
    });
  });

  describe("Invite System", () => {
    it("should create and retrieve invite codes", async () => {
      const inviteData = {
        userId: "test-user-1",
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      };

      const invite = await inviteStorage.createInviteCode(inviteData);

      expect(invite).toBeDefined();
      expect(invite.code).toBeDefined();
      expect(invite.userId).toBe("test-user-1");
      expect(invite.isUsed).toBe(false);
      expect(invite.createdAt).toBeInstanceOf(Date);
    });

    it("should get user invite codes", async () => {
      const userId = "test-user-2";

      // Create multiple invites for the user
      for (let i = 0; i < 3; i++) {
        await inviteStorage.createInviteCode({
          userId,
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        });
      }

      const userInvites = await inviteStorage.getUserInviteCodes(userId);
      expect(userInvites.length).toBe(3);
      expect(userInvites.every((invite) => invite.userId === userId)).toBe(
        true
      );
    });

    it("should enforce invite code limit", async () => {
      const userId = "test-user-limit-test";

      // Create 3 invites (the limit)
      for (let i = 0; i < 3; i++) {
        await inviteStorage.createInviteCode({
          userId,
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        });
      }

      // Try to create a 4th invite - should fail
      await expect(async () => {
        await inviteStorage.createInviteCode({
          userId,
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        });
      }).rejects.toThrow("Maximum 3 invite codes per user");
    });

    it("should validate invite codes", async () => {
      const invite = await inviteStorage.createInviteCode({
        userId: "test-user-validate",
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      });

      // Valid code
      const isValid = await inviteStorage.isInviteCodeValid(invite.code);
      expect(isValid).toBe(true);

      // Used code
      await inviteStorage.redeemInviteCode({
        code: invite.code,
        userId: "redeemer-user",
        ipAddress: "127.0.0.1",
      });

      const isUsedValid = await inviteStorage.isInviteCodeValid(invite.code);
      expect(isUsedValid).toBe(false);
    });

    it("should handle invite redemption", async () => {
      const invite = await inviteStorage.createInviteCode({
        userId: "test-inviter",
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      });

      const redemption = await inviteStorage.redeemInviteCode({
        code: invite.code,
        userId: "test-redeemer",
        ipAddress: "127.0.0.1",
      });

      expect(redemption).toBeDefined();
      expect(redemption.userId).toBe("test-redeemer");
      expect(redemption.inviteCode).toBe(invite.code);
      expect(redemption.claimedAt).toBeInstanceOf(Date);

      // Check that invite is marked as used
      const updatedInvite = await inviteStorage.getInviteCode(invite.code);
      expect(updatedInvite.isUsed).toBe(true);
      expect(updatedInvite.usedBy).toBe("test-redeemer");
      expect(updatedInvite.usedAt).toBeInstanceOf(Date);
    });
  });

  describe("Profile Storage", () => {
    it("should create and retrieve user profiles", async () => {
      const profileData = {
        userId: "test-profile-user",
        username: "testuser",
        email: "test@example.com",
        firstName: "Test",
        lastName: "User",
        university: "Test University",
        graduationYear: 2024,
        bio: "Test bio",
        vibeTags: ["academic", "artistic"],
        profileImage: "test-image-url",
        profileStrength: 75,
        hasNFT: true,
        hasWorldID: true,
      };

      const profile = await profileStorage.createProfile(profileData);

      expect(profile).toBeDefined();
      expect(profile.userId).toBe("test-profile-user");
      expect(profile.username).toBe("testuser");
      expect(profile.profileStrength).toBe(75);
      expect(profile.createdAt).toBeInstanceOf(Date);
    });

    it("should update user profiles", async () => {
      const profileData = {
        userId: "test-update-user",
        username: "originaluser",
        email: "original@example.com",
        firstName: "Original",
        lastName: "User",
        university: "Original University",
        graduationYear: 2024,
        bio: "Original bio",
        vibeTags: ["original"],
        profileImage: "original-image-url",
        profileStrength: 50,
        hasNFT: true,
        hasWorldID: true,
      };

      await profileStorage.createProfile(profileData);

      const updateData = {
        bio: "Updated bio",
        vibeTags: ["updated", "academic"],
        profileStrength: 85,
      };

      const updatedProfile = await profileStorage.updateProfile(
        "test-update-user",
        updateData
      );

      expect(updatedProfile.bio).toBe("Updated bio");
      expect(updatedProfile.vibeTags).toEqual(["updated", "academic"]);
      expect(updatedProfile.profileStrength).toBe(85);
    });

    it("should handle profile deletion", async () => {
      const profileData = {
        userId: "test-delete-user",
        username: "deleteuser",
        email: "delete@example.com",
        firstName: "Delete",
        lastName: "User",
        university: "Delete University",
        graduationYear: 2024,
        bio: "Delete bio",
        vibeTags: ["delete"],
        profileImage: "delete-image-url",
        profileStrength: 60,
        hasNFT: true,
        hasWorldID: true,
      };

      await profileStorage.createProfile(profileData);

      const deleteResult = await profileStorage.deleteProfile(
        "test-delete-user"
      );
      expect(deleteResult).toBe(true);

      const retrievedProfile = await profileStorage.getProfile(
        "test-delete-user"
      );
      expect(retrievedProfile).toBeNull();
    });

    it("should search profiles by various criteria", async () => {
      // Create test profiles
      const profiles = [
        {
          userId: "search-1",
          username: "student1",
          university: "Chulalongkorn University",
          graduationYear: 2024,
          vibeTags: ["academic", "science"],
        },
        {
          userId: "search-2",
          username: "student2",
          university: "Thammasat University",
          graduationYear: 2025,
          vibeTags: ["artistic", "music"],
        },
        {
          userId: "search-3",
          username: "student3",
          university: "Chulalongkorn University",
          graduationYear: 2023,
          vibeTags: ["academic", "leadership"],
        },
      ];

      for (const profileData of profiles) {
        await profileStorage.createProfile({
          ...profileData,
          email: `${profileData.userId}@example.com`,
          firstName: "Test",
          lastName: "User",
          bio: "Test bio",
          profileImage: "test-image-url",
          profileStrength: 70,
          hasNFT: true,
          hasWorldID: true,
        });
      }

      // Search by university
      const chulaProfiles = await profileStorage.searchProfiles({
        university: "Chulalongkorn University",
      });
      expect(chulaProfiles.profiles.length).toBe(2);

      // Search by graduation year
      const grad2024Profiles = await profileStorage.searchProfiles({
        graduationYear: 2024,
      });
      expect(grad2024Profiles.profiles.length).toBe(1);

      // Search by vibe tag
      const artisticProfiles = await profileStorage.searchProfiles({
        vibeTags: ["artistic"],
      });
      expect(artisticProfiles.profiles.length).toBe(1);
    });
  });

  describe("R2 Storage Integration", () => {
    it("should store and retrieve JSON objects", async () => {
      const testData = {
        id: "test-object",
        name: "Test Object",
        data: { key: "value", number: 42 },
        timestamp: new Date().toISOString(),
      };

      await r2Client.storeJson("test-key", testData);

      const retrievedData = await r2Client.getJson("test-key");
      expect(retrievedData).toEqual(testData);
    });

    it("should handle object listing", async () => {
      // Store multiple test objects
      for (let i = 0; i < 5; i++) {
        await r2Client.storeJson(`test-list-${i}`, { index: i });
      }

      const result = await r2Client.listObjects({
        prefix: "test-list-",
        maxKeys: 10,
      });

      expect(result.objects.length).toBeGreaterThanOrEqual(5);
      expect(
        result.objects.every((obj) => obj.key.startsWith("test-list-"))
      ).toBe(true);
    });

    it("should handle object deletion", async () => {
      await r2Client.storeJson("test-delete-key", { data: "test" });

      const deleteResult = await r2Client.delete("test-delete-key");
      expect(deleteResult).toBe(true);

      const retrievedData = await r2Client.getJson("test-delete-key");
      expect(retrievedData).toBeNull();
    });

    it("should provide health check", async () => {
      const isHealthy = await r2Client.healthCheck();
      expect(isHealthy).toBe(true);
    });
  });

  describe("End-to-End Workflow", () => {
    it("should handle complete user journey", async () => {
      // 1. User creates profile
      const profileData = {
        userId: "e2e-user",
        username: "e2euser",
        email: "e2e@example.com",
        firstName: "E2E",
        lastName: "User",
        university: "E2E University",
        graduationYear: 2024,
        bio: "End-to-end test user",
        vibeTags: ["testing", "integration"],
        profileImage: "e2e-image-url",
        profileStrength: 80,
        hasNFT: true,
        hasWorldID: true,
      };

      const profile = await profileStorage.createProfile(profileData);
      expect(profile.userId).toBe("e2e-user");

      // 2. User creates event
      const event = await eventService.createEvent(
        {
          name: "E2E Test Event",
          description: "Event for end-to-end testing",
          date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
          location: "E2E Venue",
          maxTickets: 50,
          isPublic: true,
        },
        "e2e-user"
      );
      expect(event.organizerId).toBe("e2e-user");

      // 3. User creates invite codes
      const invite1 = await inviteStorage.createInviteCode({
        userId: "e2e-user",
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      });
      const invite2 = await inviteStorage.createInviteCode({
        userId: "e2e-user",
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      });
      expect(invite1.userId).toBe("e2e-user");
      expect(invite2.userId).toBe("e2e-user");

      // 4. Another user redeems invite
      const redemption = await inviteStorage.redeemInviteCode({
        code: invite1.code,
        userId: "e2e-friend",
        ipAddress: "127.0.0.1",
      });
      expect(redemption.userId).toBe("e2e-friend");

      // 5. Friend buys ticket to event
      const tickets = await eventService.createTickets({
        eventId: event.id,
        userId: "e2e-friend",
        quantity: 2,
      });
      expect(tickets.length).toBe(2);
      expect(tickets[0].eventId).toBe(event.id);

      // 6. Verify all data is consistent
      const updatedEvent = await eventService.getEventById(event.id);
      expect(updatedEvent.ticketsSold).toBe(2);

      const updatedInvite1 = await inviteStorage.getInviteCode(invite1.code);
      expect(updatedInvite1.isUsed).toBe(true);

      const friendProfile = await profileStorage.getProfile("e2e-friend");
      expect(friendProfile).toBeDefined();

      // 7. Cleanup
      await eventService.deleteEvent(event.id);
      await profileStorage.deleteProfile("e2e-user");
      await profileStorage.deleteProfile("e2e-friend");
      await inviteStorage.deleteInviteCode(invite1.code);
      await inviteStorage.deleteInviteCode(invite2.code);
    });
  });
});
