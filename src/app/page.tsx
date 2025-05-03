'use client'

import AuthButton from "./components/AuthButton";
import { useAuth } from "./hooks/useAuth";
import { useEffect } from "react";

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
      <div className="pt-16 flex flex-col items-center">
        這裡是首頁內容
      </div>
    </main>
  );
}
