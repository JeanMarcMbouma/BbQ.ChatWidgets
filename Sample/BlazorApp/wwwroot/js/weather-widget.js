/**
 * Weather Widget SSE Integration Module
 * 
 * Handles Server-Sent Events (SSE) subscription for weather widgets.
 * Manages connection lifecycle, real-time updates, and cleanup.
 */

const weatherStreams = new Map();

/**
 * Initialize a weather widget with SSE subscription
 * @param {string} weatherId - Unique identifier for the weather instance
 * @param {string} streamId - SSE stream ID to subscribe to
 * @param {string} city - City name for context
 * @param {any} dotnetRef - .NET DotNetObjectReference for callbacks
 */
export function initializeWeatherWidget(weatherId, streamId, city, dotnetRef) {
  console.log(`[SSE-Weather] Initializing weather widget - ID: ${weatherId}, Stream: ${streamId}, City: ${city}`);
  
  if (!weatherId || !streamId) {
    console.warn('[SSE-Weather] Weather widget initialization failed: missing weatherId or streamId');
    return;
  }

  // Close any existing stream for this weather widget
  if (weatherStreams.has(weatherId)) {
    console.log(`[SSE-Weather] Closing existing stream for ${weatherId}`);
    closeWeatherStream(weatherId);
  }

  const cityDisplay = document.getElementById(`weather-city-${weatherId}`);
  const conditionDisplay = document.getElementById(`weather-condition-${weatherId}`);
  const tempDisplay = document.getElementById(`weather-temp-${weatherId}`);
  const humidityDisplay = document.getElementById(`weather-humidity-${weatherId}`);
  const windDisplay = document.getElementById(`weather-wind-${weatherId}`);
  
  if (!cityDisplay || !conditionDisplay || !tempDisplay) {
    console.error(`[SSE-Weather] Weather widget elements not found for ID: ${weatherId}`);
    return;
  }

  console.log(`[SSE-Weather] Found all weather display elements for ${weatherId}`);

  // Subscribe to SSE stream
  const sseUrl = `/api/chat/widgets/streams/${encodeURIComponent(streamId)}/events`;
  console.log(`[SSE-Weather] Creating EventSource for URL: ${sseUrl}`);
  
  const eventSource = new EventSource(sseUrl);

  // Track the stream
  weatherStreams.set(weatherId, {
    eventSource,
    dotnetRef,
    cityDisplay,
    conditionDisplay,
    tempDisplay,
    humidityDisplay,
    windDisplay,
    streamId
  });

  console.log(`[SSE-Weather] EventSource created and tracked. Total streams: ${weatherStreams.size}`);

  // Handle incoming events
  eventSource.addEventListener('message', (event) => {
    console.log(`[SSE-Weather] Received message event:`, event.data);
    try {
      const data = JSON.parse(event.data);
      console.log(`[SSE-Weather] Parsed data:`, data);
      
      // Update weather if data is for this widget
      if (data && data.widgetId === 'weather') {
        console.log(`[SSE-Weather] Updating weather display with:`, data);
        updateWeatherDisplay(weatherId, data);
      } else {
        console.log(`[SSE-Weather] Ignoring data - widgetId mismatch. Expected: weather, Got: ${data?.widgetId}`);
      }
    } catch (error) {
      console.error('[SSE-Weather] Failed to parse weather event:', error, 'Raw data:', event.data);
    }
  });

  // Handle connection open
  eventSource.addEventListener('open', () => {
    console.log(`[SSE-Weather] EventSource opened for stream: ${streamId}`);
    if (dotnetRef) {
      try {
        dotnetRef.invokeMethodAsync('OnConnectionEstablished');
        console.log(`[SSE-Weather] Invoked OnConnectionEstablished callback`);
      } catch (error) {
        console.warn('[SSE-Weather] Failed to invoke OnConnectionEstablished:', error);
      }
    }
  });

  // Handle errors
  eventSource.addEventListener('error', (event) => {
    console.error(`[SSE-Weather] Stream error for ${streamId}:`, event);
    console.log(`[SSE-Weather] EventSource readyState: ${eventSource.readyState}`);
    eventSource.close();
    
    if (dotnetRef) {
      try {
        dotnetRef.invokeMethodAsync('OnConnectionClosed');
        console.log(`[SSE-Weather] Invoked OnConnectionClosed callback`);
      } catch (error) {
        console.warn('[SSE-Weather] Failed to invoke OnConnectionClosed:', error);
      }
    }

    // Attempt to reconnect after 5 seconds
    console.log(`[SSE-Weather] Scheduling reconnect attempt in 5 seconds`);
    setTimeout(() => {
      if (weatherStreams.has(weatherId)) {
        console.log(`[SSE-Weather] Attempting to reconnect weather widget: ${streamId}`);
        initializeWeatherWidget(weatherId, streamId, city, dotnetRef);
      } else {
        console.log(`[SSE-Weather] Weather ${weatherId} no longer in streams map, skipping reconnect`);
      }
    }, 5000);
  });

  console.log(`[SSE-Weather] Weather widget initialization complete for ${weatherId}`);
}

/**
 * Update the weather display with new data
 * @param {string} weatherId - The weather widget ID
 * @param {Object} data - The SSE event data containing weather information
 */
function updateWeatherDisplay(weatherId, data) {
  console.log(`[SSE-Weather] updateWeatherDisplay called for ${weatherId} with data:`, data);
  
  const stream = weatherStreams.get(weatherId);
  if (!stream) {
    console.warn(`[SSE-Weather] Stream not found for ${weatherId}`);
    return;
  }

  const { cityDisplay, conditionDisplay, tempDisplay, humidityDisplay, windDisplay, dotnetRef } = stream;

  // Update city with animation
  if (data.city && cityDisplay) {
    console.log(`[SSE-Weather] Updating city from "${cityDisplay.textContent}" to "${data.city}"`);
    cityDisplay.style.opacity = '0.7';
    cityDisplay.textContent = String(data.city);
    setTimeout(() => { cityDisplay.style.opacity = '1'; }, 50);
  }

  // Update condition with animation
  if (data.condition && conditionDisplay) {
    console.log(`[SSE-Weather] Updating condition to "${data.condition}"`);
    conditionDisplay.style.opacity = '0.7';
    conditionDisplay.textContent = String(data.condition);
    setTimeout(() => { conditionDisplay.style.opacity = '1'; }, 50);
  }

  // Update temperature with animation
  if (data.temperature !== undefined && tempDisplay) {
    console.log(`[SSE-Weather] Updating temperature to "${data.temperature}\u00B0C"`);
    tempDisplay.style.opacity = '0.7';
    tempDisplay.textContent = `${String(data.temperature)}\u00B0C`;
    setTimeout(() => { tempDisplay.style.opacity = '1'; }, 50);
  }

  // Update humidity
  if (data.humidity !== undefined && humidityDisplay) {
    console.log(`[SSE-Weather] Updating humidity to "${data.humidity}%"`);
    humidityDisplay.textContent = `${String(data.humidity)}%`;
  }

  // Update wind
  if (data.windSpeed !== undefined && windDisplay) {
    const windText = data.windDirection 
      ? `${String(data.windSpeed)} km/h ${String(data.windDirection)}` 
      : `${String(data.windSpeed)} km/h`;
    console.log(`[SSE-Weather] Updating wind to "${windText}"`);
    windDisplay.textContent = windText;
  }

  // Notify .NET about the update
  if (dotnetRef) {
    try {
      dotnetRef.invokeMethodAsync(
        'OnWeatherUpdate',
        data.city || '',
        data.condition || '',
        data.temperature || 0,
        data.humidity || 0,
        data.windDirection || '',
        data.windSpeed || 0
      );
      console.log(`[SSE-Weather] Invoked OnWeatherUpdate callback`);
    } catch (error) {
      console.warn('[SSE-Weather] Failed to invoke OnWeatherUpdate:', error);
    }
  }
}

/**
 * Close the SSE stream for a specific weather widget
 * @param {string} weatherId - The weather widget ID
 */
export function closeWeatherStream(weatherId) {
  console.log(`[SSE-Weather] Closing stream for ${weatherId}`);
  
  const stream = weatherStreams.get(weatherId);
  if (!stream) {
    console.warn(`[SSE-Weather] Stream not found for ${weatherId}`);
    return;
  }

  const { eventSource, dotnetRef } = stream;
  
  try {
    eventSource.close();
    console.log(`[SSE-Weather] EventSource closed for stream: ${stream.streamId}`);
  } catch (error) {
    console.warn('[SSE-Weather] Error closing weather stream:', error);
  }

  // Notify .NET about closure
  if (dotnetRef) {
    try {
      dotnetRef.invokeMethodAsync('OnConnectionClosed');
      console.log(`[SSE-Weather] Invoked OnConnectionClosed callback on close`);
    } catch (error) {
      console.warn('[SSE-Weather] Failed to invoke OnConnectionClosed:', error);
    }
  }

  weatherStreams.delete(weatherId);
  console.log(`[SSE-Weather] Stream removed. Remaining streams: ${weatherStreams.size}`);
}

/**
 * Close all active weather streams
 * Used for cleanup when the page unloads or component is destroyed
 */
export function closeAllWeatherStreams() {
  console.log(`[SSE-Weather] Closing all ${weatherStreams.size} weather streams`);
  
  for (const [weatherId] of weatherStreams) {
    closeWeatherStream(weatherId);
  }
  
  console.log('[SSE-Weather] All streams closed');
}

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
  console.log('[SSE-Weather] Page unloading, closing all streams');
  closeAllWeatherStreams();
});

// Log when module is loaded
console.log('[SSE-Weather] Weather widget module loaded');
