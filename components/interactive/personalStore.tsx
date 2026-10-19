/* eslint-disable react/no-unescaped-entities */

"use client";

import React from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel";
import Image from "next/image";
import { Button } from "../ui/button";

// 触发按钮在首屏的 QuickLinks（Services）里，这里只管侧边栏本身
type Props = { open: boolean; onOpenChange: (open: boolean) => void };

const PersonalStore = ({ open, onOpenChange }: Props) => {
  const [api, setApi] = React.useState<CarouselApi | null>(null);
  const [current, setCurrent] = React.useState<number>(0);
  const [count, setCount] = React.useState<number>(0);

  React.useEffect(() => {
    if (!api) return;

    setCount(api.scrollSnapList().length);
    setCurrent(api.selectedScrollSnap());

    api.on("select", () => {
      setCurrent(api.selectedScrollSnap());
    });
  }, [api]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="bg-[#0c0c0d]/95 backdrop-blur-md border-l border-[#202020] w-[88vw] max-w-[400px] sm:w-[500px] sm:max-w-[500px]">
        <SheetHeader>
          <SheetTitle className="text-white font-extrabold">Jkeroro'Store</SheetTitle>
          <SheetDescription className="text-gray-200">
            Welcome to my Cozy Shop!
          </SheetDescription>
        </SheetHeader>
        <div className="border border-gray-400 rounded-md my-2"></div>
        <div className="mt-2 py-2 flex flex-col w-full items-center gap-y-4">
          <span className="text-white font-semibold justify-center flex items-center">
            Lock In
          </span>
          <Carousel opts={{ loop: true }} setApi={setApi}>
            <CarouselContent className="flex flex-row">
              <CarouselItem className="flex justify-center">
                <Image
                  src="/Jkeroro-front.png"
                  height={500}
                  width={500}
                  alt="front"
                  className="rounded-lg shadow-lg"
                />
              </CarouselItem>
              <CarouselItem className="flex justify-center">
                <Image
                  src="/Jkeroro-back.png"
                  height={500}
                  width={500}
                  alt="back"
                  className="rounded-lg shadow-lg"
                />
              </CarouselItem>
            </CarouselContent>
          </Carousel>
          <div className="flex justify-center mt-4 gap-2">
            {Array.from({ length: count }).map((_, index) => (
              <span
                key={index}
                className={`h-2 w-2 rounded-full transition-all duration-300 ${
                  index === current ? "bg-white w-2 h-2" : "bg-gray-400"
                }`}
              ></span>
            ))}
          </div>
          <Button variant="secondary" className="bg-white bg-opacity-20 text-white hover:bg-white hover:bg-opacity-30 transition-colors">
            Click Here for More info
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default PersonalStore;
