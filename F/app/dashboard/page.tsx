"use client"

export default function DashboardPage() {
    return (
        <div style={{ width: '100vw', height: '100vh', margin: 0, padding: 0, overflow: 'hidden' }}>
            <iframe
                src="https://amazing-lolly-64924a.netlify.app/"
                title="NeuroAdapt Dashboard"
                style={{
                    width: '100%',
                    height: '100%',
                    border: 'none',
                }}
                allow="camera; microphone; fullscreen; autoplay; clipboard-write"
                allowFullScreen
            />
        </div>
    )
}
