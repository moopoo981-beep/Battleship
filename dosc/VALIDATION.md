# Validation — IRON TIDE v2.0

Verified 2026-09-09. No external service was deployed as part of this release.

## Automated checks

- 28 engine tests: 36-cell map and five hulls; one controlled ship and AI roster; distinct co-op owners; pause; inertia and throttle; steering/roll; island collision; turret alignment/range; ballistic shell travel; lock acquisition/capacity/visibility; accelerating guided missiles; torpedoes and unsupported hulls; alien jump; death cleanup including final kill; interception; repair; anchor boost; AI autonomy; escort/dome objectives; shop prices/caps; deployed upgrade stats; reward deduplication; save round trip and invalid-save rejection; filtered multiplayer snapshots; grid conversion.
- 3 renderer tests: finite geometry in all missions/effect states; projection and picking agreement in all three camera modes; non-throwing failure when WebGL is unavailable.
- 4 server/network tests, using actual local HTTP connections and SSE streams: room creation/listing/privacy; maximum four members; authenticated commands and readiness; two clients sharing one simulation while controlling separate ships; clamped inputs; host-only pause; mid-battle join rejection; disconnect takeover by AI and return to the same ship; shared results; loadout changes after a match applied in the next round; host transfer; CORS; the packaged RoomClient parsing live SSE and submitting commands.
- Six campaign simulations: all three missions won in easy and normal modes, seed 427. The script controls only the owned ship with ordinary actions and visible sensor contacts; allied AI is autonomous. This tests reachability, not human difficulty or typical play duration.
- Four GLSL shaders compiled and both graphics programs linked in a native EGL/OpenGL ES context. Shader interfaces use matching uniform precision.
- JavaScript syntax and generated standalone script syntax checked. Offline entrypoint embeds all six scripts plus its stylesheet. Release archive includes frontend, backend, GitHub workflow, launch script, docs and tests; its CRC integrity is checked during build.

Total Node tests: **35**. Campaign and native shader checks are additional to that count.

## What was not tested

No interactive browser run, browser automation, screenshot/visual review, or physical-device playtest was performed. Renderer checks inspect geometry/math and native shader compilation; they do not establish appearance or frame rate on a particular browser or GPU.

Actual multiplayer integration was tested on local HTTP/SSE connections with two simultaneous clients. Room capacity of four is verified, but four-human gameplay, WAN latency, third-party hosting, HTTPS termination, proxy buffering, many-room load and provider restarts have not been end-to-end tested.

The campaign script can react more quickly than a human. No completion time from it should be treated as a normal player estimate. Hard-mode balance was not established by the easy/normal campaign simulations.

## Practical limits

This is a playable prototype with original procedural models and synthesized audio. Ship movement, collisions, buoyancy, guidance and ballistics are game approximations, not a naval engineering model. Graphics are not photorealistic movie assets.

GitHub Pages hosts static game files; the supplied room server must be run separately on an HTTPS-capable host for internet co-op, or it can serve both frontend and backend itself. No hosted backend URL is included.

Rooms exist only in the Node process memory. A server restart removes rooms. The backend should run as one instance unless shared state/routing is implemented. The default MAX_ROOMS=24 is an admission limit, not a tested hardware capacity.

The server owns combat state and binds commands to each member's ship. Hull/upgrades are bounded inputs from the player's local profile. Credits/ownership are not authenticated online account data and can be edited by a user; this is casual co-op, not a competitive economy.

JSON v2 backup export/import is available; v1 saves are unsupported. Browser local file storage behavior varies, so download a backup before moving files, changing browsers/domains or clearing data. If WebGL is unavailable, the tactical map and controls remain available.

## Reproduce

With Node.js 20 or later, from the extracted IRON_TIDE folder:

```sh
npm test
npm run test:campaign
```

Native shader compilation is an optional development check requiring Python 3, Linux EGL and GLESv2 libraries (not required to play):

```sh
python3 tests/check_shaders.py
```

Build the standalone game, manuals and ZIP:

```sh
python3 tools/build_release.py
```

Playing START_GAME.html offline requires neither Node.js nor Python. Running server/server.cjs requires Node.js but no third-party packages. No browser QA tool is needed for the checks listed above.
