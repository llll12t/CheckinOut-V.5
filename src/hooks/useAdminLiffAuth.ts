"use client";

import { useState, useEffect } from 'react';

interface UseAdminLiffAuthReturn {
    loading: boolean;
    error: string | null;
    isInLineApp: boolean;
    adminProfile: any | null;
    needsLink: boolean;
    linkProfile: any | null;
}

export default function useAdminLiffAuth(): UseAdminLiffAuthReturn {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isInLineApp, setIsInLineApp] = useState(false);
    const [adminProfile, setAdminProfile] = useState<any | null>(null);
    const [needsLink, setNeedsLink] = useState(false);
    const [linkProfile, setLinkProfile] = useState<any | null>(null);

    useEffect(() => {
        const init = async () => {
            try {
                // Check if we're in LINE's in-app browser
                const userAgent = typeof window !== 'undefined' ? window.navigator.userAgent : '';
                const inLineApp = /Line/i.test(userAgent);
                setIsInLineApp(inLineApp);

                if (!inLineApp) {
                    // Not in LINE, skip LIFF initialization
                    setLoading(false);
                    return;
                }

                console.log('🔧 Detected LINE Browser, initializing LIFF for Admin...');

                // Use the same LIFF ID as approvals or create a new one for admin
                // For now, we'll use NEXT_PUBLIC_LIFF_APPROVE_ID or NEXT_PUBLIC_LIFF_ID
                const liffId = process.env.NEXT_PUBLIC_LIFF_APPROVE_ID || process.env.NEXT_PUBLIC_LIFF_ID;

                if (!liffId) {
                    console.error('LIFF ID not configured');
                    setError('LIFF ID not configured');
                    setLoading(false);
                    return;
                }

                // Dynamic import LIFF SDK
                const liffModule = (await import('@line/liff')).default;
                await liffModule.init({ liffId });

                if (!liffModule.isLoggedIn()) {
                    // Redirect to LINE login
                    liffModule.login();
                    return;
                }

                const accessToken = liffModule.getAccessToken();
                if (!accessToken) {
                    setError('No access token');
                    setLoading(false);
                    return;
                }

                // Exchange LINE access token for Firebase custom token
                const response = await fetch('/api/auth/admin-line', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ accessToken }),
                });

                if (!response.ok) {
                    const errBody = await response.text();
                    throw new Error(`Auth failed: ${response.status} ${errBody}`);
                }

                const data = await response.json();

                if (data.needsLink) {
                    setNeedsLink(true);
                    setLinkProfile(data.profile || null);
                    setLoading(false);
                    return;
                }

                const { customToken, adminProfile: receivedProfile } = data;

                // Sign in with custom token
                const { getAuth, signInWithCustomToken } = await import('firebase/auth');
                const { auth } = await import('@/lib/firebase');
                await signInWithCustomToken(auth, customToken);

                setAdminProfile(receivedProfile);
                setLoading(false);

            } catch (err: any) {
                console.error('useAdminLiffAuth error:', err);
                setError(err?.message || 'Authentication error');
                setLoading(false);
            }
        };

        init();
    }, []);

    return { loading, error, isInLineApp, adminProfile, needsLink, linkProfile };
}
