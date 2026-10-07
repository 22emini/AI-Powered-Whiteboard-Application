import { Suspense } from "react";
import type { Metadata } from "next";
import { BoardEditor } from "@/components/board/BoardEditor";

export const metadata: Metadata = {
  title: "Board Canvas",
  robots: { index: false, follow: false },
};

export default function BoardPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={null}>
      <BoardEditor params={params} />
    </Suspense>
  );
}
