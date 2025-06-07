// src/components/Weather/HourlyForecast.js
import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
} from '@mui/material';
import dayjs from 'dayjs';

const HourlyForecast = ({ data }) => {
  // OpenWeather gives 3-hour intervals; we'll map the next 12 hours
  const hourlyData = data.list.slice(0, 8); // for next 24 hours, slice 8 items

  return (
    <Box my={4}>
      <Typography variant="h6" gutterBottom>
        Hourly Forecast (Next 12 Hours)
      </Typography>
      <Grid container spacing={2}>
        {hourlyData.map((item, idx) => (
          <Grid item xs={12} sm={6} md={3} key={idx}>
            <Card sx={{ backgroundColor: '#ffebee' }}>
              <CardContent>
                <Typography variant="subtitle1">
                  {dayjs(item.dt_txt).format('h:mm A')}
                </Typography>
                <img
                  src={`https://openweathermap.org/img/wn/${item.weather[0].icon}@2x.png`}
                  alt={item.weather[0].description}
                />
                <Typography variant="body2">
                  Temp: {item.main.temp}°C
                </Typography>
                <Typography variant="body2">
                  Weather: {item.weather[0].main}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default HourlyForecast;
