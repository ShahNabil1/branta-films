import { useCallback, useEffect, useState } from "react";
import Cropper, { type Area } from "react-easy-crop";
import { Loader2, Maximize, Minimize, RotateCcw, RotateCw, ZoomIn, ZoomOut } from "lucide-react";
import { BrandedDialog } from "@/components/ui/branded-dialog";
import { Button } from "@/components/ui/button";
import { ARTWORK_SPECS, type ArtworkSlot } from "@/lib/artwork";
import { cn } from "@/lib/utils";

/** Crops, zooms and rotates an image, then exports it as WebP at the slot's exact recommended size. */
export function ImageCropDialog({ file, slot, onClose, onDone }: { file: File | null; slot: ArtworkSlot; onClose: () => void; onDone: (blob: Blob) => Promise<void> }) {
  const spec = ARTWORK_SPECS[slot];
  const [src, setSrc] = useState<string | null>(null);
  const [natural, setNatural] = useState<{ w: number; h: number } | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [fit, setFit] = useState<"cover" | "contain">("cover");
  const [area, setArea] = useState<Area | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setSrc(url); setCrop({ x: 0, y: 0 }); setZoom(1); setRotation(0); setFit("cover"); setNatural(null);
    const img = new Image(); img.onload = () => setNatural({ w: img.naturalWidth, h: img.naturalHeight }); img.src = url;
    return () => URL.revokeObjectURL(url);
  }, [file]);
  const onComplete = useCallback((_: Area, px: Area) => setArea(px), []);
  const minZoom = fit === "contain" ? 0.3 : 1;
  const lowRes = area ? area.width < spec.width * 0.75 : false;

  async function apply() {
    if (!src || !area) return;
    setBusy(true);
    try { await onDone(await render(src, area, rotation, spec.width, spec.height)); }
    finally { setBusy(false); }
  }

  return <BrandedDialog open={Boolean(file)} onClose={() => !busy && onClose()} title={`Crop ${spec.label.toLowerCase()}`} description={`Exports at ${spec.width} × ${spec.height} px (${spec.ratio}). ${spec.hint}`} className="max-w-3xl">
    <div className="space-y-4">
      <div className="relative h-[min(60vh,440px)] overflow-hidden rounded-xl bg-[repeating-conic-gradient(hsl(var(--muted))_0_25%,transparent_0_50%)] [background-size:20px_20px]">
        {src ? <Cropper image={src} crop={crop} zoom={zoom} rotation={rotation} aspect={spec.aspect} minZoom={minZoom} maxZoom={5} zoomSpeed={0.15}
          objectFit={natural && natural.w / natural.h > spec.aspect ? "vertical-cover" : "horizontal-cover"} restrictPosition={fit === "cover"}
          onCropChange={setCrop} onZoomChange={setZoom} onRotationChange={setRotation} onCropComplete={onComplete} showGrid /> : null}
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <button type="button" aria-label="Zoom out" className={tool} onClick={() => setZoom((z) => Math.max(minZoom, +(z - 0.1).toFixed(2)))}><ZoomOut /></button>
        <input type="range" aria-label="Zoom" min={minZoom} max={5} step={0.01} value={zoom} onChange={(e) => setZoom(Number(e.target.value))} className="h-1.5 min-w-32 flex-1 cursor-pointer accent-[hsl(var(--primary))]" />
        <button type="button" aria-label="Zoom in" className={tool} onClick={() => setZoom((z) => Math.min(5, +(z + 0.1).toFixed(2)))}><ZoomIn /></button>
        <span className="w-12 text-right text-xs tabular-nums text-muted-foreground">{Math.round(zoom * 100)}%</span>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" className={cn(chip, fit === "cover" && chipOn)} onClick={() => { setFit("cover"); setZoom(1); setCrop({ x: 0, y: 0 }); }}><Maximize />Fill frame</button>
        <button type="button" className={cn(chip, fit === "contain" && chipOn)} onClick={() => { setFit("contain"); setZoom(natural ? Math.min(1, fitZoom(natural, spec.aspect)) : 1); setCrop({ x: 0, y: 0 }); }}><Minimize />Fit whole image</button>
        <button type="button" className={chip} onClick={() => setRotation((r) => r - 90)}><RotateCcw />Rotate left</button>
        <button type="button" className={chip} onClick={() => setRotation((r) => r + 90)}><RotateCw />Rotate right</button>
        <button type="button" className={chip} onClick={() => { setZoom(1); setRotation(0); setCrop({ x: 0, y: 0 }); setFit("cover"); }}>Reset</button>
      </div>
      <p className={cn("text-xs", lowRes ? "font-semibold text-destructive" : "text-muted-foreground")}>
        {natural ? `Original ${natural.w} × ${natural.h} px. ` : ""}{lowRes ? `This crop is small and may look blurry — use an image at least ${spec.width} × ${spec.height} px.` : "Drag to move, scroll or pinch to zoom."}
      </p>
      <div className="flex justify-end gap-2 border-t border-border pt-4">
        <Button type="button" variant="outline" disabled={busy} onClick={onClose}>Cancel</Button>
        <Button type="button" disabled={busy || !area} onClick={() => void apply()}>{busy ? <Loader2 className="animate-spin" /> : null}{busy ? "Uploading…" : "Crop & upload"}</Button>
      </div>
    </div>
  </BrandedDialog>;
}

const tool = "grid size-9 place-items-center rounded-full bg-muted text-muted-foreground ring-1 ring-border transition-all hover:text-primary hover:ring-primary/40 [&_svg]:size-4";
const chip = "inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-semibold transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 [&_svg]:size-3.5";
const chipOn = "border-primary bg-primary/10 text-primary";

/** Zoom at which the whole image fits inside the crop frame. */
function fitZoom(n: { w: number; h: number }, aspect: number) {
  const r = n.w / n.h;
  return r > aspect ? aspect / r : r / aspect;
}

async function render(src: string, area: Area, rotation: number, width: number, height: number): Promise<Blob> {
  const img = await new Promise<HTMLImageElement>((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = src; });
  const rad = (rotation * Math.PI) / 180;
  const sin = Math.abs(Math.sin(rad)), cos = Math.abs(Math.cos(rad));
  const bw = img.width * cos + img.height * sin, bh = img.width * sin + img.height * cos;
  const rotated = document.createElement("canvas"); rotated.width = bw; rotated.height = bh;
  const rc = rotated.getContext("2d")!;
  rc.translate(bw / 2, bh / 2); rc.rotate(rad); rc.drawImage(img, -img.width / 2, -img.height / 2);
  const out = document.createElement("canvas"); out.width = width; out.height = height;
  const oc = out.getContext("2d")!;
  oc.fillStyle = "#0B0B0B"; oc.fillRect(0, 0, width, height); // letterbox colour when "fit whole image" leaves gaps
  oc.imageSmoothingQuality = "high";
  oc.drawImage(rotated, area.x, area.y, area.width, area.height, 0, 0, width, height);
  return new Promise((res, rej) => out.toBlob((b) => (b ? res(b) : rej(new Error("Could not process image"))), "image/webp", 0.9));
}
