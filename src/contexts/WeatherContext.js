import React, { createContext, useContext, useState } from "react";

const WeatherContext = createContext();

export function WeatherProvider({ children }) {
  const [weather, setWeather] = useState(null);
  const [weatherLoading, setWeatherLoading] = useState(true);

  return (
    <WeatherContext.Provider value={{ weather, setWeather, weatherLoading, setWeatherLoading }}>
      {children}
    </WeatherContext.Provider>
  );
}

export function useWeather() {
  return useContext(WeatherContext);
}