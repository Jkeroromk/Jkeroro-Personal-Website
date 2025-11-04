"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { useAuth } from "../../auth";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import ViewerStats from "./ViewerStats";
import CommentSystem from "./CommentSystem";
import SocialLinks from "./SocialLinks";

const Car = dynamic(() => import("../media/car"), { ssr: false, loading: () => <p>Loading...</p> });

export default function LinkforBio() {
  const { isOnline, lastActivity, loading, isAdmin } = useAuth();
  const [hasActiveVisitors, setHasActiveVisitors] = useState(false);
  
  // 检查是否有活跃访问者（管理员在线表示有访问者）
  useEffect(() => {
    // 如果有管理员在线，表示有活跃访问者
    setHasActiveVisitors(isOnline);
  }, [isOnline]);
  
  // 显示状态逻辑：有访问者（管理员在线）显示绿色，否则显示红色并显示上次登录时间
  const statusColor = hasActiveVisitors ? "bg-green-500" : "bg-red-500";
  const statusText = loading
    ? "Loading..."
    : hasActiveVisitors
    ? "Online"
    : lastActivity
    ? `Last Active: ${lastActivity}`
    : "Offline";

  return (
    <>
      <div className="relative flex flex-col items-center mt-8 mx-4">
        <Car />
        <div className="absolute top-0 flex gap-[120px] scale-[0.85] sm:gap-80 sm:scale-[1.0] mt-3">
          <ViewerStats />
          <CommentSystem />
        </div>

        {/* 个人资料显示 */}
        <div className="absolute bottom-[-45px] flex flex-col gap-y-1 items-center">
          <Avatar className="size-20 border">
            <AvatarImage src="/pfp.webp" alt="个人头像" />
            <AvatarFallback>CN</AvatarFallback>
          </Avatar>
          {/* 始终显示状态：有访问者显示绿色，否则显示红色和上次登录时间 */}
          {!loading && statusText && (
            <div className="flex items-center gap-2 mt-1 mr-2">
              <span className={`w-2 h-2 rounded-full ${statusColor}`} />
              <span className="text-white text-xs">{statusText}</span>
            </div>
          )}
        </div>
      </div>

      {/* 用户名和地理位置 */}
      <div className="flex flex-col items-center mt-12">
        <h1 className="text-white font-extrabold text-2xl">Jkeroro</h1>
        <h2 className="text-white font-semibold text-sm">
          CN <span className="mx-1">✈️</span> HK <span className="mx-1">✈️</span> US
        </h2>
      </div>

      {/* Social Links */}
      <SocialLinks />
    </>
  );
}