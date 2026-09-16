ALTER TABLE public.extraction_logs
  ADD COLUMN IF NOT EXISTS provider_used text,
  ADD COLUMN IF NOT EXISTS native_status text,
  ADD COLUMN IF NOT EXISTS fallback_attempted boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS fallback_status text,
  ADD COLUMN IF NOT EXISTS final_status text,
  ADD COLUMN IF NOT EXISTS confidence integer;

COMMENT ON COLUMN public.extraction_logs.provider_used IS
  'Final extraction provider path used for the user-visible result.';
COMMENT ON COLUMN public.extraction_logs.native_status IS
  'Status returned by the native WishList extraction provider.';
COMMENT ON COLUMN public.extraction_logs.fallback_attempted IS
  'Whether a browser-backed fallback provider was attempted.';
COMMENT ON COLUMN public.extraction_logs.fallback_status IS
  'Status returned by the fallback provider, when attempted.';
COMMENT ON COLUMN public.extraction_logs.final_status IS
  'Final merged extraction status returned to the application.';
COMMENT ON COLUMN public.extraction_logs.confidence IS
  'Final merged extraction confidence score.';
