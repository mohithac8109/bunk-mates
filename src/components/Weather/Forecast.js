// src/components/Weather/Forecast.js
import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
} from '@mui/material';
import dayjs from 'dayjs';

const Forecast = ({ data }) => {
  // Check if data or data.list is undefined
  if (!data || !data.list) {
    return (
      <Box my={4}>
        <Typography variant="h6">Loading forecast...</Typography>
      </Box>
    );
  }

  // OpenWeather 5-day forecast gives data every 3 hours — we’ll pick one per day
  const dailyData = data.list.filter((_, index) => index % 8 === 0);

  return (
    <Box my={4}>
      <Typography variant="h6" gutterBottom>
        5-Day Forecast
      </Typography>
      <Grid container spacing={2}>
        {dailyData.map((item, idx) => (
          <Grid item xs={12} sm={6} md={2.4} key={idx}>
            <Card sx={{ backgroundColor: '#f1f8e9' }}>
              <CardContent>
                <Typography variant="subtitle1">
                  {dayjs(item.dt_txt).format('ddd, DD MMM')}
                </Typography>
                <img
                  src={`https://openweathermap.org/img/wn/${item.weather[0].icon}@2x.png`}
                  alt={item.weather[0].description}
                />
                <Typography variant="body2">
                  {item.weather[0].main}
                </Typography>
                <Typography variant="body2">
                  Temp: {item.main.temp}°C
                </Typography>
                <Typography variant="body2">
                  Humidity: {item.main.humidity}%
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default Forecast;
