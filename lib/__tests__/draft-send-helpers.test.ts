import { describe, expect, it } from "vitest";
import { htmlToPlainText, isEditorEmpty } from "@/components/common/RichTextEditor";
import { renderTemplateText } from "@/lib/template-render";

describe("RichTextEditor helpers", () => {
  it("htmlToPlainText strips tags and preserves line breaks", () => {
    const plain = htmlToPlainText("<p>Hello</p><p>World<br/>!</p>");
    expect(plain).toContain("Hello");
    expect(plain).toContain("World");
    expect(plain).toContain("!");
  });

  it("isEditorEmpty treats blank html as empty", () => {
    expect(isEditorEmpty("")).toBe(true);
    expect(isEditorEmpty("<p></p>")).toBe(true);
    expect(isEditorEmpty("<p>Hi</p>")).toBe(false);
  });
});

describe("renderTemplateText", () => {
  it("replaces kol placeholders", () => {
    const body = renderTemplateText("Hi {{kol_name}} on {{platform}}", {
      kolName: "Alice",
      platform: "YouTube",
    });
    expect(body).toBe("Hi Alice on YouTube");
  });
});
