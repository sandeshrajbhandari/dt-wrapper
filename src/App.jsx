import { useState } from 'react'
import './App.css'
import { getConfig, getAvailableConfigs } from './configs/drawThingsConfigs'

function App() {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [image, setImage] = useState(null);
  const [error, setError] = useState(null);
  const [selectedConfig, setSelectedConfig] = useState('default');

  async function fetchImage() {
    setLoading(true);
    setError(null);
    setImage(null);
    
    const DRAW_THINGS_URL = "/local_root_url/sdapi/v1/txt2img"; // see vite.config.js to check the port and url. 7860 used right now.
    
    // Get the configuration from the config file
    const params = getConfig(selectedConfig);
    
    // Add the user's prompt to the configuration
    params.prompt = prompt;
  const opts = {
          method: "POST",
          // mode: 'no-cors',
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(params),
        };

      try {
        const res = await fetch(DRAW_THINGS_URL, opts);

        if (!res.ok) {
          const errorText = await res.text();
          throw new Error(`Failed to generate image: ${res.status} ${errorText}`);
        }

        const data = await res.json();
        const imageBase64 = data.images[0];
        
        setImage(`data:image/png;base64,${imageBase64}`);

      } catch (err) {
        console.error("Failed to generate image", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
  }
  
  // Handle form submission with Enter key
  const handleFormSubmit = (e) => {
      e.preventDefault();
      if (!loading && prompt.trim() !== "") {
          fetchImage();
      }
  };

  return (
    <div style={{
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      flexDirection: "column",
      gap: "1rem"
    }}>
      <h1>Drawthings API Demo</h1>
      
      {/* Configuration Selector */}
      <div style={{ marginBottom: '1rem' }}>
        <label htmlFor="config-select" style={{ marginRight: '0.5rem' }}>
          Model Configuration:
        </label>
        <select
          id="config-select"
          value={selectedConfig}
          onChange={(e) => setSelectedConfig(e.target.value)}
          disabled={loading}
        >
          {getAvailableConfigs().map(configName => (
            <option key={configName} value={configName}>
              {configName.charAt(0).toUpperCase() + configName.slice(1)}
            </option>
          ))}
        </select>
      </div>
      
      <form onSubmit={handleFormSubmit} className="card" style={{width: '100%', boxSizing: 'border-box'}}>
        <div
          style={{
            display: "flex",
            gap: "1rem",
            alignItems: "center",
            justifyContent: "center",
            width: '100%'
          }}
        >
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Enter a prompt..."
          />
          <button
            type="submit"
            disabled={loading || prompt.trim() === ""}
          >
            {loading ? "Loading..." : "Generate"}
          </button>
        </div>
      </form>
      
      {error && <p style={{ color: 'red' }}>Error: {error}</p>}
      
      {loading && <p>Generating image, please wait...</p>}

      {image && !loading && (
        <img
          src={image}
          width={512}
          alt="Generated Image"
        />
      )}
    </div>
  );
}

export default App
