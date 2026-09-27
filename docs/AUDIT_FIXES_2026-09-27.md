# Audit fixes — 27 September 2026

## Behavior

- Screen capture starts once from the click gesture. A unique request ID matches server approval/denial; no stream is broadcast before approval. Cancellation, timeout and unmount stop pending or acquired streams.
- Missing-camera/microphone fallback is supported in-room. Stale device-acquisition results are stopped. Room admission waits for local media readiness and avoids repeated join events on mute toggles.
- Connection cleanup resolves actual peer IDs and closes channels on leave; pending socket handshakes are cancelled at logout.
- Profile sync/refresh responses cannot overwrite a newer auth session or resurrect signed-out UI.
- Room and direct chats load the latest page first and expose Load earlier messages. Stable message merging retains live messages that arrive during history loading.
- Homepage and public-room listings use actual room data, without hardcoded demo participants. The custom room hook is named useRoomData.
- Removed six unused frontend dependencies, including Firebase Admin/Functions, and declared axios directly. Refreshed compatible dependencies and overrides undici within major 6 to its patched range.

## Validation

- Clean npm ci --ignore-scripts passed.
- npm test: 12 regression tests pass.
- npm run build: passed. Large chunk warnings remain. The missing local background asset was retrieved from the deployed asset URL and verified against its exact GitHub blob hash before building; no substitute asset was used. Public media assets not imported by the compiler were not all downloaded locally.
- React controller render smoke check passed.
- Production dependency audit: 2 moderate findings (React Router packages), zero high/critical. The existing Router 6 API was retained; Router major migration remains separate. Development toolchain advisories also need a planned upgrade.
- Full npm run lint remains failing on legacy prop-types, unused variables, empty catches, display names and hook-dependency warnings. The existing command/rules remain; these failures were not suppressed to create a green result.
- Added a CI workflow for clean install, regression tests and production build.

The tests exercise screen/media helpers and the actual auth callback with controlled asynchronous I/O. They do not replace two-user browser/media tests. No production credentials or user data were used.

## Rollout

Deploy the companion backend fix first: it echoes screen-share request IDs and provides cursor pagination. Then deploy this frontend. Close/rejoin existing rooms after deployment. The old backend does not echo approval request IDs, so do not deploy this frontend first.

Before merging/deploying, test two signed-in users on separate networks: camera/mic permissions, mic-only hardware, screen chooser cancel, double-click sharing, simultaneous sharing, reconnect, reload, logout/account switch, chat pagination, mobile layout and background push. These physical-device/authenticated flows remain unverified here. This PR does not claim the app is bug-free.
