"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { Button } from "@/components/ui/button";
import { swapService, type SwapRequest } from "@/lib/firestore";
import { useAdmin } from "@/components/auth/AuthProvider";
import { Check, X, Trash2, Pencil } from "lucide-react";
import { format } from "date-fns";

export default function SwapApprovalsPage() {
    const { user, isSuperAdmin } = useAdmin();
    const [requests, setRequests] = useState<SwapRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState<string | null>(null);
    const [statusFilter, setStatusFilter] = useState<"all" | "รออนุมัติ" | "อนุมัติ" | "ไม่อนุมัติ">("all");

    // Edit modal state
    const [editModal, setEditModal] = useState<{ isOpen: boolean; request: SwapRequest | null }>({
        isOpen: false,
        request: null
    });
    const [editForm, setEditForm] = useState({
        workDate: "",
        holidayDate: "",
        reason: "",
        status: "รออนุมัติ" as SwapRequest["status"]
    });

    useEffect(() => {
        if (user) {
            loadRequests();
        }
    }, [user]);

    const loadRequests = async () => {
        try {
            const data = await swapService.getAll();
            setRequests(data);
        } catch (error) {
            console.error("Error loading swap requests:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (id: string) => {
        setProcessing(id);
        try {
            await swapService.updateStatus(id, "อนุมัติ");
            loadRequests();
        } catch (error) {
            console.error("Error approving:", error);
            alert("เกิดข้อผิดพลาด");
        } finally {
            setProcessing(null);
        }
    };

    const handleReject = async (id: string) => {
        setProcessing(id);
        try {
            await swapService.updateStatus(id, "ไม่อนุมัติ");
            loadRequests();
        } catch (error) {
            console.error("Error rejecting:", error);
            alert("เกิดข้อผิดพลาด");
        } finally {
            setProcessing(null);
        }
    };

    const handleDelete = async (id: string, employeeName: string) => {
        if (!confirm(`ต้องการลบคำขอสลับวันหยุดของ "${employeeName}" ใช่หรือไม่?`)) return;

        setProcessing(id);
        try {
            await swapService.delete(id);
            loadRequests();
        } catch (error) {
            console.error("Error deleting:", error);
            alert("เกิดข้อผิดพลาดในการลบ");
        } finally {
            setProcessing(null);
        }
    };

    const handleEdit = (request: SwapRequest) => {
        setEditForm({
            workDate: format(new Date(request.workDate), "yyyy-MM-dd"),
            holidayDate: format(new Date(request.holidayDate), "yyyy-MM-dd"),
            reason: request.reason || "",
            status: request.status
        });
        setEditModal({ isOpen: true, request });
    };

    const handleSaveEdit = async () => {
        if (!editModal.request?.id) return;

        setProcessing(editModal.request.id);
        try {
            await swapService.update(editModal.request.id, {
                workDate: new Date(editForm.workDate),
                holidayDate: new Date(editForm.holidayDate),
                reason: editForm.reason,
                status: editForm.status
            });
            setEditModal({ isOpen: false, request: null });
            loadRequests();
        } catch (error) {
            console.error("Error updating:", error);
            alert("เกิดข้อผิดพลาดในการบันทึก");
        } finally {
            setProcessing(null);
        }
    };

    const getStatusBadge = (status: SwapRequest["status"]) => {
        switch (status) {
            case "รออนุมัติ":
                return <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm font-medium">รออนุมัติ</span>;
            case "อนุมัติ":
                return <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">อนุมัติ</span>;
            case "ไม่อนุมัติ":
                return <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium">ไม่อนุมัติ</span>;
        }
    };

    // Stats
    const stats = {
        pending: requests.filter(r => r.status === "รออนุมัติ").length,
        approved: requests.filter(r => r.status === "อนุมัติ").length,
        rejected: requests.filter(r => r.status === "ไม่อนุมัติ").length,
        total: requests.length,
    };

    // Filtered requests
    const filteredRequests = statusFilter === "all"
        ? requests
        : requests.filter(r => r.status === statusFilter);

    if (!user) {
        return <div className="p-8 text-center">กรุณาเข้าสู่ระบบ</div>;
    }

    return (
        <div className="flex-1">
            <PageHeader
                title="สลับวันหยุด"
                subtitle={`${requests.length} รายการทั้งหมด`}
            />

            {/* Clickable Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatsCard
                    title="รอการอนุมัติ"
                    value={stats.pending}
                    onClick={() => setStatusFilter(statusFilter === "รออนุมัติ" ? "all" : "รออนุมัติ")}
                    isActive={statusFilter === "รออนุมัติ"}
                />
                <StatsCard
                    title="อนุมัติ"
                    value={stats.approved}
                    onClick={() => setStatusFilter(statusFilter === "อนุมัติ" ? "all" : "อนุมัติ")}
                    isActive={statusFilter === "อนุมัติ"}
                />
                <StatsCard
                    title="ไม่อนุมัติ"
                    value={stats.rejected}
                    onClick={() => setStatusFilter(statusFilter === "ไม่อนุมัติ" ? "all" : "ไม่อนุมัติ")}
                    isActive={statusFilter === "ไม่อนุมัติ"}
                />
                <StatsCard
                    title="ทั้งหมด"
                    value={stats.total}
                    onClick={() => setStatusFilter("all")}
                    isActive={statusFilter === "all"}
                />
            </div>

            {loading ? (
                <div className="text-center py-12">
                    <div className="w-12 h-12 border-4 border-gray-100 border-t-purple-600 rounded-full animate-spin mx-auto"></div>
                    <p className="text-gray-600 mt-4">กำลังโหลดข้อมูล...</p>
                </div>
            ) : (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-gray-50/50 border-b border-gray-100 text-left">
                                    <th className="py-4 px-6 text-xs font-medium text-gray-400 uppercase tracking-wider">Name</th>
                                    <th className="py-4 px-6 text-xs font-medium text-gray-400 uppercase tracking-wider">มาทำวันที่</th>
                                    <th className="py-4 px-6 text-xs font-medium text-gray-400 uppercase tracking-wider">หยุดแทนวันที่</th>
                                    <th className="py-4 px-6 text-xs font-medium text-gray-400 uppercase tracking-wider">เหตุผล</th>
                                    <th className="py-4 px-6 text-xs font-medium text-gray-400 uppercase tracking-wider">สถานะ</th>
                                    <th className="py-4 px-6 text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {filteredRequests.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="py-12 text-center text-gray-500">
                                            ไม่มีข้อมูลสลับวันหยุด
                                        </td>
                                    </tr>
                                ) : (
                                    filteredRequests.map(request => (
                                        <tr key={request.id} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="py-4 px-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center text-white font-semibold text-sm">
                                                        {request.employeeName.charAt(0)}
                                                    </div>
                                                    <span className="text-sm font-medium text-gray-700">{request.employeeName}</span>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6">
                                                <span className="text-sm text-gray-600">
                                                    {format(new Date(request.workDate), "dd-MM-yyyy")}
                                                </span>
                                            </td>
                                            <td className="py-4 px-6">
                                                <span className="text-sm text-gray-600">
                                                    {format(new Date(request.holidayDate), "dd-MM-yyyy")}
                                                </span>
                                            </td>
                                            <td className="py-4 px-6">
                                                <span className="text-sm text-gray-600 line-clamp-2">{request.reason || "-"}</span>
                                            </td>
                                            <td className="py-4 px-6">
                                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${request.status === "รออนุมัติ" ? "bg-orange-100 text-orange-700" :
                                                    request.status === "อนุมัติ" ? "bg-green-100 text-green-700" :
                                                        "bg-red-100 text-red-700"
                                                    }`}>
                                                    {request.status}
                                                </span>
                                            </td>
                                            <td className="py-4 px-6">
                                                <div className="flex gap-2">
                                                    {/* Approve/Reject buttons for pending requests */}
                                                    {request.status === "รออนุมัติ" && request.id && (
                                                        <>
                                                            <button
                                                                onClick={() => handleApprove(request.id!)}
                                                                disabled={processing === request.id}
                                                                className="p-2 hover:bg-green-100 rounded-lg transition-colors disabled:opacity-50"
                                                                title="อนุมัติ"
                                                            >
                                                                <Check className="w-4 h-4 text-green-600" />
                                                            </button>
                                                            <button
                                                                onClick={() => handleReject(request.id!)}
                                                                disabled={processing === request.id}
                                                                className="p-2 hover:bg-red-100 rounded-lg transition-colors disabled:opacity-50"
                                                                title="ไม่อนุมัติ"
                                                            >
                                                                <X className="w-4 h-4 text-red-600" />
                                                            </button>
                                                        </>
                                                    )}

                                                    {/* Edit and Delete buttons for super_admin */}
                                                    {isSuperAdmin && request.id && (
                                                        <>
                                                            <button
                                                                onClick={() => handleEdit(request)}
                                                                disabled={processing === request.id}
                                                                className="p-2 hover:bg-blue-100 rounded-lg transition-colors disabled:opacity-50"
                                                                title="แก้ไข"
                                                            >
                                                                <Pencil className="w-4 h-4 text-blue-600" />
                                                            </button>
                                                            <button
                                                                onClick={() => handleDelete(request.id!, request.employeeName)}
                                                                disabled={processing === request.id}
                                                                className="p-2 hover:bg-red-100 rounded-lg transition-colors disabled:opacity-50"
                                                                title="ลบ"
                                                            >
                                                                <Trash2 className="w-4 h-4 text-red-600" />
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Edit Modal */}
            {editModal.isOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
                        <h3 className="text-xl font-bold text-gray-800 mb-4">แก้ไขคำขอสลับวันหยุด</h3>
                        <p className="text-sm text-gray-500 mb-4">พนักงาน: {editModal.request?.employeeName}</p>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    วันที่มาทำงาน (แทนวันหยุด)
                                </label>
                                <input
                                    type="date"
                                    value={editForm.workDate}
                                    onChange={(e) => setEditForm({ ...editForm, workDate: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    วันที่ขอหยุดแทน
                                </label>
                                <input
                                    type="date"
                                    value={editForm.holidayDate}
                                    onChange={(e) => setEditForm({ ...editForm, holidayDate: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    เหตุผล
                                </label>
                                <textarea
                                    value={editForm.reason}
                                    onChange={(e) => setEditForm({ ...editForm, reason: e.target.value })}
                                    rows={2}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    สถานะ
                                </label>
                                <select
                                    value={editForm.status}
                                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value as SwapRequest["status"] })}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                                >
                                    <option value="รออนุมัติ">รออนุมัติ</option>
                                    <option value="อนุมัติ">อนุมัติ</option>
                                    <option value="ไม่อนุมัติ">ไม่อนุมัติ</option>
                                </select>
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <Button
                                variant="outline"
                                onClick={() => setEditModal({ isOpen: false, request: null })}
                                className="flex-1"
                            >
                                ยกเลิก
                            </Button>
                            <Button
                                onClick={handleSaveEdit}
                                disabled={processing !== null}
                                className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
                            >
                                {processing ? "กำลังบันทึก..." : "บันทึก"}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

