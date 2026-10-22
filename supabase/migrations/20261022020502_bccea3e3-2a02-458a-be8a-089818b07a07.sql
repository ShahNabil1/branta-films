CREATE TABLE public.video_cleanup_queue (
 video_key text PRIMARY KEY,
 attempts integer NOT NULL DEFAULT 0,
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.video_cleanup_queue TO service_role;
ALTER TABLE public.video_cleanup_queue ENABLE ROW LEVEL SECURITY;
CREATE OR REPLACE FUNCTION public.queue_removed_episode_video() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
 IF TG_OP = 'DELETE' OR OLD.video_key IS DISTINCT FROM NEW.video_key THEN
  INSERT INTO public.video_cleanup_queue(video_key) VALUES (OLD.video_key)
  ON CONFLICT(video_key) DO UPDATE SET updated_at = now();
 END IF;
 IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
 RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.queue_removed_episode_video() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER queue_removed_episode_video AFTER UPDATE OR DELETE ON public.episode_media FOR EACH ROW EXECUTE FUNCTION public.queue_removed_episode_video();
CREATE OR REPLACE FUNCTION public.touch_video_cleanup_queue() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;
CREATE TRIGGER touch_video_cleanup_queue BEFORE UPDATE ON public.video_cleanup_queue FOR EACH ROW EXECUTE FUNCTION public.touch_video_cleanup_queue();
REVOKE ALL ON FUNCTION public.touch_video_cleanup_queue() FROM PUBLIC, anon, authenticated;