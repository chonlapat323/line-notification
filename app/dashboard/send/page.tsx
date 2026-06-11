"use client";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

type SendResult = { userId: string; status: string; error?: string };

export default function SendPage() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [note, setNote] = useState("");
  const [targetSelf, setTargetSelf] = useState(true);
  const [sending, setSending] = useState(false);
  const [results, setResults] = useState<SendResult[] | null>(null);
  const [error, setError] = useState("");

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const user = typeof window !== "undefined" ? JSON.parse(localStorage.getItem("user") || "{}") : {};

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!file || !title) { setError("กรุณาเลือกรูปและกรอกชื่อ"); return; }
    if (!token) { router.push("/login"); return; }

    setSending(true);
    setError("");
    setResults(null);

    const formData = new FormData();
    formData.append("image", file);
    formData.append("title", title);
    formData.append("price", price);
    formData.append("note", note);
    formData.append("targetUserIds", JSON.stringify([user.id]));

    const res = await fetch("/api/line/send", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });

    const data = await res.json();
    setSending(false);

    if (!res.ok) { setError(data.error || "เกิดข้อผิดพลาด"); return; }
    setResults(data.results);
  }

  return (
    <div className="max-w-lg mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => router.push("/dashboard")} className="text-gray-500 hover:text-gray-700">←</button>
        <h1 className="text-xl font-bold text-gray-800">ส่งรูปเข้า LINE Group</h1>
      </div>

      <form onSubmit={handleSend} className="space-y-4">
        {/* อัพโหลดรูป */}
        <div
          onClick={() => fileRef.current?.click()}
          className="border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-green-400 transition overflow-hidden"
        >
          {preview ? (
            <div className="relative w-full h-56">
              <Image src={preview} alt="preview" fill className="object-cover" />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-40 text-gray-400">
              <span className="text-4xl mb-2">📷</span>
              <p className="text-sm">กดเพื่อเลือกรูป</p>
            </div>
          )}
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
        </div>

        {/* รายละเอียด */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            ชื่อสินค้า / หัวข้อ <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
            placeholder="เช่น ลิปสติกสีแดง"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">ราคา</label>
          <input
            type="text"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
            placeholder="เช่น 350 บาท"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">หมายเหตุ</label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 resize-none"
            placeholder="รายละเอียดเพิ่มเติม..."
          />
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <button
          type="submit"
          disabled={sending || !file}
          className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-3 rounded-xl transition disabled:opacity-50"
        >
          {sending ? "กำลังส่ง..." : "ส่งเข้า LINE Group"}
        </button>
      </form>

      {/* ผลลัพธ์ */}
      {results && (
        <div className="bg-white border rounded-xl p-4 shadow-sm space-y-2">
          <p className="font-semibold text-gray-700">ผลการส่ง</p>
          {results.map((r, i) => (
            <div key={i} className={`flex items-center gap-2 text-sm p-2 rounded-lg ${r.status === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
              <span>{r.status === "success" ? "✓" : "✗"}</span>
              <span>{r.status === "success" ? "ส่งสำเร็จ" : r.error}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
