import { EmployeeProvider } from "@/contexts/EmployeeContext";
import { AuthProvider } from "@/context/AuthContext";
import LiffLoginWrapper from "@/components/auth/LiffLoginWrapper";

export default function EmployeeLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <AuthProvider>
            <LiffLoginWrapper>
                <EmployeeProvider>
                    {children}
                </EmployeeProvider>
            </LiffLoginWrapper>
        </AuthProvider>
    );
}
