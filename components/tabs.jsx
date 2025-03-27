"use client";

import React, { useEffect, useState, useRef } from "react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { collection, getDocs, addDoc } from "firebase/firestore";
import { firestore } from "../firebase";
import { useAuth } from "../auth";

const Tabs = () => {
  const { isAdmin, loading } = useAuth();
  const [carouselItems, setCarouselItems] = useState([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [link, setLink] = useState("");
  const [projectLoading, setProjectLoading] = useState(false);
  const [fetchError, setFetchError] = useState(null);

  const autoplayPlugin = useRef(Autoplay({ delay: 3000, stopOnInteraction: false }));

  const fetchCarouselItems = async () => {
    try {
      const querySnapshot = await getDocs(collection(firestore, "carouselItems"));
      const items = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setCarouselItems(items);
      setFetchError(null);
    } catch (error) {
      console.error("Detailed error fetching carousel items:", error.code, error.message);
      if (error.code === "permission-denied") {
        setFetchError("You don't have permission to view projects.");
      } else {
        setFetchError("Failed to load projects: " + error.message);
      }
    }
  };

  useEffect(() => {
    fetchCarouselItems();
  }, []);

  const handleAddProject = async () => {
    if (!title || !description || !link) {
      alert("Please fill all fields");
      return;
    }
    setProjectLoading(true);
    try {
      await addDoc(collection(firestore, "carouselItems"), {
        title,
        description,
        link,
      });
      setTitle("");
      setDescription("");
      setLink("");
      fetchCarouselItems();
    } catch (error) {
      console.error("Error adding project:", error);
      alert("Failed to add project: " + error.message);
    } finally {
      setProjectLoading(false);
    }
  };

  const resetAutoplay = () => {
    if (autoplayPlugin.current) {
      autoplayPlugin.current.reset();
    }
  };

  if (loading) {
    return (
      <div className="mt-2 flex flex-col justify-center items-center w-full px-4 z-10">
        <p className="text-white font-bold">Loading authentication...</p>
      </div>
    );
  }

  return (
    <div className="mt-2 flex flex-col justify-center items-center w-full px-4 z-10">
      {isAdmin && (
        <div className="flex flex-col items-center bg-white bg-opacity-80 border-2 border-black py-6 rounded-3xl mt-10 w-full sm:w-[550px]">
          <h1 className="text-xl font-extrabold text-black">Add Project</h1>
          <input
            type="text"
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-4 p-2 border-2 border-black rounded-md bg-white"
          />
          <input
            type="text"
            placeholder="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="mt-4 p-2 border-2 border-black rounded-md bg-white"
          />
          <input
            type="url"
            placeholder="Link"
            value={link}
            onChange={(e) => setLink(e.target.value)}
            className="mt-4 p-2 border-2 border-black rounded-md bg-white"
          />
          <button
            onClick={handleAddProject}
            disabled={projectLoading}
            className="mt-4 py-2 px-4 bg-blue-600 text-white rounded-md disabled:bg-gray-500 hover:bg-blue-700 transition-colors"
          >
            {projectLoading ? "Adding..." : "Add Project"}
          </button>
        </div>
      )}

      <div className="flex flex-col items-center w-full">
        <a
          href="https://3d-portfolio-jade-xi.vercel.app/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-col items-center bg-white bg-opacity-80 border-2 border-black py-4 rounded-3xl mt-10 w-full sm:w-[550px] transition-transform duration-300 hover:scale-105 hover:shadow-[0_0_20px_white] heartbeat"
        >
          <h1 className="text-xl font-extrabold text-black hover:text-blue-600 transition-colors duration-300">
            Personal Cv
          </h1>
          <h2 className="text-base font-extrabold text-black hover:text-blue-600 transition-colors duration-300">
            Job Only
          </h2>
        </a>
      </div>

      <h1 className="flex justify-center text-white font-extrabold text-2xl mt-10">
        Personal Project Collection
      </h1>

      <div className="flex gap-x-3">
        <ArrowLeft className="text-white mt-3 cursor-pointer hover:text-blue-300 transition-colors" onClick={resetAutoplay} />
        <h2 className="flex justify-center text-white font-extrabold text-xl mt-2">
          Swap me
        </h2>
        <ArrowRight className="text-white mt-3 cursor-pointer hover:text-blue-300 transition-colors" onClick={resetAutoplay} />
      </div>

      <Carousel
        className="mt-5 w-full sm:w-[550px]"
        opts={{ loop: true }}
        plugins={[autoplayPlugin.current]}
      >
        <CarouselContent>
          {fetchError ? (
            <p className="text-red-600 font-bold text-center">{fetchError}</p>
          ) : carouselItems.length > 0 ? (
            carouselItems.map((item) => (
              <CarouselItem key={item.id} className="flex justify-center">
                <a
                  href={item.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col items-center bg-white bg-opacity-80 border-2 border-black hover:border-blue-600 transition-color duration-300 py-6 px-8 rounded-3xl w-full sm:w-[550px]"
                >
                  <h1 className="text-xl font-extrabold text-black hover:text-blue-600 transition-colors duration-300">
                    {item.title}
                  </h1>
                  <h2 className="text-sm font-semibold text-black hover:text-blue-600 transition-colors duration-300">
                    {item.description}
                  </h2>
                </a>
              </CarouselItem>
            ))
          ) : (
            <p className="text-white ml-56 font-bold">Loading projects...</p>
          )}
        </CarouselContent>
      </Carousel>

      <div className="flex flex-col items-center w-full">
        <a
          href="https://www.xiaohongshu.com/user/profile/678e5f43000000000e0107ac?xsec_token=YBoDy4ooZI5wbVMGN9VSpV7OGN88SSTRIr5QQntEv1awY=&xsec_source=app_share&xhsshare=CopyLink&appuid=678e5f43000000000e0107ac&apptime=1738075633&share_id=d3e00f56b0ba47ecb739975076b7eb34"
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-col items-center bg-white bg-opacity-80 border-2 border-black py-6 rounded-3xl mt-16 w-full sm:w-[550px] transition-transform duration-300 hover:scale-105 hover:shadow-[0_0_20px_white] heartbeat"
        >
          <h1 className="text-xl font-extrabold text-black hover:text-blue-600 transition-colors duration-300">
            Rednote
          </h1>
          <h2 className="text-sm font-semibold text-black hover:text-blue-600 transition-colors duration-300">
            Thread
          </h2>
        </a>
      </div>

      <div className="flex flex-col items-center w-full">
        <a
          href="https://discord.gg/eD7ZRcg22H"
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-col items-center bg-white bg-opacity-80 border-2 border-black py-6 rounded-3xl mt-10 w-full sm:w-[550px] transition-transform duration-300 hover:scale-105 hover:shadow-[0_0_20px_white] heartbeat"
        >
          <h1 className="text-xl font-extrabold text-black hover:text-blue-600 transition-colors duration-300">
            Discord
          </h1>
          <h2 className="text-sm font-semibold text-black hover:text-blue-600 transition-colors duration-300">
            Cozy
          </h2>
        </a>
      </div>

      <div className="flex flex-col items-center w-full">
        <a
          href="https://www.patreon.com/yourprofile"
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-col items-center bg-white bg-opacity-80 border-2 border-black py-6 rounded-3xl mt-10 w-full sm:w-[550px] transition-transform duration-300 hover:scale-105 hover:shadow-[0_0_20px_white] heartbeat"
        >
          <h1 className="text-xl font-extrabold text-black hover:text-blue-600 transition-colors duration-300">
            Donation
          </h1>
          <h2 className="text-sm font-semibold text-black hover:text-blue-600 transition-colors duration-300">
            Payment
          </h2>
        </a>
      </div>
    </div>
  );
};

export default Tabs;