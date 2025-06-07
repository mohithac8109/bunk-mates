import React, { useState, useEffect } from 'react';
import axios from 'axios';
import WeatherCard from './WeatherCard';
import {
  Grid,
  CircularProgress,
  Typography,
  Box,
  TextField,
  Button,
  Container,
  Paper,
  Slide,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import MyLocationIcon from '@mui/icons-material/MyLocation';

const WeatherPage = () => {
  const [weatherData, setWeatherData] = useState(null);
  const [userLocationWeather, setUserLocationWeather] = useState(null);
  const [loading, setLoading] = useState(true);
  const [city, setCity] = useState('');

  const apiKey = 'c5298240cb3e71775b479a32329803ab'; // Replace with your API key

  const fetchWeatherData = async (lat, lon) => {
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}`;
    try {
      const response = await axios.get(url);
      setUserLocationWeather(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching weather data:', error);
      setLoading(false);
    }
  };

  const getUserLocation = () => {
    setLoading(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          fetchWeatherData(latitude, longitude);
        },
        (error) => {
          console.error('Error getting location:', error);
          setLoading(false);
        }
      );
    } else {
      alert('Geolocation is not supported by this browser.');
      setLoading(false);
    }
  };

  const handleCitySearch = async () => {
    if (city) {
      setLoading(true);
      const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${apiKey}`;
      try {
        const response = await axios.get(url);
        setWeatherData(response.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching weather data:', error);
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    getUserLocation();
  }, []);

  return (
    <Container maxWidth="md" sx={{ mt: 5 }}>
      <Paper
        elevation={5}
        sx={{
          padding: 5,
          borderRadius: 5,
          background: 'linear-gradient(145deg, #dbeafe, #ffffff)',
          boxShadow: '0 8px 25px rgba(0,0,0,0.1)',
        }}
      >
        <Typography
          variant="h3"
          align="center"
          fontWeight="bold"
          sx={{
            color: '#1976d2',
            textShadow: '1px 1px 2px rgba(0,0,0,0.1)',
            mb: 4,
          }}
        >
          🌦️ Weather Explorer
        </Typography>

        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          gap={2}
          flexWrap="wrap"
          mb={4}
        >
          <TextField
            label="Search city"
            variant="outlined"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            sx={{
              backgroundColor: 'white',
              borderRadius: 1,
              minWidth: 200,
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            }}
          />
          <Button
            variant="contained"
            onClick={handleCitySearch}
            startIcon={<SearchIcon />}
            sx={{
              background: 'linear-gradient(to right, #42a5f5, #1e88e5)',
              boxShadow: '0 4px 12px rgba(33, 150, 243, 0.4)',
              '&:hover': {
                background: 'linear-gradient(to right, #1e88e5, #1565c0)',
              },
            }}
          >
            Search
          </Button>
          <Button
            variant="outlined"
            startIcon={<MyLocationIcon />}
            onClick={getUserLocation}
            sx={{
              borderColor: '#90caf9',
              color: '#1565c0',
              '&:hover': {
                borderColor: '#42a5f5',
                backgroundColor: '#e3f2fd',
              },
            }}
          >
            Use My Location
          </Button>
        </Box>

        {loading ? (
          <Box textAlign="center" mt={5}>
            <CircularProgress color="primary" />
            <Typography variant="body2" mt={2}>
              Fetching weather data...
            </Typography>
          </Box>
        ) : (
          <Grid container spacing={4} justifyContent="center">
            {userLocationWeather && (
              <Slide direction="up" in={true} mountOnEnter unmountOnExit>
                <Grid item xs={12} sm={6} md={4}>
                  <WeatherCard city="Your Location" weatherData={userLocationWeather} />
                </Grid>
              </Slide>
            )}
            {weatherData && (
              <Slide direction="up" in={true} mountOnEnter unmountOnExit>
                <Grid item xs={12} sm={6} md={4}>
                  <WeatherCard city={weatherData.name} weatherData={weatherData} />
                </Grid>
              </Slide>
            )}
          </Grid>
        )}
      </Paper>
    </Container>
  );
};

export default WeatherPage;
