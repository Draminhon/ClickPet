"use client";

import { useSession } from "next-auth/react";

export default function DebugPage() {
    const { data: session, status } = useSession();

    return (
        <div style={{ padding: '2rem' }}>
            <h1>Debug Session</h1>
            <p><strong>Status:</strong> {status}</p>
            <pre style={{ background: '#f5f5f5', padding: '1rem', borderRadius: '8px' }}>
                {JSON.stringify(session, null, 2)}
            </pre>
        </div>
    );
}
