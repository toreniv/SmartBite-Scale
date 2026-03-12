"use client";

import { Camera, MoreHorizontal, Scale, Upload } from "lucide-react";
import { MenuButton } from "@/components/MenuButton";

interface MenuScreenProps {
  isBypassMode: boolean;
  onScanFood: () => void;
  onUploadImage: () => void;
  onCalibrate: () => void;
  onMoreOptions: () => void;
  onBackToMainMenu: () => void;
}

export function MenuScreen({
  isBypassMode,
  onScanFood,
  onUploadImage,
  onCalibrate,
  onMoreOptions,
  onBackToMainMenu,
}: MenuScreenProps) {
  return (
    <div className="phone-frame flex flex-col items-center justify-center px-5 pb-8 pt-8">
      <div className="glass-card w-full rounded-[32px] p-5">
        <div className="grid grid-cols-2 gap-4">
          <MenuButton icon={Camera} label="Scan Food" onClick={onScanFood} />
          <MenuButton icon={Upload} label="Upload Image" onClick={onUploadImage} />
          <MenuButton icon={Scale} label="Calibrate" onClick={onCalibrate} />
          <MenuButton icon={MoreHorizontal} label="More Options" onClick={onMoreOptions} />
        </div>

        {isBypassMode ? (
          <div className="mt-5 rounded-3xl bg-amber-50 px-4 py-4 text-sm leading-6 text-amber-800">
            Running in bypass mode. Scale features are disabled.
          </div>
        ) : null}
      </div>

      <button
        onClick={onBackToMainMenu}
        className="mt-6 rounded-full bg-blue-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-300/50 transition hover:bg-blue-600"
      >
        Back to Main Menu
      </button>
    </div>
  );
}
