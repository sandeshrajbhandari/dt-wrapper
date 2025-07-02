# DrawThings API Demo

A React application that demonstrates integration with the DrawThings API for AI image generation. This project is built with Vite and React, providing a simple interface to generate images using text prompts.

## Features

- **Text-to-Image Generation**: Enter text prompts to generate AI images
- **Real-time Loading States**: Visual feedback during image generation
- **Error Handling**: Displays error messages for failed API calls
- **Responsive Design**: Clean, modern UI that works on different screen sizes
- **CORS Handling**: Configured proxy to handle cross-origin requests

## Prerequisites

Before running this application, you need to have:

1. **DrawThings API running locally** on `http://0.0.0.0:7859`
   - Make sure the DrawThings application is installed and running
   - The API should be accessible at the specified URL

2. **Node.js and npm/pnpm** installed on your system

## Installation

1. Clone or download this repository
2. Install dependencies:
   ```bash
   npm install
   # or
   pnpm install
   ```

## Development

To start the development server:

```bash
npm run dev
# or
pnpm dev
```

The application will be available at `http://localhost:5173` (or the port shown in the terminal).

## Usage

1. **Start the DrawThings API**: Ensure your DrawThings application is running locally
2. **Open the web app**: Navigate to the development server URL
3. **Enter a prompt**: Type a description of the image you want to generate
4. **Generate**: Click the "Generate" button or press Enter
5. **View result**: The generated image will appear below the form

## API Configuration

The application is configured to work with the DrawThings API using the following settings:

- **API Endpoint**: `/sdapi/v1/txt2img` (proxied to `http://0.0.0.0:7859`)
- **Parameters**: 
  - `t5_text_encoder_decoding`: true
  - `tea_cache_max_skip_steps`: 3
  - `fps`: 5

## Project Structure

```
dt-wrapper/
├── src/
│   ├── App.jsx          # Main application component
│   ├── App.css          # Application styles
│   ├── main.jsx         # React entry point
│   └── index.css        # Global styles
├── public/              # Static assets
├── vite.config.js       # Vite configuration with proxy setup
└── package.json         # Project dependencies
```

## Configuration

### Vite Proxy Setup

The `vite.config.js` file includes a proxy configuration to handle CORS issues:

```javascript
server: {
  proxy: {
    '/sdapi': {
      target: 'http://0.0.0.0:7859',
      changeOrigin: true,
      secure: false,
    }
  }
}
```

This allows the frontend to make requests to the local DrawThings API without CORS errors.

## Troubleshooting

### Common Issues

1. **"Failed to generate image" error**:
   - Ensure DrawThings is running on `http://0.0.0.0:7859`
   - Check that the API endpoint is accessible
   - Verify your internet connection

2. **CORS errors**:
   - The proxy configuration should handle this automatically
   - If issues persist, check the Vite configuration

3. **No image generated**:
   - Try different prompts
   - Check the browser console for detailed error messages
   - Ensure the DrawThings API is responding correctly

## Technologies Used

- **React 18**: UI framework
- **Vite**: Build tool and development server
- **DrawThings API**: AI image generation service
- **CSS**: Styling and responsive design

## License

This project is open source and available under the MIT License.
