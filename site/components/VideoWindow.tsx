"use client";

import { Play } from "@phosphor-icons/react";
import { useRef, useState } from "react";
import { Os9Window } from "./Os9Window";

export function VideoWindow({ title, src, poster, playLabel, className = "" }: { title: string; src: string; poster: string; playLabel: string; className?: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [started, setStarted] = useState(false);

  const start = () => {
    setStarted(true);
    void videoRef.current?.play();
  };

  return (
    <Os9Window title={title} accent="var(--class-k)" className={className}>
      <div className="relative aspect-video w-full bg-paper-shade">
        <video ref={videoRef} src={src} poster={poster} preload="none" playsInline controls={started} className="absolute inset-0 size-full object-cover" />
        {!started && (
          <button type="button" onClick={start} aria-label={playLabel} className="group absolute inset-0 grid place-items-center focus-visible:outline-2 focus-visible:outline-offset-[-4px] focus-visible:outline-violet">
            <span className="os9-button flex items-center gap-2 px-5 py-3 text-base transition-transform duration-200 ease-soft group-hover:scale-105 group-active:scale-95">
              <Play weight="fill" className="size-5 text-violet" aria-hidden="true" />
              {playLabel}
            </span>
          </button>
        )}
      </div>
    </Os9Window>
  );
}
