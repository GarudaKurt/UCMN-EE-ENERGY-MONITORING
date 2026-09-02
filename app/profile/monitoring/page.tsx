"use client";

import { BedDouble, Sofa, Armchair } from "lucide-react";
import HomeHeader from "@/components/home-header/HomeHeader";
import BottomNav from "@/components/bottom-nav/BottomNav";
import RoomEnergyCard from "@/components/romeenergy-card/RomeenergyCard";

// Map each PZEM meter's device_id (as stored in sensors.device_id) to a room.
// Update the deviceId values to match what your nodered flow writes.
const ROOMS = [
  {
    id: "master-bedroom",
    label: "Master Bedroom",
    deviceId: "PZEM-MASTER-BEDROOM",
    icon: BedDouble,
    accent: {
      chipBg: "bg-indigo-50",
      chipText: "text-indigo-600",
      ring: "ring-indigo-300",
      dot: "bg-indigo-500",
    },
  },
  {
    id: "sala",
    label: "Sala",
    deviceId: "PZEM-SALA",
    icon: Sofa,
    accent: {
      chipBg: "bg-amber-50",
      chipText: "text-amber-700",
      ring: "ring-amber-300",
      dot: "bg-amber-500",
    },
  },
  {
    id: "living-room",
    label: "Living Room",
    deviceId: "PZEM-LIVING-ROOM",
    icon: Armchair,
    accent: {
      chipBg: "bg-emerald-50",
      chipText: "text-emerald-700",
      ring: "ring-emerald-300",
      dot: "bg-emerald-500",
    },
  },
];

export default function EnergyHistoryPage() {
  return (
    <div className="flex min-h-screen flex-col bg-neutral-100">
      <HomeHeader name="Energy History" hasNotification={false} />

      <main className="flex flex-1 flex-col gap-4 px-4 pb-6 pt-4">
        <p className="text-xs text-neutral-500">
          Daily electricity usage per room. Tap a room to see its calendar and totals.
        </p>

        <div className="flex flex-col gap-3">
          {ROOMS.map((room) => (
            <RoomEnergyCard key={room.id} room={room} />
          ))}
        </div>
      </main>

      <BottomNav />
    </div>
  );
}