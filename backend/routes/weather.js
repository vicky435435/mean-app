const express = require('express');
const axios = require('axios');
const { query, validationResult } = require('express-validator');

const router = express.Router();

const WEATHER_BASE = process.env.WEATHER_BASE_URL || 'https://api.openweathermap.org/data/2.5';
const API_KEY = process.env.WEATHER_API_KEY;

// ─── GET /api/weather/current?city=<city> ─────────────────────────────────────
router.get(
  '/current',
  [
    query('city')
      .trim()
      .notEmpty().withMessage('City parameter is required')
      .isLength({ max: 100 }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ success: false, errors: errors.array() });
    }

    if (!API_KEY) {
      // Return mock data if API key is not configured
      return res.json({
        success: true,
        isMock: true,
        data: {
          city: req.query.city,
          country: 'US',
          temperature: 22,
          feelsLike: 20,
          humidity: 65,
          windSpeed: 5.2,
          description: 'partly cloudy',
          icon: '02d',
          pressure: 1013,
          visibility: 10000,
          fetchedAt: new Date().toISOString(),
        },
      });
    }

    try {
      const response = await axios.get(`${WEATHER_BASE}/weather`, {
        params: {
          q: req.query.city,
          appid: API_KEY,
          units: 'metric',
        },
        timeout: 8000,
      });

      const w = response.data;

      res.json({
        success: true,
        data: {
          city: w.name,
          country: w.sys.country,
          temperature: Math.round(w.main.temp),
          feelsLike: Math.round(w.main.feels_like),
          humidity: w.main.humidity,
          windSpeed: w.wind.speed,
          description: w.weather[0].description,
          icon: w.weather[0].icon,
          pressure: w.main.pressure,
          visibility: w.visibility,
          fetchedAt: new Date().toISOString(),
        },
      });
    } catch (error) {
      if (error.response?.status === 404) {
        return res.status(404).json({ success: false, message: `City "${req.query.city}" not found` });
      }
      if (error.response?.status === 401) {
        return res.status(500).json({ success: false, message: 'Weather API key is invalid' });
      }
      res.status(500).json({ success: false, message: 'Failed to fetch weather data' });
    }
  }
);

// ─── GET /api/weather/forecast?city=<city> ────────────────────────────────────
router.get('/forecast', async (req, res) => {
  const { city } = req.query;
  if (!city) {
    return res.status(400).json({ success: false, message: 'City parameter is required' });
  }

  if (!API_KEY) {
    // Mock 5-day forecast
    const forecast = Array.from({ length: 5 }, (_, i) => ({
      date: new Date(Date.now() + i * 86400000).toISOString().split('T')[0],
      tempMin: 16 + i,
      tempMax: 24 + i,
      description: ['sunny', 'cloudy', 'rainy', 'partly cloudy', 'clear'][i % 5],
      icon: ['01d', '03d', '10d', '02d', '01d'][i % 5],
    }));
    return res.json({ success: true, isMock: true, data: { city, forecast } });
  }

  try {
    const response = await axios.get(`${WEATHER_BASE}/forecast`, {
      params: { q: city, appid: API_KEY, units: 'metric', cnt: 40 },
      timeout: 8000,
    });

    // Group by day and pick min/max temps
    const byDay = {};
    for (const item of response.data.list) {
      const day = item.dt_txt.split(' ')[0];
      if (!byDay[day]) {
        byDay[day] = { tempMin: item.main.temp_min, tempMax: item.main.temp_max, description: item.weather[0].description, icon: item.weather[0].icon };
      } else {
        byDay[day].tempMin = Math.min(byDay[day].tempMin, item.main.temp_min);
        byDay[day].tempMax = Math.max(byDay[day].tempMax, item.main.temp_max);
      }
    }

    const forecast = Object.entries(byDay)
      .slice(0, 5)
      .map(([date, data]) => ({ date, ...data, tempMin: Math.round(data.tempMin), tempMax: Math.round(data.tempMax) }));

    res.json({ success: true, data: { city: response.data.city.name, forecast } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch forecast data' });
  }
});

module.exports = router;
