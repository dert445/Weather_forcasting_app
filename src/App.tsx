import React, { useState, useEffect, useRef } from 'react';
import { Search, Wind, Droplets, Sun, Cloud, CloudRain, Snowflake, CloudLightning, CloudDrizzle, MapPin, AlertCircle } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';
import { motion } from 'motion/react';
import { popularCities } from './cities';

// Types
interface WeatherData {
  name: string;
  main: {
    temp: number;
    humidity: number;
    feels_like: number;
  };
  wind: {
    speed: number;
  };
  weather: Array<{
    main: string;
    description: string;
    icon: string;
  }>;
}

interface ForecastData {
  list: Array<{
    dt: number;
    main: {
      temp: number;
    };
    weather: Array<{
      main: string;
      icon: string;
    }>;
    dt_txt: string;
  }>;
}

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || 'YOUR_GEMINI_API_KEY';

export default function App() {
  const [city, setCity] = useState('London');
  const [searchInput, setSearchInput] = useState('');
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [forecast, setForecast] = useState<ForecastData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Search Autocomplete state
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  // Keep track of search box container to close dropdown when clicking outside
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const fetchWeather = async (searchCity: string) => {
    if (!API_KEY || API_KEY === 'YOUR_GEMINI_API_KEY') {
      setError('Gemini API key is missing. Please add VITE_GEMINI_API_KEY to your .env file.');
      return;
    }

    setLoading(true);
    setError('');
    setShowSuggestions(false);
    
    try {
      const ai = new GoogleGenAI({ apiKey: API_KEY });
      const prompt = `Return a JSON object containing current weather and a 5-day forecast for ${searchCity}. 
Make the weather highly realistic for the current season.
The JSON must perfectly match this structure without markdown formatting or backticks:
{
  "weatherData": {
    "name": "${searchCity}",
    "main": { "temp": 22, "humidity": 55, "feels_like": 23 },
    "wind": { "speed": 4.5 },
    "weather": [{ "main": "Clouds", "description": "scattered clouds", "icon": "03d" }]
  },
  "forecastData": {
    "list": [
      {
        "dt": 1712145600,
        "main": { "temp": 20 },
        "weather": [{ "main": "Clear", "icon": "01d" }],
        "dt_txt": "2024-04-04 12:00:00"
      }
      // exactly 5 items corresponding to 12:00:00 for the next 5 days
    ]
  }
}
Valid 'main' weather values MUST be exactly one of: Clear, Clouds, Rain, Drizzle, Thunderstorm, Snow.`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: "application/json",
        }
      });

      if (!response.text) {
          throw new Error('Failed to generate valid weather data.');
      }
      const data = JSON.parse(response.text);

      setWeather(data.weatherData);
      setForecast(data.forecastData);
      setCity(data.weatherData.name);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An unexpected error occurred during AI generation.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWeather(city);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchInput(value);
    
    if (value.length > 0) {
      const filtered = popularCities.filter(c => c.toLowerCase().startsWith(value.toLowerCase()));
      setSuggestions(filtered);
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      fetchWeather(searchInput.trim());
      setSearchInput('');
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };
  
  const handleSuggestionClick = (suggestion: string) => {
    setSearchInput(suggestion);
    fetchWeather(suggestion);
    setSearchInput('');
    setSuggestions([]);
    setShowSuggestions(false);
  };

  const getWeatherIcon = (condition: string, className = "w-6 h-6") => {
    switch (condition.toLowerCase()) {
      case 'clear': 
        return (
          <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 8, ease: "linear" }}>
            <Sun className={className} />
          </motion.div>
        );
      case 'clouds': 
        return (
          <motion.div animate={{ x: [-2, 2, -2] }} transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}>
            <Cloud className={className} />
          </motion.div>
        );
      case 'rain': 
        return (
          <motion.div animate={{ y: [-2, 2, -2] }} transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}>
            <CloudRain className={className} />
          </motion.div>
        );
      case 'drizzle': 
        return (
          <motion.div animate={{ y: [-1, 1, -1], x: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}>
            <CloudDrizzle className={className} />
          </motion.div>
        );
      case 'thunderstorm': 
        return (
          <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ repeat: Infinity, duration: 0.5, ease: "bounce" }}>
            <CloudLightning className={className} />
          </motion.div>
        );
      case 'snow': 
        return (
          <motion.div animate={{ rotate: [0, 10, -10, 0], y: [-2, 2, -2] }} transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}>
            <Snowflake className={className} />
          </motion.div>
        );
      default: 
        return <Sun className={className} />;
    }
  };

  const getBackgroundGradient = (condition?: string) => {
    if (!condition) return 'from-blue-400 to-blue-600 text-white';
    
    switch (condition.toLowerCase()) {
      case 'clear': return 'from-orange-400 to-amber-300 text-slate-900';
      case 'clouds': return 'from-slate-400 to-slate-300 text-slate-900';
      case 'rain': 
      case 'drizzle': return 'from-blue-700 to-blue-500 text-white';
      case 'thunderstorm': return 'from-slate-800 to-slate-600 text-white';
      case 'snow': return 'from-blue-100 to-white text-slate-800';
      default: return 'from-blue-400 to-blue-600 text-white';
    }
  };

  // Process forecast data to get one reading per day (e.g., at 12:00 PM)
  const dailyForecast = forecast?.list.filter(item => item.dt_txt.includes('12:00:00')).slice(0, 5) || [];

  const bgClass = getBackgroundGradient(weather?.weather[0]?.main);

  return (
    <div className={`min-h-screen bg-gradient-to-br ${bgClass} transition-colors duration-700 ease-in-out p-4 md:p-8 font-sans`}>
      <div className="max-w-4xl mx-auto">
        {/* Header & Search */}
        <header className="mb-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Cloud className="w-8 h-8" />
            WeatherApp
          </h1>
          
          <div ref={searchRef} className="w-full md:w-auto relative">
            <form onSubmit={handleSearch} className="relative text-slate-900 z-20">
              <input
                type="text"
                placeholder="Search city..."
                value={searchInput}
                onChange={handleInputChange}
                onFocus={() => { if(suggestions.length > 0) setShowSuggestions(true); }}
                className="w-full md:w-80 pl-10 pr-4 py-3 rounded-full bg-white/40 backdrop-blur-md border border-white/50 placeholder:text-slate-700 focus:outline-none focus:ring-2 focus:ring-white/70 transition-all shadow-lg"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 opacity-70" />
              <button type="submit" className="hidden">Search</button>
            </form>
            
            {/* Suggestions Dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <ul className="absolute top-full left-0 right-0 mt-2 bg-white/80 backdrop-blur-xl border border-white/40 rounded-2xl shadow-xl overflow-hidden z-10 max-h-60 overflow-y-auto">
                {suggestions.map((suggestion) => (
                  <li 
                    key={suggestion}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="px-4 py-3 cursor-pointer hover:bg-white/50 text-slate-800 transition-colors border-b border-white/20 last:border-0"
                  >
                    {suggestion}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </header>

        {/* Error Message */}
        {error && (
          <div className="bg-red-500/90 backdrop-blur-md text-white p-4 rounded-2xl mb-8 flex items-center gap-3 shadow-lg">
            <AlertCircle className="w-6 h-6 shrink-0" />
            <p className="font-medium">{error}</p>
          </div>
        )}

        {/* Loading State */}
        {loading && !weather && (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-current border-t-transparent"></div>
          </div>
        )}

        {/* Main Content */}
        {!loading && weather && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Current Weather Card */}
            <div className="lg:col-span-2 bg-white/20 backdrop-blur-xl rounded-3xl p-8 border border-white/30 shadow-2xl">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin className="w-5 h-5 opacity-80" />
                    <h2 className="text-4xl font-bold">{weather.name}</h2>
                  </div>
                  <p className="text-xl opacity-90 capitalize">{weather.weather[0].description}</p>
                </div>
                <div className="p-4 bg-white/30 rounded-2xl backdrop-blur-md shadow-inner overflow-hidden">
                  {getWeatherIcon(weather.weather[0].main, "w-16 h-16")}
                </div>
              </div>

              <div className="mt-12 flex flex-col md:flex-row items-center md:items-end gap-8">
                <div className="text-8xl font-black tracking-tighter">
                  {Math.round(weather.main.temp)}°
                </div>
                
                <div className="grid grid-cols-2 gap-6 w-full md:w-auto">
                  <div className="flex items-center gap-3 bg-white/20 p-4 rounded-2xl backdrop-blur-sm shadow-sm">
                    <Droplets className="w-6 h-6 opacity-80" />
                    <div>
                      <p className="text-sm opacity-80 font-medium">Humidity</p>
                      <p className="text-xl font-bold">{weather.main.humidity}%</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 bg-white/20 p-4 rounded-2xl backdrop-blur-sm shadow-sm">
                    <Wind className="w-6 h-6 opacity-80" />
                    <div>
                      <p className="text-sm opacity-80 font-medium">Wind Speed</p>
                      <p className="text-xl font-bold">{weather.wind.speed} m/s</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 5-Day Forecast */}
            <div className="bg-white/20 backdrop-blur-xl rounded-3xl p-6 border border-white/30 shadow-2xl">
              <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                <Cloud className="w-5 h-5" />
                5-Day Forecast
              </h3>
              
              <div className="flex flex-col gap-4">
                {dailyForecast.map((day, index) => {
                  const date = new Date(day.dt * 1000);
                  const dayName = index === 0 ? 'Today' : new Intl.DateTimeFormat('en-US', { weekday: 'short' }).format(date);
                  
                  return (
                    <div key={day.dt} className="flex items-center justify-between p-3 rounded-2xl hover:bg-white/30 transition-colors">
                      <span className="font-medium w-12">{dayName}</span>
                      <div className="flex items-center gap-2 overflow-hidden">
                        {getWeatherIcon(day.weather[0].main, "w-6 h-6")}
                        <span className="text-sm opacity-90 capitalize hidden sm:inline-block w-20 truncate font-medium">
                          {day.weather[0].main}
                        </span>
                      </div>
                      <span className="font-bold text-lg">{Math.round(day.main.temp)}°</span>
                    </div>
                  );
                })}
                {dailyForecast.length === 0 && !loading && (
                  <p className="opacity-70 text-center py-4 font-medium">Forecast data unavailable</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
