import React, { createContext, useContext, useState } from "react";

const WeatherContext = createContext();

export function WeatherProvider({ children }) {
  const [weather, setWeather] = useState(null);
  const [weatherLoading, setWeatherLoading] = useState(true);

  return (
    <WeatherContext.Provider value={{ weather, setWeather, weatherLoading, setWeatherLoading, getWeather  }}>
      {children}
    </WeatherContext.Provider>
  );
}

export function useWeather() {
  return useContext(WeatherContext);
}

const getWeather = async (location) => {
  const apiKey = "c5298240cb3e71775b479a32329803ab";
  const response = await fetch(
    `https://api.openweathermap.org/data/2.5/weather?q=${location}&appid=${apiKey}&units=metric`
  );
  const data = await response.json();

  return {
    temp: data.main.temp,
    description: data.weather[0].description,
    icon: `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`
  };
};
export { getWeather };