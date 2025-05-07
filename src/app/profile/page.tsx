'use client'

import { Button } from "@nextui-org/react";
import { useEffect, useState, useRef } from "react";
import { Scanner, IDetectedBarcode } from '@yudiel/react-qr-scanner';
import AuthButton from "../components/AuthButton";
import { useAuth } from "../hooks/useAuth";

// 定義記錄類型
interface PunchRecord {
  recordId: string;
  userId: string;
  startTime: string;
  endTime: string | null;
  startStop: string;
  endStop: string | null;
}

export default function Profile() {
  const [records, setRecords] = useState<PunchRecord[]>([]);
  const isScanned = useRef<boolean>(false);
  const scannedStop = useRef<string>("");

  const { isLoggedIn } = useAuth();

  useEffect(() => {
    if (isLoggedIn === false) {
      window.location.href = "/"; 
    } else if (isLoggedIn) {
      // 在用戶登入後自動載入記錄
      loadUserRecords();
    }
  }, [isLoggedIn]);
  
  // 載入用戶打卡記錄
  const loadUserRecords = async () => {
    try {
      const idToken = localStorage.getItem("id_token");
      if (!idToken) return;
      
      const parseJwt = (token: string) => {
        return JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
      };
      
      const userId = parseJwt(idToken).sub;
      
      const response = await fetch(`https://mfi04yjgvi.execute-api.us-east-1.amazonaws.com/prod/getRecordbyUser?userId=${userId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${idToken}`,
          'Content-Type': 'application/json',
        },
      });
      
      const responseData = await response.json();
      console.log('Records response:', responseData);
      
      if (responseData.body) {
        try {
          // 處理嵌套的JSON字符串
          let recordsData: PunchRecord[] = [];
          
          if (typeof responseData.body === 'string') {
            // 嘗試解析JSON字符串
            const parsedBody = JSON.parse(responseData.body);
            
            // 檢查是否有records字段
            if (parsedBody.records && Array.isArray(parsedBody.records)) {
              recordsData = parsedBody.records;
            }
          }
          
          console.log('Parsed records:', recordsData);
          
          // 按時間排序，最新的記錄在前
          recordsData.sort((a, b) => {
            return new Date(b.startTime).getTime() - new Date(a.startTime).getTime();
          });
          
          setRecords(recordsData);
        } catch (error) {
          console.error('解析記錄時出錯:', error);
        }
      }
    } catch (error) {
      console.error('載入記錄時出錯:', error);
    }
  };

  const handlePunch = async (stop: string) => {
    fetch('https://mfi04yjgvi.execute-api.us-east-1.amazonaws.com/prod/showQRcodeStart', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem("id_token")}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        stopId: stop,
      })
    })
    isScanned.current = false;
    scannedStop.current = stop;
  };

  const openRanking = () => {
    // 導航到排行榜頁面
    window.location.href = "/ranking";
  };

  // 處理掃描到的 UUID
  const handleScan = async (detectedCodes: IDetectedBarcode[]) => {
    
    if (isScanned.current) {
      return;
    }

    isScanned.current = true;

    const uuid = (detectedCodes && detectedCodes.length > 0) ? detectedCodes[0].rawValue : "";
    
    if (!uuid) {
      isScanned.current = false;
      return;
    }

    if (!scannedStop.current) {
      alert("請先選擇車站！");
      isScanned.current = false;
      return;
    }

    try {
      const parseJwt = (token: string) => {
        return JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
      }

      const idToken = localStorage.getItem("id_token");
      if (!idToken) {
        alert("請先登入！");
        isScanned.current = false;
        return;
      }
      
      const userId = parseJwt(idToken).sub;
      const stop = scannedStop.current;
      const startTime = localStorage.getItem('start_time') || "";
      const lastStartStop = localStorage.getItem('last_start_stop') || "";
      const timespan = Date.now() - Number.parseInt(startTime);

      // 檢查是否是終點站打卡，並且和起點站相同
      if (timespan && timespan <= 90 * 60 * 1000) {
        if (stop === lastStartStop) {
          alert("起點站和終點站不能是同一個站點！");
          isScanned.current = false;
          return;
        }
        
        // 終點站打卡
        const response = await fetch('https://mfi04yjgvi.execute-api.us-east-1.amazonaws.com/prod/setRecordEnd', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${idToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId,
            endStop: stop,
            uuid,
          })
        });
        
        const responseData = await response.json();

        if (responseData.statusCode >= 300) {
          throw new Error(JSON.stringify(responseData));
        }
        
        // 清除記錄起點站和時間的本地存儲
        if (localStorage.getItem('start_time')) {
          localStorage.removeItem('start_time');
        } else {
          localStorage.setItem('start_time', '' + Date.now());
        }
        localStorage.removeItem('last_start_stop');
      } else {
        // 起點站打卡
        const response = await fetch('https://mfi04yjgvi.execute-api.us-east-1.amazonaws.com/prod/setRecordStart', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${idToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId,
            startStop: stop,
            uuid,
          })
        });
        
        const responseData = await response.json();

        if (responseData.statusCode >= 300) {
          throw new Error(JSON.stringify(responseData));
        }
        
        // 記錄起點站和時間
        if (localStorage.getItem('start_time')) {
          localStorage.removeItem('start_time');
        } else {
          localStorage.setItem('start_time', '' + Date.now());
        }
        localStorage.setItem('last_start_stop', stop);
      }

      alert(`成功在 ${stop} 打卡！`);
      
      // 重新載入打卡記錄
      await loadUserRecords();
      
    } catch (error) {
      console.error('打卡錯誤:', error);
      alert(`打卡失敗，請稍後再試: ${error}`);
    } finally {
      // 延遲重置掃描狀態，允許下一次掃描
      setTimeout(() => {
        isScanned.current = false;
      }, 1500);
    }
  };

  // 格式化時間戳
  const formatTimestamp = (timestamp: string) => {
    try {
      // 嘗試直接解析日期字符串
      const date = new Date(timestamp);
      // 檢查日期是否有效
      if (isNaN(date.getTime())) {
        return timestamp;
      }
      return date.toLocaleString('zh-TW', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
    } catch {
      return timestamp;
    }
  };

  // 獲取今天、昨天和之前的記錄
  const getGroupedRecords = () => {
    if (!Array.isArray(records) || records.length === 0) {
      return { today: [], yesterday: [], earlier: [] };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const result = {
      today: [] as PunchRecord[],
      yesterday: [] as PunchRecord[],
      earlier: [] as PunchRecord[]
    };
    
    records.forEach(record => {
      const recordDate = new Date(record.startTime);
      recordDate.setHours(0, 0, 0, 0);
      
      if (recordDate.getTime() === today.getTime()) {
        result.today.push(record);
      } else if (recordDate.getTime() === yesterday.getTime()) {
        result.yesterday.push(record);
      } else {
        result.earlier.push(record);
      }
    });
    
    return result;
  };

  // 檢查是否有有效數據可以顯示
  const hasRecordsToDisplay = Array.isArray(records) && records.length > 0;
  const groupedRecords = getGroupedRecords();

  return (
    <main className="min-h-screen p-4">
      {/* 頂部導航欄 */}
      <nav className="fixed top-0 left-0 right-0 p-4 z-50 bg-white dark:bg-gray-800 shadow-md flex justify-between items-center">
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
            stop1
          </Button>
          <Button 
            color="primary" 
            size="lg" 
            className="text-xl px-6 py-5"
            onClick={() => handlePunch("stop2")}
          >
            stop2
          </Button>
          <Button 
            color="primary" 
            size="lg" 
            className="text-xl px-6 py-5"
            onClick={() => handlePunch("stop3")}
          >
            stop3
          </Button>
        </div>

        {/* 打卡記錄列表 */}
        <div className="w-full max-w-2xl">
          <h2 className="text-xl font-bold mb-4">打卡記錄</h2>
          
          {!hasRecordsToDisplay ? (
            <div className="text-center p-6 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p>暫無打卡記錄</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* 今天的記錄 */}
              {groupedRecords.today.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-2 text-gray-700 dark:text-gray-300">今天</h3>
                  <div className="space-y-2">
                    {groupedRecords.today.map((record) => (
                      <div
                        key={record.recordId}
                        className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg shadow"
                      >
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                              {record.startStop}{record.endStop ? ` - ${record.endStop}` : ""}
                            </span>
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {record.endTime 
                              ? `${formatTimestamp(record.startTime)} - ${formatTimestamp(record.endTime)}` 
                              : formatTimestamp(record.startTime)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* 昨天的記錄 */}
              {groupedRecords.yesterday.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-2 text-gray-700 dark:text-gray-300">昨天</h3>
                  <div className="space-y-2">
                    {groupedRecords.yesterday.map((record) => (
                      <div
                        key={record.recordId}
                        className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg shadow"
                      >
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                              {record.startStop}{record.endStop ? ` - ${record.endStop}` : ""}
                            </span>
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {record.endTime 
                              ? `${formatTimestamp(record.startTime)} - ${formatTimestamp(record.endTime)}` 
                              : formatTimestamp(record.startTime)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* 更早的記錄 */}
              {groupedRecords.earlier.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-2 text-gray-700 dark:text-gray-300">更早</h3>
                  <div className="space-y-2">
                    {groupedRecords.earlier.map((record) => (
                      <div
                        key={record.recordId}
                        className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg shadow"
                      >
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                              {record.startStop}{record.endStop ? ` - ${record.endStop}` : ""}
                            </span>
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {formatTimestamp(record.startTime)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
