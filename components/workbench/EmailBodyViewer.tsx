"use client";

import { ChevronRight } from "lucide-react";
import DOMPurify from "isomorphic-dompurify";
import { useMemo, useState } from "react";
import { apiClient } from "@/lib/api-client";
import { isApiClientError } from "@/lib/api-client/error";

export function EmailBodyViewer({
  bodyText,
  bodyHtml,
  bodyZh
}: {
  bodyText: string;
  bodyHtml?: string | null;
  bodyZh: string | null;
}) {
  const [mode, setMode] = useState<"original" | "zh">("original");
  const [translatedZh, setTranslatedZh] = useState<string | null>(bodyZh);
  const [translating, setTranslating] = useState(false);

  // Prefer the HTML body when Gmail returned one (real formatting, images,
  // links). Otherwise fall back to the plain-text body with quote folding.
  const sanitizedHtml = useMemo(() => (bodyHtml ? sanitizeEmailHtml(bodyHtml) : ""), [bodyHtml]);
  const parsed = useMemo(() => splitQuoted(bodyText), [bodyText]);
  const showingZh = mode === "zh" && translatedZh;
  const hasHtml = !showingZh && Boolean(sanitizedHtml);

  async function translateToChinese() {
    const source = bodyText.trim() || stripHtmlToText(bodyHtml ?? "");
    if (!source) return;
    setTranslating(true);
    try {
      const result = await apiClient.ai.translate({ text: source, targetLang: "zh" });
      if (!result.translated) throw new Error("翻译失败");
      setTranslatedZh(result.translated);
      setMode("zh");
    } catch (error) {
      window.alert(isApiClientError(error) ? error.message : error instanceof Error ? error.message : "翻译失败");
    } finally {
      setTranslating(false);
    }
  }

  return (
    <div className="mt-4 grid gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setMode("original")}
          className={`rounded-full px-3 py-1 text-xs font-semibold transition duration-200 ${
            mode === "original" ? "bg-accent text-white shadow-inset" : "bg-white/70 text-muted shadow-inset hover:bg-white"
          }`}
        >
          原文
        </button>
        <button
          type="button"
          onClick={() => setMode("zh")}
          disabled={!translatedZh}
          className={`rounded-full px-3 py-1 text-xs font-semibold transition duration-200 disabled:opacity-50 ${
            mode === "zh" ? "bg-accent text-white shadow-inset" : "bg-white/70 text-muted shadow-inset hover:bg-white"
          }`}
        >
          中文
        </button>
        {!translatedZh ? (
          <button
            type="button"
            disabled={translating}
            onClick={translateToChinese}
            className="rounded-full border border-white/70 bg-white/75 px-3 py-1 text-xs font-semibold text-accent shadow-inset transition duration-200 hover:bg-white disabled:opacity-60"
          >
            {translating ? "翻译中" : "翻译成中文"}
          </button>
        ) : null}
      </div>

      <div className="overflow-x-hidden rounded-2xl border border-white/70 bg-white/[0.82] p-4 shadow-inset">
        {showingZh ? (
          <EmailText text={translatedZh as string} />
        ) : hasHtml ? (
          <EmailHtml html={sanitizedHtml} />
        ) : parsed.main || parsed.quoted ? (
          <>
            {parsed.main ? <EmailText text={parsed.main} /> : null}
            {parsed.quoted ? (
              <details className="group mt-3 border-t border-line/70 pt-3">
                <summary className="inline-flex cursor-pointer select-none items-center gap-1 text-xs font-medium text-muted transition hover:text-ink">
                  <ChevronRight className="size-3.5 transition-transform duration-200 group-open:rotate-90" />
                  显示引用的历史邮件
                </summary>
                <div className="mt-2 border-l-2 border-line pl-3 text-[13px] leading-6 text-muted/80">
                  <EmailText text={stripQuoteMarkers(parsed.quoted)} />
                </div>
              </details>
            ) : null}
          </>
        ) : (
          <p className="m-0 text-sm text-muted">这封邮件没有可展示的正文。</p>
        )}
      </div>
    </div>
  );
}

function EmailHtml({ html }: { html: string }) {
  return (
    <div
      className="email-html-body break-words text-sm leading-7 text-ink [overflow-wrap:anywhere]"
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

function EmailText({ text }: { text: string }) {
  // Light markdown + linkification for plain-text emails: bullets,
  // **bold**/*italic* and bare URLs become real markup. Anything else stays
  // as-is and uses whitespace-pre-wrap to preserve hand-formatted content.
  const html = useMemo(() => renderPlainTextToHtml(text), [text]);
  return (
    <div
      className="email-plain-body whitespace-pre-wrap break-words text-sm leading-7 text-ink [overflow-wrap:anywhere]"
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

const QUOTE_HEADER = [
  /^>+/,
  /^On\s.+\swrote:\s*$/i,
  /^On\s.+\sat\s.+wrote:\s*$/i,
  /^-{2,}\s*(Original Message|Forwarded message)\s*-{2,}/i,
  /^(From|发件人)\s*[:：]\s*.+/,
  /^在.+写道[:：]\s*$/
];

function splitQuoted(text: string): { main: string; quoted: string } {
  const lines = text.split(/\r?\n/);
  let idx = -1;
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i].trim();
    if (!line) continue;
    const isHeader = QUOTE_HEADER.some((pattern, p) => (p === 0 ? pattern.test(lines[i]) : pattern.test(line)));
    if (isHeader && (i > 0 || /^>+/.test(lines[i]))) {
      idx = i;
      break;
    }
  }
  if (idx <= 0) return { main: text.trimEnd(), quoted: "" };
  return {
    main: lines.slice(0, idx).join("\n").trimEnd(),
    quoted: lines.slice(idx).join("\n").trim()
  };
}

function stripQuoteMarkers(text: string): string {
  return text
    .split(/\r?\n/)
    .map((line) => line.replace(/^\s*>+\s?/, ""))
    .join("\n");
}

// Strict allowlist sanitizer: keep formatting tags, drop scripts/iframes/event
// handlers, force links to open in a new tab with safe rel attrs, cap image
// width via CSS (see globals.css). DOMPurify is the actual gate; the config
// below just narrows what HTML survives.
function sanitizeEmailHtml(html: string): string {
  // Wrap any quoted history (Gmail / Apple Mail / Outlook markers) into a
  // <details>…</details> BEFORE sanitization, while the discriminating class
  // and type attributes still exist. Sanitization later strips those attrs
  // but the <details> structure survives.
  const folded = collapseQuotedHtml(html);

  const cleaned = DOMPurify.sanitize(folded, {
    ALLOWED_TAGS: [
      "a", "p", "br", "strong", "b", "em", "i", "u", "s", "small", "sub", "sup",
      "ul", "ol", "li", "blockquote", "pre", "code",
      "h1", "h2", "h3", "h4", "h5", "h6",
      "img", "figure", "figcaption",
      "table", "thead", "tbody", "tfoot", "tr", "td", "th", "caption",
      "div", "span", "hr",
      "details", "summary"
    ],
    ALLOWED_ATTR: [
      "href", "title", "alt", "src", "name", "id",
      "width", "height", "align", "valign", "colspan", "rowspan",
      "style", "color", "bgcolor", "cellspacing", "cellpadding", "border"
    ],
    ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto|tel|cid|data):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
    FORBID_TAGS: ["script", "style", "iframe", "object", "embed", "link", "meta", "form", "input", "button"],
    FORBID_ATTR: ["onerror", "onload", "onclick", "onmouseover", "onfocus", "onblur"]
  }) as string;

  // Force every surviving anchor to open in a new tab safely.
  return cleaned.replace(/<a\s+([^>]*?)>/gi, (_match, attrs: string) => {
    let next = attrs;
    if (!/\btarget\s*=/.test(next)) next += ' target="_blank"';
    if (!/\brel\s*=/.test(next)) next += ' rel="noopener noreferrer"';
    else next = next.replace(/\brel\s*=\s*"([^"]*)"/i, (_m, value: string) => {
      const parts = new Set(value.split(/\s+/).filter(Boolean));
      parts.add("noopener");
      parts.add("noreferrer");
      return `rel="${Array.from(parts).join(" ")}"`;
    });
    return `<a ${next.trim()}>`;
  });
}

// Detect Gmail / Apple Mail / Outlook "quoted history" markers in raw HTML
// and wrap from the FIRST marker through end-of-body in a <details>. We run
// this BEFORE sanitization so the discriminating attributes (class,
// type="cite") are still available. Anything once a quote begins is
// considered older history — there is no legitimate "new content after a
// gmail_quote" pattern in normal email replies.
//
// Patterns we recognise (most specific first; we pick the earliest index):
//   · <div class="...gmail_quote_container...">    Gmail full container
//   · <div class="...gmail_attr...">               Gmail "On X wrote:" line
//   · <blockquote class="...gmail_quote...">       Gmail blockquote
//   · <div class="...gmail_quote...">              Gmail blockquote variant
//   · <blockquote type="cite">                     Apple Mail
//   · <div class="...OutlookMessageHeader...">     Outlook
//
// Bare <blockquote> without any of the above markers is intentionally NOT
// collapsed because it might be legitimate quoted text in the actual new
// reply content (false-positive risk).
function collapseQuotedHtml(html: string): string {
  const patterns: RegExp[] = [
    /<div\b[^>]*\bclass\s*=\s*"[^"]*\bgmail_quote_container\b[^"]*"[^>]*>/i,
    /<div\b[^>]*\bclass\s*=\s*"[^"]*\bgmail_attr\b[^"]*"[^>]*>/i,
    /<blockquote\b[^>]*\bclass\s*=\s*"[^"]*\bgmail_quote\b[^"]*"[^>]*>/i,
    /<div\b[^>]*\bclass\s*=\s*"[^"]*\bgmail_quote\b[^"]*"[^>]*>/i,
    /<blockquote\b[^>]*\btype\s*=\s*"cite"[^>]*>/i,
    /<div\b[^>]*\bclass\s*=\s*"[^"]*\bOutlookMessageHeader\b[^"]*"[^>]*>/i
  ];

  let earliest = -1;
  for (const re of patterns) {
    const match = re.exec(html);
    if (match && (earliest === -1 || match.index < earliest)) {
      earliest = match.index;
    }
  }
  if (earliest <= 0) return html;

  const before = html.slice(0, earliest);
  const quoted = html.slice(earliest);

  // If the un-quoted prefix is essentially empty (e.g. just <br> or
  // whitespace), don't collapse — there's no new content to keep visible.
  const visiblePrefix = before.replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ").trim();
  if (!visiblePrefix) return html;

  return `${before}<details><summary>显示历史回复</summary>${quoted}</details>`;
}

function stripHtmlToText(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/[ \t]+/g, " ")
    .trim();
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// Tiny, deliberately-minimal renderer for plain-text bodies:
// - URLs → <a target=_blank rel=noopener>
// - **bold** / *italic* / `code`
// - leading "- " / "* " / "1. " on consecutive lines → <ul>/<ol>
// Output is run through DOMPurify so any HTML the user typed in plain-text
// gets neutralized.
function renderPlainTextToHtml(text: string): string {
  const lines = text.split(/\r?\n/);
  const out: string[] = [];
  let listType: "ul" | "ol" | null = null;

  const flushList = () => {
    if (listType) {
      out.push(`</${listType}>`);
      listType = null;
    }
  };

  for (const raw of lines) {
    const bulletMatch = raw.match(/^\s*[-*]\s+(.*)$/);
    const numberMatch = raw.match(/^\s*\d+[.)]\s+(.*)$/);
    if (bulletMatch) {
      if (listType !== "ul") {
        flushList();
        out.push("<ul>");
        listType = "ul";
      }
      out.push(`<li>${inlineFormat(bulletMatch[1])}</li>`);
    } else if (numberMatch) {
      if (listType !== "ol") {
        flushList();
        out.push("<ol>");
        listType = "ol";
      }
      out.push(`<li>${inlineFormat(numberMatch[1])}</li>`);
    } else {
      flushList();
      out.push(inlineFormat(raw));
    }
  }
  flushList();

  const joined = out.join("\n");
  return DOMPurify.sanitize(joined, {
    ALLOWED_TAGS: ["a", "strong", "em", "code", "ul", "ol", "li", "br"],
    ALLOWED_ATTR: ["href", "target", "rel"]
  }) as string;
}

function inlineFormat(line: string): string {
  let result = escapeHtml(line);
  result = result.replace(
    /(https?:\/\/[^\s<]+|www\.[^\s<]+)/gi,
    (url) => {
      const href = url.startsWith("http") ? url : `https://${url}`;
      return `<a href="${href}" target="_blank" rel="noopener noreferrer">${url}</a>`;
    }
  );
  result = result.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  result = result.replace(/(^|[\s(])\*([^*\n]+)\*(?=[\s).,!?]|$)/g, "$1<em>$2</em>");
  result = result.replace(/`([^`]+)`/g, "<code>$1</code>");
  return result;
}
