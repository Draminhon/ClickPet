export default function LoadingSpinner({ size = 40, color = '#6CC551' }: { size?: number; color?: string }) {
    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '2rem' }}>
            <div
                style={{
                    width: size,
                    height: size,
                    border: `4px solid #f3f3f3`,
                    borderTop: `4px solid ${color}`,
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite',
                }}
            />
            <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
        </div>
    );
}
