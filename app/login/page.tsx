import { ShieldCheck } from "lucide-react";
import Link from "next/link";
import { LovartMark } from "@/components/common/LovartMark";
import { buildGoogleLoginUrl } from "@/lib/auth-url";

type LoginPageProps = {
  searchParams?: Promise<{ error?: string }>;
};

const ERROR_TEXT: Record<string, string> = {
  oauth_failed: "Google 登录失败，请重试。",
  access_denied: "你已取消授权，如需使用请重新登录。",
  session_failed: "创建登录会话失败，请重新尝试。",
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = (await searchParams) ?? {};
  const error = params.error ? ERROR_TEXT[params.error] ?? "登录失败，请重试。" : null;
  const loginUrl = buildGoogleLoginUrl();

  return (
    <main className="grid min-h-[100dvh] place-items-center bg-panel p-4 text-ink">
      <section className="glass-card-strong w-full max-w-md rounded-[2rem] p-8">
        <div className="mb-6 flex items-center gap-3">
          <LovartMark className="size-11" />
          <div>
            <h1 className="m-0 text-xl font-semibold tracking-tight">登录 Lovart Mail Desk</h1>
            <p className="m-0 mt-1 text-sm text-muted">使用团队工作 Gmail 登录</p>
          </div>
        </div>

        {error ? (
          <div className="mb-4 rounded-xl border border-[#f0c6c0] bg-[#fff6f5] p-3 text-sm leading-6 text-[#9f3429]">
            {error}
          </div>
        ) : null}

        <a
          href={loginUrl}
          className="primary-island-button flex h-11 w-full items-center justify-center gap-2"
        >
          使用 Google 登录
        </a>

        <div className="mt-5 flex gap-2 rounded-xl border border-white/70 bg-white/55 p-3 text-sm leading-6 text-muted">
          <ShieldCheck className="mt-0.5 size-4 shrink-0 text-accent" />
          <p className="m-0">
            登录即授权读取工作邮件与发送确认后的邮件。Google 同意屏上<strong className="font-semibold text-ink">邮箱权限必须全部勾选</strong>，否则无法同步与发信。所有 AI 草稿均需人工确认后才会发送。
          </p>
        </div>

        <p className="mt-4 text-center text-xs text-muted">
          首次登录需
          <Link href="/onboarding" className="text-accent underline-offset-2 hover:underline">
            完善个人资料
          </Link>
          后方可进入工作台。
        </p>
      </section>
    </main>
  );
}
