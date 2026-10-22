import { createFileRoute } from "@tanstack/react-router";
import { VideoPlayer } from "@/components/player/VideoPlayer";
export const Route = createFileRoute("/player-check")({ component: () => (
  <div className="p-2"><VideoPlayer title="Check" getSource={async () => ({ url: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4", expiresAt: Date.now() + 3600_000 })} onProgress={() => {}} /></div>
) });
