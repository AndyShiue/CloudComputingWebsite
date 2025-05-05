'use client'

import { Button } from "@nextui-org/react";
import { useEffect, useState } from "react";
import AuthButton from "../components/AuthButton";
import { useAuth } from "../hooks/useAuth";

interface PunchRecord {
  id: number;
  time: string;
  user: string;
}

export default function Profile() {
  const [records, setRecords] = useState<PunchRecord[]>([
    { id: 1, time: "2024-05-02 14:30:00", user: "張三" },
    { id: 2, time: "2024-05-02 14:35:00", user: "李四" },
    { id: 3, time: "2024-05-02 14:40:00", user: "王五" },
  ]);

  const { isLoggedIn } = useAuth();

  useEffect(() => {
    if (isLoggedIn === false) {
      window.location.href = "/"; 
    }
  }, [isLoggedIn]);

  const handlePunch = async () => {
    try {
      // 發送打卡請求
      const response = await fetch('https://mfi04yjgvi.execute-api.us-east-1.amazonaws.com/prod/setRecordStart', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem("id_token")}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: 'dummy123',
          startStop: 'start'
        })
      });

      const responseData = await response.json();
      console.log('Response:', responseData);

      if (!response.ok) {
        throw new Error('打卡失敗');
      }

      // 更新本地記錄
      const newRecord = {
        id: records.length + 1,
        time: new Date().toLocaleString("zh-TW"),
        user: "當前用戶",
      };
      setRecords([newRecord, ...records]);
    } catch (error) {
      console.error('打卡錯誤:', error);
      alert('打卡失敗，請稍後再試');
    }
  };

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
        {/* 打卡按鈕 */}
        <div className="my-8 relative">
          <Button 
            color="primary" 
            size="lg" 
            className="text-2xl px-8 py-6"
            onClick={handlePunch}
          >
            打卡
          </Button>
        </div>

        {/* 打卡記錄列表 */}
        <div className="w-full max-w-2xl">
          <h2 className="text-xl font-bold mb-4">打卡記錄</h2>
          <div className="space-y-2">
            {records.map((record) => (
              <div
                key={record.id}
                className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg shadow flex justify-between items-center"
              >
                <span className="text-gray-600 dark:text-gray-300">{record.user}</span>
                <span className="text-gray-400 dark:text-gray-500">{record.time}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
