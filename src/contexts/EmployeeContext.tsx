"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Employee, employeeService } from "@/lib/firestore";
import { useAuth } from "@/context/AuthContext";

interface EmployeeContextType {
    employee: Employee | null;
    loading: boolean;
    lineUserId: string | null;
    lineProfile: any | null;
    refreshEmployee: () => Promise<void>;
}

const EmployeeContext = createContext<EmployeeContextType>({
    employee: null,
    loading: true,
    lineUserId: null,
    lineProfile: null,
    refreshEmployee: async () => { },
});

export function EmployeeProvider({ children }: { children: ReactNode }) {
    const { userProfile, loading: authLoading } = useAuth();
    const [employee, setEmployee] = useState<Employee | null>(null);
    const [loading, setLoading] = useState(true);
    const [lineUserId, setLineUserId] = useState<string | null>(null);
    const [lineProfile, setLineProfile] = useState<any | null>(null);

    useEffect(() => {
        const loadEmployee = async () => {
            if (authLoading) return; // Wait for auth to finish

            if (userProfile) {
                // User is authenticated via Firebase (and likely LIFF)
                // Use the info from userProfile
                // userProfile.lineId is crucial here
                if (userProfile.lineId) {
                    setLineUserId(userProfile.lineId);

                    // Set lineProfile from userProfile data
                    setLineProfile({
                        userId: userProfile.lineId,
                        displayName: userProfile.displayName,
                        pictureUrl: userProfile.pictureUrl || userProfile.imageUrl,
                    });

                    // Fetch Employee Data
                    try {
                        const data = await employeeService.getByLineUserId(userProfile.lineId);
                        setEmployee(data);
                    } catch (error) {
                        console.error("Error fetching employee:", error);
                        setEmployee(null);
                    }
                } else {
                    // User authenticated but no lineId? (Maybe email login?)
                    // For now, assume this context is for LINE-bound employees.
                    console.warn("User authenticated but has no lineId:", userProfile);
                }
            } else {
                // Not logged in
                setEmployee(null);
                setLineUserId(null);
                setLineProfile(null);
            }
            setLoading(false);
        };

        loadEmployee();
    }, [userProfile, authLoading]);

    const refreshEmployee = async () => {
        if (lineUserId) {
            try {
                const data = await employeeService.getByLineUserId(lineUserId);
                setEmployee(data);
            } catch (error) {
                console.error("Error refreshing employee:", error);
            }
        }
    };

    // Combine loading states
    const isLoading = loading || authLoading;

    return (
        <EmployeeContext.Provider value={{ employee, loading: isLoading, lineUserId, lineProfile, refreshEmployee }}>
            {authLoading ? (
                <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                    <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
            ) : children}
        </EmployeeContext.Provider>
    );
}

export const useEmployee = () => useContext(EmployeeContext);
