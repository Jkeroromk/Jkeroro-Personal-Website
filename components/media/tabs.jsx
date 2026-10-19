"use client";

import React from "react";
import { useAuth } from "../../auth";
import ProjectIndex from "@/components/media/ProjectIndex";

// 作品区。原来上面有 Personal Cv / KillCam 两张亮灰色大卡片、下面有 Donation 卡片：
// CV 挪到 Tech Stack 上面（CvCard），Support 挪到页面最底部（SupportRow），KillCam 放进项目列表（后台 Projects 里管理）。

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
