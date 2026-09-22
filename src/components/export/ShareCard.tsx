'use client';

import { forwardRef } from 'react';
import { CardTemplate } from '@/components/export/templates';
import type { CardModel, TemplateId } from '@/lib/export/types';

export interface CardPreset {
  width: number;
  height: number;
}

export interface ShareCardProps {
  model: CardModel;
  template: TemplateId;
  preset: CardPreset;
  /**
   * 输出倍率（桌面 2 / 移动 3）。
   * 节点的 CSS 尺寸 = 预设尺寸 / 倍率，导出时再乘回去，
   * 这样既能拿到预设分辨率，又不会让 1080px 的节点把弹窗撑爆。
   */
  ratio: number;
}

/**
 * 导出卡片本体。设计基准宽 1080，模板内所有尺寸通过 `u()` 换算成 CSS 像素，
 * 因此同一个模板在 540px（桌面逻辑尺寸）与 360px（移动逻辑尺寸）下构图完全一致。
 */
export const ShareCard = forwardRef<HTMLDivElement, ShareCardProps>(function ShareCard(
  { model, template, preset, ratio },
  ref,
) {
  const logicalWidth = preset.width / ratio;
  const logicalHeight = preset.height / ratio;
  const u = (n: number) => (n * logicalWidth) / 1080;
  const design = { width: 1080, height: (preset.height / preset.width) * 1080 };

  return (
    <div
      ref={ref}
      data-share-card={template}
      style={{ width: logicalWidth, height: logicalHeight, position: 'relative', flex: '0 0 auto' }}
    >
      <CardTemplate
        template={template}
        model={model}
        u={u}
        width={logicalWidth}
        height={logicalHeight}
        design={design}
        landscape={preset.width > preset.height}
      />
    </div>
  );
});
