# Web3 Farcaster Integration Implementation Plan

- [x] 1. Set up environment configuration and feature flags
  - Create environment variable NEXT_PUBLIC_WEB3_MODE for toggling web3 functionality
  - Add configuration utilities to check web3 mode throughout the application
  - Implement feature flag system for conditional rendering of components
  - _Requirements: 1.1, 2.1, 4.1, 5.1_

- [x] 2. Implement platform filtering system
  - [x] 2.1 Modify PLATFORM_KEYS constant to be environment-dependent
    - Update stores/useSocialAccountStore.ts to filter platforms based on web3 mode
    - Update stores/useThreadChainStore.ts to use filtered platform keys
    - Ensure backward compatibility with existing non-web3 mode
    - _Requirements: 4.1, 4.2, 4.3_

  - [x] 2.2 Update social account components to show only Farcaster
    - Modify AccountSelectionModal in components/Sidebar.tsx to hide X and Threads options
    - Update platform display logic to show only Farcaster accounts
    - Remove connection buttons for non-Farcaster platforms in web3 mode
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [x] 3. Implement direct routing to topic-finder
  - [x] 3.1 Modify root page to redirect to topic-finder in web3 mode
    - Update app/[locale]/page.tsx to check web3 mode and redirect accordingly
    - Bypass HomeClient rendering when in web3 mode
    - Maintain existing landing page functionality for regular mode
    - _Requirements: 1.1, 1.2, 1.3_

  - [x] 3.2 Update middleware to redirect authenticated users to topic-finder
    - Modify middleware.ts to redirect to /contents/topic-finder instead of landing page
    - Ensure onboarding flow still works correctly in web3 mode
    - Update authentication success redirects
    - _Requirements: 1.1, 1.2, 1.3_

- [x] 4. Modify authentication system for Farcaster-only login
  - [x] 4.1 Update sign-in components to show only Farcaster authentication
    - Modify app/[locale]/(auth)/signin/SignInClient.tsx to hide email and Google options in web3 mode
    - Show only Farcaster QR code authentication interface
    - Update sign-in page layout for simplified authentication flow
    - _Requirements: 2.1, 2.2, 2.3_

  - [x] 4.2 Implement automatic Farcaster account linking after authentication
    - Update Farcaster authentication success handler to automatically add account to user's connected accounts
    - Set newly connected Farcaster account as default selected account
    - Ensure proper error handling for account linking failures
    - _Requirements: 3.1, 3.2, 3.3_

  - [ ]* 4.3 Update authentication configuration for web3 compatibility
    - Modify lib/auth/authOptions.ts to handle Farcaster-specific user data
    - Ensure NextAuth session management works with Farcaster authentication
    - Implement proper user profile creation for Farcaster users
    - _Requirements: 2.4, 2.5_

- [x] 5. Simplify navigation menu for web3 mode
  - [x] 5.1 Update sidebar navigation to hide statistics and comments menus
    - Modify navigation array in components/Sidebar.tsx to exclude statistics and comments in web3 mode
    - Maintain contents menu with topic-finder and draft sub-items
    - Keep schedule and settings menus visible
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

  - [x] 5.2 Update navigation component rendering logic
    - Implement conditional rendering based on web3 mode for menu items
    - Ensure proper navigation state management for simplified menu
    - Update navigation translations and labels as needed
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [ ] 6. Update account management interface
  - [ ] 6.1 Modify account selector to show only Farcaster accounts
    - Update account display logic in components/Sidebar.tsx
    - Remove platform icons and labels for non-Farcaster platforms
    - Ensure proper account selection state management
    - _Requirements: 4.1, 4.2, 4.3, 4.5_

  - [ ] 6.2 Update account connection flow for Farcaster-only mode
    - Modify account connection buttons to show only Farcaster option
    - Update account management modal to hide non-Farcaster platforms
    - Ensure proper error handling for Farcaster connection issues
    - _Requirements: 4.4, 4.5_

- [ ] 7. Implement web3 mode configuration utilities
  - [ ] 7.1 Create configuration helper functions
    - Add utility functions to check web3 mode status
    - Create platform filtering helpers for consistent behavior
    - Implement feature flag checking utilities
    - _Requirements: 1.1, 2.1, 4.1, 5.1_

  - [ ] 7.2 Update existing components to use web3 configuration
    - Integrate web3 mode checks throughout the application
    - Ensure consistent behavior across all components
    - Update component props and interfaces as needed
    - _Requirements: 1.1, 2.1, 4.1, 5.1_

- [ ]* 8. Add comprehensive testing for web3 functionality
  - [ ]* 8.1 Create unit tests for web3 mode functionality
    - Test platform filtering logic with web3 mode enabled/disabled
    - Test navigation menu rendering in different modes
    - Test authentication flow for Farcaster-only mode
    - _Requirements: 1.1, 2.1, 4.1, 5.1_

  - [ ]* 8.2 Create integration tests for complete user flows
    - Test end-to-end Farcaster authentication and account linking
    - Test content creation flow with Farcaster account in web3 mode
    - Test navigation and routing behavior in web3 mode
    - _Requirements: 1.1, 2.1, 3.1, 4.1, 5.1_

- [ ] 9. Validate and finalize web3 implementation
  - [ ] 9.1 Perform comprehensive testing of web3 mode
    - Test all major user flows in web3 mode
    - Verify backward compatibility with regular mode
    - Ensure proper error handling and edge cases
    - _Requirements: 1.1, 2.1, 3.1, 4.1, 5.1_

  - [ ] 9.2 Update documentation and configuration
    - Document web3 mode setup and configuration
    - Update environment variable documentation
    - Create deployment guidelines for web3 branch
    - _Requirements: 1.1, 2.1, 4.1, 5.1_