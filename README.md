# Weather Forecast App

A fast, responsive, and beautifully designed weather forecasting application built with React, Vite, and Tailwind CSS. The application dynamically adjusts its background and user interface elements depending on the real-time weather conditions of the selected city.

## Features

- **Live Weather Data**: Retrieve current weather details including temperature, humidity, wind speed, and weather conditions.
- **Dynamic Styling**: Beautiful UI with background gradients that change according to the weather.
- **5-Day Forecast**: Get a 5-day weather forecast summary updated daily at 12:00 PM.
- **Modern Tech Stack**: Uses React 19, Tailwind CSS v3, and Vite for blazing fast performance.
- **Responsive Design**: Mobile-friendly layout scaling perfectly to larger screens.

## Getting Started

### Prerequisites

You need [Node.js](https://nodejs.org/) installed on your machine.

### API Key Setup

This application relies on the free [OpenWeatherMap API](https://openweathermap.org/api) to fetch weather data.
1. Sign up for a free account at OpenWeatherMap.
2. Get your API key from the dashboard.
3. Rename `.env.example` to `.env`.
4. Add your API key inside `.env`:
   ```bash
   VITE_OPENWEATHER_API_KEY="your_api_key_here"
   ```

### Installation

1. Install the dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

3. Build for production:
   ```bash
   npm run build
   ```
   You can find your production-ready compiled files in the `dist` folder.

## Scripts overview

- `npm run dev`: Runs the development server.
- `npm run build`: Bundles the app into static files for production.
- `npm run preview`: Locally preview your production build.
- `npm run lint`: Analyzes the typescript code for type issues.
- `npm run clean`: Removes the `dist` build directory.
