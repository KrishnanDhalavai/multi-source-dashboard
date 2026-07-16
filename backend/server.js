import express from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Helper function to fetch and assert ok response status
const fetchJson = (url) => {
  return fetch(url)
    .then((response) => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status} for ${url}`);
      }
      return response.json();
    });
};

// Phase 4: Aggregated Dashboard Endpoint using Promise.allSettled
app.get('/api/dashboard', (req, res) => {
  const failTarget = req.query.fail;
  const location = req.query.location || 'London';

  const weatherP = failTarget === 'weather'
    ? Promise.reject(new Error('Simulated Weather API Failure'))
    : fetchJson(`https://wttr.in/${encodeURIComponent(location)}?format=j1`);

  const currencyP = failTarget === 'currency'
    ? Promise.reject(new Error('Simulated Currency API Failure'))
    : fetchJson('https://open.er-api.com/v6/latest/USD');

  const adviceP = failTarget === 'advice'
    ? Promise.reject(new Error('Simulated Advice API Failure'))
    : fetchJson('https://api.adviceslip.com/advice');

  Promise.allSettled([weatherP, currencyP, adviceP])
    .then(([weatherResult, currencyResult, adviceResult]) => {
      // 1. Process Weather
      let processedWeather = null;
      if (weatherResult.status === 'fulfilled') {
        const weather = weatherResult.value;
        const current = weather.current_condition?.[0] || {};
        processedWeather = {
          success: true,
          temp_C: current.temp_C,
          humidity: current.humidity,
          windspeedKmph: current.windspeedKmph,
          desc: current.weatherDesc?.[0]?.value || 'N/A',
          location: weather.nearest_area?.[0]?.areaName?.[0]?.value || 'London',
        };
      } else {
        processedWeather = {
          success: false,
          error: weatherResult.reason?.message || 'Weather service offline',
        };
      }

      // 2. Process Currency
      let processedCurrency = null;
      if (currencyResult.status === 'fulfilled') {
        const currency = currencyResult.value;
        const rates = currency.rates || {};
        processedCurrency = {
          success: true,
          base: currency.base_code || 'USD',
          date: currency.time_last_update_utc || new Date().toUTCString(),
          rates: {
            EUR: rates.EUR,
            GBP: rates.GBP,
            JPY: rates.JPY,
            CAD: rates.CAD,
          },
        };
      } else {
        processedCurrency = {
          success: false,
          error: currencyResult.reason?.message || 'Currency service offline',
        };
      }

      // 3. Process Advice
      let processedAdvice = null;
      if (adviceResult.status === 'fulfilled') {
        const advice = adviceResult.value;
        processedAdvice = {
          success: true,
          quote: advice.slip?.advice || 'No advice found.',
          id: advice.slip?.id || 0,
        };
      } else {
        processedAdvice = {
          success: false,
          error: adviceResult.reason?.message || 'Advice service offline',
        };
      }

      res.json({
        weather: processedWeather,
        currency: processedCurrency,
        advice: processedAdvice,
      });
    })
    .catch((err) => {
      // Promise.allSettled itself does not reject, but we guard here just in case.
      console.error('Unexpected error in Promise.allSettled:', err.message);
      res.status(500).json({
        error: 'Critical failure processing dashboard aggregation',
        details: err.message,
      });
    });
});

app.listen(PORT, () => {
  console.log(`Backend server is running on port ${PORT}`);
});
