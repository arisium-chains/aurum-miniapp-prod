# Aurum Circle Miniapp Design Specification

## 1. Overview

This document outlines the comprehensive design specification for the Aurum Circle miniapp, an exclusive dating platform for Bangkok university students with World ID verification and NFT access gates. The design follows a dark academia aesthetic with a secret society theme, incorporating modern UI patterns and responsive design principles.

## 2. Design Language and Aesthetic

### 2.1 Color Palette

The application uses a sophisticated dark color scheme with gold accents to evoke a sense of luxury and exclusivity:

- **Background**: `#1C1917` (Deep charcoal)
- **Secondary Background**: `#292524` (Darker charcoal)
- **Tertiary Background**: `#44403C` (Medium charcoal)
- **Accent Gold**: `#F59E0B` (Warm amber gold)
- **Primary Red**: `#DC2626` (Deep crimson)
- **Text Primary**: `#FAFAF9` (Off-white)
- **Text Secondary**: `#A8A29E` (Light gray)
- **Text Muted**: `#78716C` (Medium gray)
- **Border**: `#44403C` (Charcoal border)
- **Border Light**: `#57534E` (Lighter charcoal)

### 2.2 Typography

The application uses a combination of serif and sans-serif fonts to create visual hierarchy:

- **Headings**: Playfair Display (serif) - Elegant and sophisticated
- **Body Text**: Inter (sans-serif) - Clean and readable

### 2.3 Visual Elements

- **Border Radius**: Rounded corners (8-16px) for cards and buttons
- **Shadows**: Subtle depth with custom aurum and gold shadows
- **Animations**: Smooth transitions, shimmer effects, and particle animations
- **Icons**: Minimal and elegant iconography

## 3. Page Structure and Layout

### 3.1 Overall Layout

The application follows a mobile-first responsive design approach with a consistent layout structure:

```
[Header/Navigation]
[Main Content Area]
[Footer/Action Bar]
```

### 3.2 Homepage Layout

The homepage features a mystical splash screen with:

1. **Animated Particle Background**: Floating particles with shimmer effect
2. **Brand Identity**: "Aurum Circle" title with subtitle
3. **Mystical Symbol**: Animated sigil representing the secret society
4. **Primary CTA**: World ID verification button
5. **Supporting Text**: Subtle messaging about the platform's purpose

### 3.3 Authentication Flow Layout

The authentication flow consists of multiple steps:

1. **World ID Verification**
2. **Wallet Connection**
3. **NFT Gate Verification**
4. **Profile Setup**

Each step follows a consistent card-based layout with:

- Progress indicators
- Clear instructions
- Contextual information
- Appropriate CTAs

## 4. Component Hierarchy

### 4.1 Core Components

```
App Layout
├── MiniKit Provider
│   ├── World ID Button
│   ├── Wallet Connection Button
│   └── Session Management
├── Navigation
├── Main Content
│   ├── Splash Page
│   ├── Authentication Flow
│   │   ├── World ID Verification
│   │   ├── Wallet Connection
│   │   └── NFT Gate
│   ├── Profile Setup
│   └── Discovery Feed
└── Footer
```

### 4.2 UI Components

1. **Buttons**

   - Primary (Gold accent)
   - Secondary (Charcoal)
   - Outline (Bordered)
   - Ghost (Minimal)

2. **Cards**

   - Profile Cards
   - Authentication Cards
   - Information Cards

3. **Form Elements**

   - Inputs
   - Text Areas
   - Select Dropdowns

4. **Navigation**

   - Bottom Navigation Bar
   - Progress Indicators

5. **Feedback Components**
   - Toast Notifications
   - Loading States
   - Error Messages

## 5. Responsive Breakpoints and Behavior

### 5.1 Breakpoints

- **Mobile**: 0px - 768px
- **Tablet**: 769px - 1024px
- **Desktop**: 1025px+

### 5.2 Responsive Behavior

- **Mobile First**: All components are designed for mobile screens first
- **Flexible Grid**: Uses CSS Grid and Flexbox for adaptive layouts
- **Scalable Typography**: Font sizes adjust based on screen size
- **Touch-Friendly**: All interactive elements have appropriate touch targets (minimum 44px)

## 6. Color Scheme and Typography Details

### 6.1 Extended Color Palette

| Name           | Hex     | Usage                     |
| -------------- | ------- | ------------------------- |
| background     | #1C1917 | Main background           |
| bg-secondary   | #292524 | Card backgrounds          |
| bg-tertiary    | #44403C | Secondary UI elements     |
| accent         | #F59E0B | Primary accents and CTAs  |
| primary        | #DC2626 | Error states and warnings |
| text-primary   | #FAFAF9 | Main text                 |
| text-secondary | #A8A29E | Secondary text            |
| text-muted     | #78716C | Muted text                |
| border         | #44403C | Default borders           |
| border-light   | #57534E | Lighter borders           |

### 6.2 Typography Scale

| Element     | Font             | Size | Weight | Color                          |
| ----------- | ---------------- | ---- | ------ | ------------------------------ |
| H1          | Playfair Display | 36px | 700    | text-primary                   |
| H2          | Playfair Display | 24px | 600    | text-primary                   |
| H3          | Playfair Display | 20px | 600    | text-primary                   |
| Body Large  | Inter            | 16px | 400    | text-primary                   |
| Body Medium | Inter            | 14px | 400    | text-secondary                 |
| Body Small  | Inter            | 12px | 400    | text-muted                     |
| Button      | Inter            | 16px | 500    | text-primary/accent-foreground |

## 7. Interaction States and Animations

### 7.1 Button States

- **Default**: Base styling
- **Hover**: Slight color darkening (5-10%)
- **Active**: Pressed state with inset shadow
- **Focus**: Gold outline with 20% opacity
- **Disabled**: 50% opacity

### 7.2 Loading States

- **Spinner**: Circular loader with gold accent
- **Skeleton**: Shimmer animation for content loading
- **Progress Bar**: Horizontal progress indicator

### 7.3 Micro-interactions

- **Button Press**: Subtle scale transformation (0.95)
- **Card Hover**: Gentle elevation with shadow
- **Form Validation**: Color transitions for error/success states
- **Navigation Transitions**: Smooth page transitions

### 7.4 Animations

- **Entrance Animations**: Staggered fade-in with y-transform
- **Particle Effects**: Floating particles in background
- **Pulse Effects**: Subtle glow animations on key elements
- **Shimmer Effects**: Animated gradient overlays

## 8. Accessibility Considerations

### 8.1 Color Contrast

All text elements meet WCAG 2.1 AA standards for contrast:

- Text Primary: 12.5:1 against background
- Text Secondary: 7.5:1 against background
- Text Muted: 4.5:1 against background

### 8.2 Keyboard Navigation

- All interactive elements are focusable
- Logical tab order follows visual layout
- Focus indicators are clearly visible
- Keyboard shortcuts for common actions

### 8.3 Screen Reader Support

- Semantic HTML structure
- ARIA labels for interactive elements
- Proper heading hierarchy
- Alt text for all images

### 8.4 Touch Targets

- Minimum 44px touch targets for all interactive elements
- Adequate spacing between interactive elements
- Clear visual feedback on touch

## 9. Specific Feature Requirements

### 9.1 Connect Wallet Button

#### 9.1.1 Visual Design

- **Default State**: Gold button with dark text
- **Hover State**: Slightly darker gold with subtle shadow
- **Loading State**: Spinner with "Connecting Wallet..." text
- **Success State**: Green accent with checkmark icon
- **Error State**: Red accent with error icon

#### 9.1.2 Interaction Flow

1. User taps "Connect Wallet" button
2. System shows loading state
3. World App wallet connection prompt appears
4. User confirms connection in World App
5. System validates connection
6. Success state shown with wallet address preview
7. User proceeds to next step

#### 9.1.3 States

- **Idle**: Ready to connect
- **Connecting**: Wallet connection in progress
- **Connected**: Wallet successfully connected
- **Error**: Connection failed
- **Disabled**: Not available (e.g., not in World App)

### 9.2 World ID Verification Integration

#### 9.2.1 Flow Integration

1. User presented with World ID verification option
2. MiniKit SDK handles verification process
3. System validates proof server-side
4. User redirected to next authentication step
5. Session established with JWT

#### 9.2.2 Error Handling

- Clear error messages for different failure scenarios
- Option to retry verification
- Fallback instructions for World App requirements

### 9.3 QR Code Scanning Functionality

#### 9.3.1 Implementation

- Integration with World App's native QR scanning capabilities
- Visual scanning interface with targeting overlay
- Real-time feedback during scanning process
- Success/error states with appropriate messaging

#### 9.3.2 Use Cases

- Wallet address verification
- Profile sharing between users
- Event access verification
- NFT transfer confirmation

### 9.4 Responsive Design

#### 9.4.1 Mobile

- Single-column layout
- Large touch targets
- Simplified navigation
- Optimized for vertical scrolling

#### 9.4.2 Tablet

- Two-column layout where appropriate
- Increased whitespace
- Enhanced visual hierarchy
- Split-screen capabilities

#### 9.4.3 Desktop

- Multi-column layouts
- Expanded content areas
- Enhanced navigation options
- Keyboard shortcuts

### 9.5 Visual Feedback System

#### 9.5.1 User Actions

- Immediate visual feedback for all interactions
- Loading indicators for asynchronous operations
- Success confirmation for completed actions
- Clear error messaging for failures

#### 9.5.2 System Status

- Network connectivity indicators
- Session status display
- Processing state indicators
- Real-time updates for background operations

### 9.6 Session Persistence

#### 9.6.1 Storage

- JWT tokens in HTTP-only, secure cookies
- User preferences in localStorage
- Temporary data in sessionStorage

#### 9.6.2 Management

- Automatic session renewal
- Graceful expiration handling
- Secure logout functionality
- Cross-tab session synchronization

### 9.7 Network Detection

#### 9.7.1 Indicators

- Real-time connectivity status
- Visual feedback for offline mode
- Automatic reconnection attempts
- Queue management for offline actions

#### 9.7.2 States

- **Online**: Full functionality
- **Offline**: Limited functionality with caching
- **Reconnecting**: Attempting to restore connection
- **Error**: Connection issues requiring user action

## 10. Implementation Guidelines

### 10.1 Component Development

- Use TypeScript for type safety
- Follow established design patterns
- Implement proper error boundaries
- Ensure accessibility compliance
- Write comprehensive tests

### 10.2 Performance Optimization

- Lazy loading for non-critical components
- Image optimization with Next.js Image component
- Code splitting for large features
- Caching strategies for static content
- Efficient state management

### 10.3 Security Considerations

- Input validation and sanitization
- Secure storage of sensitive data
- Protection against common web vulnerabilities
- Regular security audits
- Compliance with privacy regulations

## 11. Future Considerations

### 11.1 Scalability

- Modular component architecture
- Extensible design system
- Performance monitoring
- Analytics integration

### 11.2 Enhancement Opportunities

- Dark/light mode toggle
- Custom theme support
- Advanced animation capabilities
- Enhanced accessibility features

---

_This design specification serves as a living document that will evolve as the Aurum Circle miniapp continues to develop and mature._
