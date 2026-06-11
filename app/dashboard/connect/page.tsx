"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";

type LineGroup = {
  id: string;
  lineGroupId: string;
  groupName: string | null;
  verifiedAt: string | null;
  isActive: boolean;
};

export default function ConnectLinePage() {
  const router = useRouter();
  const [code, setCode] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [groups, setGroups] = useState<LineGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const fetchGroups = useCallback(async () => {
    if (!token) return;
    const res = await fetch("/api/line/code", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.status === 401) { router.push("/login"); return; }
    const data = await res.json();
    setGroups(data.groups || []);
  }, [token, router]);

  useEffect(() => {
    if (!token) { router.push("/login"); return; }
    fetchGroups();
    // polling ทุก 5 วิ เพื่อ update สถานะเชื่อมต่อ
    const interval = setInterval(fetchGroups, 5000);
    return () => clearInterval(interval);
  }, [token, router, fetchGroups]);

  async function generateCode() {
    if (!token) return;
    setLoading(true);
    const res = await fetch("/api/line/code", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    setCode(data.code);
    setExpiresAt(data.expiresAt);
    setLoading(false);
  }

  function copyCode() {
    if (!code) return;
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="max-w-lg mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => router.push("/dashboard")} className="text-gray-500 hover:text-gray-700">←</button>
        <h1 className="text-xl font-bold text-gray-800">เชื่อมต่อ LINE Group</h1>
      </div>

      {/* กลุ่มที่เชื่อมอยู่แล้ว */}
      {groups.length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
          <p className="text-sm font-semibold text-green-700 mb-2">กลุ่มที่เชื่อมต่อแล้ว ✓</p>
          {groups.map((g) => (
            <div key={g.id} className="flex items-center gap-2 text-sm text-green-800">
              <span>•</span>
              <span>{g.groupName || g.lineGroupId}</span>
            </div>
          ))}
        </div>
      )}

      {/* ขั้นตอน */}
      <div className="bg-white border rounded-xl p-5 space-y-4 shadow-sm">
        <p className="font-semibold text-gray-700">วิธีเชื่อมต่อกลุ่ม LINE ของคุณ</p>

        <div className="space-y-3 text-sm text-gray-600">
          <div className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 bg-green-100 text-green-700 rounded-full flex items-center justify-center font-bold text-xs">1</span>
            <p>เพิ่ม <strong>BeautyUp Bot</strong> เป็นเพื่อนใน LINE ก่อน</p>
          </div>
          <div className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 bg-green-100 text-green-700 rounded-full flex items-center justify-center font-bold text-xs">2</span>
            <p>เปิดกลุ่ม LINE ของคุณ → เพิ่มสมาชิก → เลือก <strong>BeautyUp Bot</strong></p>
          </div>
          <div className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 bg-green-100 text-green-700 rounded-full flex items-center justify-center font-bold text-xs">3</span>
            <p>กดปุ่มด้านล่างเพื่อรับรหัส แล้วพิมพ์รหัสในกลุ่ม LINE</p>
          </div>
        </div>

        {!code ? (
          <button
            onClick={generateCode}
            disabled={loading}
            className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-2 rounded-lg transition disabled:opacity-50"
          >
            {loading ? "กำลังสร้างรหัส..." : "ขอรหัสยืนยัน"}
          </button>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-gray-500">พิมพ์รหัสนี้ในกลุ่ม LINE:</p>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-gray-100 rounded-lg px-4 py-3 text-center text-2xl font-bold tracking-widest text-gray-800">
                {code}
              </div>
              <button
                onClick={copyCode}
                className="px-4 py-3 bg-gray-200 hover:bg-gray-300 rounded-lg text-sm font-medium transition"
              >
                {copied ? "✓" : "คัดลอก"}
              </button>
            </div>
            {expiresAt && (
              <p className="text-xs text-gray-400 text-center">
                รหัสหมดอายุ: {new Date(expiresAt).toLocaleString("th-TH")}
              </p>
            )}
            <button
              onClick={generateCode}
              className="w-full text-sm text-gray-500 hover:text-gray-700 underline"
            >
              ขอรหัสใหม่
            </button>
            <div className="flex items-center gap-2 text-sm text-yellow-600 bg-yellow-50 rounded-lg p-2">
              <span>⏳</span>
              <span>รอการยืนยันจาก LINE... (หน้านี้จะอัปเดตอัตโนมัติ)</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
