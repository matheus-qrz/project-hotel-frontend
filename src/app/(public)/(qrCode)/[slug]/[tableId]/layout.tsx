import AuthGuard from '@/components/auth/AuthGuard';

export default function QRCodeLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <AuthGuard allowGuest={true}>
            {children}
        </AuthGuard>
    );
}