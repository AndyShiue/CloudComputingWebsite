'use client'

import React, { useEffect, useState } from 'react';
import { Button } from "@nextui-org/react";
import { useRouter } from 'next/navigation';
import { useAuth } from '../hooks/useAuth';

// 排行榜用戶類型
interface RankingUser {
  userId: string;
  count: number;
}

export default function RankingPage() {
  const [rankings, setRankings] = useState<RankingUser[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [debug, setDebug] = useState<string>("");
  const router = useRouter();
  const { isLoggedIn } = useAuth();

  useEffect(() => {
    if (isLoggedIn === false) {
      router.push('/');
    } else if (isLoggedIn) {
      loadRankingData();
    }
  }, [isLoggedIn, router]);

  const loadRankingData = async () => {
    setLoading(true);
    try {
      const idToken = localStorage.getItem("id_token");
      if (!idToken) {
        setError('請先登入');
        setLoading(false);
        return;
      }

      // API 調用 - 獲取排行榜數據
      const response = await fetch(`https://mfi04yjgvi.execute-api.us-east-1.amazonaws.com/prod/getRecordAll`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${idToken}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      
      // 將數據轉換為字符串以顯示於調試用途
      setDebug(JSON.stringify(data, null, 2));
      console.log('Ranking data:', data);

      // 嘗試解析嵌套結構
      let usersData: Record<string, number> = {};
      let parsedCorrectly = false;

      // 嘗試方法1: 如果 body 是字符串形式的 JSON
      if (data && typeof data.body === 'string') {
        try {
          const parsed = JSON.parse(data.body);
          
          if (typeof parsed === 'object' && parsed !== null) {
            // 檢查是否還有更深一層
            if (parsed.body && typeof parsed.body === 'object') {
              usersData = parsed.body;
            } else {
              // 假設這個層級就是用戶數據 {userId: count}
              usersData = parsed;
            }
            parsedCorrectly = true;
          }
        } catch (e) {
          console.error("解析 JSON 字符串失敗:", e);
        }
      }
      
      // 嘗試方法2: 如果 body 已經是對象
      if (!parsedCorrectly && data && typeof data.body === 'object' && data.body !== null) {
        if (data.body.body && typeof data.body.body === 'object') {
          usersData = data.body.body;
        } else {
          usersData = data.body;
        }
        parsedCorrectly = true;
      }

      // 嘗試方法3: 直接使用頂層數據
      if (!parsedCorrectly && typeof data === 'object' && data !== null) {
        usersData = data;
      }

      // 轉換為數組格式
      const rankingArray: RankingUser[] = [];
      
      // 遍歷對象，只保留有效的數字值
      Object.entries(usersData).forEach(([key, value]) => {
        // 排除 body, message 等非用戶ID的鍵
        if (key !== 'body' && key !== 'message' && key !== 'statusCode') {
          const count = typeof value === 'number' ? value : 
                        typeof value === 'string' ? parseInt(value, 10) : 0;
                        
          if (!isNaN(count)) {
            rankingArray.push({
              userId: key,
              count: count
            });
          }
        }
      });
      
      // 按打卡次數降序排序
      rankingArray.sort((a, b) => b.count - a.count);
      
      if (rankingArray.length > 0) {
        setRankings(rankingArray);
      } else {
        setError('找不到有效的排行榜數據');
      }
    } catch (err) {
      console.error('載入排行榜時出錯:', err);
      setError('載入排行榜數據失敗: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setLoading(false);
    }
  };

  const formatUserId = (userId: string): string => {
    // 簡化顯示用戶ID
    if (userId.length > 12) {
      return userId.substring(0, 6) + '...' + userId.substring(userId.length - 6);
    }
    return userId;
  };

  const goBack = () => {
    router.push('/profile');
  };

  return (
    <main className="min-h-screen p-4 bg-gray-800">
      {/* 頂部導航欄 */}
      <nav className="fixed top-0 left-0 right-0 p-4 z-50 bg-white dark:bg-black shadow-md flex justify-between items-center">
        <div className="w-24 flex justify-start">
          <Button
            color="primary" 
            variant="light"
            onClick={goBack}
          >
            返回
          </Button>
        </div>
        
        <h1 className="text-2xl font-bold text-center">排行榜</h1>
        
        <div className="w-24">
        </div>
      </nav>

      {/* 主要內容 */}
      <div className="pt-24 flex flex-col items-center">
        {loading ? (
          <div className="w-full max-w-2xl text-center p-8">
            <p className="text-gray-600 dark:text-gray-400">載入中...</p>
          </div>
        ) : error ? (
          <div className="w-full max-w-2xl text-center p-8">
            <p className="text-red-500">{error}</p>
            <div className="mt-4 p-4 bg-gray-800 text-xs text-white rounded overflow-auto max-h-60">
              <pre>{debug}</pre>
            </div>
          </div>
        ) : rankings.length === 0 ? (
          <div className="w-full max-w-2xl text-center p-8">
            <p className="text-gray-600 dark:text-gray-400">暫無排行榜數據</p>
            <div className="mt-4 p-4 bg-gray-800 text-xs text-white rounded overflow-auto max-h-60">
              <pre>{debug}</pre>
            </div>
          </div>
        ) : (
          <div className="w-full max-w-2xl">
            
            {/* 前三名 - 特別顯示 */}
            <div className="mb-8 flex justify-center items-end gap-4">
              {/* 第二名 */}
              {rankings.length > 1 && (
                <div className="flex flex-col items-center">
                  <div className="w-16 h-16 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden mb-2 border-2 border-silver">
                    <div className="w-full h-full flex items-center justify-center text-xl font-bold">
                      2
                    </div>
                  </div>
                  <p className="font-medium text-gray-800 dark:text-gray-200">{formatUserId(rankings[1].userId)}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{rankings[1].count} 次打卡</p>
                </div>
              )}

              {/* 第一名 */}
              {rankings.length > 0 && (
                <div className="flex flex-col items-center -mt-4">
                  <div className="w-20 h-20 rounded-full bg-yellow-100 dark:bg-yellow-900 overflow-hidden mb-2 border-2 border-yellow-400">
                    <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-yellow-600 dark:text-yellow-300">
                      1
                    </div>
                  </div>
                  <p className="font-semibold text-lg text-gray-800 dark:text-gray-200">{formatUserId(rankings[0].userId)}</p>
                  <p className="text-gray-600 dark:text-gray-400">{rankings[0].count} 次打卡</p>
                </div>
              )}

              {/* 第三名 */}
              {rankings.length > 2 && (
                <div className="flex flex-col items-center">
                  <div className="w-16 h-16 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden mb-2 border-2 border-bronze">
                    <div className="w-full h-full flex items-center justify-center text-xl font-bold">
                      3
                    </div>
                  </div>
                  <p className="font-medium text-gray-800 dark:text-gray-200">{formatUserId(rankings[2].userId)}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{rankings[2].count} 次打卡</p>
                </div>
              )}
            </div>

            {/* 排名列表 - 第四名開始 */}
            {rankings.length > 3 && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-900">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        排名
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        用戶ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        打卡次數
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {rankings.slice(3).map((user, index) => (
                      <tr key={user.userId}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                          {index + 4}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {formatUserId(user.userId)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {user.count}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
} 