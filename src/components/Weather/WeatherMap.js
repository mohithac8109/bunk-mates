import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { Icon } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './WeatherMap.css'; // Create this for custom styles
import WbSunnyIcon from '@mui/icons-material/WbSunny';
import OpacityIcon from '@mui/icons-material/Opacity';
import ThermostatIcon from '@mui/icons-material/Thermostat';

const WeatherMap = ({ weatherData, center }) => {
  const position = center || [51.505, -0.09];

  const weatherIcon = weatherData
    ? `https://openweathermap.org/img/wn/${weatherData.weather[0].icon}@2x.png`
    : 'https://openweathermap.org/img/wn/01d.png';

  const customIcon = new Icon({
    iconUrl: weatherIcon,
    iconSize: [50, 50],
    iconAnchor: [25, 50],
    popupAnchor: [0, -50],
    className: 'animated-marker', // For optional animation
  });

  return (
    <div className="map-container">
      <MapContainer
        center={position}
        zoom={10}
        scrollWheelZoom={false}
        style={{
          width: '100%',
          height: '400px',
          borderRadius: '10px',
          overflow: 'hidden',
          boxShadow: '0 10px 20px rgba(0,0,0,0.2)',
        }}
      >
        <TileLayer
          // Darker map style (you can change to other themes too)
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='© OpenStreetMap contributors'
        />

        {weatherData?.coord && (
          <Marker position={[weatherData.coord.lat, weatherData.coord.lon]} icon={customIcon}>
            <Popup className="custom-popup">
              <div style={{ textAlign: 'center' }}>
                <h3 style={{ margin: '5px 0' }}>{weatherData.name}</h3>
                <img src={weatherIcon} alt="weather" style={{ width: 60 }} />
                <p>{weatherData.weather[0].description}</p>
                <p>
                  <ThermostatIcon fontSize="small" /> {weatherData.main.temp}°C
                </p>
                <p>
                  <OpacityIcon fontSize="small" /> {weatherData.main.humidity}%
                </p>
              </div>
            </Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  );
};

export default WeatherMap;
