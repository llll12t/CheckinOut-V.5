"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { swapService, systemConfigService } from "@/lib/firestore";
import { EmployeeHeader } from "@/components/mobile/EmployeeHeader";
import { useEmployee } from "@/contexts/EmployeeContext";
import { ArrowLeftRight, Send, CheckCircle, AlertCircle } from "lucide-react";
import { addDays, startOfDay, differenceInCalendarDays, format } from "date-fns";
import { th } from "date-fns/locale";

export default function SwapRequestPage() {
    const { employee } = useEmployee();
    const [workDate, setWorkDate] = useState("");     // วันหยุดปกติที่ขอมาทำงานแทน
    const [holidayDate, setHolidayDate] = useState(""); // วันทำงานปกติที่ขอหยุดแทน
    const [reason, setReason] = useState("");
    const [loading, setLoading] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [swapAdvanceDays, setSwapAdvanceDays] = useState(3); // Default value

    useEffect(() => {
        const loadConfig = async () => {
            try {
                const config = await systemConfigService.get();
                if (config && config.swapAdvanceDays !== undefined) {
                    setSwapAdvanceDays(config.swapAdvanceDays);
                }
            } catch (error) {
                console.error("Error loading config:", error);
            }
        };
        loadConfig();
    }, []);

    const validateDate = (dateStr: string) => {
        if (!dateStr) return true;

        const selectedDate = startOfDay(new Date(dateStr));
        const today = startOfDay(new Date());
        const minDate = addDays(today, swapAdvanceDays);

        return selectedDate >= minDate;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!employee) return;

        // Validation
        if (!validateDate(workDate)) {
            alert(`กรุณาขอสลับวันหยุดล่วงหน้าอย่างน้อย ${swapAdvanceDays} วัน`);
            return;
        }

        setLoading(true);
        try {
            await swapService.create({
                employeeId: employee.id || "unknown",
                employeeName: employee.name,
                workDate: new Date(workDate),
                holidayDate: new Date(holidayDate),
                reason,
                status: "รออนุมัติ",
                createdAt: new Date(),
            });

            setShowSuccess(true);

            // Reset
            setWorkDate("");
            setHolidayDate("");
            setReason("");

            // Hide success message after 3 seconds
            setTimeout(() => setShowSuccess(false), 3000);
        } catch (error) {
            console.error(error);
            alert("เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง");
        } finally {
            setLoading(false);
        }
    };

    const minDateStr = format(addDays(new Date(), swapAdvanceDays), "yyyy-MM-dd");

    return (
        <div className="min-h-screen bg-gray-50 pb-10">
            <EmployeeHeader />

            {/* Success Notification */}
            {showSuccess && (
                <div className="fixed top-0 left-0 right-0 z-50 p-4 animate-in slide-in-from-top-10 fade-in duration-300">
                    <div className="bg-[#1DB446] text-white px-6 py-4 rounded-2xl shadow-xl flex items-center gap-3 mx-auto max-w-sm">
                        <div className="p-2 bg-white/20 rounded-full">
                            <CheckCircle className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h3 className="font-bold text-lg">ส่งคำขอสำเร็จ!</h3>
                            <p className="text-white/90 text-sm">รอ Admin อนุมัติ</p>
                        </div>
                    </div>
                </div>
            )}

            <main className="px-6 -mt-6 relative z-10">
                <div className="bg-white rounded-3xl p-6 shadow-lg border border-gray-100">
                    <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                        <ArrowLeftRight className="w-5 h-5 text-purple-500" />
                        ขอสลับวันหยุด
                    </h2>

                    <div className="bg-purple-50 border border-purple-100 rounded-xl p-4 mb-6">
                        <p className="text-sm text-purple-700">
                            <strong>เงื่อนไข:</strong> ต้องขอสลับวันหยุดล่วงหน้าอย่างน้อย <strong>{swapAdvanceDays}</strong> วัน
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">
                                วันที่จะมาทำงาน (แทนวันหยุด) <span className="text-red-500">*</span>
                            </label>
                            <Input
                                type="date"
                                value={workDate}
                                min={minDateStr}
                                onChange={(e) => setWorkDate(e.target.value)}
                                className={`h-12 rounded-xl border-gray-200 bg-gray-50/50 ${workDate && !validateDate(workDate) ? "border-red-500 ring-1 ring-red-500" : ""}`}
                                required
                            />
                            {workDate && !validateDate(workDate) && (
                                <p className="text-xs text-red-500 flex items-center gap-1">
                                    <AlertCircle className="w-3 h-3" />
                                    ต้องเลือกวันที่ {format(addDays(new Date(), swapAdvanceDays), "d MMM yyyy", { locale: th })} เป็นต้นไป
                                </p>
                            )}
                            <p className="text-xs text-gray-500">เลือกวันหยุดที่ต้องการมาทำงานแทน</p>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">
                                วันที่จะหยุด (แทนวันทำงาน) <span className="text-red-500">*</span>
                            </label>
                            <Input
                                type="date"
                                value={holidayDate}
                                min={minDateStr}
                                onChange={(e) => setHolidayDate(e.target.value)}
                                className="h-12 rounded-xl border-gray-200 bg-gray-50/50"
                                required
                            />
                            <p className="text-xs text-gray-500">เลือกวันทำงานปกติที่ต้องการหยุดชดเชย</p>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">เหตุผล</label>
                            <Textarea
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                placeholder="ระบุเหตุผลการขอสลับ..."
                                className="min-h-[100px] rounded-xl border-gray-200 bg-gray-50/50 resize-none"
                                required
                            />
                        </div>

                        <Button
                            type="submit"
                            disabled={loading || !!(workDate && !validateDate(workDate))}
                            className="w-full h-14 text-lg rounded-2xl bg-purple-600 hover:bg-purple-700 shadow-lg shadow-purple-900/20 mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? "กำลังส่งข้อมูล..." : (
                                <span className="flex items-center gap-2">
                                    ส่งคำขอ <Send className="w-4 h-4" />
                                </span>
                            )}
                        </Button>
                    </form>
                </div>
            </main>
        </div>
    );
}
