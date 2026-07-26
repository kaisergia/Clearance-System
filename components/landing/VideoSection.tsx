"use client";

import { useCallback, useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight, Play, X } from "lucide-react";
import Image from "next/image";

const VIDEOS = [
  { id: "oU1WSUY6_7E", title: "Cor Jesu College Corporate Video" },
  { id: "ha3-vd3zSzI", title: "Cor Jesu College" },
  { id: "QiVoYIrXFMY", title: "Cor Jesu College" },
];

export function VideoSection() {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true });
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [activeVideoId, setActiveVideoId] = useState<string | null>(null);

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);
  const scrollTo = useCallback((index: number) => emblaApi?.scrollTo(index), [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => {
      setSelectedIndex(emblaApi.selectedScrollSnap());
      setActiveVideoId(null);
    };
    emblaApi.on("select", onSelect);
    onSelect();
    return () => { emblaApi.off("select", onSelect); };
  }, [emblaApi]);

  return (
    <section className="relative bg-black">
      <div className="relative">
        {/* Carousel viewport */}
        <div
          className={`overflow-hidden ${activeVideoId ? "pointer-events-none" : ""}`}
          ref={emblaRef}
        >
          <div className="flex">
            {VIDEOS.map((video) => (
              <div key={video.id} className="flex-[0_0_100%] min-w-0">
                <div className="relative w-full aspect-[16/9]">
                  <button
                    type="button"
                    className="absolute inset-0 w-full h-full cursor-pointer group"
                    onClick={() => setActiveVideoId(video.id)}
                    aria-label={`Play ${video.title}`}
                  >
                    <Image
                      src={`https://img.youtube.com/vi/${video.id}/maxresdefault.jpg`}
                      alt={video.title}
                      fill
                      className="object-cover"
                      sizes="100vw"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/35 transition-colors">
                      <div className="flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-full bg-[#c41e2a] text-white shadow-xl group-hover:scale-110 transition-transform duration-200">
                        <Play className="h-7 w-7 sm:h-8 sm:w-8 ml-1" fill="currentColor" />
                      </div>
                    </div>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Active video player overlay */}
        {activeVideoId && (
          <div className="absolute inset-0 z-30 bg-black">
            <iframe
              className="absolute inset-0 w-full h-full"
              src={`https://www.youtube-nocookie.com/embed/${activeVideoId}?autoplay=1&rel=0&modestbranding=1&playsinline=1`}
              title={VIDEOS.find((v) => v.id === activeVideoId)?.title || "Video"}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
            />
          </div>
        )}

        {/* Close button */}
        {activeVideoId && (
          <button
            onClick={() => setActiveVideoId(null)}
            className="absolute -top-11 right-3 z-40 flex h-9 items-center gap-2 px-4 rounded-full bg-black/80 text-white/80 text-sm font-medium hover:bg-black hover:text-white transition-colors"
            aria-label="Close video"
          >
            <X className="h-4 w-4" />
            Close
          </button>
        )}

        {/* Prev / Next arrows */}
        {!activeVideoId && (
          <>
            <button
              onClick={scrollPrev}
              className="absolute left-4 lg:left-8 top-1/2 -translate-y-1/2 z-10 flex h-12 w-12 items-center justify-center rounded-full border-2 border-white/60 text-white/80 hover:border-white hover:text-white hover:bg-white/10 transition-colors"
              aria-label="Previous video"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            <button
              onClick={scrollNext}
              className="absolute right-4 lg:right-8 top-1/2 -translate-y-1/2 z-10 flex h-12 w-12 items-center justify-center rounded-full border-2 border-white/60 text-white/80 hover:border-white hover:text-white hover:bg-white/10 transition-colors"
              aria-label="Next video"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          </>
        )}

        {/* Dot indicators */}
        {!activeVideoId && (
          <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-10 flex gap-2.5">
            {VIDEOS.map((_, index) => (
              <button
                key={index}
                onClick={() => scrollTo(index)}
                className={`h-3 w-3 rounded-full transition-all border-2 ${
                  index === selectedIndex
                    ? "bg-white border-white"
                    : "bg-transparent border-white/60 hover:border-white"
                }`}
                aria-label={`Go to video ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
