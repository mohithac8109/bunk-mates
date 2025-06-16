import WbSunnyIcon from '@mui/icons-material/WbSunny';
import CloudIcon from '@mui/icons-material/Cloud';
import ThunderstormIcon from '@mui/icons-material/Thunderstorm';
import AcUnitIcon from '@mui/icons-material/AcUnit';
import OpacityIcon from '@mui/icons-material/Opacity';

const weatherGradients = {
  Clear: "linear-gradient(360deg, #00000000 4%, #00c2cf30 40%, #00c1cf 100%)",
  Clouds: "linear-gradient(360deg, #00000000 4%, #232526 40%, #fffbfb85 100%)",
  Rain: "linear-gradient(360deg, #00000000 4%, #232526 40%, #6e9ca5 100%)",
  Thunderstorm: "linear-gradient(360deg, #00000000 4%, #232526 40%, #8b7c66 100%)",
  Snow: "linear-gradient(360deg, #00000000 4%, #232526 40%, #dae3ff 100%)",
  Drizzle: "linear-gradient(360deg, #00000000 4%, #232526 40%, #859699 100%)",
  Mist: "linear-gradient(360deg, #00000000 4%, #232526 40%, #c7c7c7 100%)",
  Default: "linear-gradient(360deg, #00000000 4%, #232526 40%, #2c2c2c 100%)"
};

const weatherColors = {
  Clear: "#00c2cf",
  Clouds: "#fffbfb",
  Rain: "#6e9ca5",
  Thunderstorm: "#8b7c66",
  Snow: "#dae3ff",
  Drizzle: "#859699",
  Mist: "#c7c7c7",
  Default: "#23fc07"
};

const weatherbgColors = {
  Clear: "#00c2cf20",
  Clouds: "#fffbfb20",
  Rain: "#6e9ca520",
  Thunderstorm: "#8b7c6620",
  Snow: "#dae3ff20",
  Drizzle: "#85969920",
  Mist: "#c7c7c720",
  Default: "#23fc0720"
};

const weatherIcons = {
  Clear: <WbSunnyIcon sx={{ color: "#ffe066" }} />,
  Clouds: <CloudIcon sx={{ color: "#bdbdbd" }} />,
  Rain: <OpacityIcon sx={{ color: "#00b4d8" }} />,
  Thunderstorm: <ThunderstormIcon sx={{ color: "#6366f1" }} />,
  Snow: <AcUnitIcon sx={{ color: "#b3c6ff" }} />,
  Drizzle: <OpacityIcon sx={{ color: "#48cae4" }} />,
  Mist: <CloudIcon sx={{ color: "#bdbdbd" }} />,
  Default: <CloudIcon sx={{ color: "#bdbdbd" }} />
};

export { weatherGradients, weatherColors, weatherbgColors, weatherIcons };