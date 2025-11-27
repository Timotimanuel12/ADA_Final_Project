const { useState, useEffect, useRef, useMemo } = React;

/**
 * ------------------------------------------------------------------
 * UTILITIES: FORMATTING
 * ------------------------------------------------------------------
 */

const formatIDR = (number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  }).format(number);
};

const formatShortIDR = (number) => {
  if (Math.abs(number) >= 1_000_000_000) {
    return (number / 1_000_000_000).toFixed(1) + ' Miliar';
  } else if (Math.abs(number) >= 1_000_000) {
    return (number / 1_000_000).toFixed(1) + ' Juta';
  }
  return formatIDR(number);
};

/**
 * ------------------------------------------------------------------
 * COMPONENT: CHARTS
 * ------------------------------------------------------------------
 */

function BarChart({ data }) {
  const chartRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!data) return;
    const ctx = canvasRef.current.getContext('2d');
    if (chartRef.current) chartRef.current.destroy();

    const labels = Object.keys(data.expected).map(k => k.replace('_Revenue', ''));
    const expectedValues = Object.values(data.expected);
    const riskValues = Object.values(data.risk);

    chartRef.current = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Avg Revenue Growth',
            data: expectedValues,
            backgroundColor: 'rgba(34, 197, 94, 0.7)',
            borderColor: 'rgba(34, 197, 94, 1)',
            borderWidth: 1
          },
          {
            label: 'Risk (Volatility)',
            data: riskValues,
            backgroundColor: 'rgba(239, 68, 68, 0.7)',
            borderColor: 'rgba(239, 68, 68, 1)',
            borderWidth: 1
          }
        ]
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: 'Projected Revenue vs. Risk',
            font: { size: 16 }
          },
          subtitle: {
            display: true,
            text: 'Green: Expected Income | Red: Potential Deviation (Risk)',
            padding: { bottom: 10 }
          },
          tooltip: {
            callbacks: { label: (ctx) => ` ${ctx.dataset.label}: ${formatShortIDR(ctx.raw)}` }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            title: { display: true, text: 'Amount (IDR)', font: { weight: 'bold' } },
            ticks: { callback: (value) => formatShortIDR(value) }
          },
          x: {
            title: { display: true, text: 'Departments', font: { weight: 'bold' } }
          }
        }
      }
    });

    return () => { if (chartRef.current) chartRef.current.destroy(); };
  }, [data]);

  return <canvas ref={canvasRef} />;
}

function AllocationPieChart({ allocation }) {
  const chartRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!allocation) return;
    const ctx = canvasRef.current.getContext('2d');
    if (chartRef.current) chartRef.current.destroy();

    chartRef.current = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Marketing', 'R&D', 'Operations'],
        datasets: [{
          data: [allocation.Marketing, allocation.RnD, allocation.Operations],
          backgroundColor: ['#3b82f6', '#a855f7', '#f97316'],
          hoverOffset: 4
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { position: 'bottom' },
          title: { display: true, text: 'Recommended Budget Split', font: { size: 16 } },
          subtitle: { display: true, text: 'Optimized for maximum growth' }
        }
      }
    });

    return () => { if (chartRef.current) chartRef.current.destroy(); };
  }, [allocation]);

  return <div className="w-64 mx-auto"><canvas ref={canvasRef} /></div>;
}

// --- TREND CHARTS FOR COMPARISON ---

function GrowthTrendChart({ history }) {
  const chartRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!history || history.length === 0) return;

    // Sort history by Year then Quarter
    const sortedHistory = [...history].sort((a, b) => {
      if (a.inputs.Year !== b.inputs.Year) return a.inputs.Year - b.inputs.Year;
      return a.inputs.Quarter - b.inputs.Quarter;
    });

    const labels = sortedHistory.map(h => `${h.inputs.Year} Q${h.inputs.Quarter}`);
    const growthData = sortedHistory.map(h => h.results.total_growth);
    const budgetData = sortedHistory.map(h => h.inputs.Budget);

    const ctx = canvasRef.current.getContext('2d');
    if (chartRef.current) chartRef.current.destroy();

    chartRef.current = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Expected Growth (Revenue)',
            data: growthData,
            borderColor: '#22c55e', // Green
            backgroundColor: '#22c55e',
            tension: 0.3,
            pointRadius: 6,
            pointHoverRadius: 8,
            yAxisID: 'y'
          },
          {
            label: 'Total Budget Invested',
            data: budgetData,
            borderColor: '#94a3b8', // Slate
            backgroundColor: '#94a3b8',
            borderDash: [5, 5],
            tension: 0.3,
            pointRadius: 4,
            yAxisID: 'y'
          }
        ]
      },
      options: {
        responsive: true,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          title: { display: true, text: 'Efficiency Trend: Budget vs Growth', font: { size: 16 } },
          subtitle: { display: true, text: 'Are we growing faster than we spend?' }
        },
        scales: {
          y: {
            beginAtZero: true,
            title: { display: true, text: 'Financial Value (IDR)', font: { weight: 'bold' } },
            ticks: { callback: (value) => formatShortIDR(value) }
          },
          x: {
            title: { display: true, text: 'Timeline (Quarterly)', font: { weight: 'bold' } }
          }
        }
      }
    });
    return () => { if (chartRef.current) chartRef.current.destroy(); };
  }, [history]);

  return <canvas ref={canvasRef} />;
}

function AllocationTrendChart({ history }) {
  const chartRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!history || history.length === 0) return;

    const sortedHistory = [...history].sort((a, b) => {
      if (a.inputs.Year !== b.inputs.Year) return a.inputs.Year - b.inputs.Year;
      return a.inputs.Quarter - b.inputs.Quarter;
    });

    const labels = sortedHistory.map(h => `${h.inputs.Year} Q${h.inputs.Quarter}`);
    const mData = sortedHistory.map(h => h.results.allocation.Marketing);
    const rData = sortedHistory.map(h => h.results.allocation.RnD);
    const oData = sortedHistory.map(h => h.results.allocation.Operations);

    const ctx = canvasRef.current.getContext('2d');
    if (chartRef.current) chartRef.current.destroy();

    chartRef.current = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [
          { label: 'Marketing %', data: mData, backgroundColor: '#3b82f6' },
          { label: 'R&D %', data: rData, backgroundColor: '#a855f7' },
          { label: 'Ops %', data: oData, backgroundColor: '#f97316' }
        ]
      },
      options: {
        responsive: true,
        plugins: {
          title: { display: true, text: 'Strategy Evolution', font: { size: 16 } },
          subtitle: { display: true, text: 'How the optimal mix changes over time' }
        },
        scales: {
          x: {
            stacked: true,
            title: { display: true, text: 'Timeline', font: { weight: 'bold' } }
          },
          y: {
            stacked: true,
            max: 100,
            title: { display: true, text: 'Allocation %', font: { weight: 'bold' } }
          }
        }
      }
    });
    return () => { if (chartRef.current) chartRef.current.destroy(); };
  }, [history]);

  return <canvas ref={canvasRef} />;
}


/**
 * ------------------------------------------------------------------
 * MAIN APP COMPONENT
 * ------------------------------------------------------------------
 */

function App() {
  const [view, setView] = useState("input");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);

  const [batchData, setBatchData] = useState([]);

  const [history, setHistory] = useState(() => {
    const saved = localStorage.getItem('simulationHistory');
    return saved ? JSON.parse(saved) : [];
  });

  const [inputs, setInputs] = useState({
    Year: 2024,
    Quarter: 1,
    Marketing_Revenue: 5_000_000_000,
    RnD_Revenue: 3_000_000_000,
    Ops_Revenue: 4_000_000_000,
    Marketing_Spend: 500_000_000,
    RnD_Spend: 400_000_000,
    Ops_Spend: 600_000_000,
    Budget: 2_000_000_000
  });

  const handleInput = (e) => {
    const fieldName = e.target.name;
    const value = parseFloat(e.target.value) || 0;

    let newInputs = { ...inputs, [fieldName]: value };

    if (batchData.length > 0 && (fieldName === 'Year' || fieldName === 'Quarter')) {
      const match = batchData.find(row =>
        row.Year === newInputs.Year && row.Quarter === newInputs.Quarter
      );

      if (match) {
        newInputs = { ...newInputs, ...match };
      }
    }

    setInputs(newInputs);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target.result;
        const lines = text.split(/\r?\n/).map(l => l.trim()).filter(l => l);

        if (lines.length < 2) {
          alert("Error: CSV file must have a header row and at least one data row.");
          return;
        }

        const headers = lines[0].split(',').map(h => h.trim());

        const allRows = lines.slice(1).map(line => {
             const values = line.split(',').map(v => parseFloat(v));
             const rowObj = {};
             let matchCount = 0;
             headers.forEach((header, index) => {
                const key = header.replace(/['"]+/g, '');
                if (inputs.hasOwnProperty(key)) {
                    rowObj[key] = isNaN(values[index]) ? 0 : values[index];
                    matchCount++;
                }
             });
             return matchCount > 0 ? rowObj : null;
        }).filter(r => r !== null);

        if (allRows.length > 0) {
          setBatchData(allRows);
          const latestRow = allRows[allRows.length - 1];
          setInputs({ ...inputs, ...latestRow });
          alert(`Success! Loaded ${allRows.length} quarters of data.\n\nYou can now run 'Batch Analysis' to simulate all at once.`);
        } else {
          alert("Could not match any columns.");
        }
      } catch (err) {
        alert("Failed to parse CSV file.");
        console.error(err);
      }
    };
    reader.readAsText(file);
  };

  const runOptimization = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("http://127.0.0.1:5000/run-optimization", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(inputs)
      });

      if (!res.ok) throw new Error("Connection failed.");

      const data = await res.json();
      setResults(data);

      const newHistoryItem = {
        id: Date.now(),
        timestamp: new Date().toLocaleString(),
        inputs: { ...inputs },
        results: data
      };

      const updatedHistory = [newHistoryItem, ...history];
      setHistory(updatedHistory);
      localStorage.setItem('simulationHistory', JSON.stringify(updatedHistory));

      setView("analysis");
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const runBatchOptimization = async () => {
    if (batchData.length === 0) return alert("Please upload a CSV file first.");
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("http://127.0.0.1:5000/run-batch-optimization", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(batchData)
      });

      if (!res.ok) throw new Error("Batch processing failed. Did you update server.py?");
      const dataList = await res.json();

      const newHistoryItems = dataList.map((item, idx) => ({
        id: Date.now() + idx,
        timestamp: new Date().toLocaleString(),
        inputs: item.inputs,
        results: item
      }));

      const updatedHistory = [...newHistoryItems, ...history];
      setHistory(updatedHistory);
      localStorage.setItem('simulationHistory', JSON.stringify(updatedHistory));

      setView("compare");
      alert(`Batch Complete! Processed ${dataList.length} quarters.`);
    } catch (err) {
        console.error(err);
        setError("Batch Error: " + err.message);
    } finally {
        setLoading(false);
    }
  };

  // --- SUB-PAGES ---

  const InputPage = () => (
    <div className="animate-fade-in space-y-8">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex justify-between items-start mb-4">
          <div>
             <h2 className="text-xl font-bold text-slate-800">Import Data</h2>
             <p className="text-slate-500 text-sm mt-1">Upload <code>historical_rupiah.csv</code> to fill the form.</p>
          </div>
          <div className="bg-blue-50 text-blue-700 px-3 py-1 rounded-lg text-xs font-bold uppercase">Fast Fill</div>
        </div>
        <div className="w-full">
           <label className="block w-full cursor-pointer group mb-4">
              <input type="file" accept=".csv" onChange={handleFileUpload} className="hidden" />
              <div className="flex items-center justify-center w-full h-24 border-2 border-dashed border-slate-300 rounded-xl group-hover:border-blue-500 group-hover:bg-blue-50 transition">
                <span className="text-sm text-slate-500 group-hover:text-blue-600 font-medium">Click to upload CSV</span>
              </div>
           </label>

           {batchData.length > 0 && (
             <div className="flex items-center justify-between bg-blue-50 p-3 rounded-xl border border-blue-100 animate-fade-in">
                <span className="text-sm text-blue-800 font-medium px-2">
                   Ready to process <strong>{batchData.length} quarters</strong> at once?
                </span>
                <button
                  onClick={runBatchOptimization}
                  disabled={loading}
                  className="bg-blue-600 text-white text-xs font-bold uppercase px-4 py-2 rounded-lg shadow hover:bg-blue-700 transition"
                >
                  {loading ? "Processing..." : "Run Batch Analysis 🚀"}
                </button>
             </div>
           )}
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <h2 className="text-xl font-bold mb-4 text-slate-800">Manual Data Entry</h2>

        <div className="mb-6 pb-6 border-b border-slate-100">
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-3">Simulation Period</label>
          <div className="flex gap-4">
            <div className="flex-1">
              <span className="text-xs text-slate-500 mb-1 block">Year</span>
              <input type="number" name="Year" value={inputs.Year} onChange={handleInput} className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-bold text-slate-700" />
            </div>
            <div className="flex-1">
              <span className="text-xs text-slate-500 mb-1 block">Quarter</span>
              <select name="Quarter" value={inputs.Quarter} onChange={handleInput} className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-bold text-slate-700 bg-white">
                <option value="1">Q1</option>
                <option value="2">Q2</option>
                <option value="3">Q3</option>
                <option value="4">Q4</option>
              </select>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Object.keys(inputs).filter(k => k !== 'Year' && k !== 'Quarter').map(key => (
            <div key={key}>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">
                {key.replace('_', ' ')}
              </label>
              <div className="relative">
                <span className="absolute left-3 top-3 text-slate-400 text-sm font-semibold">Rp</span>
                <input
                  type="number"
                  name={key}
                  value={inputs[key]}
                  onChange={handleInput}
                  className="w-full pl-10 p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition font-mono text-sm"
                />
              </div>
              <div className="text-xs text-slate-400 mt-1 text-right font-medium">
                {formatShortIDR(inputs[key])}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 flex justify-end">
          <button
            onClick={runOptimization}
            disabled={loading}
            className={`px-8 py-3 rounded-xl text-white font-semibold shadow-lg transition-all transform hover:scale-105 ${loading ? "bg-slate-400 cursor-not-allowed" : "bg-slate-900 hover:bg-slate-800"}`}
          >
            {loading ? "Running Calculation..." : "Run Simulation & Optimize"}
          </button>
        </div>
        {error && <div className="mt-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm font-medium border border-red-100">{error}</div>}
      </div>
    </div>
  );

  const AnalysisPage = () => {
      // Helper to identify best and worst stats
      const bestDept = Object.keys(results.allocation).reduce((a, b) => results.allocation[a] > results.allocation[b] ? a : b);
      const riskyDept = Object.keys(results.risk).reduce((a, b) => results.risk[a] > results.risk[b] ? a : b).replace('_Revenue', '');

      return (
        <div className="space-y-6 animate-fade-in">
          {!results ? <EmptyState /> : (
            <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <BarChart data={results} />
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <AllocationPieChart allocation={results.allocation} />
              </div>
            </div>

            {/* NEW: Executive Summary Section */}
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                    <span className="text-2xl">📝</span>
                    <h3 className="text-lg font-bold text-slate-800">Executive Summary: {inputs.Year} Q{inputs.Quarter}</h3>
                </div>

                {/* ADDED: Key Financials Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 border-b border-slate-200 pb-4">
                     <div>
                        <div className="text-xs text-slate-500 uppercase font-bold">Total Budget</div>
                        <div className="text-base font-mono font-bold text-slate-700">{formatShortIDR(inputs.Budget)}</div>
                     </div>
                     <div>
                        <div className="text-xs text-slate-500 uppercase font-bold">Exp. Revenue</div>
                        <div className="text-base font-mono font-bold text-green-600">{formatShortIDR(results.total_growth)}</div>
                     </div>
                     <div className="col-span-2">
                        <div className="text-xs text-slate-500 uppercase font-bold">ROI Projection</div>
                        <div className="text-base font-mono font-bold text-blue-600">
                            {((results.total_growth / inputs.Budget) * 100).toFixed(1)}% Return
                        </div>
                     </div>
                </div>

                <p className="text-slate-600 text-sm leading-relaxed text-justify">
                    Deploying a budget of <strong>{formatShortIDR(inputs.Budget)}</strong> is projected to generate <strong>{formatShortIDR(results.total_growth)}</strong> in revenue.
                    Based on <strong>1,000 Monte Carlo simulations</strong>, the data suggests a strategic pivot towards <strong>{bestDept}</strong> ({results.allocation[bestDept]}% allocation) to maximize this growth.
                </p>
                <div className="mt-4 p-4 bg-white rounded-xl border border-slate-100 flex items-start gap-3">
                    <span className="text-red-500 font-bold">⚠️ Risk Note:</span>
                    <span className="text-slate-500 text-sm">
                        The <strong>{riskyDept}</strong> department currently shows the highest volatility (standard deviation of {formatShortIDR(results.risk[riskyDept + '_Revenue'])}).
                        While it may offer high upside, returns are less guaranteed compared to other departments.
                    </span>
                </div>
            </div>
            </>
          )}
        </div>
      );
  };

  const StrategyPage = () => (
    <div className="space-y-6 animate-fade-in">
       {!results ? <EmptyState /> : (
         <div className="bg-slate-900 text-white rounded-2xl p-8 shadow-xl">
            <div className="flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="space-y-6 flex-1">
                <div>
                  <h2 className="text-2xl font-bold text-white">Optimal Strategy ({inputs.Year} Q{inputs.Quarter})</h2>
                  <p className="text-slate-400 text-sm mt-1">
                    Constraint: <span className="text-yellow-400 font-medium">Max 60% per Dept</span>.
                  </p>
                </div>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
                    <div className="text-slate-400 text-xs uppercase mb-2 font-bold tracking-wider">Marketing</div>
                    <div className="text-3xl font-bold text-blue-400">{results.allocation.Marketing}%</div>
                  </div>
                  <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
                    <div className="text-slate-400 text-xs uppercase mb-2 font-bold tracking-wider">R&D</div>
                    <div className="text-3xl font-bold text-purple-400">{results.allocation.RnD}%</div>
                  </div>
                  <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
                    <div className="text-slate-400 text-xs uppercase mb-2 font-bold tracking-wider">Ops</div>
                    <div className="text-3xl font-bold text-orange-400">{results.allocation.Operations}%</div>
                  </div>
                </div>
              </div>
              <div className="bg-slate-800 p-6 rounded-xl text-center min-w-[260px] border border-slate-700 shadow-inner">
                <div className="text-xs text-slate-400 uppercase tracking-widest mb-3 font-bold">Total Expected Growth</div>
                <div className="text-3xl font-bold text-green-400">{formatShortIDR(results.total_growth)}</div>
                <div className="text-slate-500 text-xs mt-2">Combined Revenue Impact</div>
              </div>
            </div>
         </div>
       )}
    </div>
  );

  const VisualsPage = () => (
    <div className="space-y-6 animate-fade-in">
      {!results ? <EmptyState /> : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <BarChart data={results} />
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col items-center justify-center">
            <AllocationPieChart allocation={results.allocation} />
          </div>
        </div>
      )}
    </div>
  );

  const ComparePage = () => {
    // Only show unique quarters to avoid duplicates in chart
    const uniqueHistory = useMemo(() => {
        const map = new Map();
        [...history].reverse().forEach(item => {
            const key = `${item.inputs.Year}-Q${item.inputs.Quarter}`;
            if (!map.has(key)) map.set(key, item);
        });
        return Array.from(map.values()).sort((a,b) => a.inputs.Year - b.inputs.Year || a.inputs.Quarter - b.inputs.Quarter);
    }, [history]);

    // NEW: Logic for Batch Summary
    const totalGrowth = uniqueHistory.reduce((sum, h) => sum + h.results.total_growth, 0);
    const avgGrowth = totalGrowth / uniqueHistory.length || 0;
    const start = uniqueHistory[0];
    const end = uniqueHistory[uniqueHistory.length - 1];

    // Calculate simple percentage growth from first to last recorded quarter
    const growthChange = start ? ((end.results.total_growth - start.results.total_growth) / start.results.total_growth) * 100 : 0;
    const trendIcon = growthChange >= 0 ? "📈" : "📉";
    const trendWord = growthChange >= 0 ? "positive" : "negative";

    return (
      <div className="space-y-6 animate-fade-in">
        {uniqueHistory.length < 2 ? (
          <div className="text-center py-20 text-slate-400 bg-white rounded-2xl border border-dashed border-slate-300">
            <p className="mb-4">Not enough data to compare.</p>
            <p className="text-sm">Run simulations for at least two different quarters (e.g., Q1 and Q2) to see a comparison.</p>
            <button onClick={() => setView('input')} className="mt-4 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg font-bold hover:bg-blue-100 transition">Go to Input</button>
          </div>
        ) : (
          <>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <GrowthTrendChart history={uniqueHistory} />
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <AllocationTrendChart history={uniqueHistory} />
            </div>

            {/* NEW: Batch Summary Section */}
            <div className="bg-slate-900 text-white p-8 rounded-2xl shadow-xl mt-6">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h3 className="text-xl font-bold text-white flex items-center gap-2">
                            {trendIcon} Long-term Performance Report
                        </h3>
                        <p className="text-slate-400 text-sm mt-1">
                            Analysis of {uniqueHistory.length} Quarters ({start.inputs.Year} Q{start.inputs.Quarter} - {end.inputs.Year} Q{end.inputs.Quarter})
                        </p>
                    </div>
                    <div className="text-right hidden md:block">
                        <div className="text-xs uppercase text-slate-500 font-bold">Cumulative Value</div>
                        <div className="text-2xl font-bold text-green-400">{formatShortIDR(totalGrowth)}</div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-t border-slate-700 pt-6">
                    <div>
                        <h4 className="font-bold text-blue-400 mb-2 text-sm uppercase">Trend Analysis</h4>
                        <p className="text-slate-300 text-sm leading-relaxed">
                            The simulation indicates a <strong>{trendWord} trajectory</strong> in budget efficiency, with expected growth shifting by <strong>{growthChange.toFixed(1)}%</strong> from the start period to the latest quarter.
                            The average quarterly revenue generated over this entire period is <strong>{formatShortIDR(avgGrowth)}</strong>.
                        </p>
                    </div>
                    <div>
                         <h4 className="font-bold text-purple-400 mb-2 text-sm uppercase">Strategic Recommendation</h4>
                         <p className="text-slate-300 text-sm leading-relaxed">
                            Review the "Strategy Evolution" chart above. If allocation bars fluctuate wildly, it suggests highly volatile market conditions requiring adaptive strategies.
                            Consistent allocation bars suggest a stable market where a fixed strategy is effective.
                         </p>
                    </div>
                </div>
            </div>
          </>
        )}
      </div>
    );
  };

  const HistoryPage = () => {
    const restoreInputs = (savedInputs) => {
      setInputs(savedInputs);
      setView('input');
      alert("Inputs restored.");
    };

    return (
      <div className="space-y-6 animate-fade-in">
        {history.length === 0 ? (
          <div className="text-center py-20 text-slate-400 bg-white rounded-2xl border border-dashed border-slate-300">
            <p className="mb-4">No history available yet.</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-slate-500">
                <thead className="text-xs text-slate-700 uppercase bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4">Period</th>
                    <th className="px-6 py-4">Budget</th>
                    <th className="px-6 py-4">Growth</th>
                    <th className="px-6 py-4">Allocation (M/R/O)</th>
                    <th className="px-6 py-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((item) => (
                    <tr key={item.id} className="bg-white border-b hover:bg-slate-50 transition">
                      <td className="px-6 py-4 font-bold text-slate-900">{item.inputs.Year} Q{item.inputs.Quarter}</td>
                      <td className="px-6 py-4 font-mono">{formatShortIDR(item.inputs.Budget)}</td>
                      <td className="px-6 py-4 font-mono text-green-600 font-bold">{formatShortIDR(item.results.total_growth)}</td>
                      <td className="px-6 py-4">
                        <span className="text-blue-600">{item.results.allocation.Marketing}%</span> /
                        <span className="text-purple-600"> {item.results.allocation.RnD}%</span> /
                        <span className="text-orange-600"> {item.results.allocation.Operations}%</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button onClick={() => restoreInputs(item.inputs)} className="text-blue-600 hover:text-blue-800 font-bold text-xs uppercase">Restore</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    );
  };

  const ExportPage = () => {
    const downloadCSV = () => {
      if (!results) return;
      const headers = ["Category,Metric,Value,Unit"];
      const rows = [
        `Meta,Year,${inputs.Year},Year`,
        `Meta,Quarter,${inputs.Quarter},Quarter`,
        `Summary,Total Budget,${inputs.Budget},IDR`,
        `Summary,Total Growth,${results.total_growth},IDR`,
        `Allocation,Marketing,${results.allocation.Marketing},Percentage`,
        `Allocation,RnD,${results.allocation.RnD},Percentage`,
        `Allocation,Operations,${results.allocation.Operations},Percentage`,
      ];
      const csvContent = "data:text/csv;charset=utf-8," + headers.concat(rows).join("\n");
      const link = document.createElement("a");
      link.setAttribute("href", encodeURI(csvContent));
      link.setAttribute("download", `report_${inputs.Year}_Q${inputs.Quarter}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    };

    return (
      <div className="space-y-6 animate-fade-in">
        {!results ? <EmptyState /> : (
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 text-center">
            <div className="text-6xl mb-6">📄</div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Export Report</h2>
            <p className="text-slate-500 mb-8 max-w-md mx-auto">Download results for {inputs.Year} Q{inputs.Quarter}.</p>
            <button onClick={downloadCSV} className="bg-slate-900 text-white px-8 py-4 rounded-xl font-bold shadow-lg hover:bg-slate-800 transition">Download .csv</button>
          </div>
        )}
      </div>
    );
  };

  const EmptyState = () => (
    <div className="text-center py-20 text-slate-400 bg-white rounded-2xl border border-dashed border-slate-300">
      <p className="mb-4">No simulation data available.</p>
      <button onClick={() => setView('input')} className="px-4 py-2 bg-blue-50 text-blue-600 rounded-lg font-bold hover:bg-blue-100 transition">Go to Input</button>
    </div>
  );

  const NavItem = ({ id, label, icon }) => (
    <button onClick={() => setView(id)} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${view === id ? "bg-slate-900 text-white shadow-md" : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"}`}>
      <span>{icon}</span> {label}
    </button>
  );

  return (
    <div className="flex flex-1 h-screen overflow-hidden bg-slate-50">
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col hidden md:flex">
        <div className="p-6 border-b border-slate-100">
          <div className="font-bold text-xl tracking-tight text-slate-900">Decision<span className="text-blue-600">Opt</span></div>
          <div className="text-xs text-slate-400 mt-1 font-medium">IDR Enterprise Edition</div>
        </div>
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          <div className="text-xs font-bold text-slate-400 uppercase px-4 mb-2 mt-2">Functions</div>
          <NavItem id="input" label="Input Data" icon="📝" />
          <NavItem id="analysis" label="Analysis" icon="📊" />
          <NavItem id="strategy" label="Strategy" icon="🎯" />
          <NavItem id="visuals" label="Visuals" icon="📈" />
          <NavItem id="compare" label="Compare Quarters" icon="⚖️" />
          <div className="text-xs font-bold text-slate-400 uppercase px-4 mb-2 mt-6">System</div>
          <NavItem id="history" label="History" icon="clock" />
          <NavItem id="export" label="Export" icon="file" />
        </nav>
      </aside>

      <main className="flex-1 overflow-y-auto p-4 md:p-8 pt-16 md:pt-8 bg-slate-50">
        <div className="max-w-5xl mx-auto">
          <div className="mb-8 flex flex-col md:flex-row md:justify-between md:items-end gap-4">
             <div>
               <h1 className="text-3xl font-bold text-slate-900 capitalize tracking-tight">{view === 'input' ? 'Financial Input' : view === 'compare' ? 'Quarterly Comparison' : view === 'analysis' ? 'Risk Analysis' : view}</h1>
               <p className="text-slate-500 mt-1">{view === 'input' ? 'Configure parameters in IDR.' : view === 'compare' ? 'Comparing simulation trends.' : 'Reviewing calculation results.'}</p>
             </div>
             {results && view !== 'input' && (
               <div className="inline-flex items-center gap-2 text-xs bg-green-100 text-green-700 px-3 py-1.5 rounded-full font-bold shadow-sm">
                 <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span> Synced
               </div>
             )}
          </div>
          {view === 'input' && <InputPage />}
          {view === 'analysis' && <AnalysisPage />}
          {view === 'strategy' && <StrategyPage />}
          {view === 'visuals' && <VisualsPage />}
          {view === 'compare' && <ComparePage />}
          {view === 'history' && <HistoryPage />}
          {view === 'export' && <ExportPage />}
        </div>
      </main>
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);