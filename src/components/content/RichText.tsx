import { sanitizeRichText } from "@/lib/rich-text";
import { cn } from "@/lib/utils";

export function RichText({ html, className }: { html: string | null | undefined; className?: string }) {
  return <div className={cn("rich-text", className)} dangerouslySetInnerHTML={{ __html: sanitizeRichText(html) }} />;
}
