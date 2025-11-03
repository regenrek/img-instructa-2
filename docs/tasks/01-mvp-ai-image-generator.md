# MVP: AI Image Generator + Video (Production Plan)

> Build a production-ready AI image editor matching the provided flows: generate image → optional generate video → success and error states, with robust server-first architecture (TanStack Start), secure FAL integrations, and test coverage.

---

## Models & Endpoints (reference)

- [ ] HiDream I1 Fast (text-to-image)
  - Endpoint: `https://fal.run/fal-ai/hidream-i1-fast`
  - Subscribe ID: `fal-ai/hidream-i1-fast`
  - Inputs: `prompt` (req), `negative_prompt?`, `image_size? {width,height}`, `num_inference_steps?`, `seed?`, `sync_mode?`, `num_images?`, `enable_safety_checker?`, `output_format? ('jpeg'|'png')`
  - Output: `{ images: [{ url, content_type }], prompt, seed, has_nsfw_concepts[], timings }`
- [ ] MiniMax Hailuo 2.3 Fast (image-to-video)
  - Endpoint: `https://fal.run/fal-ai/minimax/hailuo-2.3-fast/standard/image-to-video`
  - Subscribe ID: `fal-ai/minimax/hailuo-2.3-fast/standard/image-to-video`
  - Inputs: `prompt` (req), `image_url` (req), `prompt_optimizer? (true)`, `duration? ('6'|'10')`
  - Output: `{ video: { url } }`

---

## Scope & UX (based on screenshot)

- [ ] Single-session flow with three primary screens: New, ImageGeneratedSuccess, VideoGeneratedSuccess
- [ ] Two error states: ImageGeneratedError, VideoGeneratedError
- [ ] Controls: prompt box, Generate button, after success show “Generate Video”, “Download Video”, “Start a new session”
- [ ] Image placeholder, progress and logs during generation, NSFW/validation messaging
- [ ] Keyboard shortcuts: Cmd/Ctrl+Enter to generate, Esc to clear modal dialogs

---

## Environment & Secrets

- [ ] Add `FAL_KEY` to `.env.example` (never commit real keys)
- [ ] Extend `src/env/server.ts` to validate `FAL_KEY` (zod) and export strongly typed accessors
- [ ] Confirm server-only usage of `FAL_KEY` (no exposure to client)

---

## Dependencies

- [ ] Add `@fal-ai/client` (server usage)
- [ ] Add `zod` for schema validation (if not already)
- [ ] Ensure `pnpm` lock integrity and scripts updated

---

## Architecture (TanStack Start rules)

- [ ] Fetch via route loaders/server functions; avoid `useEffect` for data fetching
- [ ] Mutations done in server functions, then `router.invalidate()` as needed
- [ ] Use typed search params for UI state (e.g., selected size, duration)
- [ ] Keep ephemeral UI/session in Zustand if needed; never mirror server data
- [ ] Hydration-safe updates (wrap sync updates that may suspend with `startTransition`)

---

## Routes & Navigation

- [ ] Create `routes/(app)/image-gen/route.tsx` (layout shell, SEO, breadcrumbs)
- [ ] Create `routes/(app)/image-gen/index.tsx` (New → main experience)
- [ ] Support search params: `size`, `steps`, `duration`, `seed`, `format`
- [ ] Implement loader to hydrate any prior session data (if present)

---

## Server Functions (FAL integrations)

- [ ] `src/server/function/aiImage.generate.ts` (HiDream)
  - [ ] Input schema (zod) mirroring model inputs; enforce sane defaults
  - [ ] Implementation using `fal.subscribe('fal-ai/hidream-i1-fast', { input, logs: true })`
  - [ ] Stream queue logs to client via event stream; return final payload `{ images[], seed, prompt }`
  - [ ] Handle `sync_mode` path for simpler latency tradeoff (configurable)
  - [ ] Normalize and persist minimal audit log (server-only)
- [ ] `src/server/function/aiVideo.generate.ts` (MiniMax I2V)
  - [ ] Input schema requiring `prompt` + `image_url`
  - [ ] Implementation using `fal.subscribe('fal-ai/minimax/hailuo-2.3-fast/standard/image-to-video', { input, logs: true })`
  - [ ] Stream progress/logs; return `{ video: { url } }`
  - [ ] Guardrails: reject non-HTTPS URLs; ensure URL is from our CDN bucket if applicable
- [ ] Shared utilities
  - [ ] `~/lib/fal.ts`: client init, common subscribe wrapper, queue → progress mapping
  - [ ] `~/lib/types/fal.ts`: TypeScript models for inputs/outputs
  - [ ] `~/lib/errors.ts`: typed errors (validation, nsfw, rate-limit, upstream)

---

## UI Components

- [ ] `ImagePromptForm` (prompt, negative prompt, size, steps, seed, format)
- [ ] `GenerationProgress` (streamed logs, ETA, statuses)
- [ ] `GeneratedImageCard` (image display, seed, download, copy URL)
- [ ] `GenerateVideoCTA` (enabled after image success)
- [ ] `GeneratedVideoCard` (video player, download MP4, copy URL)
- [ ] `ErrorCallout` (friendly error text with retry)
- [ ] Utilize existing shadcn UI primitives in `src/components/ui`

---

## Editor (MVP scope)

- [ ] Canvas with zoom/pan and crop; export cropped image blob
- [ ] Simple prompt refinements (append/prepend templates, e.g., “medieval kingdom style”)
- [ ] Seed lock & regenerate variations
- [ ] Basic image metadata banner (size, format, seed, steps)

---

## Data & Caching

- [ ] No server DB for MVP; keep session artifacts client-side (localStorage) with opt-in clear
- [ ] Optional CDN pass-through: download via signed URL if we later proxy
- [ ] TanStack Query for request lifecycle and cache invalidation

---

## Validation & Safety

- [ ] Validate inputs with zod on server and client
- [ ] Respect `enable_safety_checker` (default true) for image gen
- [ ] Display NSFW flags; block video generation if NSFW detected

---

## Error Handling

- [ ] Map upstream errors to user-friendly codes/messages
- [ ] Distinct error UIs for image vs video (retry, edit prompt, back)
- [ ] Timeouts and cancellation (AbortController from client → server function)

---

## Downloads & Sharing

- [ ] Image: download button (uses `content_type` to set extension)
- [ ] Video: download button (MP4), open in new tab, copy URL
- [ ] “Start a new session” clears UI and local-only artifacts

---

## Accessibility & i18n

- [ ] Labels for inputs/buttons; ARIA for progress
- [ ] Keyboard navigation and focus order
- [ ] Copy-ready i18n strings with keys (even if en only)

---

## Analytics & Observability

- [ ] Add minimal event hooks (generate_image, generate_video, error)
- [ ] Server logs for upstream latency, queue times, failures

---

## Security & Compliance

- [ ] Server-only FAL calls; never expose `FAL_KEY`
- [ ] Rate limit by IP/session for server functions
- [ ] Input sanitation; restrict image_url host to our trusted domains when generating video

---

## Testing (vitest --run)

- [ ] Unit tests for zod schemas (valid/invalid cases)
- [ ] Unit tests for server functions (happy path, upstream error, timeout)
- [ ] Component tests for forms and success/error states
- [ ] Snapshot tests for major UI cards

---

## CI/CD & Tooling

- [ ] Lint/typecheck gates; vitest in CI
- [ ] Pre-push hook for typecheck/tests
- [ ] Build preview pipeline (no secrets exposed)

---

## Acceptance Criteria

- [ ] User can generate an image from prompt and see progress logs
- [ ] After success, user can generate a video from the image
- [ ] Distinct, helpful error states for image and video flows
- [ ] Downloads for image and video work reliably
- [ ] No secrets leak to client; all requests via server functions
- [ ] Tests pass with `vitest --run`

---

## Follow-ups (post-MVP, not required now)

- [ ] Inpainting/outpainting tools
- [ ] History and gallery
- [ ] User accounts and persistence
- [ ] Multi-model support (model selector)


