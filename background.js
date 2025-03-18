let popupWindow = null;
<<<<<<< HEAD
let focusIntervalId = null;

chrome.action.onClicked.addListener(() => {
  if (popupWindow) {
    chrome.windows.get(popupWindow.id, {}, (window) => {
      if (chrome.runtime.lastError) {
        createPopupWindow();
      } else {
        chrome.windows.remove(popupWindow.id);
        popupWindow = null;
        clearFocusInterval();
      }
    });
  } else {
    createPopupWindow();
  }
});

function createPopupWindow() {
  chrome.windows.getCurrent((currentWindow) => {
    const width = 350;
    const height = 500;

    chrome.system.display.getInfo((displays) => {
      const primaryDisplay = displays[0];
      const screenWidth = primaryDisplay.workArea.width;
      const screenHeight = primaryDisplay.workArea.height;
      const screenLeft = primaryDisplay.workArea.left;
      const screenTop = primaryDisplay.workArea.top;

      // Calculate top-right position
      let left = (currentWindow.width - width) + currentWindow.left;
      let top = currentWindow.top;

      // Ensure 50% visibility
      const minVisibleWidth = width * 0.5;
      const minVisibleHeight = height * 0.5;
      if (left + minVisibleWidth > screenLeft + screenWidth) {
        left = screenLeft + screenWidth - width;
      }
      if (left < screenLeft) left = screenLeft;
      if (top + minVisibleHeight > screenTop + screenHeight) {
        top = screenTop + screenHeight - height;
      }
      if (top < screenTop) top = screenTop;

      chrome.windows.create({
        url: chrome.runtime.getURL('popup.html'),
        // Remove type: 'popup' to test Arc's default behavior
        width: width,
        height: height,
        top: Math.round(top),
        left: Math.round(left),
        focused: true,
        state: 'normal'
      }, (window) => {
        if (chrome.runtime.lastError) {
          console.error('Window creation failed:', chrome.runtime.lastError.message);
          chrome.windows.create({
            url: chrome.runtime.getURL('popup.html'),
            width: width,
            height: height,
            left: Math.round(screenLeft + (screenWidth - width) / 2),
            top: Math.round(screenTop + (screenHeight - height) / 2),
            focused: true,
            state: 'normal'
          }, (fallbackWindow) => {
            popupWindow = fallbackWindow;
            if (fallbackWindow) enforceWindowProperties(fallbackWindow.id);
          });
        } else {
          popupWindow = window;
          enforceWindowProperties(window.id);
        }
      });
    });
  });
}

function enforceWindowProperties(windowId) {
  // Immediately enforce size and position
  chrome.windows.update(windowId, {
    width: 350,
    height: 500,
    top: Math.round(popupWindow.top || 0), // Use initial top if available
    left: Math.round(popupWindow.left || 0),
    focused: true,
    state: 'normal'
  });

  clearFocusInterval();
  focusIntervalId = setInterval(() => {
    if (popupWindow) {
      chrome.windows.get(popupWindow.id, {}, (window) => {
        if (chrome.runtime.lastError) {
          clearFocusInterval();
          popupWindow = null;
        } else {
          console.log('Window state:', window); // Debug log
          if (!window.focused || window.state !== 'normal' || window.width > 400 || window.height > 550) {
            chrome.windows.update(popupWindow.id, {
              width: 350,
              height: 500,
              top: Math.round(window.top),
              left: Math.round(window.left),
              focused: true,
              state: 'normal',
              drawAttention: true // Flash to regain attention
            });
          }
        }
      });
    } else {
      clearFocusInterval();
    }
  }, 500); // Check every 0.5 seconds
}

function clearFocusInterval() {
  if (focusIntervalId) {
    clearInterval(focusIntervalId);
    focusIntervalId = null;
  }
}

chrome.windows.onRemoved.addListener((windowId) => {
  if (popupWindow && popupWindow.id === windowId) {
    popupWindow = null;
    clearFocusInterval();
  }
});

chrome.runtime.onSuspend.addListener(() => {
  clearFocusInterval();
});
=======
 let focusIntervalId = null;
 
 // Listen for clicks on the extension icon
 chrome.action.onClicked.addListener(() => {
   if (popupWindow) {
     // Check if the window still exists
     chrome.windows.get(popupWindow.id, {}, (window) => {
       if (chrome.runtime.lastError) {
         // Window doesn't exist anymore, create a new one
         createPopupWindow();
       } else {
         // Window exists, toggle it (close it)
         chrome.windows.remove(popupWindow.id);
         popupWindow = null;
         clearFocusInterval();
       }
     });
   } else {
     // No window exists, create one
     createPopupWindow();
   }
 });
 
 // Function to create the popup window
 function createPopupWindow() {
   // Get the current window first to determine positioning
   chrome.windows.getCurrent((currentWindow) => {
     // Get display information
     const width = 350;
     const height = 500;
     
     // Calculate position (top-right corner of the current window)
     let left = (currentWindow.width - width) + currentWindow.left;
     let top = currentWindow.top;
     
     // Ensure window is within visible area
     if (left < 0) left = 0;
     if (top < 0) top = 0;
     
     // Create a new popup window
     chrome.windows.create({
       url: chrome.runtime.getURL('popup.html'),
       type: 'popup',
       width: width,
       height: height,
       top: top,
       left: left,
       focused: true
     }, (window) => {
       popupWindow = window;
       
       // Create a focus interval to keep the window on top
       setupFocusInterval();
     });
   });
 }
 
 // Function to set up the focus interval
 function setupFocusInterval() {
   // Clear any existing intervals
   clearFocusInterval();
   
   // Set up a new interval to check and bring the window to front
   // This interval is less frequent to be less intrusive
   focusIntervalId = setInterval(() => {
     if (popupWindow) {
       // Check if the window is focused
       chrome.windows.get(popupWindow.id, {}, (window) => {
         if (!chrome.runtime.lastError && !window.focused) {
           // Only focus if the window isn't already focused
           chrome.windows.update(popupWindow.id, { focused: true });
         }
       });
     } else {
       clearFocusInterval();
     }
   }, 0); // Check every 3 seconds - balance between staying on top and being intrusive
 }
 
 // Function to clear the focus interval
 function clearFocusInterval() {
   if (focusIntervalId) {
     clearInterval(focusIntervalId);
     focusIntervalId = null;
   }
 }
 
 // Listen for popup window being closed
 chrome.windows.onRemoved.addListener((windowId) => {
   if (popupWindow && popupWindow.id === windowId) {
     popupWindow = null;
     clearFocusInterval();
   }
 });
 
 // Listen for when the browser is shutting down
 chrome.runtime.onSuspend.addListener(() => {
   clearFocusInterval();
 });
>>>>>>> 3080000bb666c69b11c9ba9c10fff386b8bdb98d
