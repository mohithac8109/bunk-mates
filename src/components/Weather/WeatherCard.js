import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Grid,
  Box,
  useTheme,
} from '@mui/material';
import {
  WbSunny,
  Cloud,
  AcUnit,
  InvertColors,
  BeachAccess,
  Thunderstorm,
} from '@mui/icons-material';

const WeatherCard = ({ city, weatherData }) => {
  if (!weatherData) return <div>Loading...</div>;

  const { main, weather, wind } = weatherData;

  const getWeatherIcon = (condition) => {
    const style = {
      fontSize: 60,
      filter: 'drop-shadow(0 0 6px rgba(0,0,0,0.2))',
    };
    switch (condition) {
      case 'Clear':
        return <WbSunny style={{ ...style, color: '#fdd835' }} />;
      case 'Clouds':
        return <Cloud style={{ ...style, color: '#90a4ae' }} />;
      case 'Snow':
        return <AcUnit style={{ ...style, color: '#81d4fa' }} />;
      case 'Rain':
        return <InvertColors style={{ ...style, color: '#4fc3f7' }} />;
      case 'Thunderstorm':
        return <Thunderstorm style={{ ...style, color: '#607d8b' }} />;
      case 'Drizzle':
        return <BeachAccess style={{ ...style, color: '#0288d1' }} />;
      default:
        return <Cloud style={{ ...style, color: '#b0bec5' }} />;
    }
  };

  return (
    <Grid item xs={12} sm={6} md={4} lg={3}>
      <Card
        elevation={8}
        sx={{
          background: 'rgba(255, 255, 255, 0.85)',
          backdropFilter: 'blur(8px)',
          borderRadius: 4,
          boxShadow: '0 8px 25px rgba(0,0,0,0.1)',
          transition: 'transform 0.3s ease',
          '&:hover': {
            transform: 'scale(1.03)',
            boxShadow: '0 12px 30px rgba(0,0,0,0.15)',
          },
          padding: 2,
          mx: 'auto',
        }}
      >
        <CardContent>
          <Typography
            variant="h5"
            align="center"
            fontWeight="bold"
            gutterBottom
            sx={{ color: '#1976d2' }}
          >
            {city}
          </Typography>

          <Box display="flex" justifyContent="center" mb={2}>
            {getWeatherIcon(weather[0].main)}
          </Box>

          <Typography variant="subtitle1" align="center" sx={{ textTransform: 'capitalize' }}>
            {weather[0].description}
          </Typography>

          <Box mt={2}>
            <Typography variant="body1">
              🌡️ Temperature: <strong>{main.temp}°C</strong>
            </Typography>
            <Typography variant="body1">
              💧 Humidity: <strong>{main.humidity}%</strong>
            </Typography>
            <Typography variant="body1">
              💨 Wind Speed: <strong>{wind.speed} km/h</strong>
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Grid>
  );
};

export default WeatherCard;
