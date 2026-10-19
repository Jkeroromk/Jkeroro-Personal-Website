"use client";

import React from "react";
import { useAuth } from "../../auth";
import ProjectIndex from "@/components/media/ProjectIndex";
import IndexRow from "@/components/interactive/IndexRow";

// 作品区。原来上面有 Personal Cv / KillCam 两张亮灰色大卡片、下面有 Donation 卡片：
// CV 改成项目列表下面同款的一行，Support 挪到页面最底部，KillCam 放进项目列表（后台 Projects 里管理）。

const CV_URL = "https://3d-portfolio-jade-xi.vercel.app/";

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

      <IndexRow eyebrow="Resume · Job only" title="Personal CV" href={CV_URL} className="mt-6" />
    </div>
  );
};

export default Tabs;
