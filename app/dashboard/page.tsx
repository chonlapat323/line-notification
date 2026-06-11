"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ fullName: string; email: string } | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const u = localStorage.getItem("user");
    if (!token || !u) { router.push("/login"); return; }
    setUser(JSON.parse(u));
  }, [router]);

  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/login");
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-gray-800">BeautyUp LINE</h1>
          <p className="text-xs text-gray-500">{user.fullName}</p>
        </div>
        <button onClick={logout} className="text-sm text-gray-500 hover:text-red-500">
          ออกจากระบบ
        </button>
      </div>

      {/* Menu */}
      <div className="max-w-lg mx-auto p-6 space-y-4">
        <button
          onClick={() => router.push("/dashboard/send")}
          className="w-full bg-green-500 hover:bg-green-600 text-white rounded-2xl p-5 flex items-center gap-4 shadow transition"
        >
          <span className="text-4xl">📤</span>
          <div className="text-left">
            <p className="font-bold text-lg">ส่งรูปเข้า LINE Group</p>
            <p className="text-sm text-green-100">อัพโหลดรูป + กรอกรายละเอียด แล้วส่งได้เลย</p>
          </div>
        </button>

        <button
          onClick={() => router.push("/dashboard/connect")}
          className="w-full bg-white border-2 border-green-200 hover:border-green-400 text-gray-700 rounded-2xl p-5 flex items-center gap-4 shadow-sm transition"
        >
          <span className="text-4xl">🔗</span>
          <div className="text-left">
            <p className="font-bold text-lg">เชื่อมต่อ LINE Group</p>
            <p className="text-sm text-gray-400">ผูก LINE Group ของคุณกับระบบ</p>
          </div>
        </button>
      </div>
    </div>
  );
}
