"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

type Log = {
  id: string;
  imageUrl: string;
  details: { title: string; price?: string; note?: string };
  status: string;
  errorMessage: string | null;
  sentAt: string;
  targetUser: { fullName: string; email: string };
  sender: { fullName: string };
};

export default function HistoryPage() {
  const router = useRouter();
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const fetchLogs = useCallback(async () => {
    if (!token) return;
    const res = await fetch("/api/history", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.status === 401) { router.push("/login"); return; }
    const data = await res.json();
    setLogs(data.logs || []);
    setLoading(false);
  }, [token, router]);

  useEffect(() => {
    if (!token) { router.push("/login"); return; }
    fetchLogs();
  }, [token, router, fetchLogs]);

  return (
    <div className="max-w-lg mx-auto p-6 space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={() => router.push("/dashboard")} className="text-gray-500 hover:text-gray-700">←</button>
        <h1 className="text-xl font-bold text-gray-800">ประวัติการส่ง</h1>
      </div>

      {loading ? (
        <p className="text-center text-gray-400 py-8">กำลังโหลด...</p>
      ) : logs.length === 0 ? (
        <p className="text-center text-gray-400 py-8">ยังไม่มีประวัติการส่ง</p>
      ) : (
        <div className="space-y-3">
          {logs.map((log) => (
            <div key={log.id} className="bg-white border rounded-xl overflow-hidden shadow-sm">
              <div className="flex gap-3 p-3">
                <div className="relative w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
                  <Image src={log.imageUrl} alt={log.details.title} fill className="object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-semibold text-gray-800 text-sm truncate">{log.details.title}</p>
                    <span className={`flex-shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${
                      log.status === "success"
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-600"
                    }`}>
                      {log.status === "success" ? "สำเร็จ" : "ล้มเหลว"}
                    </span>
                  </div>
                  {log.details.price && (
                    <p className="text-xs text-gray-500">{log.details.price}</p>
                  )}
                  <p className="text-xs text-gray-400 mt-1">
                    ส่งถึง: {log.targetUser.fullName}
                  </p>
                  <p className="text-xs text-gray-400">
                    {new Date(log.sentAt).toLocaleString("th-TH")}
                  </p>
                  {log.errorMessage && (
                    <p className="text-xs text-red-500 mt-1">{log.errorMessage}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
