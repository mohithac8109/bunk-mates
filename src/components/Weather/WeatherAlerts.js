// src/components/Weather/WeatherAlerts.js
import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Alert,
} from '@mui/material';

const WeatherAlerts = ({ alerts }) => {
  if (!alerts || alerts.length === 0) {
    return null; // No alerts, don't render the component
  }

  return (
    <Box my={4}>
      <Typography variant="h6" gutterBottom>
        Weather Alerts
      </Typography>
      {alerts.map((alert, index) => (
        <Card key={index} sx={{ mb: 2, backgroundColor: '#fff8e1' }}>
          <CardContent>
            <Alert severity="warning">
              <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                {alert.event}
              </Typography>
              <Typography variant="body2">
                {alert.description}
              </Typography>
              <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
                {alert.start} - {alert.end}
              </Typography>
            </Alert>
          </CardContent>
        </Card>
      ))}
    </Box>
  );
};

export default WeatherAlerts;
