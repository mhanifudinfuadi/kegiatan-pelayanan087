"use client"

import type React from "react"

import { useState, useRef } from "react"
import { cn } from "@/lib/utils"

interface InfiniteCarouselProps {
  children: React.ReactNode[]
  speed?: number
  direction?: "left" | "right"
  pauseOnHover?: boolean
  gap?: number
  className?: string
}

export function InfiniteCarousel({
  children,
  speed = 50,
  direction = "left",
  pauseOnHover = true,
  gap = 16,
  className,
}: InfiniteCarouselProps) {
  const [isPaused, setIsPaused] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  return (
    <div
      ref={containerRef}
      className={cn("relative overflow-hidden", className)}
      onMouseEnter={() => pauseOnHover && setIsPaused(true)}
      onMouseLeave={() => pauseOnHover && setIsPaused(false)}
    >
      <div
        className="flex"
        style={{
          gap: `${gap}px`,
          animation: `scroll-${direction} ${speed}s linear infinite`,
          animationPlayState: isPaused ? "paused" : "running",
        }}
      >
        {/* First set of items */}
        {children.map((child, index) => (
          <div key={`first-${index}`} className="flex-shrink-0">
            {child}
          </div>
        ))}
        {/* Duplicate set for seamless loop */}
        {children.map((child, index) => (
          <div key={`second-${index}`} className="flex-shrink-0">
            {child}
          </div>
        ))}
      </div>

      <style jsx>{`
        @keyframes scroll-left {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(calc(-50% - ${gap / 2}px));
          }
        }

        @keyframes scroll-right {
          0% {
            transform: translateX(calc(-50% - ${gap / 2}px));
          }
          100% {
            transform: translateX(0);
          }
        }
      `}</style>
    </div>
  )
}
