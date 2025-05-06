'use client'

import { Button } from "@nextui-org/react";
import { useEffect, useState, useRef } from "react";
import { Scanner, IDetectedBarcode } from '@yudiel/react-qr-scanner';
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
  const isScanned = useRef<boolean>(false)
  const scannedStop = useRef<string>("");

  const { isLoggedIn } = useAuth();

  useEffect(() => {
    if (isLoggedIn === false) {
      window.location.href = "/"; 
    }
  }, [isLoggedIn]);

  const handlePunch = async (stop: string) => {
    isScanned.current = false;
    scannedStop.current = stop; // TODO: Request
  };

  const openRanking = () => {
    alert('排行榜功能即將推出！');
    // 未來可以導航到排行榜頁面
    // window.location.href = "/ranking";
  };

  // 處理掃描到的 UUID
  const handleScan = async (detectedCodes: IDetectedBarcode[]) => {
    
    if (isScanned.current) {
      return;
    }

    isScanned.current = true;

    const uuid = (detectedCodes && detectedCodes.length > 0) ? detectedCodes[0].rawValue : "";

    try {

      const parseJwt = (token: string) => {
        return JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
      }

      const idToken = localStorage.getItem("id_token")!;
      const stop = scannedStop.current || alert("請先選擇車站！");

      const response = await fetch('https://mfi04yjgvi.execute-api.us-east-1.amazonaws.com/prod/setRecordStart', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${idToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: parseJwt(idToken).sub,
          startStop: stop,
          uuid: uuid,
        })
      });

      const responseData = await response.json();
      console.log('Response:', responseData);

      if (!response.ok) {
        throw new Error('打卡失敗');
      }

      const newRecord = {
        id: records.length + 1,
        time: new Date().toLocaleString("zh-TW"),
        user: `${stop}打卡`,
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
      <nav className="fixed top-0 left-0 right-0 p-4 z-50 bg-white dark:bg-black shadow-md flex justify-between items-center">
        {/* 左側排行榜按鈕 */}
        <div className="w-24 flex justify-start">
          <Button 
            color="primary" 
            variant="light"
            onClick={openRanking}
          >
            排行榜
          </Button>
        </div>
        
        {/* 中央標題 */}
        <h1 className="text-2xl font-bold text-center">打卡</h1>
        
        {/* 右側登入按鈕 */}
        <div className="w-24 flex justify-end">
          <AuthButton />
        </div>
      </nav>

      {/* 主要內容，增加頂部間距 */}
      <div className="pt-24 flex flex-col items-center">
        {/* 掃描器 */}
        <div className="w-full max-w-md mb-8">
          <Scanner 
            onScan={handleScan}
            allowMultiple
            classNames={{
              container: "w-full max-w-md mx-auto"
            }}
          />
        </div>

        {/* 文字提示 */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            請選擇車站
          </h2>
        </div>

        {/* 三個站點按鈕 */}
        <div className="flex justify-center gap-4 mb-12">
          <Button 
            color="primary" 
            size="lg" 
            className="text-xl px-6 py-5"
            onClick={() => handlePunch("stop1")}
          >
            第一站
          </Button>
          <Button 
            color="primary" 
            size="lg" 
            className="text-xl px-6 py-5"
            onClick={() => handlePunch("stop2")}
          >
            第二站
          </Button>
          <Button 
            color="primary" 
            size="lg" 
            className="text-xl px-6 py-5"
            onClick={() => handlePunch("stop3")}
          >
            第三站
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
