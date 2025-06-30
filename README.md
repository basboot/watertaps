# Watertaps

Experiment to create a Chrome Extension. This extension reads the JWT from local storage on
https://dashboard.hammerhead.io and uses it to add watertaps to an existing route.

## Installation

### Prerequisites

- Node.js and npm installed on your system
- Google Chrome browser

### Building the Extension

1. Clone or download this repository

2. Install dependencies:
   ```bash
   npm install
   ```
3. Build the extension:
   ```bash
   npm run build
   ```

This will create a `dist` folder with the compiled extension files.

### Installing as an Unpacked Extension

https://developer.chrome.com/docs/extensions/get-started/tutorial/hello-world#load-unpacked

1. Open Google Chrome
2. Navigate to `chrome://extensions/`
3. Enable "Developer mode" by toggling the switch in the top-right corner
4. Click "Load unpacked" button
5. Select the `dist` folder that was created during the build process
6. The extension should now appear in your extensions list and be ready to use

### Usage

1. Navigate to https://dashboard.hammerhead.io and open a route
2. Click the watertap extension icon in your Chrome toolbar
3. The extension will automatically add nearby public watertaps to your route

## Notes

- This extension only works with existing routes (not new/unsaved routes)
- Only works for routes in the Netherlands
- Uses public watertap data from drinkwaterkaart.nl via Nationaal Georegister
