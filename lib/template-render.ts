/**
 * Client-side mirror of backend {@code TemplateRenderService} placeholder keys.
 */
export type TemplateRenderInput = {
  kolName: string;
  kolHandle?: string | null;
  platform?: string | null;
  agreedPrice?: number | null;
  homepageUrl?: string | null;
  operatorName?: string | null;
  stage?: string | null;
};

const PLACEHOLDER = /\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g;

export function renderTemplateText(template: string, input: TemplateRenderInput): string {
  if (!template) return "";
  const vars = buildVariables(input);
  return template.replace(PLACEHOLDER, (_, rawKey: string) => {
    const key = rawKey.trim().toLowerCase();
    return vars[key] ?? "";
  });
}

function buildVariables(input: TemplateRenderInput): Record<string, string> {
  const kolName = (input.kolName ?? "").trim();
  const platform = (input.platform ?? "").trim();
  const quote =
    input.agreedPrice == null || Number.isNaN(input.agreedPrice)
      ? ""
      : String(input.agreedPrice);
  const homepage = (input.homepageUrl ?? "").trim();
  const operatorName = (input.operatorName ?? "").trim();
  const stage = (input.stage ?? "").trim().toLowerCase();

  const values: Record<string, string> = {
    creator_name: kolName,
    kol_name: kolName,
    platform,
    quote,
    agreed_price: quote,
    homepage_url: homepage,
    external_profile_url: homepage,
    operator_name: operatorName,
    kol_handle: (input.kolHandle ?? "").trim(),
  };
  if (stage) values.stage = stage;
  return values;
}
