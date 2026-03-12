"use client";

import { ArrowLeft, Loader2, Upload } from "lucide-react";
import type { ChangeEvent } from "react";

interface UploadScreenProps {
  previewUrl: string | null;
  uploading: boolean;
  weight: number;
  showWeight: boolean;
  onSelectFile: (event: ChangeEvent<HTMLInputElement>) => void;
  onUpload: () => void;
  onBack: () => void;
}

export function UploadScreen({
  previewUrl,
  uploading,
  weight,
  showWeight,
  onSelectFile,
  onUpload,
  onBack,
}: UploadScreenProps) {
  return (
    <div className="phone-frame flex flex-col px-5 pb-8 pt-8">
      <div className="glass-card w-full rounded-[32px] p-5">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="rounded-full bg-slate-100 p-2 text-slate-700 transition hover:bg-slate-200"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h2 className="text-2xl font-bold text-blue-500">Upload Food Image</h2>
        </div>

        <div className="mt-6 rounded-[28px] border-2 border-dashed border-blue-300 bg-slate-50 p-4 text-center">
          <input
            id="image-upload"
            type="file"
            accept="image/*"
            onChange={onSelectFile}
            className="hidden"
          />
          <label
            htmlFor="image-upload"
            className="flex cursor-pointer flex-col items-center gap-4 py-6"
          >
            <Upload className="h-11 w-11 text-blue-500" />
            {previewUrl ? (
              <div className="aspect-[4/3] w-full overflow-hidden rounded-3xl">
                <img src={previewUrl} alt="Food preview" className="h-full w-full object-cover" />
              </div>
            ) : (
              <p className="text-sm text-slate-500">Select an image to preview and analyze</p>
            )}
          </label>
        </div>

        {showWeight ? (
          <div className="mt-5 rounded-3xl bg-slate-50 px-4 py-4">
            <div className="text-xs uppercase tracking-[0.18em] text-slate-400">Current Weight</div>
            <div className="mt-2 text-2xl font-bold text-slate-800">{weight.toFixed(1)}g</div>
          </div>
        ) : null}

        <button
          onClick={onUpload}
          disabled={uploading}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-500 px-4 py-3.5 text-sm font-semibold text-white transition hover:bg-blue-600 disabled:opacity-70"
        >
          {uploading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="h-5 w-5" />
              Upload and Analyze
            </>
          )}
        </button>
      </div>
    </div>
  );
}
