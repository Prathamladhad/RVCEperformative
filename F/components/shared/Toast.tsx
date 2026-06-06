'use client'

import { useEffect, useState } from 'react'

interface ToastProps {
    message: string
    type?: 'success' | 'error' | 'info'
    duration?: number
    onClose?: () => void
}

export function Toast({
    message,
    type = 'info',
    duration = 3000,
    onClose,
}: ToastProps) {
    const [isVisible, setIsVisible] = useState(true)

    useEffect(() => {
        if (duration && duration > 0) {
            const timer = setTimeout(() => {
                setIsVisible(false)
                onClose?.()
            }, duration)

            return () => clearTimeout(timer)
        }
    }, [duration, onClose])

    if (!isVisible) return null

    const bgColors = {
        success: 'bg-accent-teal',
        error: 'bg-error-red',
        info: 'bg-brand-purple',
    }

    return (
        <div
            className={`fixed bottom-4 right-4 px-6 py-3 rounded-lg text-white shadow-lg ${bgColors[type]} animate-in slide-in-from-bottom-4 duration-300`}
            role="status"
            aria-live="polite"
        >
            {message}
        </div>
    )
}
