import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Label
} from 'recharts';
import { Paper, Typography, Box } from '@mui/material';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <Paper sx={{ p: 2, background: '#ffffffee', boxShadow: 3 }}>
        <Typography variant="subtitle2">{label}</Typography>
        <Typography variant="body2" sx={{ color: '#8884d8' }}>
          🌡 Temperature: {payload[0].value}°C
        </Typography>
        <Typography variant="body2" sx={{ color: '#82ca9d' }}>
          💧 Humidity: {payload[1].value}%
        </Typography>
      </Paper>
    );
  }

  return null;
};

const WeatherChart = ({ data }) => {
  return (
    <Box my={4} sx={{ background: 'linear-gradient(to right, #e3f2fd, #f3e5f5)', borderRadius: 4, p: 2 }}>
      <Typography variant="h6" align="center" gutterBottom fontWeight="bold">
        📊 Weather Trends
      </Typography>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data} margin={{ top: 5, right: 30, left: 0, bottom: 25 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#ccc" />
          <XAxis dataKey="date" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }}>
            <Label
              value="Values"
              angle={-90}
              position="insideLeft"
              style={{ textAnchor: 'middle', fill: '#888' }}
            />
          </YAxis>
          <Tooltip content={<CustomTooltip />} />
          <Legend verticalAlign="top" height={36} />
          <Line
            type="monotone"
            dataKey="temperature"
            stroke="#8884d8"
            strokeWidth={3}
            dot={{ r: 5, stroke: '#8884d8', strokeWidth: 2, fill: 'white' }}
            activeDot={{ r: 8 }}
            name="Temperature (°C)"
          />
          <Line
            type="monotone"
            dataKey="humidity"
            stroke="#82ca9d"
            strokeWidth={3}
            dot={{ r: 5, stroke: '#82ca9d', strokeWidth: 2, fill: 'white' }}
            activeDot={{ r: 8 }}
            name="Humidity (%)"
          />
        </LineChart>
      </ResponsiveContainer>
    </Box>
  );
};

export default WeatherChart;
