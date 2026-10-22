import React from "react";
import { createRoot } from "react-dom/client";
import { VideoPlayer } from "./components/player/VideoPlayer";
export function mount() {
  document.body.innerHTML = '<div id="player-check"></div>';
  const element = document.getElementById("player-check");
  if (!element) return;
  createRoot(element).render(<div className="admin-theme p-5"><div className="mx-auto max-w-3xl"><VideoPlayer title="Preview check" getSource={async () => ({ url: "/check.mp4", expiresAt: Date.now() + 900000 })} onProgress={() => {}} /></div></div>);
}