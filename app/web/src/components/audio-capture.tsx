"use client";

import { useEffect, useRef, useState } from "react";

interface AudioCaptureProps {
  disabled?: boolean;
  onTranscript: (audio: Blob) => Promise<void> | void;
  onError: (message: string) => void;
  onStatusChange?: (status: string | null) => void;
}

export function AudioCapture({
  disabled,
  onTranscript,
  onError,
  onStatusChange
}: AudioCaptureProps) {
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    setIsSupported(
      typeof window !== "undefined" &&
        typeof navigator !== "undefined" &&
        typeof navigator.mediaDevices?.getUserMedia === "function" &&
        typeof MediaRecorder !== "undefined"
    );

    return () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  async function startRecording() {
    if (!isSupported) {
      onError("This browser does not support in-app recording yet.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      streamRef.current = stream;
      mediaRecorderRef.current = recorder;

      recorder.addEventListener("dataavailable", (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      });

      recorder.addEventListener("stop", async () => {
        const blob = new Blob(chunksRef.current, {
          type: recorder.mimeType || "audio/webm"
        });

        onStatusChange?.("Transcribing...");

        try {
          await onTranscript(blob);
        } catch (error) {
          onError(
            error instanceof Error ? error.message : "Transcription failed."
          );
        } finally {
          onStatusChange?.(null);
          chunksRef.current = [];
          stream.getTracks().forEach((track) => track.stop());
          streamRef.current = null;
        }
      });

      recorder.start();
      onStatusChange?.("Recording...");
      setIsRecording(true);
    } catch (error) {
      onError(
        error instanceof Error ? error.message : "Microphone access failed."
      );
    }
  }

  function stopRecording() {
    mediaRecorderRef.current?.stop();
    mediaRecorderRef.current = null;
    setIsRecording(false);
  }

  if (!isSupported) {
    return (
      <p className="text-xs leading-5 text-coffee/60">
        Browser recording is unavailable here. You can still paste a transcript or
        use the shared server from another device.
      </p>
    );
  }

  return (
    <button
      type="button"
      onClick={isRecording ? stopRecording : startRecording}
      disabled={disabled}
      className={`rounded-full px-4 py-3 text-sm font-semibold transition ${
        isRecording
          ? "bg-coffee text-sand hover:bg-[#3f2720]"
          : "bg-palm text-white hover:bg-[#26584b]"
      } disabled:cursor-not-allowed disabled:opacity-60`}
    >
      {isRecording ? "Stop and transcribe" : "Use microphone"}
    </button>
  );
}
