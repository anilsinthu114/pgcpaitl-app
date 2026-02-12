"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
// We rely on global toast.css being imported in layout or here
// import "@/styles/toast.css"; // It is already in layout.tsx

type ToastType = "success" | "error" | "info" | "warning";

interface ToastData {
    id: number;
    message: string;
    type: ToastType;
    duration: number;
    isClosing?: boolean;
}

interface ToastContextType {
    showToast: (message: string, type?: ToastType, duration?: number) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

const ToastItem = ({ toast, onRemove }: { toast: ToastData; onRemove: (id: number) => void }) => {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        // Trigger enter animation
        const t = requestAnimationFrame(() => setVisible(true));
        return () => cancelAnimationFrame(t);
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            handleClose();
        }, toast.duration);
        return () => clearTimeout(timer);
    }, [toast.duration]);

    const handleClose = () => {
        setVisible(false);
        // Wait for CSS transition (approx 300ms) then remove
        setTimeout(() => {
            onRemove(toast.id);
        }, 300);
    };

    let icon = "";
    if (toast.type === "success") icon = "✅ ";
    if (toast.type === "error") icon = "❌ ";
    if (toast.type === "warning") icon = "⚠️ ";
    if (toast.type === "info") icon = "ℹ️ ";

    return (
        <div className={`toast ${toast.type} ${visible ? "show" : ""}`}>
            <span>{icon}{toast.message}</span>
            <button className="toast-close" onClick={handleClose}>&times;</button>
        </div>
    );
};

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<ToastData[]>([]);

    const showToast = (message: string, type: ToastType = "info", duration = 4000) => {
        const id = Date.now() + Math.random();
        setToasts((prev) => [...prev, { id, message, type, duration }]);
    };

    const removeToast = (id: number) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    };

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            <div id="toast-container">
                {toasts.map((toast) => (
                    <ToastItem key={toast.id} toast={toast} onRemove={removeToast} />
                ))}
            </div>
        </ToastContext.Provider>
    );
}

export function useToast() {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error("useToast must be used within a ToastProvider");
    }
    return context;
}
