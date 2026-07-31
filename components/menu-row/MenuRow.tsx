
import Link from "next/link";
import { ChevronRight } from "lucide-react";

interface MenuRowProps {
  label: string;
  href: string;
}

export default function MenuRow({ label, href }: MenuRowProps) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between py-4 text-neutral-800 transition hover:text-neutral-950"
    >
      <span className="text-[15px]">{label}</span>
      <ChevronRight className="h-4 w-4 text-neutral-400" strokeWidth={2} />
    </Link>
  );
}