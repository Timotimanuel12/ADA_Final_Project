const { useState, useEffect, useRef, useMemo } = React;

/**
 * ------------------------------------------------------------------
 * UTILITIES
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

// --- CHARTS ---

const BarChart = React.memo(function BarChart({ data }) {
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
            label: 'Projected Revenue',
            data: expectedValues,
            backgroundColor: 'rgba(34, 197, 94, 0.7)',
            borderColor: 'rgba(34, 197, 94, 1)',
            borderWidth: 1
          },
          {
            label: 'Volatility Risk',
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
          legend: { position: 'top' },
          tooltip: {
            callbacks: { label: (ctx) => ` ${ctx.dataset.label}: ${formatShortIDR(ctx.raw)}` }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: { callback: (value) => formatShortIDR(value) }
          }
        }
      }
    });
    return () => { if (chartRef.current) chartRef.current.destroy(); };
  }, [JSON.stringify(data)]);

  return <canvas ref={canvasRef} />;
});

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
          legend: { position: 'bottom' }
        }
      }
    });
    return () => { if (chartRef.current) chartRef.current.destroy(); };
  }, [allocation]);

  return <div className="w-64 mx-auto"><canvas ref={canvasRef} /></div>;
}

function TrendChart({ history }) {
  const chartRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!history || history.length === 0) return;
    const valid = history.filter(h =>
      h &&
      h.target &&
      Number.isFinite(h.target.Year) &&
      Number.isFinite(h.target.Quarter) &&
      h.results &&
      (Number.isFinite(h.results.total_growth) ||
       (h.results.expected &&
        Number.isFinite(h.results.expected.Marketing_Revenue) &&
        Number.isFinite(h.results.expected.RnD_Revenue) &&
        Number.isFinite(h.results.expected.Ops_Revenue))) &&
      (Number.isFinite(h.inputs?.Budget) || Number.isFinite(h.budget))
    );
    if (valid.length === 0) return;

    // Sort Chronologically
    const sortedHistory = [...valid].sort((a, b) => {
      if (a.target.Year !== b.target.Year) return a.target.Year - b.target.Year;
      return a.target.Quarter - b.target.Quarter;
    });

    const labels = sortedHistory.map(h => `Q${h.target.Quarter} ${h.target.Year}`);
    const growthData = sortedHistory.map(h => {
      const e = h.results?.expected || {};
      const totalBase =
        (e.Marketing_Revenue || 0) +
        (e.RnD_Revenue || 0) +
        (e.Ops_Revenue || 0);
      const b = Number.isFinite(h.budget) ? h.budget : (h.inputs?.Budget || 0);
      const scale = totalBase > 0 ? (b / totalBase) : 1;
      return (e.Marketing_Revenue || 0) * 1.1 * scale
           + (e.RnD_Revenue || 0) * 1.1 * scale
           + (e.Ops_Revenue || 0) * 1.1 * scale;
    });
    const budgetData = sortedHistory.map(h => Number.isFinite(h.budget) ? h.budget : (h.inputs?.Budget || 0));

    const ctx = canvasRef.current.getContext('2d');
    if (chartRef.current) chartRef.current.destroy();

    chartRef.current = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Predicted Revenue',
            data: growthData,
            borderColor: '#22c55e',
            backgroundColor: '#22c55e',
            tension: 0.3,
            yAxisID: 'y'
          },
          {
            label: 'Budget',
            data: budgetData,
            borderColor: '#94a3b8',
            backgroundColor: '#94a3b8',
            borderDash: [5, 5],
            tension: 0.3,
            yAxisID: 'y'
          }
        ]
      },
      options: {
        responsive: true,
        interaction: { mode: 'index', intersect: false },
        scales: {
          y: {
            beginAtZero: true,
            ticks: { callback: (value) => formatShortIDR(value) }
          }
        }
      }
    });
    return () => { if (chartRef.current) chartRef.current.destroy(); };
  }, [JSON.stringify(history)]);

  return <canvas ref={canvasRef} />;
}

// --- PREDICT PAGE (moved out of App, uncontrolled input to avoid focus loss) ---
const PredictPage = React.memo(function PredictPage({
  inputs,
  targetDate,
  targetBudgetInput,
  setTargetBudgetInput,
  setTargetBudget,
  setView,
  runPrediction,
  loading
}) {
  const inputRef = useRef(null);

  // keep uncontrolled input in sync when parent programmatically changes the buffer
  useEffect(() => {
    if (inputRef.current) inputRef.current.value = String(targetBudgetInput);
  }, [targetBudgetInput]);

  return (
    <div className="animate-fade-in space-y-8">
      {/* Baseline Summary Card */}
      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex justify-between items-center">
        <div>
          <div className="text-xs font-bold text-slate-400 uppercase">Baseline Data</div>
          <div className="font-bold text-slate-700">Q{inputs.Quarter} {inputs.Year}</div>
        </div>
        <button onClick={() => setView('input')} className="text-xs text-blue-600 font-bold underline">Edit Baseline</button>
      </div>

      {/* Prediction Input Card */}
      <div className="bg-white p-8 rounded-2xl shadow-xl border border-indigo-100 text-center relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 to-purple-500"></div>
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Forecast Target: Q{targetDate.Quarter} {targetDate.Year}</h2>
        <p className="text-slate-500 mb-6">Enter the total budget available for the upcoming quarter.</p>

        <div className="max-w-md mx-auto relative mb-6">
          <span className="absolute left-4 top-4 text-slate-400 font-bold">Rp</span>
          <input
            ref={inputRef}
            type="text"
            defaultValue={targetBudgetInput}
            // avoid calling any setState here — keeps typing smooth
            onBlur={() => {
              const raw = (inputRef.current && inputRef.current.value) || '';
              const parsed = parseFloat(raw.replace(/[^\d.-]/g, ''));
              const finalVal = Number.isFinite(parsed) ? parsed : 0;
              // commit numeric model and update buffer string
              setTargetBudget(finalVal);
              setTargetBudgetInput(String(finalVal));
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                const raw = (inputRef.current && inputRef.current.value) || '';
                const parsed = parseFloat(raw.replace(/[^\d.-]/g, ''));
                const finalVal = Number.isFinite(parsed) ? parsed : 0;
                setTargetBudget(finalVal);
                setTargetBudgetInput(String(finalVal));
                // blur to trigger onBlur behavior and end editing
                e.currentTarget.blur();
              }
            }}
            inputMode="numeric"
            pattern="[0-9]*"
            className="w-full pl-10 p-4 text-2xl font-bold text-center border-2 border-indigo-100 rounded-2xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 outline-none transition"
          />
        </div>

        <button
          onClick={runPrediction}
          disabled={loading}
          className="w-full max-w-md bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1"
        >
          {loading ? "Calculating..." : "🚀 Run Prediction"}
        </button>
      </div>
    </div>
  );
});

/**
 * ------------------------------------------------------------------
 * MAIN APP
 * ------------------------------------------------------------------
 */

function App() {
  const [view, setView] = useState("input");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [notification, setNotification] = useState(null);

  const [history, setHistory] = useState(() => {
    try {
      const saved = localStorage.getItem('simulationHistory');
      const parsed = saved ? JSON.parse(saved) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      try { localStorage.removeItem('simulationHistory'); } catch {}
      return [];
    }
  });

  // "inputs" state represents the BASELINE DATA (The Last Quarter)
  const [inputs, setInputs] = useState({
    Year: 2024,
    Quarter: 4,
    Marketing_Revenue: 5_000_000_000,
    RnD_Revenue: 3_000_000_000,
    Ops_Revenue: 4_000_000_000,
    Marketing_Spend: 500_000_000,
    RnD_Spend: 400_000_000,
    Ops_Spend: 600_000_000,
    Budget: 2_000_000_000 // Old Budget
  });

  // "targetBudget" state is the NEW BUDGET for the NEXT Quarter
  const [targetBudget, setTargetBudget] = useState(2_500_000_000);
  const [targetBudgetInput, setTargetBudgetInput] = useState(String(2_500_000_000));

  // Computed: Next Quarter Date
  const targetDate = useMemo(() => {
    let q = inputs.Quarter + 1;
    let y = inputs.Year;
    if (q > 4) { q = 1; y += 1; }
    return { Year: y, Quarter: q };
  }, [inputs.Year, inputs.Quarter]);


  const showNotification = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const handleInput = (e) => {
    const fieldName = e.target.name;
    const value = parseFloat(e.target.value) || 0;
    setInputs({ ...inputs, [fieldName]: value });
  };

  // CSV PARSER: Finds the absolute last row
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target.result;
        const lines = text.split(/\r?\n/).map(l => l.trim()).filter(l => l);
        if (lines.length < 2) return alert("Invalid CSV format.");

        const headers = lines[0].split(',').map(h => h.trim());
        const allRows = lines.slice(1).map(line => {
             const values = line.split(',').map(v => parseFloat(v));
             const rowObj = {};
             headers.forEach((header, index) => {
                const key = header.replace(/['"]+/g, '');
                if (inputs.hasOwnProperty(key)) rowObj[key] = isNaN(values[index]) ? 0 : values[index];
             });
             return rowObj;
        });

        if (allRows.length > 0) {
          // Sort to find the true last row
          allRows.sort((a, b) => (a.Year - b.Year) || (a.Quarter - b.Quarter));
          const lastRow = allRows[allRows.length - 1];
          
          setInputs({ ...inputs, ...lastRow });
          setTargetBudget(lastRow.Budget); // Default new budget to old budget
          setTargetBudgetInput(String(lastRow.Budget));
          showNotification(`Loaded Baseline: Q${lastRow.Quarter} ${lastRow.Year}`);
        }
      } catch (err) {
        alert("Failed to parse CSV.");
      }
    };
    reader.readAsText(file);
  };

  const runPrediction = async () => {
    setLoading(true);
    setError(null);
    try {
      // We send the Baseline Data + The NEW Target Budget
      // The backend will use the Baseline Spends to calc efficiency, and New Budget for allocation
      const payload = { ...inputs, Budget: targetBudget };

      const res = await fetch("http://127.0.0.1:5000/run-optimization", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error("Connection failed.");

      const data = await res.json();
      setResults(data);

      // Save to history
      const newEntry = {
        id: Date.now(),
        timestamp: new Date().toLocaleString(),
        inputs: { ...inputs }, // The Baseline used
        target: { ...targetDate }, // The Future Date
        budget: targetBudget, // The New Budget
        results: data
      };

      const updatedHistory = [newEntry, ...history];
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

  // --- SUB COMPONENTS ---

  const InputPage = () => (
    <div className="animate-fade-in space-y-6">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <h2 className="text-xl font-bold text-slate-800 mb-4">1. Define Baseline (Last Quarter)</h2>

        {/* CSV Upload */}
        <label className="block w-full cursor-pointer group mb-6">
            <input type="file" accept=".csv" onChange={handleFileUpload} className="hidden" />
            <div className="flex items-center justify-center w-full h-20 border-2 border-dashed border-slate-300 rounded-xl group-hover:border-blue-500 group-hover:bg-blue-50 transition">
            <span className="text-sm text-slate-500 group-hover:text-blue-600 font-medium">Click to Upload Historical Data (CSV)</span>
            </div>
        </label>

        {/* Manual Form */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
             <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Year</label>
                <input type="number" name="Year" value={inputs.Year} onChange={handleInput} className="w-full p-2 border rounded font-bold" />
             </div>
             <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Quarter</label>
                <select name="Quarter" value={inputs.Quarter} onChange={handleInput} className="w-full p-2 border rounded bg-white font-bold">
                    <option value="1">1</option><option value="2">2</option><option value="3">3</option><option value="4">4</option>
                </select>
             </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
            {Object.keys(inputs).filter(k => !['Year','Quarter'].includes(k)).map(key => (
                <div key={key}>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1">{key.replace('_',' ')}</label>
                    <input type="number" name={key} value={inputs[key]} onChange={handleInput} className="w-full p-2 border rounded text-sm" />
                </div>
            ))}
        </div>
      </div>
      <div className="flex justify-end">
          <button onClick={() => setView('predict')} className="bg-slate-900 text-white px-6 py-3 rounded-xl font-bold hover:bg-slate-800 transition">
              Next: Set Future Budget &rarr;
          </button>
      </div>
    </div>
  );

  const AnalysisPage = () => {
    if (!results) return <div className="text-center p-10">No results.</div>;

    // Allocation percentages from DP optimization
    const allocPerc = results.allocation;

    // Total Monte Carlo expected revenue
    const totalExpRevenue = results.expected.Marketing_Revenue
                          + results.expected.RnD_Revenue
                          + results.expected.Ops_Revenue;

    // Scale factor to match the new target budget
    const scaleFactor = targetBudget / totalExpRevenue;

    // Compute scaled expected revenue per department
    const expectedRevenue = {
        Marketing: results.expected.Marketing_Revenue * 1.1 * scaleFactor,
        RnD: results.expected.RnD_Revenue * 1.1 * scaleFactor,
        Operations: results.expected.Ops_Revenue * 1.1 * scaleFactor
    };

    const totalExpectedRevenue = expectedRevenue.Marketing + expectedRevenue.RnD + expectedRevenue.Operations;

    // Determine top department after scaling
    const bestDept = Object.keys(expectedRevenue).reduce((a, b) => expectedRevenue[a] > expectedRevenue[b] ? a : b);

    return (
        <div className="animate-fade-in space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <div className="flex items-center gap-2 mb-4">
                    <span className="text-2xl">📊</span>
                    <h3 className="text-lg font-bold text-slate-800">Forecast: Q{targetDate.Quarter} {targetDate.Year}</h3>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-center mb-6">
                    <div className="p-3 bg-slate-50 rounded-lg">
                        <div className="text-xs text-slate-400 uppercase font-bold">Total Budget</div>
                        <div className="text-lg font-mono font-bold text-slate-700">{formatShortIDR(targetBudget)}</div>
                    </div>
                    <div className="p-3 bg-green-50 rounded-lg">
                        <div className="text-xs text-green-600 uppercase font-bold">Predicted Revenue</div>
                        <div className="text-lg font-mono font-bold text-green-700">{formatShortIDR(totalExpectedRevenue)}</div>
                    </div>
                    <div className="p-3 bg-blue-50 rounded-lg">
                        <div className="text-xs text-blue-600 uppercase font-bold">Top Dept</div>
                        <div className="text-lg font-bold text-blue-700">{bestDept}</div>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="h-64"><BarChart data={{
                        expected: expectedRevenue,
                        risk: results.risk
                    }} /></div>
                    <div className="h-64 flex justify-center"><AllocationPieChart allocation={allocPerc} /></div>
                </div>
            </div>
        </div>
    );
  };


  const StrategyPage = () => {
    if (!results) return <div className="text-center p-10">No strategy generated.</div>;

    return (
      <div className="animate-fade-in bg-slate-900 text-white rounded-2xl p-8 shadow-xl">
        <h2 className="text-2xl font-bold mb-6">Optimal Allocation Strategy</h2>
        <div className="grid grid-cols-3 gap-4 text-center">
          {Object.entries(results.allocation).map(([key, val]) => {
            const dollarAmount = Math.round(targetBudget * (val / 100));
            return (
              <div key={key} className="bg-slate-800 p-4 rounded-xl border border-slate-700">
                <div className="text-slate-400 text-xs uppercase mb-2 font-bold">{key}</div>
                <div className="text-3xl font-bold text-blue-400">{val}%</div>
                <div className="text-slate-200 text-sm mt-1">{formatShortIDR(dollarAmount)}</div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };


  const ComparePage = () => (
      <div className="animate-fade-in bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <h2 className="text-lg font-bold text-slate-800 mb-4">Historical Trends</h2>
          <div className="h-72">
            {history.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-500 text-sm">No history yet. Run a prediction to see trends.</div>
            ) : (
              <TrendChart history={history} />
            )}
          </div>
      </div>
  );

  const HistoryPage = () => (
      <div className="animate-fade-in bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-800">Run History</h2>
          <button
            onClick={() => { setHistory([]); try { localStorage.removeItem('simulationHistory'); } catch {} }}
            className="text-xs font-bold text-red-600 hover:text-red-700 underline"
          >
            Clear History
          </button>
        </div>
        {history.length === 0 ? (
          <div className="p-6 text-slate-500 text-sm">No history yet. Run a prediction to populate this table.</div>
        ) : (
          <table className="w-full text-sm text-left text-slate-500">
              <thead className="bg-slate-50 text-xs uppercase text-slate-700">
                  <tr>
                      <th className="px-6 py-3">Prediction For</th>
                      <th className="px-6 py-3">Budget</th>
                      <th className="px-6 py-3">Predicted Revenue</th>
                      <th className="px-6 py-3">Based On</th>
                  </tr>
              </thead>
              <tbody>
                  {history.map(item => {
                    const e = item.results?.expected || {};
                    const totalBase = (e.Marketing_Revenue || 0) + (e.RnD_Revenue || 0) + (e.Ops_Revenue || 0);
                    const b = Number.isFinite(item.budget) ? item.budget : (item.inputs?.Budget || 0);
                    const scale = totalBase > 0 ? (b / totalBase) : 1;
                    const predictedRevenue = (e.Marketing_Revenue || 0) * 1.1 * scale
                                           + (e.RnD_Revenue || 0) * 1.1 * scale
                                           + (e.Ops_Revenue || 0) * 1.1 * scale;
                    return (
                      <tr key={item.id} className="border-b">
                          <td className="px-6 py-4 font-bold text-indigo-700">Q{item.target?.Quarter} {item.target?.Year}</td>
                          <td className="px-6 py-4">{formatShortIDR(b)}</td>
                          <td className="px-6 py-4 text-green-600 font-bold">{formatShortIDR(predictedRevenue)}</td>
                          <td className="px-6 py-4 text-xs text-slate-400">Q{item.inputs?.Quarter} {item.inputs?.Year}</td>
                      </tr>
                    );
                  })}
              </tbody>
          </table>
        )}
      </div>
  );

  // --- NAVIGATION ---

  const NavItem = ({ id, label, icon }) => (
    <button onClick={() => setView(id)} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${view === id ? "bg-slate-900 text-white shadow-md" : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"}`}>
      <span>{icon}</span> {label}
    </button>
  );

  return (
    <div className="flex h-screen bg-slate-50 font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 hidden md:flex flex-col">
        <div className="p-6 border-b border-slate-100">
          <div className="font-bold text-xl text-slate-900">Decision<span className="text-blue-600">Opt</span></div>
        </div>
        <nav className="p-4 space-y-2">
            <NavItem id="input" label="1. Baseline Data" icon="📝" />
            <NavItem id="predict" label="2. Predict" icon="🔮" />
            <div className="pt-4 pb-2 px-4 text-xs font-bold text-slate-400 uppercase">Results</div>
            <NavItem id="analysis" label="Analysis" icon="📊" />
            <NavItem id="strategy" label="Strategy" icon="🎯" />
            <NavItem id="compare" label="Trends" icon="📈" />
            <NavItem id="history" label="History" icon="clock" />
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-4xl mx-auto">
            {notification && (
                <div className="fixed top-4 right-4 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg animate-bounce">
                    {notification}
                </div>
            )}

            <header className="mb-8">
                <h1 className="text-3xl font-bold text-slate-900 capitalize">{view.replace('input', 'Baseline Setup').replace('predict', 'Run Prediction')}</h1>
            </header>

            {view === 'input' && <InputPage />}
            {view === 'predict' && (
              <PredictPage
                inputs={inputs}
                targetDate={targetDate}
                targetBudgetInput={targetBudgetInput}
                setTargetBudgetInput={setTargetBudgetInput}
                setTargetBudget={setTargetBudget}
                setView={setView}
                runPrediction={runPrediction}
                loading={loading}
              />
            )}
            {view === 'analysis' && <AnalysisPage />}
            {view === 'strategy' && <StrategyPage />}
            {view === 'compare' && <ComparePage />}
            {view === 'history' && <HistoryPage />}
        </div>
      </main>
    </div>
  );
}

let root = window.__appRoot;

if (!root) {
  root = ReactDOM.createRoot(document.getElementById('root'));
  window.__appRoot = root;
}

root.render(<App />);
