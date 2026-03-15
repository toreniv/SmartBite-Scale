"use client";

import { ArrowLeft, ImagePlus, Loader2, Upload } from "lucide-react";
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
    <div className="phone-frame flex flex-col px-5 pb-8 pt-6">
      <div className="flex items-center justify-between">
        <div className="badge-chip">Upload flow</div>
        <button onClick={onBack} className="ghost-button !w-auto px-4 py-2 text-xs">
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
      </div>

      <div className="mt-5 surface-card-strong w-full rounded-[34px] p-5">
        <div>
          <h2 className="text-[1.9rem] font-semibold tracking-[-0.04em] text-slate-950">
            Upload a food image
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Use a well-lit image with the plate centered. SmartBite will prepare the same analysis
            flow without opening the camera.
          </p>
        </div>

        <div className="mt-6 rounded-[30px] border border-dashed border-blue-200 bg-[linear-gradient(180deg,rgba(248,251,255,0.96),rgba(239,246,255,0.82))] p-4 text-center">
          <input
            id="image-upload"
            type="file"
            accept="image/*"
            onChange={onSelectFile}
            className="hidden"
          />
          <label
            htmlFor="image-upload"
            className="flex cursor-pointer flex-col items-center gap-4 rounded-[24px] px-3 py-5"
          >
            {previewUrl ? (
              <>
                <div className="aspect-[4/3] w-full overflow-hidden rounded-[24px] shadow-[0_18px_32px_rgba(15,23,42,0.12)]">
                  <img src={previewUrl} alt="Food preview" className="h-full w-full object-cover" />
                </div>
                <div className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm">
                  Replace image
                </div>
              </>
            ) : (
              <>
                <div className="icon-surface bg-blue-100 text-blue-600">
                  <ImagePlus className="h-8 w-8" />
                </div>
                <div>
                  <div className="text-base font-semibold text-slate-900">Choose a meal photo</div>
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    JPG or PNG works best. Overhead or slightly angled photos are easiest to read.
                  </p>
                </div>
              </>
            )}
          </label>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {showWeight ? (
            <div className="rounded-[24px] bg-slate-50 px-4 py-4">
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                Current weight
              </div>
              <div className="mt-2 text-xl font-semibold text-slate-900">{weight.toFixed(1)}g</div>
            </div>
          ) : (
            <div className="empty-state-card px-4 py-4">
              <div className="text-sm font-semibold text-slate-900">No scale reading attached</div>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                That is fine. You can still upload a photo and continue with image-only analysis.
              </p>
            </div>
          )}

          <div className="rounded-[24px] bg-slate-50 px-4 py-4">
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
              Best results
            </div>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Keep shadows soft and let the plate fill most of the frame.
            </p>
          </div>
        </div>

        <button onClick={onUpload} disabled={uploading || !previewUrl} className="primary-button mt-6">
          {uploading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Uploading image
            </>
          ) : (
            <>
              <Upload className="h-5 w-5" />
              Upload and analyze
            </>
          )}
        </button>

        {!previewUrl ? (
          <p className="mt-3 text-center text-sm text-slate-500">
            Select an image first to continue.
          </p>
        ) : null}
      </div>
    </div>
  );
}
