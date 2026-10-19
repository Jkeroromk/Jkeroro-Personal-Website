"use client";

import React from "react";
import { useAuth } from "../../auth";
import ProjectIndex from "@/components/media/ProjectIndex";

// 作品区。原来上面还有 Personal Cv / KillCam 两张大卡片、下面有 Donation 卡片：
// CV 和 Support 挪到了首屏的 QuickLinks，KillCam 放进项目列表（后台 Projects 里管理）。
const Tabs = () => {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="mt-2 flex flex-col justify-center items-center w-full px-4 z-10">
        <p className="text-white font-bold">Loading authentication...</p>
      </div>
    );
  }

  return (
    <div className="mt-2 flex flex-col justify-center items-center w-full px-4 z-10" style={{ overflow: "visible" }}>
      {/* 作品区：居中的项目索引 + 翻页，标题在组件里 */}
      <div className="w-full mt-16 sm:mt-20 py-8" style={{ overflow: "visible" }}>
        <ProjectIndex />
      </div>
    </div>
  );
};

export default Tabs;
