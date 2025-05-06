'use client'

import AuthButton from "./components/AuthButton";
import { useAuth } from "./hooks/useAuth";
import { useEffect } from "react";
import Image from "next/image";

export default function Home() {
  const { isLoggedIn } = useAuth();

  useEffect(() => {
    if (isLoggedIn === true) {
      window.location.href = "/profile"; // 如果已登入，重定向到profile頁面
    }
  }, [isLoggedIn]);

  return (
    <main className="min-h-screen p-4">
      {/* 頂部導航欄 */}
      <nav className="fixed top-0 left-0 right-0 p-4 bg-white dark:bg-black shadow-md flex justify-end">
        <div className="relative">
          <AuthButton />
        </div>
      </nav>

      {/* 主要內容 */}
      <div className="pt-16 flex flex-col items-center justify-center min-h-[80vh]">
        <div className="relative w-64 h-64 md:w-80 md:h-80 mb-8">
          <Image 
            src="/bus_station_like.png"
            alt="公車讚"
            fill
            style={{ objectFit: 'contain' }}
            priority
          />
        </div>
      </div>
    </main>
  );
}
