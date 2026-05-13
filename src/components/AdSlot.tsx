/**
 * Non-intrusive AdSense slot.
 *
 * Renders nothing until both NEXT_PUBLIC_ADSENSE_CLIENT and the explicit
 * slot id are set, so the layout is identical in dev / before launch.
 *
 * Usage:
 *   <AdSlot slot="1234567890" format="auto" />
 *
 * AdSense Auto Ads also work — but a manual slot lets us pin a single ad
 * unit between e.g. chapter content and the comment section so we never
 * disturb the reader mid-paragraph.
 */
'use client';

import { useEffect, useRef } from 'react';

interface AdSlotProps {
  slot: string;
  format?: 'auto' | 'rectangle' | 'horizontal' | 'vertical';
  layout?: string;
  responsive?: boolean;
  className?: string;
  hideInVip?: boolean;
}

declare global {
  interface Window {
    adsbygoogle?: any[];
  }
}

export default function AdSlot({ slot, format = 'auto', layout, responsive = true, className, hideInVip }: AdSlotProps) {
  const client = process.env.NEXT_PUBLIC_ADSENSE_CLIENT;
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!client || !ref.current) return;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (e) {
      // Silent — AdSense often double-pushes during HMR
    }
  }, [client]);

  if (!client) return null;
  if (hideInVip) {
    // Could read user VIP flag here when the schema exists. Keep API stable.
  }

  return (
    <div className={`my-6 text-center ${className || ''}`}>
      <span className="block text-[10px] text-muted/60 uppercase tracking-wider mb-1">Quảng cáo</span>
      <ins
        ref={ref as any}
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client={client}
        data-ad-slot={slot}
        data-ad-format={format}
        data-ad-layout={layout}
        data-full-width-responsive={responsive ? 'true' : 'false'}
      />
    </div>
  );
}
