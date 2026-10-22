import { ImagePlus, RotateCcw, Upload } from "lucide-react";
import { Field, Panel } from "./AdminKit";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { contentSeo, type SeoContent } from "@/lib/content-seo";

export interface SeoEditorValues { metaTitle: string; metaDescription: string; ogTitle: string; ogDescription: string; ogImage: string | null }
export function ContentSeoFields({ values, onChange, content, episode, onImage }: { values: SeoEditorValues; onChange: (v: SeoEditorValues) => void; content: SeoContent; episode?: { seriesTitle: string; number: number; fallbackImage?: string | null } | undefined; onImage: (file: File) => void }) {
  const seo = contentSeo({ ...content, meta_title: values.metaTitle, meta_description: values.metaDescription, og_title: values.ogTitle, og_description: values.ogDescription, og_image: values.ogImage }, episode);
  const update = (key: keyof SeoEditorValues, value: string | null) => onChange({ ...values, [key]: value });
  return <Panel title="Search & sharing"><div className="space-y-5">
    <div className="grid gap-4 sm:grid-cols-2">
      <Field label="Meta title"><Input aria-label="Meta title" className="admin-input" maxLength={200} placeholder={seo.defaultTitle} value={values.metaTitle} onChange={e => update("metaTitle", e.target.value)} /></Field>
      <Field label="OG title"><Input aria-label="OG title" className="admin-input" maxLength={200} placeholder={seo.title} value={values.ogTitle} onChange={e => update("ogTitle", e.target.value)} /></Field>
      <Field label="Meta description"><Textarea aria-label="Meta description" className="admin-input" rows={4} maxLength={500} placeholder={seo.defaultDescription} value={values.metaDescription} onChange={e => update("metaDescription", e.target.value)} /><span className="text-xs text-muted-foreground">{values.metaDescription.length || seo.defaultDescription.length} characters</span></Field>
      <Field label="OG description"><Textarea aria-label="OG description" className="admin-input" rows={4} maxLength={500} placeholder={seo.description} value={values.ogDescription} onChange={e => update("ogDescription", e.target.value)} /></Field>
    </div>
    <div className="grid gap-4 sm:grid-cols-[200px_1fr]">
      <div className="aspect-[1200/630] overflow-hidden rounded-md bg-muted">{seo.image ? <img src={seo.image} alt="Share preview" className="size-full object-cover" /> : <div className="grid size-full place-items-center text-muted-foreground"><ImagePlus /></div>}</div>
      <div className="min-w-0"><p className="text-xs text-muted-foreground">films.brantatech.com</p><p className="mt-1 break-words font-semibold">{seo.ogTitle}</p><p className="mt-2 break-words text-sm text-muted-foreground">{seo.ogDescription}</p></div>
    </div>
    <div className="flex flex-wrap gap-2">
      <Button type="button" variant="outline" size="sm" asChild><label><Upload />{values.ogImage ? "Replace OG image" : "Upload OG image"}<input className="sr-only" aria-label="Upload OG image" type="file" accept="image/jpeg,image/png,image/webp" onChange={e => { const file = e.target.files?.[0]; if (file) onImage(file); e.target.value = ""; }} /></label></Button>
      {values.ogImage ? <Button type="button" variant="outline" size="sm" onClick={() => update("ogImage", null)}><RotateCcw />Use content image</Button> : null}
      <Button type="button" variant="ghost" size="sm" disabled={!values.metaTitle && !values.metaDescription && !values.ogTitle && !values.ogDescription && !values.ogImage} onClick={() => onChange({ metaTitle: "", metaDescription: "", ogTitle: "", ogDescription: "", ogImage: null })}><RotateCcw />Reset to automatic</Button>
    </div>
  </div></Panel>;
}