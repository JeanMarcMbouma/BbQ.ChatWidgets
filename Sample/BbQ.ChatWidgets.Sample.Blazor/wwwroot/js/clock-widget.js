/**
 * Clock Widget SSE Integration Module
 * 
 * Handles Server-Sent Events (SSE) subscription for clock widgets.
 * Manages connection lifecycle, real-time updates, and cleanup.
 */

const clockStreams = new Map();

/**
 * Initialize a clock widget with SSE subscription
 * @param {string} clockId - Unique identifier for the clock instance
 * @param {string} streamId - SSE stream ID to subscribe to
 * @param {any} dotnetRef - .NET DotNetObjectReference for callbacks
 */
export function initializeClockWidget(clockId, streamId, dotnetRef) {
  console.log(`[SSE] Initializing clock widget - ID: ${clockId}, Stream: ${streamId}`);
  
  if (!clockId || !streamId) {
    console.warn('[SSE] Clock widget initialization failed: missing clockId or streamId');
    return;
  }

  // Close any existing stream for this clock
  if (clockStreams.has(clockId)) {
    console.log(`[SSE] Closing existing stream for ${clockId}`);
    closeClockStream(clockId);
  }

  const timeDisplay = document.getElementById(`clock-time-${clockId}`);
  if (!timeDisplay) {
    console.error(`[SSE] Clock widget element not found: clock-time-${clockId}`);
    return;
  }

  console.log(`[SSE] Found clock display element: clock-time-${clockId}`);

  // Subscribe to SSE stream
  const sseUrl = `/api/chat/widgets/streams/${encodeURIComponent(streamId)}/events`;
  console.log(`[SSE] Creating EventSource for URL: ${sseUrl}`);
  
  const eventSource = new EventSource(sseUrl);

  // Track the stream
  clockStreams.set(clockId, {
    eventSource,
    dotnetRef,
    timeDisplay,
    streamId
  });

  console.log(`[SSE] EventSource created and tracked. Total streams: ${clockStreams.size}`);

  // Handle incoming events
  eventSource.addEventListener('message', (event) => {
    console.log(`[SSE] Received message event:`, event.data);
    try {
      const data = JSON.parse(event.data);
      console.log(`[SSE] Parsed data:`, data);
      
      // Update clock if data is for this widget
      if (data && data.widgetId === 'clock') {
        console.log(`[SSE] Updating clock display with:`, data);
        updateClockDisplay(clockId, data);
      } else {
        console.log(`[SSE] Ignoring data - widgetId mismatch. Expected: clock, Got: ${data?.widgetId}`);
      }
    } catch (error) {
      console.error('[SSE] Failed to parse clock event:', error, 'Raw data:', event.data);
    }
  });

  // Handle connection open
  eventSource.addEventListener('open', () => {
    console.log(`[SSE] EventSource opened for stream: ${streamId}`);
    if (dotnetRef) {
      try {
        dotnetRef.invokeMethodAsync('OnConnectionEstablished');
        console.log(`[SSE] Invoked OnConnectionEstablished callback`);
      } catch (error) {
        console.warn('[SSE] Failed to invoke OnConnectionEstablished:', error);
      }
    }
  });

  // Handle errors
  eventSource.addEventListener('error', (event) => {
    console.error(`[SSE] Stream error for ${streamId}:`, event);
    console.log(`[SSE] EventSource readyState: ${eventSource.readyState}`);
    eventSource.close();
    
    if (dotnetRef) {
      try {
        dotnetRef.invokeMethodAsync('OnConnectionClosed');
        console.log(`[SSE] Invoked OnConnectionClosed callback`);
      } catch (error) {
        console.warn('[SSE] Failed to invoke OnConnectionClosed:', error);
      }
    }

    // Attempt to reconnect after 5 seconds
    console.log(`[SSE] Scheduling reconnect attempt in 5 seconds`);
    setTimeout(() => {
      if (clockStreams.has(clockId)) {
        console.log(`[SSE] Attempting to reconnect clock widget: ${streamId}`);
        initializeClockWidget(clockId, streamId, dotnetRef);
      } else {
        console.log(`[SSE] Clock ${clockId} no longer in streams map, skipping reconnect`);
      }
    }, 5000);
  });

  console.log(`[SSE] Clock widget initialization complete for ${clockId}`);
}

/**
 * Update the clock display with new time data
 * @param {string} clockId - The clock widget ID
 * @param {Object} data - The SSE event data containing time information
 */
function updateClockDisplay(clockId, data) {
  console.log(`[SSE] updateClockDisplay called for ${clockId} with data:`, data);
  
  const stream = clockStreams.get(clockId);
  if (!stream) {
    console.warn(`[SSE] Stream not found for ${clockId}`);
    return;
  }

  const { timeDisplay, dotnetRef } = stream;

  // Update the displayed time with animation
  if (data.timeLocal && timeDisplay) {
    console.log(`[SSE] Updating time display from "${timeDisplay.textContent}" to "${data.timeLocal}"`);
    
    // Add a subtle animation on update
    timeDisplay.style.opacity = '0.7';
    timeDisplay.textContent = String(data.timeLocal);
    
    // Fade back in
    setTimeout(() => {
      timeDisplay.style.opacity = '1';
    }, 50);
  } else {
    console.warn(`[SSE] Cannot update: timeLocal=${data.timeLocal}, timeDisplay=${timeDisplay ? 'exists' : 'null'}`);
  }

  // Notify .NET about the update
  if (dotnetRef) {
    try {
      dotnetRef.invokeMethodAsync(
        'OnTimeUpdate',
        data.timeLocal || '',
        data.time || ''
      );
      console.log(`[SSE] Invoked OnTimeUpdate callback`);
    } catch (error) {
      console.warn('[SSE] Failed to invoke OnTimeUpdate:', error);
    }
  }
}

/**
 * Close the SSE stream for a specific clock widget
 * @param {string} clockId - The clock widget ID
 */
export function closeClockStream(clockId) {
  console.log(`[SSE] Closing stream for ${clockId}`);
  
  const stream = clockStreams.get(clockId);
  if (!stream) {
    console.warn(`[SSE] Stream not found for ${clockId}`);
    return;
  }

  const { eventSource, dotnetRef } = stream;
  
  try {
    eventSource.close();
    console.log(`[SSE] EventSource closed for stream: ${stream.streamId}`);
  } catch (error) {
    console.warn('[SSE] Error closing clock stream:', error);
  }

  // Notify .NET about closure
  if (dotnetRef) {
    try {
      dotnetRef.invokeMethodAsync('OnConnectionClosed');
      console.log(`[SSE] Invoked OnConnectionClosed callback on close`);
    } catch (error) {
      console.warn('[SSE] Failed to invoke OnConnectionClosed:', error);
    }
  }

  clockStreams.delete(clockId);
  console.log(`[SSE] Stream removed. Remaining streams: ${clockStreams.size}`);
}

/**
 * Close all active clock streams
 * Used for cleanup when the page unloads or component is destroyed
 */
export function closeAllClockStreams() {
  console.log(`[SSE] Closing all ${clockStreams.size} clock streams`);
  
  for (const [clockId] of clockStreams) {
    closeClockStream(clockId);
  }
  
  console.log('[SSE] All streams closed');
}

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
  console.log('[SSE] Page unloading, closing all streams');
  closeAllClockStreams();
});

// Log when module is loaded
console.log('[SSE] Clock widget module loaded');
