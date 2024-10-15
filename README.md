# AI-Driven UserScript Manager

This Chrome extension allows users to create, manage, and execute AI-generated user scripts for web page customization.

## Installation

1. Clone this repository or download the source code.
2. Run `npm install` to install the dependencies.
3. Run `npm run build` to build the extension.
4. Open Chrome and navigate to `chrome://extensions`.
5. Enable "Developer mode" in the top right corner.
6. Click "Load unpacked" and select the `dist` folder created by the build process.

## Usage

1. Click on the extension icon in the Chrome toolbar to open the popup.
2. Use the "New Script" button to create a new script.
3. Enter a name, URL pattern, and description for your script.
4. The AI will generate a script based on your description.
5. You can edit, enable/disable, or delete scripts from the popup.
6. Open the options page to configure AI settings.

## Development

- Run `npm run dev` to start the development mode with hot reloading.
- Make changes to the files in the `src` folder.
- The extension will be automatically rebuilt when changes are detected.

## License

This project is licensed under the MIT License.
