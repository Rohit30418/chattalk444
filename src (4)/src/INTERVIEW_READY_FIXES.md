# Interview-readiness fixes applied

## Frontend

- Fixed Redux `togglePopup` bug so it updates the correct state key.
- Migrated store setup from `createStore` to `configureStore`.
- Added `resetRoomUiState` to reset room UI, chat sidebar, media preferences, and pre-join state.
- Fixed pre-join flow: every new `/room/:id` visit now starts on `ScreenBeforeJoin`.
- Added route protection for `/room/:id`; unauthenticated users are redirected to `/rooms`.
- Added direct room fetch fallback via `GET /api/rooms/:roomId` so refresh/direct links do not get stuck.
- Added room-unavailable UI for invalid/deleted room IDs.
- Improved join flow errors so room full/auth/server errors are shown to users.
- Standardized important API calls through `services/api.js` with timeout and auth header support.
- Rewrote the outdated Firebase Storage upload hook to the modular SDK.
- Removed dead commented code from `FriendsSidebar.jsx`.
- Reset room UI on hangup, room close, kick, and room route unmount.

## Backend

- Added security headers.
- Added REST rate limiting.
- Hardened CORS defaults for development and production.
- Added required UID validation to room join endpoint.
- Added/kept direct room fetch endpoint for page refresh/direct links.
- Synced joining users into the user collection if missing.
- Added socket `room-created` sync handler.
- Fixed message delete safety so unknown DB messages cannot be deleted by anyone unless host/owner proof exists.
- Added API 404 and global error handlers.
- Cleaned the modular `routes/roomRoutes.js` and removed the duplicate wrong `models/routes` folder.

## Remaining production upgrades

- Add real JWT/Firebase token verification middleware on backend.
- Move image files to Cloudinary/S3/Firebase Storage and store only `imageUrl` in MongoDB.
- Move WebRTC media from PeerJS mesh to an SFU such as LiveKit or mediasoup for larger rooms.
- Add unit and E2E tests.
