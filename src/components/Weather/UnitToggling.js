// src/components/Weather/UnitToggling.js
import React, { useState } from 'react';
import { Button, ButtonGroup } from '@mui/material';

const UnitToggling = ({ setUnit }) => {
  const [unit, setUnitState] = useState('metric'); // metric for °C, imperial for °F

  const handleUnitChange = (unitType) => {
    setUnitState(unitType);
    setUnit(unitType);
  };

  return (
    <ButtonGroup variant="outlined" color="primary">
      <Button onClick={() => handleUnitChange('metric')}>°C</Button>
      <Button onClick={() => handleUnitChange('imperial')}>°F</Button>
      <Button onClick={() => handleUnitChange('metric')}>km/h</Button>
      <Button onClick={() => handleUnitChange('imperial')}>mph</Button>
    </ButtonGroup>
  );
};

export default UnitToggling;
