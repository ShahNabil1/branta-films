import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AdminEpisodeVideo } from "./components/admin/AdminEpisodeVideo";
import { Button } from "./components/ui/button";
export function mount() {
  const qc = new QueryClient();
  function Fixture() {
    const [editing, setEditing] = useState(false);
    return <div className="admin-theme light mx-auto max-w-3xl space-y-4 bg-background p-6 text-foreground"><Button onClick={() => setEditing(true)}>Edit</Button><AdminEpisodeVideo episodeId="22222222-2222-4222-8222-000000000101" title="Duration check" thumbnail={null} editing={editing} busy={false} onUpload={async file => { document.body.dataset.uploaded = file?.name ?? ""; }} /></div>;
  }
  createRoot(document.body.appendChild(document.createElement("div"))).render(<QueryClientProvider client={qc}><Fixture /></QueryClientProvider>);
}