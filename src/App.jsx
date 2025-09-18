import { useEffect, useMemo, useState } from 'react'
import './App.css'
import { getConfig, getAvailableConfigs } from './configs/drawThingsConfigs'
import testImgUrl from './assets/taylor-qwen-test.png'

function App() {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [image, setImage] = useState(null);
  const [error, setError] = useState(null);
  const [selectedConfig, setSelectedConfig] = useState('default');
  const [mode, setMode] = useState('txt2img'); // 'txt2img' | 'img2img'
  const [sourceImageBase64, setSourceImageBase64] = useState(null);
  const [sourcePreview, setSourcePreview] = useState(null);
  const [denoise, setDenoise] = useState(0.6);
  const [lockAspect, setLockAspect] = useState(true);
  const [width, setWidth] = useState(512);
  const [height, setHeight] = useState(512);
  const aspectRatio = useMemo(() => (width && height ? width / height : 1), [width, height]);

  // Load default test image and set dimensions from its natural size
  useEffect(() => {
    async function loadDefault() {
      try {
        const res = await fetch(testImgUrl);
        const blob = await res.blob();
        const reader = new FileReader();
        reader.onloadend = () => {
          const dataUrl = reader.result;
          setSourcePreview(dataUrl);
          // Strip the data URL header to send pure base64 to API
          const base64Only = String(dataUrl).split(',')[1];
          setSourceImageBase64(base64Only);

          const img = new Image();
          img.onload = () => {
            setWidth(img.naturalWidth);
            setHeight(img.naturalHeight);
          };
          img.src = dataUrl;
        };
        reader.readAsDataURL(blob);
      } catch (e) {
        console.error('Failed to load default image', e);
      }
    }
    loadDefault();
  }, []);

  async function fetchImage() {
    setLoading(true);
    setError(null);
    setImage(null);
    
    const DRAW_THINGS_URL = mode === 'img2img' ? "/local_root_url/sdapi/v1/txt2img" : "/local_root_url/sdapi/v1/txt2img"; // see vite.config.js to check the port and url. 7860 used right now.
    
    // Get the configuration from the config file
    const params = getConfig(selectedConfig);
    
    // Add the user's prompt to the configuration
    params.prompt = prompt;
    // Ensure width/height reflect current UI controls
    params.width = width;
    params.height = height;

    if (mode === 'img2img') {
      if (!sourceImageBase64) {
        setError('No source image available for img2img');
        setLoading(false);
        return;
      }
      params.init_images = [sourceImageBase64];
      // params.denoising_strength = denoise;
    }
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

  // Handle user-selected source image
  const onSelectFile = async (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result;
      setSourcePreview(dataUrl);
      const base64Only = String(dataUrl).split(',')[1];
      setSourceImageBase64(base64Only);

      const img = new Image();
      img.onload = () => {
        setWidth(img.naturalWidth);
        setHeight(img.naturalHeight);
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  };

  const onWidthChange = (val) => {
    const w = Number(val) || 0;
    if (lockAspect && aspectRatio) {
      const h = Math.round(w / aspectRatio);
      setWidth(w);
      setHeight(h);
    } else {
      setWidth(w);
    }
  };

  const onHeightChange = (val) => {
    const h = Number(val) || 0;
    if (lockAspect && aspectRatio) {
      const w = Math.round(h * aspectRatio);
      setHeight(h);
      setWidth(w);
    } else {
      setHeight(h);
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
      <div style={{ display: 'flex', gap: '1rem' }}>
        <label><input type="radio" name="mode" value="txt2img" checked={mode==='txt2img'} onChange={() => setMode('txt2img')} disabled={loading}/> Text to Image</label>
        <label><input type="radio" name="mode" value="img2img" checked={mode==='img2img'} onChange={() => setMode('img2img')} disabled={loading}/> Image to Image</label>
      </div>
      
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
        {mode === 'img2img' && (
          <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', alignItems: 'center', justifyContent: 'center' }}>
            <input type="file" accept="image/*" onChange={(e) => onSelectFile(e.target.files && e.target.files[0])} disabled={loading} />
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <input type="checkbox" checked={lockAspect} onChange={(e) => setLockAspect(e.target.checked)} disabled={loading} /> Lock aspect ratio
            </label>
            <label>W: <input type="number" min="1" value={width} onChange={(e)=>onWidthChange(e.target.value)} disabled={loading} style={{ width: 90 }}/></label>
            <label>H: <input type="number" min="1" value={height} onChange={(e)=>onHeightChange(e.target.value)} disabled={loading} style={{ width: 90 }}/></label>
            <label>Denoise: <input type="number" min="0" max="1" step="0.05" value={denoise} onChange={(e)=>setDenoise(Number(e.target.value))} disabled={loading} style={{ width: 80 }}/></label>
          </div>
        )}
      </form>
      
      {error && <p style={{ color: 'red' }}>Error: {error}</p>}
      
      {loading && <p>Generating image, please wait...</p>}

      {mode === 'img2img' && sourcePreview && (
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
          <div>
            <div style={{ margin: '0.5rem 0' }}>Source ({width}×{height})</div>
            <img src={sourcePreview} alt="Source" style={{ maxWidth: 256, height: 'auto' }} />
          </div>
          {image && !loading && (
            <div>
              <div style={{ margin: '0.5rem 0' }}>Result</div>
              <img src={image} width={Math.min(512, width)} alt="Generated Image" />
            </div>
          )}
        </div>
      )}

      {mode !== 'img2img' && image && !loading && (
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
