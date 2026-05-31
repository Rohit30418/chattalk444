# Production notes for this updated src

This src zip keeps your existing paths to avoid breaking the app, but includes key launch fixes:

- Chat UI replaced with compact fixed premium chat.
- Pre-join UI replaced with clean compact version.
- Route aliases fixed: `/rooms`, `/room/:id`, `/profile/:userId`.
- Room creation now navigates to lowercase `/room/:id`.
- Room hangup now navigates to `/rooms`.
- Direct room refresh now has a fallback if dashboard memory is empty.
- Old Firestore `DeleteRoom` cleanup has been removed from `App.jsx` render because rooms are Mongo/socket based.

Backend reminders before launch:

- Add `GET /api/rooms/:id` for direct room refresh.
- Add `delete-message` socket handler if you want delete to sync for everyone.
- Add server-side auth and host validation for all admin socket events.
- Move image upload to Cloudinary/S3/Firebase Storage before public launch.
- PeerJS mesh is okay for beta; use LiveKit/mediasoup for real scale.
