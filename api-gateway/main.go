package main

import (
	"fmt"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/rs/zerolog/log"
)

// WorldIDAuthRequest defines the request body for World ID authentication
type WorldIDAuthRequest struct {
	Proof  string `json:"proof" binding:"required"`
	Action string `json:"action" binding:"required"` // e.g., "verify"
}

// WorldIDAuthResponse defines the response body for World ID authentication
type WorldIDAuthResponse struct {
	Success bool   `json:"success"`
	Message string `json:"message"`
	UserID  string `json:"userId,omitempty"` // World ID nullifier hash or user ID
}

// WalletAuthRequest defines the request body for Wallet authentication
type WalletAuthRequest struct {
	Message   string `json:"message" binding:"required"`
	Signature string `json:"signature" binding:"required"`
	Address   string `json:"address" binding:"required"`
}

// WalletAuthResponse defines the response body for Wallet authentication
type WalletAuthResponse struct {
	Success bool   `json:"success"`
	Message string `json:"message"`
	UserID  string `json:"userId,omitempty"`
	Token   string `json:"token,omitempty"` // JWT token
}

// UserProfile defines the structure for user profile data
type UserProfile struct {
	UserID       string    `json:"userId"`
	Handle       string    `json:"handle"`
	DisplayName  string    `json:"displayName"`
	Bio          *string   `json:"bio,omitempty"`
	ProfileImage *string   `json:"profileImage,omitempty"` // URL to the profile image
	Vibe         string    `json:"vibe"`                   // e.g., "Wicked", "Royal", "Mystic"`
	Tags         []string  `json:"tags"`
	NFTVerified  bool      `json:"nftVerified"`
	CreatedAt    time.Time `json:"createdAt"`
	LastSeen     time.Time `json:"lastSeen"`
}

// SignalRequest defines the request body for sending a signal
type SignalRequest struct {
	ToUserID string  `json:"toUserId" binding:"required"`
	Type     string  `json:"type" binding:"required"` // e.g., "interest", "super_interest", "pass"
	Message  *string `json:"message,omitempty"`       // Optional message with the signal
}

// SignalResponse defines the response body for sending a signal
type SignalResponse struct {
	Success  bool   `json:"success"`
	Message  string `json:"message"`
	SignalID string `json:"signalId,omitempty"`
}

// ReceivedSignal defines the structure for a signal received by the user
type ReceivedSignal struct {
	SignalID   string    `json:"signalId"`
	FromUserID string    `json:"fromUserId"`
	FromHandle string    `json:"fromHandle"` // For displaying sender's info
	Type       string    `json:"type"`       // e.g., "interest", "super_interest", "pass"`
	Message    *string   `json:"message,omitempty"`
	SentAt     time.Time `json:"sentAt"`
}

// MatchedUser defines the structure for a user in the context of a match
type MatchedUser struct {
	UserID       string    `json:"userId"`
	Handle       string    `json:"handle"`
	DisplayName  string    `json:"displayName"`
	ProfileImage *string   `json:"profileImage,omitempty"`
	LastSeen     time.Time `json:"lastSeen"`
}

// Match defines the structure for a match
type Match struct {
	MatchID      string      `json:"matchId"`
	User1        MatchedUser `json:"user1"`
	User2        MatchedUser `json:"user2"`
	MatchedAt    time.Time   `json:"matchedAt"`
	LastActivity time.Time   `json:"lastActivity"` // For sorting or prioritization
	Status       string      `json:"status"`       // e.g., "active", "archived"
	// ConversationID string `json:"conversationId,omitempty"` // If direct messaging is implemented
}

// AuthMiddleware validates the JWT token and sets user context
func AuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		tokenString := GetTokenFromRequest(c)
		if tokenString == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Authorization token required"})
			c.Abort()
			return
		}

		// TODO: Implement JWT validation logic
		// For now, mock user ID
		// claims, err := jwt.ValidateToken(tokenString)
		// if err != nil {
		//     c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid or expired token"})
		//     c.Abort()
		//     return
		// }
		// c.Set("userID", claims.Subject)
		c.Set("userID", "mock-user-id-123") // Placeholder

		c.Next()
	}
}

// GetTokenFromRequest extracts the token from the Authorization header
func GetTokenFromRequest(c *gin.Context) string {
	authHeader := c.GetHeader("Authorization")
	if authHeader == "" {
		return ""
	}
	// Bearer <token>
	if len(authHeader) > 7 && authHeader[:7] == "Bearer " {
		return authHeader[7:]
	}
	return ""
}

// CORSMiddleware handles Cross-Origin Resource Sharing
func CORSMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*") // Restrict to specific domains in production
		c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, accept, origin, Cache-Control, X-Requested-With, X-Real-IP, X-Forwarded-For")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS, GET, PUT, DELETE")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}

		c.Next()
	}
}

func main() {
	// Set Gin to release mode in production
	gin.SetMode(gin.ReleaseMode)

	router := gin.New()
	router.Use(gin.Recovery())
	router.Use(CORSMiddleware())
	// TODO: Add structured logging middleware (e.g., using zerolog)

	// Public routes (no authentication required)
	public := router.Group("/api")
	{
		public.POST("/auth/worldid", handleWorldIDAuth) // World ID verification
		public.POST("/auth/wallet", handleWalletAuth)   // Wallet signature verification
		public.GET("/auth/session", handleGetSession)   // Get current session (if any, for client-side)
		// public.POST("/auth/logout", handleLogout)           // Logout (invalidate token)
	}

	// Protected routes (authentication required)
	protected := router.Group("/api")
	protected.Use(AuthMiddleware())
	{
		// User Management
		users := protected.Group("/users")
		{
			users.GET("/me", handleGetUserProfile)    // Get current user profile
			users.PUT("/me", handleUpdateUserProfile) // Update current user profile
			// users.POST("/me/upload", handleUploadImage) // Upload profile image
			// users.DELETE("/me", handleDeleteAccount)   // Delete user account
		}

		// NFT & Access Control
		// protected.GET("/nft/verify/:address", handleNFTVerify) // Check NFT ownership for a specific address
		// protected.GET("/access/gate", handleAccessGate)         // Check user's access level

		// Discovery & Matching
		discovery := protected.Group("/discovery")
		{
			discovery.GET("/profiles", handleGetDiscoveryProfiles) // Get potential matches
		}
		protected.POST("/signals", handleSendSignal)                 // Send interest signal
		protected.GET("/signals/received", handleGetReceivedSignals) // Get received signals
		protected.GET("/matches", handleGetMatches)                  // Get current matches
		// protected.DELETE("/matches/:id", handleUnmatch)         // Unmatch a user

		// Invite System
		// invites := protected.Group("/invites")
		// {
		//     invites.GET("/me", handleGetMyInvites)      // Get my generated invite codes
		//     invites.POST("/", handleCreateInvite)       // Generate a new invite code
		//     invites.GET("/:code", handleValidateInvite) // Validate an invite code
		//     invites.POST("/:code/claim", handleClaimInvite) // Claim an invite code
		//     invites.GET("/claims", handleGetInviteClaims) // Who claimed my invites
		// }

		// Scoring System (if needed via gateway, or direct to ML API)
		// protected.POST("/score", handleCalculateScore) // Calculate final user score
	}

	// Health check
	router.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"status":    "ok",
			"timestamp": time.Now().UTC(),
			"service":   "api-gateway",
		})
	})

	// ML API direct proxy (optional, if API Gateway needs to forward some ML requests)
	// This can also be handled by Nginx directly if no transformation is needed at the gateway level.
	// router.Any("/ml-api/*", func(c *gin.Context) {
	// 	proxyURL := "http://ml-api:3000" + c.Request.URL.Path
	// 	proxyHandler := httputil.NewSingleHostReverseProxy(http.URL{Scheme: "http", Host: "ml-api:3000"})
	// 	proxyHandler.ServeHTTP(c.Writer, c.Request)
	// })

	// Fallback for unknown routes
	router.NoRoute(func(c *gin.Context) {
		c.JSON(http.StatusNotFound, gin.H{"error": "Route not found"})
	})

	port := ":8081"
	fmt.Printf("Starting API Gateway on port %s...\n", port)
	if err := router.Run(port); err != nil {
		log.Fatal().Err(err).Msg("Failed to start API Gateway")
	}
}

// --- Handlers ---

func handleWorldIDAuth(c *gin.Context) {
	var req WorldIDAuthRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// TODO: Integrate with actual World ID verification logic
	// This would involve verifying the proof with the World ID service
	// For now, we'll mock a successful verification
	log.Info().Str("proof", req.Proof).Str("action", req.Action).Msg("World ID auth request received")

	if req.Action != "verify" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid action"})
		return
	}

	// Mock verification - replace with actual verification
	// Example: verified, nullifierHash, err := worldClient.VerifyProof(req.Proof)
	// if err != nil { ... }
	// if !verified { ... }

	// Simulating a successful verification
	// In a real scenario, the nullifierHash would be used to identify/retrieve the user
	mockUserID := fmt.Sprintf("worldid-%s", req.Proof[:10]) // Truncated proof for mock ID

	response := WorldIDAuthResponse{
		Success: true,
		Message: "World ID verification successful",
		UserID:  mockUserID,
	}

	c.JSON(http.StatusOK, response)
}

func handleWalletAuth(c *gin.Context) {
	var req WalletAuthRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	log.Info().
		Str("address", req.Address).
		Str("message", req.Message).
		Str("signature", req.Signature).
		Msg("Wallet auth request received")

	// TODO: Implement actual wallet signature verification logic
	// This would involve:
	// 1. Recovering the public key from the signature and message.
	// 2. Comparing the recovered address with the provided address.
	// 3. Checking if the address owns the required NFT (if applicable).

	// Mock verification
	// Example:
	// recoveredAddress, err := VerifySignature(req.Message, req.Signature)
	// if err != nil { ... }
	// if recoveredAddress != req.Address { ... }
	// nftOwned, err := CheckNFTOwnership(req.Address)
	// if err != nil { ... }
	// if !nftOwned { ... }

	// Simulating successful verification and user creation/retrieval
	mockUserID := fmt.Sprintf("wallet-%s", req.Address[:10]) // Truncated address for mock ID
	mockToken := "mock-jwt-token-" + mockUserID              // In a real app, this would be a signed JWT

	response := WalletAuthResponse{
		Success: true,
		Message: "Wallet authentication successful",
		UserID:  mockUserID,
		Token:   mockToken,
	}

	c.JSON(http.StatusOK, response)
}

func handleGetSession(c *gin.Context) {
	userID, _ := c.Get("userID")
	c.JSON(http.StatusOK, gin.H{"userID": userID, "message": "Session active (mock)"})
}

func handleGetUserProfile(c *gin.Context) {
	userID, _ := c.Get("userID")
	log.Info().Str("userID", userID.(string)).Msg("Get user profile request received")

	// TODO: Fetch user profile from the database
	// Example: profile, err := db.GetUserProfile(userID.(string))
	// if err != nil { ... }

	// Mock user profile data
	mockProfile := UserProfile{
		UserID:       userID.(string),
		Handle:       "mockuser",
		DisplayName:  "Mock User",
		Bio:          strPtr("This is a mock bio."),
		ProfileImage: strPtr("https://example.com/mock-image.jpg"),
		Vibe:         "Wicked",
		Tags:         []string{"music", "tech", "travel"},
		NFTVerified:  true,
		CreatedAt:    time.Now().Add(-24 * time.Hour * 7), // 1 week ago
		LastSeen:     time.Now().Add(-5 * time.Minute),    // 5 minutes ago
	}

	c.JSON(http.StatusOK, gin.H{"profile": mockProfile})
}

func handleUpdateUserProfile(c *gin.Context) {
	userID, _ := c.Get("userID")
	log.Info().Str("userID", userID.(string)).Msg("Update user profile request received")

	var updates map[string]interface{}
	if err := c.ShouldBindJSON(&updates); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// TODO: Update user profile in the database
	// Example: err := db.UpdateUserProfile(userID.(string), updates)
	// if err != nil { ... }

	// For now, just acknowledge the request
	c.JSON(http.StatusOK, gin.H{"message": "Profile update not yet implemented, but request received", "updates": updates})
}

// Helper function to return a string pointer
func strPtr(s string) *string {
	return &s
}

func handleGetDiscoveryProfiles(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"profiles": []gin.H{{"id": "user1", "name": "Mock User 1"}, {"id": "user2", "name": "Mock User 2"}}})
}

func handleSendSignal(c *gin.Context) {
	userID, _ := c.Get("userID")
	var req SignalRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	log.Info().
		Str("fromUserID", userID.(string)).
		Str("toUserID", req.ToUserID).
		Str("type", req.Type).
		Str("message", func() string {
			if req.Message != nil {
				return *req.Message
			}
			return ""
		}()).
		Msg("Send signal request received")

	// TODO: Validate signal type
	if req.Type != "interest" && req.Type != "super_interest" && req.Type != "pass" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid signal type"})
		return
	}

	// TODO: Check if users can interact (e.g., not already matched, not self)
	// TODO: Check rate limits for sending signals

	// TODO: Store the signal in the database
	// Example: signalID, err := db.CreateSignal(userID.(string), req.ToUserID, req.Type, req.Message)
	// if err != nil { ... }

	// Mock signal ID
	mockSignalID := fmt.Sprintf("signal-%s-%d", userID.(string)[:8], time.Now().Unix())

	// TODO: Check for reciprocal signal (match creation logic)
	// Example: isMatch, otherUserID, err := db.CheckForMatch(userID.(string), req.ToUserID, req.Type)
	// if isMatch { ... }

	response := SignalResponse{
		Success:  true,
		Message:  "Signal sent successfully",
		SignalID: mockSignalID,
	}

	c.JSON(http.StatusOK, response)
}

func handleGetReceivedSignals(c *gin.Context) {
	userID, _ := c.Get("userID")
	log.Info().Str("userID", userID.(string)).Msg("Get received signals request received")

	// TODO: Fetch received signals from the database, potentially paginated
	// Example: signals, err := db.GetReceivedSignals(userID.(string), limit, offset)
	// if err != nil { ... }

	// Mock received signals data
	mockSignals := []ReceivedSignal{
		{
			SignalID:   "signal-abc123",
			FromUserID: "user1",
			FromHandle: "user_one",
			Type:       "interest",
			Message:    strPtr("Hey, you seem interesting!"),
			SentAt:     time.Now().Add(-2 * time.Hour),
		},
		{
			SignalID:   "signal-def456",
			FromUserID: "user2",
			FromHandle: "user_two",
			Type:       "super_interest",
			SentAt:     time.Now().Add(-30 * time.Minute),
		},
	}

	c.JSON(http.StatusOK, gin.H{"signals": mockSignals})
}

func handleGetMatches(c *gin.Context) {
	userID, _ := c.Get("userID")
	log.Info().Str("userID", userID.(string)).Msg("Get matches request received")

	// TODO: Fetch matches for the user from the database
	// This should typically include the other user's details and match timestamp.
	// Example: matches, err := db.GetUserMatches(userID.(string))
	// if err != nil { ... }

	// Mock matches data
	// Assuming userID is "mock-user-id-123", we create matches with other users
	mockMatches := []Match{
		{
			MatchID:      "match-xyz789",
			MatchedAt:    time.Now().Add(-24 * time.Hour),
			LastActivity: time.Now().Add(-1 * time.Hour),
			Status:       "active",
			User1: MatchedUser{
				UserID:       "mock-user-id-123", // Current user
				Handle:       "mockuser",
				DisplayName:  "Mock User",
				ProfileImage: strPtr("https://example.com/mock-image.jpg"),
				LastSeen:     time.Now().Add(-5 * time.Minute),
			},
			User2: MatchedUser{
				UserID:       "user1",
				Handle:       "user_one",
				DisplayName:  "User One",
				ProfileImage: strPtr("https://example.com/user1-image.jpg"),
				LastSeen:     time.Now().Add(-10 * time.Minute),
			},
		},
		{
			MatchID:      "match-abc123",
			MatchedAt:    time.Now().Add(-3 * 24 * time.Hour), // 3 days ago
			LastActivity: time.Now().Add(-6 * time.Hour),
			Status:       "active",
			User1: MatchedUser{
				UserID:       "mock-user-id-123", // Current user
				Handle:       "mockuser",
				DisplayName:  "Mock User",
				ProfileImage: strPtr("https://example.com/mock-image.jpg"),
				LastSeen:     time.Now().Add(-5 * time.Minute),
			},
			User2: MatchedUser{
				UserID:       "user2",
				Handle:       "user_two",
				DisplayName:  "User Two",
				ProfileImage: strPtr("https://example.com/user2-image.jpg"),
				LastSeen:     time.Now().Add(-30 * time.Minute),
			},
		},
	}

	c.JSON(http.StatusOK, gin.H{"matches": mockMatches})
}
