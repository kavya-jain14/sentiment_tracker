import React, { useState, useEffect, useMemo, useCallback } from 'react';

const ALTERNATIVE_ME_API_URL = 'https://api.alternative.me/fng/?limit=90';


const getClassification = (score) => {
  if (score >= 75) return { name: 'Extreme Greed', color: 'text-green-600', hex: '#16a34a' };
  if (score >= 55) return { name: 'Greed', color: 'text-green-400', hex: '#4ade80' };
  if (score >= 45) return { name: 'Neutral', color: 'text-yellow-400', hex: '#facc15' };
  if (score >= 25) return { name: 'Fear', color: 'text-orange-500', hex: '#f97316' };
  return { name: 'Extreme Fear', color: 'text-red-600', hex: '#dc2626' };
};


const generateMockData = (fngData) => {
  const mockData = [];
  const basePrice = 45000;


  const reversedFng = [...fngData].reverse();

  reversedFng.forEach((item, index) => {
    const score = parseInt(item.value);

   
    const date = new Date(parseInt(item.timestamp) * 1000).toISOString().substring(0, 10);

    // SIMPLE MOCK BTC PRICE: Correlate price loosely to sentiment for visualization
    const priceFactor = (score / 100) * 0.5 + 0.75;
    const btcPrice = Math.round(basePrice * priceFactor + Math.sin(index / 5) * 2000);

    mockData.push({
      date: date,
      fearGreedScore: score,
      classification: item.value_classification,
      btcPrice: btcPrice,
    });
  });
  return mockData;
};



const GaugeDisplay = ({ score, classification }) => {

  const rotationDegrees = -90 + (score / 100) * 180;

  return (
    <div className="relative w-full max-w-sm mx-auto text-center p-4">
      <svg className="w-full" viewBox="0 0 200 110">
        {/* Gauge Background Arcs */}
        <path d="M 10 100 A 90 90 0 0 1 190 100" fill="none" stroke="#dc2626" strokeWidth="20" opacity="0.3" /> {/* Extreme Fear */}
        <path d="M 10 100 A 90 90 0 0 1 190 100" fill="none" stroke="#f97316" strokeWidth="20" strokeDasharray="50 150" strokeDashoffset="125" opacity="0.4" /> {/* Fear */}
        <path d="M 10 100 A 90 90 0 0 1 190 100" fill="none" stroke="#facc15" strokeWidth="20" strokeDasharray="20 180" strokeDashoffset="90" opacity="0.5" /> {/* Neutral */}
        <path d="M 10 100 A 90 90 0 0 1 190 100" fill="none" stroke="#4ade80" strokeWidth="20" strokeDasharray="50 150" strokeDashoffset="65" opacity="0.6" /> {/* Greed */}
        <path d="M 10 100 A 90 90 0 0 1 190 100" fill="none" stroke="#16a34a" strokeWidth="20" strokeDasharray="50 150" strokeDashoffset="25" opacity="0.7" /> {/* Extreme Greed */}

        {/* Needle/Arrow */}
        <g style={{ transform: 'translate(100px, 100px)', transition: 'transform 1s ease-out' }}>
          <line
            x1="0" y1="0" x2="0" y2="-90"
            stroke="#1f2937"
            strokeWidth="4"
            strokeLinecap="round"
            style={{
              transform: `rotate(${rotationDegrees}deg)`,
              transformOrigin: '0 0',
              transition: 'transform 1s ease-out',
            }}
          />
          <circle cx="0" cy="0" r="8" fill="#1f2937" />
        </g>
      </svg>
      <div className="absolute inset-x-0 top-0 z-10 pt-16">
        <div className="bg-gray-700/80 backdrop-blur-sm rounded-xl p-3 shadow-2xl inline-block">
          <p className="text-xl font-bold text-white uppercase">
            SCORE: <span className={`${classification.color} text-4xl`}>{score}</span>
          </p>
          <p className={`text-2xl font-extrabold ${classification.color}`}>
            {classification.name}
          </p>
        </div>
      </div>
    </div>
  );
};



const HistoricalChart = ({ data }) => {

  const WIDTH = 600;
  const HEIGHT = 300;
  const PADDING = 40;
  const CHART_WIDTH = WIDTH - 2 * PADDING;
  const CHART_HEIGHT = HEIGHT - 2 * PADDING;

  if (data.length === 0) {
    return (
      <div className="bg-gray-700 p-4 rounded-xl h-96 flex items-center justify-center">
        <p className="text-red-400">No Historical Data Loaded for Charting.</p>
      </div>
    );
  }


  const scores = data.map(d => d.fearGreedScore);
  const prices = data.map(d => d.btcPrice);

  const minScore = 0;
  const maxScore = 100; 
  const minPrice = Math.min(...prices) * 0.95; 
  const maxPrice = Math.max(...prices) * 1.05; 

 
  const getX = (index) => PADDING + (index / (data.length - 1)) * CHART_WIDTH;
  const getYScore = (score) => PADDING + CHART_HEIGHT - ((score - minScore) / (maxScore - minScore)) * CHART_HEIGHT;
  const getYPrice = (price) => PADDING + CHART_HEIGHT - ((price - minPrice) / (maxPrice - minPrice)) * CHART_HEIGHT;


  const scorePath = data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getYScore(d.fearGreedScore)}`).join(' ');
  const pricePath = data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getYPrice(d.btcPrice)}`).join(' ');

  
  const scoreToHeight = (score) => (score / maxScore) * CHART_HEIGHT;

  const sentimentZones = [
    { start: 0, end: 25, color: '#dc2626', opacity: 0.1 },
    { start: 25, end: 45, color: '#f97316', opacity: 0.1 },
    { start: 45, end: 55, color: '#facc15', opacity: 0.1 },
    { start: 55, end: 75, color: '#4ade80', opacity: 0.1 },
    { start: 75, end: 100, color: '#16a34a', opacity: 0.1 },
  ];

  return (
    <div className="bg-gray-700 p-4 rounded-xl h-96 w-full">
      <svg width="100%" height="100%" viewBox={`0 0 ${WIDTH} ${HEIGHT}`} preserveAspectRatio="xMidYMid meet" style={{ overflow: 'visible' }}>
        {/* Background and Grid */}
        <rect x={PADDING} y={PADDING} width={CHART_WIDTH} height={CHART_HEIGHT} fill="#1f2937" />

        {/* Sentiment Zone Backgrounds */}
        {sentimentZones.map((zone, index) => {
          const zoneHeight = scoreToHeight(zone.end - zone.start);
          const zoneY = getYScore(zone.end);
          return (
            <rect
              key={index}
              x={PADDING}
              y={zoneY}
              width={CHART_WIDTH}
              height={zoneHeight}
              fill={zone.color}
              fillOpacity={zone.opacity}
            />
          );
        })}

        {/* F&G Score Line */}
        <path d={scorePath} fill="none" stroke="#10b981" strokeWidth="2" />

        {/* BTC Price Line */}
        <path d={pricePath} fill="none" stroke="#3b82f6" strokeWidth="2" />

        {/* Y-Axis (F&G Score - Left) */}
        {[0, 25, 50, 75, 100].map(score => (
          <text key={score} x={PADDING - 5} y={getYScore(score)} textAnchor="end" fill="#10b981" fontSize="10">
            {score}
          </text>
        ))}

        {/* Y-Axis (BTC Price - Right) */}
        {[minPrice, (minPrice + maxPrice) / 2, maxPrice].map((price, index) => (
          <text key={index} x={WIDTH - PADDING + 5} y={getYPrice(price)} textAnchor="start" fill="#3b82f6" fontSize="10">
            ${(price / 1000).toFixed(0)}K
          </text>
        ))}

        {/* X-Axis (Dates - Simplified) */}
        {data.filter((_, i) => i % Math.ceil(data.length / 8) === 0).map((d, i) => (
          <text key={i} x={getX(data.indexOf(d))} y={HEIGHT - PADDING + 15} textAnchor="middle" fill="#9ca3af" fontSize="9">
            {d.date.substring(5)}
          </text>
        ))}

        {/* Title & Legend (Simplified) */}
        <text x={PADDING} y={20} fill="#10b981" fontSize="12" fontWeight="bold">F&G Score</text>
        <text x={PADDING + 80} y={20} fill="#3b82f6" fontSize="12" fontWeight="bold">BTC Price</text>

      </svg>
    </div>
  );
};



const App = () => {
  const [historicalData, setHistoricalData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

 
  const fetchSentimentData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
     
      const response = await fetch(ALTERNATIVE_ME_API_URL);

      if (!response.ok) {
       
        throw new Error(`External API fetch failed with status: ${response.status}`);
      }

      const result = await response.json();

      if (result.data) {
       
        const processedData = generateMockData(result.data);
        setHistoricalData(processedData);
      } else {
        throw new Error("Invalid data structure from Alternative.me.");
      }
    } catch (e) {
      
      console.warn("Direct API fetch failed (Using simulated data).", e);

      
      const fallbackFngData = [
        { value: '45', value_classification: 'Neutral', timestamp: String(Math.floor(Date.now() / 1000) - 86400 * 5) },
        { value: '20', value_classification: 'Extreme Fear', timestamp: String(Math.floor(Date.now() / 1000) - 86400 * 4) },
        { value: '35', value_classification: 'Fear', timestamp: String(Math.floor(Date.now() / 1000) - 86400 * 3) },
        { value: '55', value_classification: 'Greed', timestamp: String(Math.floor(Date.now() / 1000) - 86400 * 2) },
        { value: '78', value_classification: 'Extreme Greed', timestamp: String(Math.floor(Date.now() / 1000) - 86400 * 1) },
        { value: '62', value_classification: 'Greed', timestamp: String(Math.floor(Date.now() / 1000) - 86400 * 0) },
      ];
      const processedData = generateMockData(fallbackFngData);
      setHistoricalData(processedData);

      setError("Note: Live data fetch failed. Displaying simulated data for development.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSentimentData();
  }, [fetchSentimentData]);

  const latestData = useMemo(() => {
    return historicalData.length > 0 ? historicalData[historicalData.length - 1] : null;
  }, [historicalData]);

  const classification = latestData
    ? getClassification(latestData.fearGreedScore)
    : { name: 'Loading', color: 'text-gray-500' };

  

  if (loading) {
    return <div className="flex justify-center items-center h-screen bg-gray-900 text-white text-2xl">Loading Sentiment Data...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white font-inter p-4 sm:p-8">
      <header className="text-center mb-10">
        <h1 className="text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-500">
          Crypto Emotion Tracker
        </h1>
        <p className="text-gray-400 mt-2">Fear & Greed Sentiment: Be fearful when others are greedy.</p>
      </header>

      <div className="max-w-4xl mx-auto space-y-8">
        {/* Error Banner */}
        {error && (
          <div className="bg-orange-900/50 text-orange-300 p-3 rounded-lg text-sm mb-4">
            {error}
          </div>
        )}

        {/* 1. Current Sentiment Display (The Gauge) */}
        <section className="bg-gray-800 p-6 rounded-2xl shadow-xl ring-2 ring-blue-500/50">
          <h2 className="text-2xl font-bold mb-4">Today's Reading</h2>
          {latestData ? (
            <>
              <GaugeDisplay
                score={latestData.fearGreedScore}
                classification={classification}
              />
              <div className="mt-6 text-center">
                <p className="text-xl text-gray-400">BTC Price Context (Simulated):</p>
                <p className="text-3xl font-extrabold text-blue-400">
                  ${latestData.btcPrice.toLocaleString()}
                </p>
              </div>
            </>
          ) : (
            <p className="text-gray-500 text-center">No current data available.</p>
          )}
        </section>

        {/* 2. Historical Chart Display */}
        <section className="bg-gray-800 p-6 rounded-2xl shadow-xl">
          <h2 className="text-2xl font-bold mb-4">Sentiment vs. Price History (Mocked)</h2>
          <HistoricalChart data={historicalData} />
        </section>

        {/* 3. Data Source Information */}
        <footer className="text-center text-sm text-gray-500 pt-4 border-t border-gray-700">
          Data sourced from Alternative.me (Fear & Greed Index) and CoinGecko (BTC Price - Simulated for environment).
        </footer>
      </div>
    </div>
  );
};

export default App;