"use client";

import { useEffect, useRef, useState } from "react";
import type { PermissionStateLike } from "@/lib/types";

export function useCamera() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [permission, setPermission] = useState<PermissionStateLike>("unknown");

  useEffect(() => {
    void refreshPermission();

    return () => {
      stopCamera();
    };
  }, []);

  const refreshPermission = async () => {
    if (typeof navigator === "undefined" || !("permissions" in navigator)) {
      return;
    }

    try {
      const status = await navigator.permissions.query({
        name: "camera" as PermissionName,
      });

      setPermission(status.state);
    } catch {
      setPermission("unknown");
    }
  };

  const startCamera = async () => {
    if (
      typeof navigator === "undefined" ||
      !navigator.mediaDevices ||
      !navigator.mediaDevices.getUserMedia
    ) {
      throw new Error("Camera is not supported in this browser.");
    }

    try {
      const nextStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false,
      });

      if (videoRef.current) {
        videoRef.current.srcObject = nextStream;
      }

      setStream(nextStream);
      setPermission("granted");
      return nextStream;
    } catch (error) {
      if (error instanceof DOMException && error.name === "NotAllowedError") {
        setPermission("denied");
        throw new Error(
          "Camera access denied. Please allow camera access in your browser settings.",
        );
      }

      throw new Error("Failed to access the camera. Please try again.");
    }
  };

  const stopCamera = () => {
    setStream((currentStream) => {
      currentStream?.getTracks().forEach((track) => track.stop());
      return null;
    });

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const capturePhoto = () =>
    new Promise<Blob>((resolve, reject) => {
      if (!videoRef.current || !stream) {
        reject(new Error("Camera is not initialized."));
        return;
      }

      const canvas = document.createElement("canvas");
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;

      const context = canvas.getContext("2d");

      if (!context) {
        reject(new Error("Failed to create canvas context."));
        return;
      }

      context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error("Failed to capture image."));
          return;
        }

        resolve(blob);
      }, "image/jpeg", 0.9);
    });

  return {
    capturePhoto,
    permission,
    refreshPermission,
    startCamera,
    stopCamera,
    stream,
    videoRef,
  };
}
