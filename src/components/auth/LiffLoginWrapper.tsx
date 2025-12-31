"use client";

import { useAuth } from "@/context/AuthContext";
import useLiffAuth from '@/hooks/useLiffAuth';
import { useState, useEffect } from 'react';

// You might need a ModalProvider if used in the original code, but here we'll simplify or just wrap children
// For this wrapper, we focus on the Auth Logic.

export default function LiffLoginWrapper({ children }: { children: React.ReactNode }) {
    const { loading: authLoading, setUserProfileFromAuth } = useAuth();
    const { loading: liffLoading, needsLink, linkProfile, linkByPhone, error: liffAuthError, userProfile: liffUserProfile } = useLiffAuth();
    const [phoneInput, setPhoneInput] = useState('');
    const [linking, setLinking] = useState(false);
    const [linkMessage, setLinkMessage] = useState('');

    useEffect(() => {
        if (liffUserProfile && setUserProfileFromAuth) {
            console.log('Setting userProfile from LIFF auth:', liffUserProfile);
            setUserProfileFromAuth(liffUserProfile);
        }
    }, [liffUserProfile, setUserProfileFromAuth]);

    if (liffLoading || authLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="mb-4">
                        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                    </div>
                    <h1 className="text-xl font-bold text-gray-800">กำลังเข้าสู่ระบบ...</h1>
                </div>
            </div>
        );
    }

    if (liffAuthError) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-red-50 p-6">
                <div className="bg-white p-6 rounded-lg shadow-md max-w-sm w-full text-center">
                    <h3 className="text-lg font-bold text-red-600 mb-2">เกิดข้อผิดพลาด!</h3>
                    <div className="bg-gray-100 p-3 rounded text-sm font-mono text-left text-red-800 break-words mb-4">
                        {typeof liffAuthError === 'string' ? liffAuthError : JSON.stringify(liffAuthError)}
                    </div>
                    <button
                        onClick={() => window.location.reload()}
                        className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 w-full"
                    >
                        ลองใหม่
                    </button>
                </div>
            </div>
        );
    }

    if (needsLink) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
                <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
                    <div className="mb-4">
                        <h2 className="text-xl font-bold text-center mb-2">ผูกบัญชีด้วยหมายเลขโทรศัพท์</h2>
                        <p className="text-sm text-gray-600 text-center mb-6">
                            เราไม่พบบัญชีพนักงานที่เชื่อมกับ LINE นี้ ({linkProfile?.displayName || ''})
                        </p>
                    </div>

                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            หมายเลขโทรศัพท์
                        </label>
                        <input
                            value={phoneInput}
                            onChange={(e) => setPhoneInput(e.target.value)}
                            placeholder="0812345678"
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:blue-500"
                            type="tel"
                        />
                    </div>

                    {linkMessage && (
                        <div className={`mb-4 p-3 rounded ${linkMessage.includes('สำเร็จ') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                            <p className="text-sm">{linkMessage}</p>
                        </div>
                    )}

                    <button
                        onClick={async () => {
                            setLinking(true);
                            setLinkMessage('');
                            const res = await linkByPhone(phoneInput.trim());
                            if (res.success) {
                                setLinkMessage('ผูกบัญชีสำเร็จ กำลังโหลดข้อมูล...');
                            } else {
                                setLinkMessage(res.error || 'ไม่สามารถผูกบัญชีได้');
                            }
                            setLinking(false);
                        }}
                        className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
                        disabled={linking || !phoneInput.trim()}
                    >
                        {linking ? 'กำลังผูกบัญชี...' : 'ผูกบัญชี'}
                    </button>
                </div>
            </div>
        );
    }

    return <>{children}</>;
}
