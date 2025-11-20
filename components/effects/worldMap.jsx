"use client";

import { useState, useEffect } from "react";
// No longer using Firebase - using API instead
import ReactECharts from "echarts-for-react";
import { registerMap } from "echarts";
import DataManager from "@/lib/data-manager";

const WorldMapDialog = () => {
  const [countryData, setCountryData] = useState({});
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapHeight, setMapHeight] = useState("300px");
  const [mapWidth, setMapWidth] = useState("100%");
  const [topCountries, setTopCountries] = useState([]);
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [isZoomed, setIsZoomed] = useState(false);

  // 处理国家数据
  const processCountryData = (data) => {
        // Convert array to object format for compatibility
        const countryDataObj = {};
        data.forEach((item) => {
          countryDataObj[item.country] = {
            count: item.count,
            lastUpdated: item.lastUpdated,
            lastVisit: item.lastVisit,
          };
        });
        
        setCountryData(countryDataObj);

        // Extract top 3 most visited countries
        const sortedCountries = data
          .sort((a, b) => b.count - a.count)
          .slice(0, 3)
          .map((item) => [item.country, { count: item.count, lastUpdated: item.lastUpdated, lastVisit: item.lastVisit }]);

        setTopCountries(sortedCountries);
        
    // 移除数据流动动画
    // setDataFlowAnimation(true);
    // setTimeout(() => setDataFlowAnimation(false), 2000);
  };

  useEffect(() => {
    const dataManager = DataManager.getInstance();
    
    // 先使用缓存数据立即显示
    const cachedCountries = dataManager.getCountries();
    if (cachedCountries && cachedCountries.length > 0) {
      processCountryData(cachedCountries);
    }

    const fetchCountries = async () => {
      try {
        const response = await fetch('/api/stats/countries');
        if (!response.ok) throw new Error('Failed to fetch countries');
        
        const data = await response.json();
        
        // 保存到缓存
        dataManager.saveCountries(data);
        
        // 更新显示
        processCountryData(data);
      } catch (error) {
        console.error('Error fetching countries:', error);
      }
    };

    // 异步获取最新数据（仅首次加载）
    fetchCountries();
    
    // 注意：不再需要轮询，因为已经有 SSE 实时更新了
    // 如果需要实时更新，可以通过 SSE 事件来更新数据
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

  // 格式化访问时间
  const formatLastVisit = (timestamp) => {
    if (!timestamp) return 'Never';
    const now = new Date();
    const visitTime = new Date(timestamp);
    const diffMs = now - visitTime;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return visitTime.toLocaleDateString();
  };

  // 国家坐标映射（主要国家的经纬度）
  const countryCoordinates = {
    'United States': [-95.7129, 37.0902],
    'China': [104.1954, 35.8617],
    'Japan': [138.2529, 36.2048],
    'Germany': [10.4515, 51.1657],
    'United Kingdom': [-3.4360, 55.3781],
    'France': [2.2137, 46.2276],
    'Canada': [-106.3468, 56.1304],
    'Australia': [133.7751, -25.2744],
    'Brazil': [-51.9253, -14.2350],
    'India': [78.9629, 20.5937],
    'Russia': [105.3188, 61.5240],
    'South Korea': [127.7669, 35.9078],
    'Italy': [12.5674, 41.8719],
    'Spain': [-3.7492, 40.4637],
    'Netherlands': [5.2913, 52.1326],
    'Sweden': [18.6435, 60.1282],
    'Norway': [8.4689, 60.4720],
    'Denmark': [9.5018, 56.2639],
    'Finland': [25.7482, 61.9241],
    'Switzerland': [8.2275, 46.8182],
    'Austria': [14.5501, 47.5162],
    'Belgium': [4.4699, 50.5039],
    'Poland': [19.1349, 51.9194],
    'Czech Republic': [15.4730, 49.8175],
    'Hungary': [19.5033, 47.1625],
    'Portugal': [-8.2245, 39.3999],
    'Greece': [21.8243, 39.0742],
    'Turkey': [35.2433, 38.9637],
    'Israel': [34.8516, 31.0461],
    'United Arab Emirates': [53.8478, 23.4241],
    'Saudi Arabia': [45.0792, 23.8859],
    'South Africa': [22.9375, -30.5595],
    'Egypt': [30.8025, 26.0975],
    'Nigeria': [8.6753, 9.0820],
    'Kenya': [37.9062, -0.0236],
    'Mexico': [-102.5528, 23.6345],
    'Argentina': [-63.6167, -38.4161],
    'Chile': [-71.5430, -35.6751],
    'Colombia': [-74.2973, 4.5709],
    'Peru': [-75.0152, -9.1900],
    'Venezuela': [-66.5897, 6.4238],
    'Thailand': [100.9925, 15.8700],
    'Vietnam': [108.2772, 14.0583],
    'Malaysia': [101.9758, 4.2105],
    'Singapore': [103.8198, 1.3521],
    'Indonesia': [113.9213, -0.7893],
    'Philippines': [121.7740, 12.8797],
    'New Zealand': [174.8860, -40.9006],
    'Taiwan': [120.9605, 23.6978],
    'Hong Kong': [114.1095, 22.3964],
  };

  // 处理国家点击事件
  const handleCountryClick = (params) => {
    const countryName = params.name;
    const countryInfo = countryData[countryName];
    
    if (countryInfo) {
      setSelectedCountry({
        name: countryName,
        count: countryInfo.count,
        lastUpdated: countryInfo.lastUpdated,
        lastVisit: countryInfo.lastVisit,
        coordinates: countryCoordinates[countryName] || [0, 0]
      });
      setIsZoomed(true);
    }
  };

  // 返回世界视图
  const handleBackToWorld = () => {
    setSelectedCountry(null);
    setIsZoomed(false);
  };

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
      formatter: ({ name, value }) => {
        const countryInfo = countryData[name];
        if (!countryInfo) return `${name}: No data`;
        const lastVisit = countryInfo.lastVisit || countryInfo.lastUpdated;
        return `${name}: ${value} visits<br/>Last: ${formatLastVisit(lastVisit)}`;
      },
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
        roam: true,
        zoom: isZoomed ? 3 : 1,
        center: selectedCountry ? selectedCountry.coordinates : undefined,
        emphasis: {
          disabled: true,
        },
        select: {
          disabled: true,
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
        <>
          <div data-map-container className="w-full">
            <ReactECharts
              option={getMapOption()}
              style={{
                height: mapHeight,
                width: mapWidth,
              }}
              onEvents={{
                click: handleCountryClick,
              }}
            />
          </div>
          
          {/* 返回按钮 */}
          {isZoomed && (
            <button
              onClick={handleBackToWorld}
              className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm"
            >
              ← Back to World View
            </button>
          )}
        </>
      ) : (
        <p className="text-gray-400 text-sm">Loading world map...</p>
      )}

      {/* 选中国家的详细信息 */}
      {selectedCountry && (
        <div className="mt-6 w-full max-w-md bg-gray-800 rounded-lg p-4 text-white">
          <h3 className="text-lg font-bold text-center mb-3">{selectedCountry.name}</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-300">Total Visits:</span>
              <span className="text-sm font-semibold">{selectedCountry.count}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-300">Last Visit:</span>
              <span className="text-sm font-semibold">{formatLastVisit(selectedCountry.lastVisit || selectedCountry.lastUpdated)}</span>
            </div>
          </div>
        </div>
      )}

      {/* ✅ Display Top 3 Countries Under the Map */}
      {!selectedCountry && (
        <div className="mt-6 w-full max-w-md text-white text-center">
          <h2 className="text-sm font-bold">Top 3 Visiting Countries</h2>
          <p className="text-xs text-gray-400 mb-2">Click on any country to see details</p>
          <ul className="mt-2 space-y-2">
            {topCountries.length > 0 ? (
              topCountries.map(([country, data], index) => (
                <li key={index} className="flex justify-between p-2 rounded-md bg-gray-800">
                  <span className="text-xs">{index + 1}. {country}</span>
                  <span className="text-xs">{data.count} visits</span>
                </li>
              ))
            ) : (
              <p className="text-gray-400 text-sm">No data yet.</p>
            )}
          </ul>
        </div>
      )}
    </div>
  );
};

export default WorldMapDialog;
