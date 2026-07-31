
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

interface PageHeaderProps {
  title: string;
  showBack?: boolean;
}

export default function PageHeader({ title, showBack = false }: PageHeaderProps) {
  const router = useRouter();

  return (
    <div className="flex items-center gap-3 bg-white px-5 pb-4 pt-3">
      {showBack && (
        <button
          type="button"
          onClick={() => router.back()}
          aria-label="Go back"
          className="-ml-1 rounded-full p-1 text-neutral-900 hover:bg-neutral-100"
        >
          <ArrowLeft className="h-5 w-5" strokeWidth={2.25} />
        </button>
      )}
      <h1 className="text-xl font-bold text-neutral-900">{title}</h1>
    </div>
  );
}