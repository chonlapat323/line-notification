"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";

type LineGroup = { id: string; groupName: string | null; verifiedAt: string | null };
type User = {
  id: string;
  email: string;
  fullName: string;
  isActive: boolean;
  createdAt: string;
  lineGroups: LineGroup[];
};

export default function UsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ email: "", fullName: "", password: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const fetchUsers = useCallback(async () => {
    if (!token) return;
    const res = await fetch("/api/users", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.status === 401) { router.push("/login"); return; }
    const data = await res.json();
    setUsers(data.users || []);
    setLoading(false);
  }, [token, router]);

  useEffect(() => {
    if (!token) { router.push("/login"); return; }
    fetchUsers();
  }, [token, router, fetchUsers]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const res = await fetch("/api/users", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) { setError(data.error); return; }
    setShowForm(false);
    setForm({ email: "", fullName: "", password: "" });
    fetchUsers();
  }

  return (
    <div className="max-w-lg mx-auto p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push("/dashboard")} className="text-gray-500 hover:text-gray-700">←</button>
          <h1 className="text-xl font-bold text-gray-800">จัดการ User</h1>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-green-500 hover:bg-green-600 text-white text-sm font-semibold px-4 py-2 rounded-lg transition"
        >
          + เพิ่ม User
        </button>
      </div>

      {/* Form เพิ่ม User */}
      {showForm && (
        <div className="bg-white border rounded-xl p-5 shadow-sm space-y-3">
          <p className="font-semibold text-gray-700">เพิ่ม User ใหม่</p>
          <form onSubmit={handleCreate} className="space-y-3">
            <input
              type="text"
              placeholder="ชื่อ-นามสกุล"
              value={form.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
            />
            <input
              type="email"
              placeholder="อีเมล"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
            />
            <input
              type="password"
              placeholder="รหัสผ่าน"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
            />
            {error && <p className="text-sm text-red-500">{error}</p>}
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 bg-green-500 hover:bg-green-600 text-white font-semibold py-2 rounded-lg transition disabled:opacity-50"
              >
                {saving ? "กำลังบันทึก..." : "บันทึก"}
              </button>
              <button
                type="button"
                onClick={() => { setShowForm(false); setError(""); }}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2 rounded-lg transition"
              >
                ยกเลิก
              </button>
            </div>
          </form>
        </div>
      )}

      {/* รายการ User */}
      {loading ? (
        <p className="text-center text-gray-400 py-8">กำลังโหลด...</p>
      ) : users.length === 0 ? (
        <p className="text-center text-gray-400 py-8">ยังไม่มี User</p>
      ) : (
        <div className="space-y-3">
          {users.map((u) => (
            <div key={u.id} className="bg-white border rounded-xl p-4 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-gray-800">{u.fullName}</p>
                  <p className="text-sm text-gray-500">{u.email}</p>
                </div>
                {u.lineGroups.length > 0 ? (
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">
                    เชื่อม LINE แล้ว
                  </span>
                ) : (
                  <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded-full">
                    ยังไม่เชื่อม
                  </span>
                )}
              </div>
              {u.lineGroups.length > 0 && (
                <div className="mt-2 space-y-1">
                  {u.lineGroups.map((g) => (
                    <p key={g.id} className="text-xs text-gray-400">
                      • {g.groupName || "กลุ่มไม่มีชื่อ"}
                    </p>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
