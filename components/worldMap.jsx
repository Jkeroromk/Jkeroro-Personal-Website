"use client";

import { useState, useEffect } from "react";
import { database, ref, onValue } from "../firebase";
import ReactECharts from "echarts-for-react";
import { registerMap } from "echarts";

const WorldMapDialog = () => {
  const [countryData, setCountryData] = useState({});
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapHeight, setMapHeight] = useState("300px");
  const [mapWidth, setMapWidth] = useState("100%");
  const [topCountries, setTopCountries] = useState([]);

  useEffect(() => {
    const countriesRef = ref(database, "countries");
    onValue(countriesRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        setCountryData(data);

        // ✅ Extract top 3 most visited countries
        const sortedCountries = Object.entries(data)
          .sort(([, a], [, b]) => b.count - a.count) // Sort by visit count (descending)
          .slice(0, 3); // Get the top 3

        setTopCountries(sortedCountries);
      }
    });
  }, []);

  useEffect(() => {
    fetch("/world.json")
      .then((response) => response.json())
      .then((data) => {
        registerMap("world", data);
        setMapLoaded(true);
      })
      .catch((error) => console.error("Error loading world map:", error));
  }, []);

  useEffect(() => {
    const updateSize = () => {
      if (window.innerWidth >= 1024) {
        setMapHeight("300px");
        setMapWidth("100%");
      } else {
        setMapHeight("300px");
        setMapWidth("95%");
      }
    };

    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  const getMapOption = () => ({
    backgroundColor: "#000",
    tooltip: {
      show: true,
      trigger: "item",
      backgroundColor: "#333",
      borderColor: "#fff",
      textStyle: {
        color: "#fff",
      },
      formatter: ({ name, value }) =>
        `${value ? value + " visits" : "No data"}`,
    },
    visualMap: {
      min: 0,
      max: 50,
      left: "left",
      top: "bottom",
      text: ["High", "Low"],
      calculable: true,
      textStyle: {
        color: "#fff",
        fontWeight: "bold",
      },
      inRange: {
        color: ["#2c7bb6", "#abd9e9", "#ffffbf", "#fdae61", "#d73027"],
      },
      itemWidth: 2,
      itemHeight: 40,
    },
    series: [
      {
        name: "Visitor Locations",
        type: "map",
        map: "world",
        roam: false,
        emphasis: {
          label: {
            show: false,
          },
        },
        select:{
          label:{
            show:false,
          }
        },
        data: Object.keys(countryData).map((country) => ({
          name: country,
          value: countryData[country].count || 0,
        })),
      },
    ],
  });

  return (
    <div className="w-full flex flex-col items-center">
      {mapLoaded ? (
        <ReactECharts
          option={getMapOption()}
          style={{
            height: mapHeight,
            width: mapWidth,
          }}
        />
      ) : (
        <p className="text-gray-400 text-sm">Loading world map...</p>
      )}

      {/* ✅ Display Top 3 Countries Under the Map */}
      <div className="mt-6 w-full max-w-md text-white text-center">
        <h2 className="text-sm font-bold">Top 3 Visiting Countries</h2>
        <ul className="mt-2 space-y-2">
          {topCountries.length > 0 ? (
            topCountries.map(([country, data], index) => (
              <li key={index} className="flex justify-between p-2 rounded-md">
                <span className="text-xs">{index + 1}. {country}</span>
                <span className="text-xs">{data.count} visits</span>
              </li>
            ))
          ) : (
            <p className="text-gray-400 text-sm">No data yet.</p>
          )}
        </ul>
      </div>
    </div>
  );
};

export default WorldMapDialog;
