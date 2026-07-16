import React, { useState, useEffect } from 'react';

function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [activeSimulation, setActiveSimulation] = useState(null);
  
  // State for typing and submitting location queries
  const [locationInput, setLocationInput] = useState('London');
  const [currentLocation, setCurrentLocation] = useState('London');

  const fetchDashboardData = (failType = activeSimulation, loc = currentLocation) => {
    setIsLoading(true);
    setError(null);
    setActiveSimulation(failType);

    let queryParams = [];
    if (failType) queryParams.push(`fail=${failType}`);
    if (loc) queryParams.push(`location=${encodeURIComponent(loc)}`);

    const queryString = queryParams.length > 0 ? `?${queryParams.join('&')}` : '';
    const url = `http://localhost:5000/api/dashboard${queryString}`;

    fetch(url)
      .then((res) => {
        if (!res.ok) {
          return res.json().then((errData) => {
            throw new Error(errData.details || 'Server failed to process dashboard data');
          });
        }
        return res.json();
      })
      .then((resData) => {
        setData(resData);
      })
      .catch((err) => {
        setError(err.message || 'Failed to connect to the backend server.');
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  // Re-fetch when currentLocation changes
  useEffect(() => {
    fetchDashboardData(activeSimulation, currentLocation);
  }, [currentLocation]);

  const handleWeatherSearch = (e) => {
    e.preventDefault();
    if (!locationInput.trim()) return;
    setCurrentLocation(locationInput.trim());
  };

  return (
    <div className="app-container">
      <header className="header">
        <h1>Multi-Source API Dashboard</h1>
        <p>Real-time weather, currency exchange, and daily advice aggregated via an Express proxy backend.</p>
        
        {/* Simulation Controls */}
        <div style={{ marginTop: '1.5rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button 
            className="btn" 
            style={{ 
              backgroundColor: activeSimulation === null ? 'var(--accent-color)' : 'var(--card-bg)',
              border: '1px solid var(--card-border)',
              color: activeSimulation === null ? 'white' : 'var(--text-secondary)'
            }}
            onClick={() => fetchDashboardData(null, currentLocation)}
          >
            All Services Online
          </button>
          <button 
            className="btn" 
            style={{ 
              backgroundColor: activeSimulation === 'weather' ? '#b91c1c' : 'var(--card-bg)',
              border: '1px solid var(--card-border)',
              color: activeSimulation === 'weather' ? 'white' : 'var(--text-secondary)'
            }}
            onClick={() => fetchDashboardData('weather', currentLocation)}
          >
            Simulate Weather Offline
          </button>
          <button 
            className="btn" 
            style={{ 
              backgroundColor: activeSimulation === 'currency' ? '#b91c1c' : 'var(--card-bg)',
              border: '1px solid var(--card-border)',
              color: activeSimulation === 'currency' ? 'white' : 'var(--text-secondary)'
            }}
            onClick={() => fetchDashboardData('currency', currentLocation)}
          >
            Simulate Currency Offline
          </button>
          <button 
            className="btn" 
            style={{ 
              backgroundColor: activeSimulation === 'advice' ? '#b91c1c' : 'var(--card-bg)',
              border: '1px solid var(--card-border)',
              color: activeSimulation === 'advice' ? 'white' : 'var(--text-secondary)'
            }}
            onClick={() => fetchDashboardData('advice', currentLocation)}
          >
            Simulate Advice Offline
          </button>
        </div>
      </header>

      {/* 1. PENDING STATE (Loading) */}
      {isLoading && (
        <div className="loader-container">
          <div className="spinner"></div>
          <div className="loader-text">Fetching data from Express server...</div>
        </div>
      )}

      {/* 2. REJECTED STATE (Error - when backend server itself is unreachable/crashes) */}
      {!isLoading && error && (
        <div className="error-banner">
          <h2 className="error-title">Backend Connection Error</h2>
          <p className="error-desc">{error}</p>
          <button className="btn" onClick={() => fetchDashboardData(activeSimulation, currentLocation)}>
            Retry Request
          </button>
        </div>
      )}

      {/* 3. FULFILLED STATE (Data display - supports partial fulfillment) */}
      {!isLoading && !error && data && (
        <main className="dashboard-grid">
          {/* Weather Widget */}
          <section className="card">
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <h2 className="card-title" style={{ margin: 0 }}>
                  Weather: {data.weather.success ? data.weather.location : currentLocation}
                </h2>
                <span className={`status-badge ${data.weather.success ? 'online' : 'offline'}`}>
                  {data.weather.success ? 'online' : 'offline'}
                </span>
              </div>

              {/* Location Search Form */}
              <form onSubmit={handleWeatherSearch} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
                <input 
                  type="text" 
                  placeholder="Enter country, city, or state..." 
                  value={locationInput}
                  onChange={(e) => setLocationInput(e.target.value)}
                  style={{
                    flexGrow: 1,
                    backgroundColor: 'var(--bg-color)',
                    border: '1px solid var(--card-border)',
                    borderRadius: '4px',
                    padding: '0.4rem 0.6rem',
                    color: 'var(--text-primary)',
                    fontSize: '0.9rem',
                    outline: 'none'
                  }}
                />
                <button type="submit" className="btn" style={{ padding: '0.4rem 0.8rem', fontSize: '0.9rem' }}>
                  Search
                </button>
              </form>
              
              {data.weather.success ? (
                <div className="card-content">
                  <div className="data-row">
                    <span className="data-label">Description</span>
                    <span className="data-value">{data.weather.desc}</span>
                  </div>
                  <div className="data-row">
                    <span className="data-label">Temperature</span>
                    <span className="data-value accent">{data.weather.temp_C}°C</span>
                  </div>
                  <div className="data-row">
                    <span className="data-label">Humidity</span>
                    <span className="data-value">{data.weather.humidity}%</span>
                  </div>
                  <div className="data-row">
                    <span className="data-label">Wind Speed</span>
                    <span className="data-value">{data.weather.windspeedKmph} km/h</span>
                  </div>
                </div>
              ) : (
                <div className="card-content" style={{ marginTop: '1rem' }}>
                  <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.95rem' }}>
                    {data.weather.error || 'Weather service is currently unavailable.'}
                  </p>
                </div>
              )}
            </div>
          </section>

          {/* Currency Widget */}
          <section className="card">
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <h2 className="card-title" style={{ margin: 0 }}>Currency Exchange</h2>
                <span className={`status-badge ${data.currency.success ? 'online' : 'offline'}`}>
                  {data.currency.success ? 'online' : 'offline'}
                </span>
              </div>
              
              {data.currency.success ? (
                <div className="card-content">
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', margin: '0 0 1rem 0' }}>
                    Base Currency: {data.currency.base}
                  </p>
                  {Object.entries(data.currency.rates).map(([currencyCode, rate]) => (
                    <div className="data-row" key={currencyCode}>
                      <span className="data-label">{currencyCode}</span>
                      <span className="data-value accent">
                        {rate !== undefined ? rate.toFixed(4) : 'N/A'}
                      </span>
                    </div>
                  ))}
                  <div className="data-row">
                    <span className="data-label">Last Updated</span>
                    <span className="data-value" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      {new Date(data.currency.date).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="card-content" style={{ marginTop: '1rem' }}>
                  <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.95rem' }}>
                    {data.currency.error || 'Currency conversion service is currently unavailable.'}
                  </p>
                </div>
              )}
            </div>
          </section>

          {/* Advice Widget */}
          <section className="card">
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <h2 className="card-title" style={{ margin: 0 }}>Advice of the Day</h2>
                <span className={`status-badge ${data.advice.success ? 'online' : 'offline'}`}>
                  {data.advice.success ? 'online' : 'offline'}
                </span>
              </div>

              {data.advice.success ? (
                <div className="card-content">
                  <blockquote className="advice-quote">
                    "{data.advice.quote}"
                  </blockquote>
                  <p className="advice-author">Advice Slip ID: #{data.advice.id}</p>
                </div>
              ) : (
                <div className="card-content" style={{ marginTop: '1rem' }}>
                  <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.95rem' }}>
                    {data.advice.error || 'Advice service is currently unavailable.'}
                  </p>
                </div>
              )}
            </div>
          </section>
        </main>
      )}
    </div>
  );
}

export default App;
