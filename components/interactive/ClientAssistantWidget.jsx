'use client';

import dynamic from 'next/dynamic';

const AssistantWidget = dynamic(() => import("./AssistantWidget"), {
  ssr: false,
  loading: () => null
});

export default function ClientAssistantWidget() {
  return <AssistantWidget />;
}
