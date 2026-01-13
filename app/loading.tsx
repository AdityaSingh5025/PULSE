import ModernLoader from "@/app/components/ModernLoader";

export default function Loading() {
    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-[#0B1121]">
            <ModernLoader />
        </div>
    );
}
