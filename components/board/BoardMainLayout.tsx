"use client";

import type { ReactNode } from "react";

type Props = {
  left: ReactNode;
  right: ReactNode;
  footer?: ReactNode;
};

/** v1 看板主区两栏壳：左 Pipeline + Members，右平台 + 动态；footer 为全宽下钻列表。 */
export function BoardMainLayout({ left, right, footer }: Props) {
  return (
    <>
      <div className="grid gap-4 xl:grid-cols-[1.4fr_0.6fr]">
        <div className="grid content-start gap-4">{left}</div>
        <div className="grid content-start gap-4">{right}</div>
      </div>
      {footer ? <div className="mt-4">{footer}</div> : null}
    </>
  );
}
