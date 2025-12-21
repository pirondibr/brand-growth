// Configuration - Update this with your n8n webhook URL
const N8N_WEBHOOK_URL = 'https://pirondi.app.n8n.cloud/webhook/dataforseo-keyword';

// DOM Elements
const websiteInput = document.getElementById('websiteInput');
const analyzeBtn = document.getElementById('analyzeBtn');
const resultsSection = document.getElementById('resultsSection');
const websiteName = document.getElementById('websiteName');
const errorMessage = document.getElementById('errorMessage');
const metricsContainer = document.getElementById('metricsContainer');
const chartContainer = document.getElementById('chartContainer');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    // Add event listeners
    analyzeBtn.addEventListener('click', handleAnalyze);
    websiteInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleAnalyze();
        }
    });

    // Focus on input
    websiteInput.focus();
});

// Handle analyze button click
async function handleAnalyze() {
    const website = websiteInput.value.trim();
    
    // Validation
    if (!website) {
        showError('Please enter a website name');
        return;
    }

    // Basic URL validation
    if (!isValidWebsite(website)) {
        showError('Please enter a valid website name (e.g., example.com)');
        return;
    }

    // Hide previous results and errors
    hideError();
    resultsSection.style.display = 'none';

    // Show loading state
    setLoadingState(true);

    try {
        // Send request to n8n webhook
        const response = await fetch(N8N_WEBHOOK_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                website: website,
                timestamp: new Date().toISOString()
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        // Log the response for debugging
        console.log('n8n Response:', data);
        console.log('Response type:', Array.isArray(data) ? 'Array' : typeof data);
        console.log('Response keys:', typeof data === 'object' && data !== null ? Object.keys(data) : 'N/A');
        
        // Display results
        displayResults(website, data);
        
    } catch (error) {
        console.error('Error fetching data:', error);
        showError(`Failed to fetch brand growth data: ${error.message}. Please check your n8n webhook URL and ensure the workflow is active.`);
    } finally {
        setLoadingState(false);
    }
}

// Validate website input
function isValidWebsite(website) {
    // Basic validation - can be enhanced
    const domainRegex = /^([a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;
    return domainRegex.test(website) || website.includes('.');
}

// Set loading state
function setLoadingState(loading) {
    analyzeBtn.disabled = loading;
    const btnText = analyzeBtn.querySelector('.btn-text');
    const btnLoader = analyzeBtn.querySelector('.btn-loader');
    
    if (loading) {
        btnText.style.display = 'none';
        btnLoader.style.display = 'flex';
    } else {
        btnText.style.display = 'inline';
        btnLoader.style.display = 'none';
    }
}

// Display results
function displayResults(website, data) {
    websiteName.textContent = website;
    resultsSection.style.display = 'block';

    // Clear previous content
    metricsContainer.innerHTML = '';
    chartContainer.innerHTML = '';

    // Handle the n8n response format: array of objects with period and searches
    let searchData = [];
    
    // Log the data structure for debugging
    console.log('Parsing data:', data);
    
    // Check if data is an array (direct response)
    if (Array.isArray(data)) {
        // Check if it's the n8n format: [{keyword: "...", monthlyData: [...]}]
        if (data.length > 0 && data[0].monthlyData && Array.isArray(data[0].monthlyData)) {
            // Use the first keyword's monthlyData (or combine all if multiple keywords)
            searchData = data[0].monthlyData;
            console.log('Found monthlyData in array:', searchData.length, 'items');
        }
        // Check if first item contains the actual data array
        else if (data.length === 1 && Array.isArray(data[0])) {
            searchData = data[0];
            console.log('Found array in first element:', searchData.length, 'items');
        } else if (data.length === 1 && data[0].json && Array.isArray(data[0].json)) {
            searchData = data[0].json;
            console.log('Found data[0].json array:', searchData.length, 'items');
        } else if (data.length === 1 && data[0].body && Array.isArray(data[0].body)) {
            searchData = data[0].body;
            console.log('Found data[0].body array:', searchData.length, 'items');
        } else {
            // Check if array items have period/searches directly
            if (data.length > 0 && data[0].period !== undefined && data[0].searches !== undefined) {
                searchData = data;
                console.log('Found array directly with period/searches:', searchData.length, 'items');
            }
        }
    }
    // Check if data has monthlyData property (n8n format)
    else if (data && data.monthlyData && Array.isArray(data.monthlyData)) {
        searchData = data.monthlyData;
        console.log('Found data.monthlyData array:', searchData.length, 'items');
    }
    // Check if data has a data property with array
    else if (data && Array.isArray(data.data)) {
        searchData = data.data;
        console.log('Found data.data array:', searchData.length, 'items');
    }
    // Check if data has a searches property with array
    else if (data && Array.isArray(data.searches)) {
        searchData = data.searches;
        console.log('Found data.searches array:', searchData.length, 'items');
    }
    // Check if data has a results property with array
    else if (data && Array.isArray(data.results)) {
        searchData = data.results;
        console.log('Found data.results array:', searchData.length, 'items');
    }
    // Check if data has a body property (common in webhook responses)
    else if (data && data.body) {
        if (Array.isArray(data.body)) {
            searchData = data.body;
            console.log('Found data.body array:', searchData.length, 'items');
        } else if (data.body && Array.isArray(data.body.data)) {
            searchData = data.body.data;
            console.log('Found data.body.data array:', searchData.length, 'items');
        }
    }
    // Check if data has a json property
    else if (data && data.json) {
        if (Array.isArray(data.json)) {
            searchData = data.json;
            console.log('Found data.json array:', searchData.length, 'items');
        } else if (data.json && Array.isArray(data.json.data)) {
            searchData = data.json.data;
            console.log('Found data.json.data array:', searchData.length, 'items');
        } else if (data.json.json && Array.isArray(data.json.json)) {
            searchData = data.json.json;
            console.log('Found data.json.json array:', searchData.length, 'items');
        }
    }
    // Check if data has a response property (common in n8n Respond to Webhook)
    else if (data && data.response) {
        if (Array.isArray(data.response)) {
            searchData = data.response;
            console.log('Found data.response array:', searchData.length, 'items');
        } else if (data.response && Array.isArray(data.response.data)) {
            searchData = data.response.data;
            console.log('Found data.response.data array:', searchData.length, 'items');
        }
    }
    // Check if data is an object with numeric keys (n8n sometimes returns objects with indices)
    else if (data && typeof data === 'object' && !Array.isArray(data)) {
        // Check if object has numeric string keys (like {"0": {...}, "1": {...}})
        const keys = Object.keys(data);
        const numericKeys = keys.filter(k => /^\d+$/.test(k));
        if (numericKeys.length > 0 && numericKeys.length === keys.length) {
            // Convert to array
            const potentialArray = numericKeys.map(k => data[k]);
            if (potentialArray.length > 0) {
                const firstItem = potentialArray[0];
                // Check if it's an array of search data
                if (Array.isArray(firstItem) && firstItem.length > 0 && firstItem[0].period !== undefined) {
                    searchData = firstItem;
                    console.log('Found array in numeric-keyed object:', searchData.length, 'items');
                } else if (firstItem && (firstItem.period !== undefined || firstItem.searches !== undefined)) {
                    searchData = potentialArray;
                    console.log('Converted numeric-keyed object to array:', searchData.length, 'items');
                }
            }
        }
        
        // Try to find any array property
        if (searchData.length === 0) {
            for (const key in data) {
                if (Array.isArray(data[key]) && data[key].length > 0) {
                    // Check if it looks like search data (has period and searches properties)
                    const firstItem = data[key][0];
                    if (firstItem && (firstItem.period !== undefined || firstItem.searches !== undefined)) {
                        searchData = data[key];
                        console.log(`Found array in data.${key}:`, searchData.length, 'items');
                        break;
                    }
                }
            }
        }
        
        // If still not found, check if the object itself has period/searches (single item)
        if (searchData.length === 0 && data.period !== undefined && data.searches !== undefined) {
            searchData = [data];
            console.log('Found single item with period/searches');
        }
    }

    // Validate that we have the right structure
    if (searchData.length > 0) {
        const firstItem = searchData[0];
        if (!firstItem.period && !firstItem.searches) {
            console.warn('Data found but missing period/searches properties:', firstItem);
            // Try to find period/searches in nested structure
            searchData = searchData.map(item => {
                // Handle nested structures
                if (item.data) return item.data;
                if (item.json) return item.json;
                return item;
            }).filter(item => item && (item.period !== undefined || item.searches !== undefined));
        }
    }

    if (searchData.length === 0) {
        console.error('No search data found. Full response:', JSON.stringify(data, null, 2));
        showError('No search data found in the response. Please check your n8n workflow configuration. Check browser console for details.');
        return;
    }
    
    console.log('Final searchData:', searchData);

    // Extract and display metrics from search data
    const metrics = extractMetricsFromSearchData(searchData);
    
    // Display metrics
    metrics.forEach(metric => {
        const metricCard = createMetricCard(metric);
        metricsContainer.appendChild(metricCard);
    });

    // Always render chart with search data
    renderChart(searchData);
}

// Extract metrics from search data array
function extractMetricsFromSearchData(searchData) {
    const metrics = [];
    
    if (!Array.isArray(searchData) || searchData.length === 0) {
        return metrics;
    }

    // Sort by period (most recent first)
    const sortedData = [...searchData].sort((a, b) => {
        const periodA = a.period || '';
        const periodB = b.period || '';
        return periodB.localeCompare(periodA);
    });

    // Get current (most recent) searches
    const current = sortedData[0]?.searches || 0;
    
    // Get previous period for comparison
    const previous = sortedData[1]?.searches || current;
    
    // Calculate growth percentage
    const growth = previous > 0 ? ((current - previous) / previous) * 100 : 0;
    
    // Calculate average
    const total = searchData.reduce((sum, item) => sum + (item.searches || 0), 0);
    const average = Math.round(total / searchData.length);
    
    // Get peak (maximum) searches
    const peak = Math.max(...searchData.map(item => item.searches || 0));
    
    // Get minimum searches
    const minimum = Math.min(...searchData.map(item => item.searches || 0));

    metrics.push(
        {
            label: 'Current Monthly Searches',
            value: formatValue(current),
            change: null
        },
        {
            label: 'Average Monthly Searches',
            value: formatValue(average),
            change: null
        },
        {
            label: 'Peak Monthly Searches',
            value: formatValue(peak),
            change: null
        },
        {
            label: 'Month-over-Month Growth',
            value: formatValue(Math.abs(growth)),
            change: growth
        }
    );

    return metrics;
}

// Format label for display
function formatLabel(key) {
    return key
        .replace(/_/g, ' ')
        .replace(/\b\w/g, l => l.toUpperCase());
}

// Format value for display
function formatValue(value) {
    if (typeof value === 'number') {
        if (value >= 1000000) {
            return (value / 1000000).toFixed(2) + 'M';
        } else if (value >= 1000) {
            return (value / 1000).toFixed(2) + 'K';
        }
        return value.toLocaleString();
    }
    return value || 'N/A';
}

// Create metric card element
function createMetricCard(metric) {
    const card = document.createElement('div');
    card.className = 'metric-card';

    const changeHTML = metric.change !== null 
        ? `<div class="metric-change ${getChangeClass(metric.change)}">
            ${formatChange(metric.change)}
        </div>`
        : '';

    card.innerHTML = `
        <div class="metric-label">${metric.label}</div>
        <div class="metric-value">${metric.value}</div>
        ${changeHTML}
    `;

    return card;
}

// Get change class for styling
function getChangeClass(change) {
    if (typeof change === 'number') {
        return change > 0 ? 'positive' : change < 0 ? 'negative' : 'neutral';
    }
    return 'neutral';
}

// Format change value
function formatChange(change) {
    if (typeof change === 'number') {
        const sign = change > 0 ? '+' : '';
        return `${sign}${change.toFixed(1)}%`;
    }
    return change;
}

// Render chart with search data
function renderChart(searchData) {
    if (!Array.isArray(searchData) || searchData.length === 0) {
        chartContainer.innerHTML = `
            <div class="chart-placeholder">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
                </svg>
                <p>No search data available</p>
            </div>
        `;
        return;
    }

    // Sort data by period (oldest first for chart)
    const sortedData = [...searchData].sort((a, b) => {
        const periodA = a.period || '';
        const periodB = b.period || '';
        return periodA.localeCompare(periodB);
    });

    // Create chart
    const chartHTML = createSearchChart(sortedData);
    chartContainer.innerHTML = chartHTML;
}

// Create chart for search data
function createSearchChart(data) {
    const width = 1000;
    const height = 500;
    const padding = { top: 40, right: 40, bottom: 80, left: 80 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    // Extract values and periods
    const values = data.map(d => d.searches || 0);
    const periods = data.map(d => d.period || '');
    
    const maxValue = Math.max(...values, 1);
    const minValue = Math.min(...values, 0);
    const valueRange = maxValue - minValue || 1;

    // Format period for display (MM-YYYY -> MMM YYYY)
    function formatPeriod(period) {
        if (!period) return '';
        const [month, year] = period.split('-');
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const monthIndex = parseInt(month) - 1;
        return `${monthNames[monthIndex] || month} ${year}`;
    }

    // Create SVG
    let svg = `<svg width="${width}" height="${height}" style="max-width: 100%; height: auto;" viewBox="0 0 ${width} ${height}">`;
    
    // Define gradient
    svg += `<defs>
        <linearGradient id="searchGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style="stop-color:#6366f1;stop-opacity:0.3" />
            <stop offset="100%" style="stop-color:#6366f1;stop-opacity:0.05" />
        </linearGradient>
        <linearGradient id="searchLineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" style="stop-color:#6366f1;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#8b5cf6;stop-opacity:1" />
        </linearGradient>
    </defs>`;
    
    // Draw axes
    svg += `<line x1="${padding.left}" y1="${padding.top}" x2="${padding.left}" y2="${height - padding.bottom}" stroke="currentColor" stroke-width="2" opacity="0.3"/>`;
    svg += `<line x1="${padding.left}" y1="${height - padding.bottom}" x2="${width - padding.right}" y2="${height - padding.bottom}" stroke="currentColor" stroke-width="2" opacity="0.3"/>`;

    // Calculate points
    const points = values.map((value, index) => {
        const x = padding.left + (index / (values.length - 1 || 1)) * chartWidth;
        const y = height - padding.bottom - ((value - minValue) / valueRange) * chartHeight;
        return { x, y, value, period: periods[index] };
    });

    // Draw area under curve
    let areaPath = `M ${points[0].x} ${height - padding.bottom} L ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
        areaPath += ` L ${points[i].x} ${points[i].y}`;
    }
    areaPath += ` L ${points[points.length - 1].x} ${height - padding.bottom} Z`;
    svg += `<path d="${areaPath}" fill="url(#searchGradient)"/>`;

    // Draw line
    let linePath = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
        linePath += ` L ${points[i].x} ${points[i].y}`;
    }
    svg += `<path d="${linePath}" fill="none" stroke="url(#searchLineGradient)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>`;

    // Draw points and labels
    points.forEach((point, index) => {
        // Draw point
        svg += `<circle cx="${point.x}" cy="${point.y}" r="5" fill="#6366f1" stroke="#1e293b" stroke-width="2"/>`;
        
        // Draw period label on x-axis (show every 3rd or fewer labels to avoid crowding)
        const showLabel = index % Math.ceil(data.length / 12) === 0 || index === 0 || index === data.length - 1;
        if (showLabel) {
            const periodText = formatPeriod(point.period);
            svg += `<text x="${point.x}" y="${height - padding.bottom + 20}" text-anchor="middle" fill="currentColor" font-size="12" opacity="0.7">${periodText}</text>`;
        }
        
        // Draw value label on hover area (simplified - show on some points)
        if (index === 0 || index === Math.floor(data.length / 2) || index === data.length - 1) {
            svg += `<text x="${point.x}" y="${point.y - 10}" text-anchor="middle" fill="currentColor" font-size="11" font-weight="600">${formatValue(point.value)}</text>`;
        }
    });

    // Y-axis labels
    const ySteps = 5;
    for (let i = 0; i <= ySteps; i++) {
        const value = minValue + (valueRange / ySteps) * i;
        const y = height - padding.bottom - (i / ySteps) * chartHeight;
        svg += `<text x="${padding.left - 10}" y="${y + 4}" text-anchor="end" fill="currentColor" font-size="11" opacity="0.7">${formatValue(value)}</text>`;
    }

    // Chart title
    svg += `<text x="${width / 2}" y="25" text-anchor="middle" fill="currentColor" font-size="16" font-weight="600">Monthly Search Volume Over Time</text>`;

    svg += `</svg>`;

    return svg;
}

// Show error message
function showError(message) {
    errorMessage.textContent = message;
    errorMessage.style.display = 'block';
    resultsSection.style.display = 'block';
}

// Hide error message
function hideError() {
    errorMessage.style.display = 'none';
}

