"use client";

import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Lock, Mail, AlertCircle, Loader2 } from "lucide-react";
import { adminService } from "@/lib/firestore";
import useAdminLiffAuth from "@/hooks/useAdminLiffAuth";

export default function AdminLoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    // LINE Auto Login hook
    const {
        loading: liffLoading,
        error: liffError,
        isInLineApp,
        adminProfile,
        needsLink,
        linkProfile
    } = useAdminLiffAuth();

    // Auto redirect if logged in via LINE
    useEffect(() => {
        if (adminProfile && !liffLoading) {
            console.log("Admin logged in via LINE:", adminProfile);
            router.push("/admin");
        }
    }, [adminProfile, liffLoading, router]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            await signInWithEmailAndPassword(auth, email, password);

            // Update last login
            const admin = await adminService.getByEmail(email);
            if (admin && admin.id) {
                await adminService.update(admin.id, { lastLogin: new Date() });
            }

            router.push("/admin");
        } catch (err: any) {
            console.error("Login error:", err);
            if (err.code === "auth/invalid-credential") {
                setError("อีเมลหรือรหัสผ่านไม่ถูกต้อง");
            } else if (err.code === "auth/user-not-found") {
                setError("ไม่พบผู้ใช้งานนี้");
            } else if (err.code === "auth/wrong-password") {
                setError("รหัสผ่านไม่ถูกต้อง");
            } else {
                setError("เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง");
            }
        } finally {
            setLoading(false);
        }
    };

    // Show loading while LIFF is initializing (only in LINE browser)
    if (isInLineApp && liffLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-50 flex items-center justify-center p-4">
                <div className="text-center">
                    <div className="w-20 h-20 bg-[#059669] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                        <Loader2 className="w-10 h-10 text-white animate-spin" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-800 mb-2">กำลังเข้าสู่ระบบ...</h2>
                    <p className="text-gray-500 text-sm">เชื่อมต่อกับ LINE</p>
                </div>
            </div>
        );
    }

    // Show message if LINE account is not linked to any admin
    if (isInLineApp && needsLink) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-50 flex items-center justify-center p-4">
                <div className="w-full max-w-md">
                    <div className="bg-white rounded-3xl shadow-2xl p-8 border border-gray-100">
                        <div className="text-center mb-6">
                            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <AlertCircle className="w-8 h-8 text-yellow-600" />
                            </div>
                            <h2 className="text-xl font-bold text-gray-800 mb-2">ไม่พบบัญชีผู้ดูแลระบบ</h2>
                            <p className="text-gray-600 text-sm">
                                บัญชี LINE นี้ ({linkProfile?.displayName || 'Unknown'}) ยังไม่ได้ผูกกับบัญชีผู้ดูแลระบบ
                            </p>
                        </div>

                        <div className="bg-gray-50 rounded-xl p-4 mb-6">
                            <p className="text-sm text-gray-600 mb-2">
                                <strong>LINE User ID:</strong>
                            </p>
                            <code className="text-xs bg-gray-200 px-2 py-1 rounded break-all">
                                {linkProfile?.lineId || '-'}
                            </code>
                        </div>

                        <p className="text-sm text-gray-500 text-center mb-4">
                            กรุณาติดต่อ Super Admin เพื่อเพิ่ม LINE User ID นี้ในหน้าจัดการผู้ดูแลระบบ
                        </p>

                        <p className="text-xs text-gray-400 text-center">
                            หรือใช้ Email/Password เข้าสู่ระบบผ่าน Browser ปกติ
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    // Show LIFF error if any
    if (isInLineApp && liffError) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-red-50 flex items-center justify-center p-4">
                <div className="w-full max-w-md">
                    <div className="bg-white rounded-3xl shadow-2xl p-8 border border-gray-100">
                        <div className="text-center mb-6">
                            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <AlertCircle className="w-8 h-8 text-red-600" />
                            </div>
                            <h2 className="text-xl font-bold text-gray-800 mb-2">เกิดข้อผิดพลาด</h2>
                            <p className="text-red-600 text-sm">{liffError}</p>
                        </div>
                        <Button
                            onClick={() => window.location.reload()}
                            className="w-full h-12 bg-red-600 hover:bg-red-700 text-white rounded-xl"
                        >
                            ลองใหม่
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    // Normal Email/Password login form
    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                <h3 className="text-3xl font-bold text-center mb-6"> CHECK IN-OUT V.5</h3>

                {/* Login Form */}
                <div className="bg-white rounded-3xl shadow-2xl p-8 border border-gray-100">
                    <form onSubmit={handleLogin} className="space-y-6">
                        {/* Error Message */}
                        {error && (
                            <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
                                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                                <p className="text-sm text-red-700">{error}</p>
                            </div>
                        )}

                        {/* Email Input */}
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                                อีเมล
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#059669]/20 focus:border-[#059669] transition-all"
                                    placeholder="admin@example.com"
                                    required
                                />
                            </div>
                        </div>

                        {/* Password Input */}
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                                รหัสผ่าน
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    id="password"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#059669]/20 focus:border-[#059669] transition-all"
                                    placeholder="••••••••"
                                    required
                                />
                            </div>
                        </div>

                        {/* Remember Me & Forgot Password */}
                        <div className="flex items-center justify-between text-sm">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="w-4 h-4 rounded border-gray-300 text-[#059669] focus:ring-[#059669]"
                                />
                                <span className="text-gray-600">จดจำฉันไว้</span>
                            </label>
                            <a href="#" className="text-[#059669] hover:underline hover:text-[#047857]">
                                ลืมรหัสผ่าน?
                            </a>
                        </div>

                        {/* Login Button */}
                        <Button
                            type="submit"
                            disabled={loading}
                            className="w-full h-12 bg-[#059669] hover:bg-[#047857] text-white rounded-xl font-medium text-base shadow-lg shadow-[#059669]/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <div className="flex items-center gap-2">
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    กำลังเข้าสู่ระบบ...
                                </div>
                            ) : (
                                "เข้าสู่ระบบ"
                            )}
                        </Button>
                    </form>
                </div>

                {/* Footer */}
                <p className="text-center text-sm text-gray-600 mt-6">
                    © 3RN Studio
                </p>
            </div>
        </div>
    );
}
