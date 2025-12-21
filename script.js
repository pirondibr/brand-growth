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

    // Handle different response formats from n8n
    // n8n might return data in different structures
    const metrics = extractMetrics(data);
    
    if (metrics.length === 0) {
        showError('No metrics data found in the response. Please check your n8n workflow configuration.');
        return;
    }

    // Display metrics
    metrics.forEach(metric => {
        const metricCard = createMetricCard(metric);
        metricsContainer.appendChild(metricCard);
    });

    // Display chart if historical data is available
    if (data.historical || data.timeline || data.growthData) {
        renderChart(data);
    } else {
        chartContainer.innerHTML = `
            <div class="chart-placeholder">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
                </svg>
                <p>Historical data visualization will appear here</p>
            </div>
        `;
    }
}

// Extract metrics from n8n response
// This function handles various response formats
function extractMetrics(data) {
    const metrics = [];

    // Handle direct metrics object
    if (data.metrics) {
        Object.entries(data.metrics).forEach(([key, value]) => {
            metrics.push({
                label: formatLabel(key),
                value: formatValue(value),
                change: data.changes?.[key] || null
            });
        });
    }

    // Handle DataForSEO API response structure
    if (data.tasks && Array.isArray(data.tasks)) {
        data.tasks.forEach(task => {
            if (task.result && Array.isArray(task.result)) {
                task.result.forEach(result => {
                    if (result.items && Array.isArray(result.items)) {
                        result.items.forEach(item => {
                            // Extract common DataForSEO metrics
                            if (item.metrics) {
                                Object.entries(item.metrics).forEach(([key, value]) => {
                                    metrics.push({
                                        label: formatLabel(key),
                                        value: formatValue(value),
                                        change: null
                                    });
                                });
                            }
                        });
                    }
                });
            }
        });
    }

    // Handle flat response structure
    if (metrics.length === 0) {
        const commonMetrics = [
            'organic_traffic',
            'backlinks',
            'referring_domains',
            'domain_rating',
            'organic_keywords',
            'traffic_cost',
            'search_volume'
        ];

        commonMetrics.forEach(metric => {
            if (data[metric] !== undefined) {
                metrics.push({
                    label: formatLabel(metric),
                    value: formatValue(data[metric]),
                    change: data[`${metric}_change`] || data[`${metric}_growth`] || null
                });
            }
        });
    }

    // If still no metrics, create placeholder
    if (metrics.length === 0) {
        metrics.push(
            { label: 'Domain Authority', value: 'N/A', change: null },
            { label: 'Backlinks', value: 'N/A', change: null },
            { label: 'Organic Traffic', value: 'N/A', change: null },
            { label: 'Keywords', value: 'N/A', change: null }
        );
    }

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

// Render chart (simple implementation)
function renderChart(data) {
    // Extract historical data
    const historicalData = data.historical || data.timeline || data.growthData || [];
    
    if (historicalData.length === 0) {
        chartContainer.innerHTML = `
            <div class="chart-placeholder">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
                </svg>
                <p>No historical data available</p>
            </div>
        `;
        return;
    }

    // Simple SVG chart implementation
    // For production, consider using Chart.js or D3.js
    const chartHTML = createSimpleChart(historicalData);
    chartContainer.innerHTML = chartHTML;
}

// Create simple SVG chart
function createSimpleChart(data) {
    const width = 800;
    const height = 400;
    const padding = 60;
    const chartWidth = width - 2 * padding;
    const chartHeight = height - 2 * padding;

    // Extract values and dates
    const values = data.map(d => typeof d === 'object' ? d.value : d);
    const dates = data.map(d => typeof d === 'object' ? d.date : null);
    
    const maxValue = Math.max(...values, 1);
    const minValue = Math.min(...values, 0);

    // Create SVG
    let svg = `<svg width="${width}" height="${height}" style="max-width: 100%; height: auto;">`;
    
    // Draw axes
    svg += `<line x1="${padding}" y1="${height - padding}" x2="${width - padding}" y2="${height - padding}" stroke="currentColor" stroke-width="2" opacity="0.3"/>`;
    svg += `<line x1="${padding}" y1="${padding}" x2="${padding}" y2="${height - padding}" stroke="currentColor" stroke-width="2" opacity="0.3"/>`;

    // Draw line
    const points = values.map((value, index) => {
        const x = padding + (index / (values.length - 1 || 1)) * chartWidth;
        const y = height - padding - ((value - minValue) / (maxValue - minValue || 1)) * chartHeight;
        return { x, y, value };
    });

    // Draw line path
    let path = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
        path += ` L ${points[i].x} ${points[i].y}`;
    }
    svg += `<path d="${path}" fill="none" stroke="url(#gradient)" stroke-width="3" stroke-linecap="round"/>`;

    // Draw gradient
    svg += `<defs><linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" style="stop-color:#6366f1;stop-opacity:1" />
        <stop offset="100%" style="stop-color:#8b5cf6;stop-opacity:1" />
    </linearGradient></defs>`;

    // Draw points
    points.forEach(point => {
        svg += `<circle cx="${point.x}" cy="${point.y}" r="4" fill="currentColor" style="color: #6366f1;"/>`;
    });

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

