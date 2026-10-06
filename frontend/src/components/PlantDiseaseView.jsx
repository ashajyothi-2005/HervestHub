import React, { useState, useRef } from 'react';
import { 
  Sparkles, 
  UploadCloud, 
  Image as ImageIcon, 
  AlertCircle, 
  CheckCircle2, 
  ShieldAlert, 
  Leaf, 
  RefreshCw,
  Info,
  Layers,
  Activity
} from 'lucide-react';
import { translations, getCropDisplay, CROPS } from '../translations';
import { api } from '../services/api';

export default function PlantDiseaseView({ lang = 'en', showToast }) {
  const t = (key) => translations[lang]?.[key] || key;

  const [selectedFile, setSelectedFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [selectedCrop, setSelectedCrop] = useState('');
  const [acres, setAcres] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = (file) => {
    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleDiagnose = async () => {
    if (!selectedFile) {
      showToast(lang === 'te' ? "దయచేసి ఆకు ఫోటోను ఎంచుకోండి" : "Please select or upload a leaf photo first", 'error');
      return;
    }
    if (!selectedCrop || !Number.isFinite(Number(acres)) || Number(acres) <= 0) {
      showToast(lang === 'te' ? 'పంటను ఎంచుకుని సరైన ఎకరాల విస్తీర్ణం నమోదు చేయండి' : 'Select a crop and enter a valid acreage greater than zero', 'error');
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const data = await api.predictDisease(selectedFile, {
        crop_type: selectedCrop,
        acres,
        lang
      });
      setResult(data);
      showToast(
        lang === 'te' 
          ? `నిర్ధారణ పూర్తయింది: ${data.disease}` 
          : `Diagnosis Complete: ${data.disease}`, 
        'success'
      );
    } catch (err) {
      console.error(err);
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Hero Header */}
      <div style={{ background: '#ffffff', borderRadius: '20px', padding: '24px', border: '1px solid #e2e8f0', marginBottom: '24px', boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
          <div style={{ background: '#dcfce7', padding: '8px', borderRadius: '10px' }}>
            <Sparkles size={24} color="#15803d" />
          </div>
          <div>
            <h2 style={{ fontSize: '22px', fontWeight: '800', color: '#0f172a' }}>
              {t('disease_title')}
            </h2>
            <p style={{ fontSize: '13px', color: '#64748b' }}>
              {t('disease_sub')}
            </p>
          </div>
        </div>

        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginTop: '12px', background: '#f0fdf4', padding: '6px 14px', borderRadius: '20px', fontSize: '12px', color: '#166534', fontWeight: '700', border: '1px solid #bbf7d0' }}>
          <Layers size={14} />
          {t('disease_supported_crops')}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '24px' }}>
        
        {/* Left: Upload and Test Sample Card */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <UploadCloud size={20} color="#16a34a" />
              <span>{lang === 'te' ? "ఆకు ఫోటో అప్‌లోడ్ / నమూనా ఎంపిక" : "Upload Leaf Photo or Select Sample"}</span>
            </div>
          </div>

          <div className="card-body">
            
            {/* Dropzone */}
            <div 
              className="disease-dropzone"
              onClick={() => fileInputRef.current?.click()}
            >
              <input 
                type="file" 
                ref={fileInputRef} 
                accept="image/*" 
                style={{ display: 'none' }}
                onChange={handleFileChange}
              />

              {imagePreview ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                  <img 
                    src={imagePreview} 
                    alt="Selected Leaf" 
                    style={{ maxHeight: '200px', maxWidth: '100%', borderRadius: '12px', objectFit: 'contain', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} 
                  />
                  <span style={{ fontSize: '12px', color: '#166534', fontWeight: '700' }}>
                    {selectedFile?.name || 'leaf_image.jpg'} (Click to change)
                  </span>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                  <ImageIcon size={48} color="#16a34a" />
                  <h4 style={{ fontSize: '15px', fontWeight: '800', color: '#0f172a' }}>{t('disease_upload_box')}</h4>
                  <p style={{ fontSize: '12px', color: '#64748b' }}>{t('disease_upload_hint')}</p>
                </div>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginTop: '16px' }}>
              <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px', fontWeight: '700', color: '#475569' }}>
                {lang === 'te' ? 'పంట రకం' : 'Crop type'}
                <select className="form-select" value={selectedCrop} onChange={(event) => setSelectedCrop(event.target.value)} required>
                  <option value="">{lang === 'te' ? 'పంటను ఎంచుకోండి' : 'Select crop'}</option>
                  {CROPS.map((crop) => (
                    <option key={crop.value} value={crop.value}>{t(crop.labelKey)}</option>
                  ))}
                </select>
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px', fontWeight: '700', color: '#475569' }}>
                {lang === 'te' ? 'పంట విస్తీర్ణం (ఎకరాలు)' : 'Crop area (acres)'}
                <input
                  className="form-input"
                  type="number"
                  min="0.01"
                  step="any"
                  value={acres}
                  onChange={(event) => setAcres(event.target.value)}
                  placeholder={lang === 'te' ? 'ఉదా. 2.5' : 'e.g. 2.5'}
                  required
                />
              </label>
            </div>

            {/* Diagnose Button */}
            <button 
              className="btn-primary" 
              style={{ width: '100%', marginTop: '20px', padding: '14px', justifyContent: 'center', fontSize: '15px' }}
              onClick={handleDiagnose}
              disabled={loading || !selectedFile}
            >
              {loading ? (
                <>
                  <RefreshCw size={18} style={{ animation: 'spin 1.5s linear infinite' }} />
                  {lang === 'te' ? "CNN మోడల్ విశ్లేషిస్తోంది..." : "CNN Deep Learning Model Analyzing..."}
                </>
              ) : (
                <>
                  <Sparkles size={18} />
                  {t('btn_diagnose')}
                </>
              )}
            </button>

          </div>
        </div>

        {/* Right: AI Diagnosis & ICAR Treatment Report Card */}
        <div>
          {result ? (
            <div className="disease-result-card">
              
              {/* Header */}
              <div className="disease-result-header">
                <div>
                  <span style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em', opacity: 0.9 }}>
                    {t('disease_detected_crop')}: {getCropDisplay(result.crop, lang)}
                  </span>
                  <h3 style={{ fontSize: '22px', fontWeight: '800', marginTop: '4px' }}>
                    {result.disease}
                  </h3>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '11px', opacity: 0.85 }}>{t('disease_confidence')}</div>
                  <div style={{ fontSize: '24px', fontWeight: '800', color: '#86efac' }}>
                    {result.confidence}%
                  </div>
                </div>
              </div>

              {/* Treatment and Symptoms Details */}
              <div className="treatment-section">
                
                {/* Symptoms Box */}
                <div className="treatment-box">
                  <h5>
                    <Activity size={16} color="#16a34a" />
                    {t('disease_symptoms')}
                  </h5>
                  <p style={{ fontSize: '13px', color: '#334155', lineHeight: 1.6 }}>
                    {result.symptoms}
                  </p>
                </div>

                {/* Precautions Box */}
                <div className="treatment-box alert">
                  <h5>
                    <ShieldAlert size={16} color="#d97706" />
                    {t('disease_precautions')}
                  </h5>
                  <p style={{ fontSize: '13px', color: '#78350f', lineHeight: 1.6 }}>
                    {result.precautions}
                  </p>
                </div>

                {/* Recommended Treatment & Pesticide Info */}
                <div className="treatment-box" style={{ background: '#f0fdf4', borderLeftColor: '#15803d' }}>
                  <h5 style={{ color: '#14532d' }}>
                    <CheckCircle2 size={16} color="#16a34a" />
                    {t('disease_treatment')}
                  </h5>
                  <p style={{ fontSize: '13px', color: '#166534', lineHeight: 1.6, fontWeight: '600' }}>
                    {result.treatment_pesticide_information}
                  </p>
                </div>

                {result.recommendation && (
                  <div className="treatment-box" style={{ background: '#eff6ff', borderLeftColor: '#2563eb' }}>
                    <h5 style={{ color: '#1e3a8a' }}>
                      <Sparkles size={16} color="#2563eb" />
                      {lang === 'te' ? 'AI సిఫార్సు' : 'AI Recommendation'}
                    </h5>
                    <p style={{ fontSize: '13px', color: '#1e3a8a', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
                      {result.recommendation}
                    </p>
                  </div>
                )}

              </div>

            </div>
          ) : (
            <div className="card" style={{ height: '100%', minHeight: '340px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '30px' }}>
              <Leaf size={48} color="#94a3b8" style={{ marginBottom: '14px' }} />
              <h4 style={{ fontSize: '16px', fontWeight: '700', color: '#334155' }}>
                {lang === 'te' ? "ఆకు ఫోటోను ఎంచుకుని AI విశ్లేషణను ప్రారంభించండి" : "Awaiting Crop Leaf Diagnosis"}
              </h4>
              <p style={{ fontSize: '13px', color: '#64748b', maxWidth: '340px', marginTop: '6px' }}>
                {lang === 'te'
                  ? "వరి, మిరప, పత్తి, చెరకు మరియు గోధుమ పంటల వ్యాధులు మరియు శాస్త్రీయ నివారణ సమాచారాన్ని పొందండి."
                  : "Upload a crop leaf photo, choose the crop and enter its area to run the diagnosis."}
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
