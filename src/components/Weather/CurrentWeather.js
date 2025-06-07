// src/components/Weather/CurrentWeather.js
import React from 'react';
import { Box, Card, CardContent, Typography } from '@mui/material';

const CurrentWeather = ({ data }) => {
  const { name, main, weather, wind } = data;

  return (
    <Card sx={{ my: 3, backgroundColor: '#e3f2fd' }}>
      <CardContent>
        <Typography variant="h5" gutterBottom>
          Current Weather in {name}
        </Typography>
        <Typography variant="h6">
          {weather[0].main} ({weather[0].description})
        </Typography>
        <Typography variant="body1">
          Temperature: {main.temp}°C
        </Typography>
        <Typography variant="body1">
          Humidity: {main.humidity}%
        </Typography>
        <Typography variant="body1">
          Wind Speed: {wind.speed} m/s
        </Typography>
        <Box mt={2}>
          <img
            alt={weather[0].description}
            src={`https://openweathermap.org/img/wn/${weather[0].icon}@2x.png`}
          />
        </Box>
      </CardContent>
    </Card>
  );
};

export default CurrentWeather;
