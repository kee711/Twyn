'use client';

import { Card } from "@/components/ui/card";
import { Clock, Zap, Sparkles, Users } from "lucide-react";

const MovSection = ({ src }: { src: string }) => {
  return (
    <div className="w-full md:w-1/2">
      <div className="relative aspect-video rounded-xl overflow-hidden bg-gray-100 border border-gray-200 shadow-lg">
        <video
          src={src}
          className="w-full h-full object-cover"
          autoPlay
          loop
          muted
          playsInline
        />
      </div>
    </div>
  )
}

const TextSection = ({ title, description1, description2, description3 }: { title: string, description1: string, description2: string, description3?: string }) => {
  return (
    <div className="w-full md:w-1/2 space-y-6">
      <h2 className="text-2xl sm:text-4xl font-bold text-landing-text-primary">{title}</h2>
      <div className="space-y-4">
        <div className="flex items-start gap-3">
          <div className="h-4 w-4 sm:h-6 sm:w-6 mt-1 rounded-full bg-landing-primary-100 border border-landing-primary-200 flex items-center justify-center">
            <div className="h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-landing-primary-600"></div>
          </div>
          <p className="text-sm sm:text-base md:text-lg text-landing-text-secondary">{description1}</p>
        </div>
        <div className="flex items-start gap-3">
          <div className="h-4 w-4 sm:h-6 sm:w-6 mt-1 rounded-full bg-landing-primary-100 border border-landing-primary-200 flex items-center justify-center">
            <div className="h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-landing-primary-600"></div>
          </div>
          <p className="text-sm sm:text-base md:text-lg text-landing-text-secondary">{description2}</p>
        </div>
        {description3 && (
          <div className="flex items-start gap-3">
            <div className="h-4 w-4 sm:h-6 sm:w-6 mt-1 rounded-full bg-landing-primary-100 border border-landing-primary-200 flex items-center justify-center">
              <div className="h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-landing-primary-600"></div>
            </div>
            <p className="text-sm sm:text-base md:text-lg text-landing-text-secondary">{description3}</p>
          </div>
        )}
      </div>
    </div>
  )
}


export const FeatureSection = () => {
  return (
    <section id="features" className="py-20 sm:py-32 bg-landing-background-primary">
      {/* Feature Sections */}
      <div className="w-full space-y-32">
        {/* First Feature - Left GIF, Right Text */}
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex flex-col-reverse md:flex-row items-center gap-8 md:gap-16 max-w-6xl mx-auto">
            <MovSection src="/landing-page/vid_topic-finder.mov" />
            <TextSection
              title="Never run out of ideas"
              description1="Explore ideas, perfectly suitable for you"
              description2="Obviously, up-to-date topics are here"
              description3="Personal profile data makes topic more yours"
            />
          </div>
        </div>
        {/* Second Feature - Right GIF, Left Text */}
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex flex-col md:flex-row items-center gap-8 md:gap-16 max-w-6xl mx-auto">
            <TextSection
              title="Write 10x faster & better"
              description1="Generate a ready-to-post draft with one click"
              description2="Fine‑tune tone & style with AI"
            />
            <MovSection src="/landing-page/vid_create-detail.mov" />
          </div>
        </div>
        {/* Third Feature - Left GIF, Right Text */}
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex flex-col-reverse md:flex-row items-center gap-8 md:gap-16 max-w-6xl mx-auto">
            <MovSection src="/landing-page/vid_schedule.mov" />
            <TextSection
              title="Auto-post while you rest"
              description1="Post anytime, hands‑free"
              description2="Drag & drop to reschedule in seconds"
              description3="Stay consistent without extra effort"
            />
          </div>
        </div>
        {/* Fourth Feature - Right GIF, Left Text */}
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex flex-col md:flex-row items-center gap-8 md:gap-16 max-w-6xl mx-auto">
            <TextSection
              title="Engage 10x faster"
              description1="Generate Replies to all comments in one click"
              description2="Crafts context‑aware replies that feel human"
            />
            <MovSection src="/landing-page/vid_comment.mov" />
          </div>
        </div>
      </div>
    </section>
  );
};