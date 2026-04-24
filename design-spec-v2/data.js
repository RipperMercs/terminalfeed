// Data shaped exactly like the real Worker endpoints per brief §6
(function(){
  const rng = (min, max) => Math.random() * (max - min) + min;
  const pick = arr => arr[Math.floor(Math.random()*arr.length)];

  // BTC
  const btcHistory = [];
  let p = 77047.92;
  for (let i = 96; i > 0; i--) { p += rng(-180, 200); btcHistory.push([Date.now() - i*900_000, p]); }

  // Markets (finnhub-shaped)
  const stocks = [
    { symbol: "SPY",  price: 595.22, change: 2.41, change_percent: 0.41 },
    { symbol: "QQQ",  price: 532.18, change: 3.92, change_percent: 0.74 },
    { symbol: "AAPL", price: 270.23, change: 6.83, change_percent: 2.59 },
    { symbol: "NVDA", price: 1214.07, change: 25.40, change_percent: 2.14 },
    { symbol: "TSLA", price: 341.22, change: -3.66, change_percent: -1.06 },
    { symbol: "MSFT", price: 512.88, change: 1.70, change_percent: 0.33 },
    { symbol: "GOOG", price: 201.45, change: 1.42, change_percent: 0.71 },
    { symbol: "META", price: 662.19, change: -1.46, change_percent: -0.22 },
    { symbol: "AMZN", price: 248.90, change: 3.05, change_percent: 1.24 },
    { symbol: "AMD",  price: 184.55, change: 4.02, change_percent: 2.22 },
  ].map(s => ({ ...s, spark: Array.from({length: 24}, () => s.price * (1 + rng(-0.01, 0.01))) }));

  // Crypto (coingecko-shaped)
  const crypto = [
    { symbol: "btc", name: "Bitcoin",  current_price: 77450.74, price_change_percentage_24h: 3.39 },
    { symbol: "eth", name: "Ethereum", current_price: 3562.14,  price_change_percentage_24h: 1.82 },
    { symbol: "sol", name: "Solana",   current_price: 212.45,   price_change_percentage_24h: 3.11 },
    { symbol: "bnb", name: "BNB",      current_price: 672.18,   price_change_percentage_24h: -0.41 },
    { symbol: "xrp", name: "XRP",      current_price: 2.42,     price_change_percentage_24h: 1.08 },
    { symbol: "ada", name: "Cardano",  current_price: 0.92,     price_change_percentage_24h: -1.21 },
    { symbol: "doge",name: "Dogecoin", current_price: 0.38,     price_change_percentage_24h: 4.22 },
  ];

  // Service status (13)
  const services = [
    { name: "GitHub",        indicator: "none",  description: "All Systems Operational" },
    { name: "Cloudflare",    indicator: "minor", description: "Minor Service Outage" },
    { name: "AWS",           indicator: "none",  description: "Operating Normally" },
    { name: "OpenAI",        indicator: "minor", description: "Elevated Error Rates" },
    { name: "Claude",        indicator: "none",  description: "All Systems Operational" },
    { name: "Stripe",        indicator: "none",  description: "All Systems Operational" },
    { name: "Discord",       indicator: "minor", description: "Voice Connection Issues" },
    { name: "Slack",         indicator: "none",  description: "All Systems Operational" },
    { name: "Vercel",        indicator: "none",  description: "All Systems Operational" },
    { name: "Netlify",       indicator: "none",  description: "All Systems Operational" },
    { name: "npm",           indicator: "none",  description: "All Systems Operational" },
    { name: "Docker Hub",    indicator: "none",  description: "All Systems Operational" },
    { name: "PagerDuty",     indicator: "none",  description: "All Systems Operational" },
  ];

  // News (RSS-shaped)
  const news = [
    { title: "Linux 6.15 RC1 lands with new sched-ext hooks", src: "LWN", t: "12m" },
    { title: "Stripe acquires ledger startup Ivy for $1.1B", src: "TC", t: "24m" },
    { title: "NVDA ships RTX 6090; early benchmarks leak", src: "THR", t: "38m" },
    { title: "SpaceX Starship V4 completes orbital refueling test", src: "ARS", t: "52m" },
    { title: "FED holds rates; dot plot shifts dovish for Q3", src: "WSJ", t: "1h" },
    { title: "Kernel team adopts Rust for new storage drivers", src: "LWN", t: "1h" },
    { title: "Meta's Llama 4 surpasses GPT-5 on HELM leaderboard", src: "AI", t: "2h" },
    { title: "Apple quietly updates Vision Pro to v3.1", src: "9TO5", t: "3h" },
    { title: "Anthropic expands Claude availability to EU region", src: "ANT", t: "4h" },
    { title: "Rust 1.88 stabilizes async closures", src: "BLOG", t: "5h" },
  ];

  // Earthquakes (USGS-shaped)
  const quakes = [
    { magnitude: 5.1, place: "127 km WNW of Ternate, Indonesia", time: Date.now()-240_000, coordinates: [126.32, 1.20, 35.0] },
    { magnitude: 4.4, place: "Central Mid-Atlantic Ridge",       time: Date.now()-660_000, coordinates: [-29.1, 2.3, 10.0] },
    { magnitude: 3.8, place: "South of Fiji Islands",            time: Date.now()-1_800_000, coordinates: [179.2, -21.4, 533.0] },
    { magnitude: 2.3, place: "23km SW of Burnley, Alaska",       time: Date.now()-120_000, coordinates: [-150.3, 61.4, 14.0] },
    { magnitude: 4.1, place: "Off the coast of Hokkaido, Japan", time: Date.now()-420_000, coordinates: [142.2, 42.8, 42.0] },
    { magnitude: 3.2, place: "18km N of Chico, California",      time: Date.now()-720_000, coordinates: [-121.8, 39.9, 8.0] },
    { magnitude: 2.9, place: "Reykjanes Peninsula, Iceland",     time: Date.now()-3_600_000, coordinates: [-22.5, 63.9, 3.0] },
  ];

  // Ticker
  const tickerItems = [
    { sym: "BTC", val: "77,450.74", chg: "+3.39%", up: true },
    { sym: "ETH", val: "3,562.14",  chg: "+1.82%", up: true },
    { sym: "SOL", val: "212.45",    chg: "+3.11%", up: true },
    { sym: "SPX", val: "5,948.12",  chg: "+0.41%", up: true },
    { sym: "NDX", val: "21,344.88", chg: "+0.62%", up: true },
    { sym: "DJIA",val: "42,118.04", chg: "-0.08%", up: false },
    { sym: "DXY", val: "103.42",    chg: "-0.21%", up: false },
    { sym: "GOLD",val: "2,784.50",  chg: "+0.58%", up: true },
    { sym: "OIL", val: "71.24",     chg: "-0.92%", up: false },
    { sym: "10Y", val: "4.21%",     chg: "+0.02", up: true },
    { sym: "VIX", val: "14.82",     chg: "-1.44%", up: false },
    { sym: "AAPL",val: "270.23",    chg: "+2.59%", up: true },
    { sym: "NVDA",val: "1,214.07",  chg: "+2.14%", up: true },
    { sym: "TSLA",val: "341.22",    chg: "-1.06%", up: false },
    { sym: "MSFT",val: "512.88",    chg: "+0.33%", up: true },
  ];

  const sports = [
    { home: "LAL", away: "GSW", score: "112-108", final: true },
    { home: "BOS", away: "MIA", score: "98-94", final: true },
    { home: "NYK", away: "PHI", score: "89-81", q: "Q4 3:22" },
    { home: "DEN", away: "PHX", score: "45-42", q: "H1" },
    { home: "MIL", away: "CHI", score: "21-18", q: "Q1 4:11" },
  ];

  const crew = [
    { name: "Oleg Kononenko", craft: "ISS" },
    { name: "Nikolai Chub", craft: "ISS" },
    { name: "Tracy Caldwell Dyson", craft: "ISS" },
    { name: "Matthew Dominick", craft: "ISS" },
    { name: "Michael Barratt", craft: "ISS" },
    { name: "Jeanette Epps", craft: "ISS" },
    { name: "Li Guangsu", craft: "Tiangong" },
    { name: "Ye Guangfu", craft: "Tiangong" },
    { name: "Li Cong", craft: "Tiangong" },
  ];

  const wikiTitles = ["Apollo 11","Bitcoin","Orion Nebula","Kyoto","Lapis lazuli","Saturn V","Tokyo Metro","IEEE 754","Dwarf planet","Roman Empire","Edmund Halley","DNA replication","Quasar","Monsoon","Etruscan civilization","CRISPR","NP-complete","Dark matter","Mount Fuji","Fourier transform"];
  const wikiUsers = ["user:AlphaQuill","user:BotPatrol","user:Raven42","user:mkx","bot:RefBot","user:Orrery","user:bluecactus","user:sol_invictus"];
  const wikiLangs = ["EN","DE","FR","JA","ES","RU","IT","PT","ZH"];

  window.TF_DATA = {
    rng, pick,
    btcHistory,
    stocks, crypto, services, news, quakes, tickerItems, sports, crew,
    wikiTitles, wikiUsers, wikiLangs,
    // Cached static
    fearGreed: { value: 26, label: "Fear" },
    gas: { low: 8, standard: 12, fast: 18 },
    weather: { temp: 72, cond: "Sunny", forecast: [
      { d: "MON", h: 74, l: 58 }, { d: "TUE", h: 76, l: 60 }, { d: "WED", h: 73, l: 59 },
      { d: "THU", h: 71, l: 56 }, { d: "FRI", h: 69, l: 55 }, { d: "SAT", h: 72, l: 57 },
      { d: "SUN", h: 75, l: 59 },
    ] },
  };
})();
