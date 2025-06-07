import React from 'react';
import {
  WbSunny,
  Cloud,
  AcUnit,
  Opacity,
  Thunderstorm,
  Grain
} from '@mui/icons-material';
import { Box } from '@mui/material';

// Custom animation style
const iconStyle = {
  fontSize: 48,
  transition: 'transform 0.3s ease',
  '&:hover': {
    transform: 'scale(1.2)',
  },
};

// Mapping condition to icon and color
const conditionIcons = {
  Clear: { icon: <WbSunny sx={{ ...iconStyle, color: '#fdd835' }} />, label: 'Sunny' },
  Clouds: { icon: <Cloud sx={{ ...iconStyle, color: '#90a4ae' }} />, label: 'Cloudy' },
  Rain: { icon: <Opacity sx={{ ...iconStyle, color: '#4fc3f7' }} />, label: 'Rain' },
  Drizzle: { icon: <Grain sx={{ ...iconStyle, color: '#0288d1' }} />, label: 'Drizzle' },
  Snow: { icon: <AcUnit sx={{ ...iconStyle, color: '#b3e5fc' }} />, label: 'Snow' },
  Thunderstorm: { icon: <Thunderstorm sx={{ ...iconStyle, color: '#7e57c2' }} />, label: 'Thunderstorm' },
  Atmosphere: { icon: <Cloud sx={{ ...iconStyle, color: '#607d8b' }} />, label: 'Hazy' },
};

const WeatherIcon = ({ condition }) => {
  const { icon } = conditionIcons[condition] || conditionIcons['Clouds'];

  return (
    <Box
      display="flex"
      justifyContent="center"
      alignItems="center"
      sx={{
        padding: 1,
        borderRadius: '50%',
        boxShadow: `0 0 12px ${conditionIcons[condition]?.icon.props.sx.color || '#90a4ae'}`,
        backgroundColor: '#ffffffcc',
        width: 70,
        height: 70,
      }}
    >
      {icon}
    </Box>
  );
};

export default WeatherIcon;
