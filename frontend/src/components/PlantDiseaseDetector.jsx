import React, { useEffect, useRef, useState } from 'react';
import { 
  Sparkles, 
  UploadCloud, 
  Image as ImageIcon, 
  CheckCircle2, 
  ShieldAlert, 
  Leaf, 
  RefreshCw,
  Activity,
  Layers,
  MessageCircle,
  Send,
  Trash2
} from 'lucide-react';
import { translations, CROPS, getCropDisplay } from '../translations';
import { api } from '../services/api';

function renderMarkdownInline(text, keyPrefix) {
  const tokens = text.split(/(\*\*[^*]+\*\*|__[^_]+__|\*[^*]+\*|_[^_]+_|`[^`]+`)/g);
  return tokens.map((token, index) => {
    const key = `${keyPrefix}-${index}`;
    if ((token.startsWith('**') && token.endsWith('**')) || (token.startsWith('__') && token.endsWith('__'))) {
      return <strong key={key}>{token.slice(2, -2)}</strong>;
    }
    if ((token.startsWith('*') && token.endsWith('*')) || (token.startsWith('_') && token.endsWith('_'))) {
      return <em key={key}>{token.slice(1, -1)}</em>;
    }
    if (token.startsWith('`') && token.endsWith('`')) {
      return <code key={key}>{token.slice(1, -1)}</code>;
    }
    return token;
  });
}

function renderAssistantMarkdown(markdown) {
  const lines = markdown.split(/\r?\n/);
  const blocks = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index].trim();
    if (!line) {
      index += 1;
      continue;
    }

    const heading = line.match(/^(#{1,6})\s+(.+)$/);
    if (heading) {
      const Tag = heading[1].length <= 2 ? 'h3' : 'h4';
      blocks.push(<Tag key={`heading-${index}`}>{renderMarkdownInline(heading[2], `heading-${index}`)}</Tag>);
      index += 1;
      continue;
    }

    const listItem = line.match(/^([-*+]|\d+[.)])\s+(.+)$/);
    if (listItem) {
      const ordered = /^\d/.test(listItem[1]);
      const items = [];
      while (index < lines.length) {
        const match = lines[index].trim().match(/^([-*+]|\d+[.)])\s+(.+)$/);
        if (!match || /^\d/.test(match[1]) !== ordered) break;
        items.push(<li key={`item-${index}`}>{renderMarkdownInline(match[2], `item-${index}`)}</li>);
        index += 1;
      }
      const List = ordered ? 'ol' : 'ul';
      blocks.push(<List key={`list-${index}`}>{items}</List>);
      continue;
    }

    const paragraph = [line];
    index += 1;
    while (index < lines.length && lines[index].trim() &&
      !/^(#{1,6})\s+/.test(lines[index].trim()) &&
      !/^([-*+]|\d+[.)])\s+/.test(lines[index].trim())) {
      paragraph.push(lines[index].trim());
      index += 1;
    }
    blocks.push(<p key={`paragraph-${index}`}>{renderMarkdownInline(paragraph.join(' '), `paragraph-${index}`)}</p>);
  }

  return blocks;
}

export default function PlantDiseaseDetector({ lang = 'en', showToast }) {
  const t = (key) => translations[lang]?.[key] || key;

  const [selectedFile, setSelectedFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [cropType, setCropType] = useState('Paddy');
  const [acres, setAcres] = useState(1);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatQuestion, setChatQuestion] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState('');

  const fileInputRef = useRef(null);
  const chatEndRef = useRef(null);
  const chatSessionRef = useRef(0);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [chatMessages, chatLoading]);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = (file) => {
    chatSessionRef.current += 1;
    setChatMessages([]);
    setChatQuestion('');
    setChatError('');
    setChatLoading(false);
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

    setLoading(true);
    setResult(null);

    try {
      const data = await api.predictDisease(selectedFile, { crop_type: cropType, acres, lang });
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

  const handleChatSubmit = async (event) => {
    event.preventDefault();
    const question = chatQuestion.trim();
    if (!question || chatLoading) return;

    setChatQuestion('');
    setChatError('');
    setChatMessages((messages) => [...messages, { role: 'user', content: question }]);
    setChatLoading(true);
    const chatSession = chatSessionRef.current;
    try {
      const response = await api.chatWithDiseaseExpert({
        question,
        messages: chatMessages.slice(-10).map(({ role, content }) => ({ role, content: content.slice(0, 2000) })),
        diagnosis: result,
        crop_type: cropType,
        lang
      });
      if (chatSession === chatSessionRef.current) {
        setChatMessages((messages) => [...messages, { role: 'assistant', content: response.answer }]);
      }
    } catch (error) {
      if (chatSession === chatSessionRef.current) setChatError(error.message);
    } finally {
      if (chatSession === chatSessionRef.current) setChatLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '950px', margin: '0 auto' }}>
      
      {/* Hero Header */}
      <div style={{ background: '#ffffff', borderRadius: '20px', padding: '24px', border: '1px solid #e2e8f0', marginBottom: '24px', boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
          <div style={{ background: '#dcfce7', padding: '10px', borderRadius: '12px' }}>
            <Sparkles size={28} color="#15803d" />
          </div>
          <div>
            <h2 style={{ fontSize: '22px', fontWeight: '800', color: '#0f172a' }}>
              {t('disease_title')} – {lang === 'te' ? "CNN + LLM చిత్ర విశ్లేషణ" : "CNN + LLM Image Analysis"}
            </h2>
            <p style={{ fontSize: '13px', color: '#64748b' }}>
              {t('disease_sub')}
            </p>
          </div>
        </div>

        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginTop: '10px', background: '#f0fdf4', padding: '6px 14px', borderRadius: '20px', fontSize: '12px', color: '#166534', fontWeight: '700', border: '1px solid #bbf7d0' }}>
          <Layers size={14} />
          {t('disease_supported_crops')}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '24px' }}>
        
        {/* Upload and crop details */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <UploadCloud size={20} color="#16a34a" />
              <span>{lang === 'te' ? "ఆకు ఫోటో అప్‌లోడ్" : "Upload Leaf Photo"}</span>
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
                    style={{ maxHeight: '180px', maxWidth: '100%', borderRadius: '12px', objectFit: 'contain' }} 
                  />
                  <span style={{ fontSize: '12px', color: '#166534', fontWeight: '700' }}>
                    {selectedFile?.name || 'leaf_image.jpg'} (Click to change)
                  </span>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                  <ImageIcon size={44} color="#16a34a" />
                  <h4 style={{ fontSize: '15px', fontWeight: '800', color: '#0f172a' }}>{t('disease_upload_box')}</h4>
                  <p style={{ fontSize: '12px', color: '#64748b' }}>{t('disease_upload_hint')}</p>
                </div>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '16px' }}>
              <div className="form-group">
                <label className="form-label">{t('lbl_crop_type')}</label>
                <select className="form-select" value={cropType} onChange={(event) => setCropType(event.target.value)}>
                  {CROPS.map((crop) => <option key={crop.value} value={crop.value}>{crop.icon} {t(crop.labelKey)}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">{t('lbl_acres')}</label>
                <input className="form-input" type="number" min="0.1" step="0.1" required value={acres} onChange={(event) => setAcres(Number(event.target.value))} />
              </div>
            </div>

            <button 
              className="btn-primary" 
              style={{ width: '100%', marginTop: '20px', padding: '14px', justifyContent: 'center', fontSize: '15px' }}
              onClick={handleDiagnose}
              disabled={loading || !selectedFile}
            >
              {loading ? (
                <>
                  <RefreshCw size={18} style={{ animation: 'spin 1.5s linear infinite' }} />
                  {lang === 'te' ? "CNN + LLM చిత్రాన్ని విశ్లేషిస్తున్నాయి..." : "CNN + LLM analyzing the crop image..."}
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

        {/* Diagnosis & ICAR Treatment Report */}
        <div>
          {result ? (
            <div className="disease-result-card">
              
              <div className="disease-result-header">
                <div>
                  <span style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em', opacity: 0.9 }}>
                    {t('disease_detected_crop')}: {getCropDisplay(result.crop, lang)} · {result.acres} {lang === 'te' ? 'ఎకరాలు' : 'acres'}
                  </span>
                  <h3 style={{ fontSize: '20px', fontWeight: '800', marginTop: '4px' }}>
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

              <div className="treatment-section">
                {(lang !== 'te' || !result.recommendation) && <>
                <div className="treatment-box">
                  <h5>
                    <Activity size={16} color="#16a34a" />
                    {t('disease_symptoms')}
                  </h5>
                  <p style={{ fontSize: '13px', color: '#334155', lineHeight: 1.6 }}>
                    {result.symptoms}
                  </p>
                </div>

                <div className="treatment-box alert">
                  <h5>
                    <ShieldAlert size={16} color="#d97706" />
                    {t('disease_precautions')}
                  </h5>
                  <p style={{ fontSize: '13px', color: '#78350f', lineHeight: 1.6 }}>
                    {result.precautions}
                  </p>
                </div>

                <div className="treatment-box" style={{ background: '#f0fdf4', borderLeftColor: '#15803d' }}>
                  <h5 style={{ color: '#14532d' }}>
                    <CheckCircle2 size={16} color="#16a34a" />
                    {t('disease_treatment')}
                  </h5>
                  <p style={{ fontSize: '13px', color: '#166534', lineHeight: 1.6, fontWeight: '600' }}>
                    {result.treatment_pesticide_information}
                  </p>
                </div>
                </>}

                <div className="treatment-box">
                  <h5><Sparkles size={16} color="#16a34a" />{lang === 'te' ? 'రైతుకు సులభమైన వివరణ' : 'Farmer-friendly guidance'}</h5>
                  <p style={{ fontSize: '13px', color: '#334155', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                    {result.recommendation || (lang === 'te'
                      ? 'OpenAI వివరణ అందుబాటులో లేదు. పై చికిత్స సమాచారం సాధారణ మార్గదర్శకం మాత్రమే. ధృవీకరించిన లేబుల్ రేటు అందుబాటులో లేదు కాబట్టి ఎకరాల ఆధారంగా రసాయన పరిమాణాన్ని లెక్కించలేము.'
                      : 'OpenAI explanation is unavailable. The treatment information above is general guidance. No verified label rate is available, so a chemical quantity cannot be calculated from acreage.')}
                  </p>
                  <small style={{ color: '#64748b' }}>{lang === 'te' ? 'ఉత్పత్తి లేబుల్ మరియు స్థానిక వ్యవసాయ అధికారుల సూచనలను అనుసరించండి.' : 'Always follow the product label and local agricultural guidance.'}</small>
                </div>

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
                  : "Upload a crop leaf photo, choose the crop and enter its area to get an AI diagnosis."}
              </p>
            </div>
          )}
        </div>

      </div>

      <section className="disease-chat card" aria-labelledby="disease-chat-title">
        <div className="card-header disease-chat-header">
          <div className="card-title">
            <MessageCircle size={20} color="#15803d" />
            <span id="disease-chat-title">{lang === 'te' ? 'వ్యవసాయ AI సహాయకుడు' : 'Ask the Crop Health Assistant'}</span>
          </div>
          <button
            type="button"
            className="disease-chat-clear"
            onClick={() => { setChatMessages([]); setChatError(''); }}
            disabled={!chatMessages.length || chatLoading}
            title={lang === 'te' ? 'సంభాషణను క్లియర్ చేయండి' : 'Clear conversation'}
          >
            <Trash2 size={15} />
            {lang === 'te' ? 'క్లియర్' : 'Clear'}
          </button>
        </div>

        <div className="disease-chat-messages" aria-live="polite">
          {!chatMessages.length && (
            <div className="disease-chat-empty">
              <p>{lang === 'te'
                ? 'పంట ఆరోగ్యం, లక్షణాలు, నివారణ లేదా పొలం నిర్వహణ గురించి అడగండి.'
                : 'Ask about crop health, symptoms, prevention, or practical farm management.'}</p>
              <div className="disease-chat-prompts">
                {(lang === 'te'
                  ? ['ఈ వ్యాధి మరింత వ్యాపించకుండా ఎలా ఆపాలి?', 'పంటకు ఏ జాగ్రత్తలు తీసుకోవాలి?']
                  : ['How can I prevent this disease from spreading?', 'What symptoms should I monitor next?']
                ).map((prompt) => (
                  <button key={prompt} type="button" onClick={() => setChatQuestion(prompt)}>{prompt}</button>
                ))}
              </div>
            </div>
          )}
          {chatMessages.map((message, index) => (
            <div key={`${message.role}-${index}`} className={`disease-chat-message ${message.role}`}>
              <span className="disease-chat-message-label">{message.role === 'user' ? (lang === 'te' ? 'మీరు' : 'You') : (lang === 'te' ? 'వ్యవసాయ సహాయకుడు' : 'Crop assistant')}</span>
              {message.role === 'assistant' ? renderAssistantMarkdown(message.content) : <p>{message.content}</p>}
            </div>
          ))}
          {chatLoading && <div className="disease-chat-thinking">{lang === 'te' ? 'సమాధానం సిద్ధం చేస్తోంది...' : 'Thinking through your question...'}</div>}
          <div ref={chatEndRef} />
        </div>

        {chatError && <p className="disease-chat-error" role="alert">{chatError}</p>}

        <form className="disease-chat-form" onSubmit={handleChatSubmit}>
          <textarea
            value={chatQuestion}
            onChange={(event) => setChatQuestion(event.target.value)}
            placeholder={lang === 'te' ? 'మీ ప్రశ్నను ఇక్కడ టైప్ చేయండి...' : 'Ask a question about your crop...'}
            aria-label={lang === 'te' ? 'మీ ప్రశ్న' : 'Your question'}
            maxLength={1200}
            rows={2}
            disabled={chatLoading}
          />
          <button className="btn-primary" type="submit" disabled={chatLoading || !chatQuestion.trim()}>
            <Send size={16} />
            {lang === 'te' ? 'పంపండి' : 'Ask'}
          </button>
        </form>
        <p className="disease-chat-disclaimer">{lang === 'te'
          ? 'AI సమాధానాలు తప్పుగా ఉండవచ్చు. పురుగుమందుల కోసం ఉత్పత్తి లేబుల్ మరియు స్థానిక వ్యవసాయ అధికారుల సూచనలను అనుసరించండి.'
          : 'AI answers can be wrong. Verify pesticide use against the product label and advice from a local agricultural officer.'}</p>
      </section>

    </div>
  );
}
