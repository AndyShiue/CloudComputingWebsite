'use client'

import AuthButton from "./components/AuthButton";
import { useAuth } from "./hooks/useAuth";
import { useEffect } from "react";
import Image from "next/image";
import Link from "next/link";

export default function Home() {
  const { isLoggedIn } = useAuth();

  useEffect(() => {
    if (isLoggedIn === true) {
      window.location.href = "/profile"; // 如果已登入，重定向到profile頁面
    }
  }, [isLoggedIn]);

  return (
    <div className="min-h-screen p-4">
      {/* 頂部導航欄 */}
      <header className="fixed left-0 right-0 top-0 bg-white dark:bg-gray-800 shadow-md z-10">
        <div className="container mx-auto flex items-center justify-between py-3 px-4 md:px-6">
          <div className="flex items-center">
            <Link href="/" className="flex items-center">
              <span className="text-xl font-bold text-gray-800 dark:text-white hover:text-primary transition-colors">公車讚</span>
            </Link>
          </div>
          <div className="flex items-center">
            <AuthButton />
          </div>
        </div>
      </header>
      {/* 主要內容 */}
      <main className="pt-20 flex flex-col items-center justify-center min-h-[80vh]">
        <div className="max-w-md text-center space-y-6">
          <div className="w-80 h-80 mx-auto relative">
            <Image 
              src="/bus_station_like.png"
              alt="公車讚"
              fill
              style={{ objectFit: 'contain' }}
              priority
            />
          </div>
          <h1 className="text-3xl font-extrabold">智慧搭車，環保打卡</h1>
          <p className="text-gray-400">
            「公車讚」提供打卡功能，除了紀錄您的綠色足跡，
              還能和其他用戶競賽，看看誰才是環保小能手！
          </p>
          <ul className="list-disc list-inside text-left text-gray-400 space-y-2">
            <li>即時掃描，即時打卡</li>
            <li>統計出行紀錄，掌握環保成就</li>
            <li>節能排行系統，激勵持續參與</li>
            <li>提高候車舒適度，同時兼顧節能</li>
          </ul>
        </div>
      </main>
    </div>
  );
}
