/* eslint-disable react/no-unescaped-entities */

"use client";

import React from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel";
import Image from "next/image";
import { Button } from "./ui/button";

const PersonalStore = () => {
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
    <Sheet>
      <div className="flex flex-col items-center w-full px-4">
        <SheetTrigger className="flex flex-col items-center bg-white bg-opacity-40 border-2 border-black py-6 rounded-3xl mt-10 w-full sm:w-[550px] transition-transform duration-300 hover:scale-105 hover:shadow-[0_0_20px_white]">
          <h1 className="text-xl font-extrabold text-black hover:text-white transition-colors duration-300">
            Personal Brand
          </h1>
          <h2 className="text-sm font-semibold text-black hover:text-white transition-colors duration-300">
            Services
          </h2>
        </SheetTrigger>
      </div>
      <SheetContent className="bg-transparent w-[400px] sm:w-[500px]">
        <SheetHeader>
          <SheetTitle className="text-white">Jkeroro'Store</SheetTitle>
          <SheetDescription className="text-white">
            Welcome to my Cozy Shop!
          </SheetDescription>
        </SheetHeader>
        <div className="border rounded-md my-2"></div>
        <div className="mt-2 py-2 flex flex-col w-full items-center gap-y-4">
          <span className="text-white justify-center flex items-center">
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
                />
              </CarouselItem>
              <CarouselItem className="flex justify-center">
                <Image
                  src="/Jkeroro-back.png"
                  height={500}
                  width={500}
                  alt="back"
                />
              </CarouselItem>
            </CarouselContent>
          </Carousel>
          <div className="flex justify-center mt-4 gap-2">
            {Array.from({ length: count }).map((_, index) => (
              <span
                key={index}
                className={`h-2 w-2 rounded-full transition-all duration-300 ${
                  index === current ? "bg-white w-2 h-2" : "bg-gray-500"
                }`}
              ></span>
            ))}
          </div>
          <Button variant="secondary">Click Here for More info</Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default PersonalStore;
