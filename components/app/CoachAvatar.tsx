import Image from "next/image";
import { coach } from "@/lib/site";

/** Round photo of the coach, with an optional green "online" dot. */
export function CoachAvatar({ className = "h-10 w-10", online = false, ring = "ring-white" }: { className?: string; online?: boolean; ring?: string }) {
  return (
    <span className={`relative inline-block shrink-0 ${className}`}>
      <span className="relative block h-full w-full overflow-hidden rounded-full bg-forest">
        <Image src={coach.photo} alt={coach.name} fill sizes="96px" className="object-cover" />
      </span>
      {online && <span className={`absolute bottom-0 right-0 h-[26%] w-[26%] rounded-full bg-brand ring-2 ${ring}`} />}
    </span>
  );
}
