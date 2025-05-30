import React, { useState, useEffect } from 'react';
import { useScopedI18n } from '@/locales/client';

const PROVIDERS = [
  { value: 'gemini', label: 'Google Gemini' },
  { value: 'openai', label: 'OpenAI ChatGPT' },
];

export default function ApiKeyConfigModal({ onSave, onCancel }: { onSave?: (data: { provider: string; apiKey: string }) => void; onCancel?: () => void }) {
  const [provider, setProvider] = useState<string>('gemini');
  const [apiKey, setApiKey] = useState<string>('');
  const [error, setError] = useState<string>('');
  const tai = useScopedI18n('aiConfig');

  // Funciones de codificación Base64 (NO es encriptación)
  const encodeApiKey = (key: string): string => btoa(key);
  const decodeApiKey = (encoded: string): string => {
    try {
      return atob(encoded);
    } catch {
      return encoded; // Si no está codificado en Base64
    }
  };

  // Cargar valores guardados
  useEffect(() => {
    const savedProvider = localStorage.getItem('aiProvider');
    const savedEncodedKey = localStorage.getItem('aiApiKey');
    
    if (savedProvider) setProvider(savedProvider);
    if (savedEncodedKey) {
      const decodedKey = decodeApiKey(savedEncodedKey);
      setApiKey(decodedKey);
    }
  }, []);

  // Validar API Key
  const validateApiKey = (key: string, providerType: string): string | null => {
    if (!key.trim()) {
      return tai('errorApiKeyEmpty');
    }
    if (providerType === 'openai' && !key.startsWith('sk-')) {
      return tai('errorOpenAIPrefix');
    }
    if (key.length < 10) {
      return tai('errorApiKeyTooShort');
    }
    return null;
  };

  // Obtener enlace de ayuda
  const getHelpLink = () => {
    return provider === 'gemini' 
      ? 'https://makersuite.google.com/app/apikey'
      : 'https://platform.openai.com/api-keys';
  };

  // Obtener título dinámico
  const getTitle = () => {
    return provider === 'gemini' 
      ? tai('configureApiKeyTitleGemini')
      : tai('configureApiKeyTitleOpenAI');
  };

  const handleSave = () => {
    setError('');
    const validationError = validateApiKey(apiKey, provider);
    if (validationError) {
      setError(validationError);
      return;
    }
    // Codificar en Base64 y guardar (NO es encriptación)
    const encodedKey = encodeApiKey(apiKey);
    localStorage.setItem('aiProvider', provider);
    localStorage.setItem('aiApiKey', encodedKey);
    if (onSave) onSave({ provider, apiKey });
  };

  const handleDeleteApiKey = () => {
    const savedEncodedKey = localStorage.getItem('aiApiKey');
    if (!savedEncodedKey) {
      alert(tai('apiKeyEmptyTitle'));
      return;
    }
    localStorage.removeItem('aiApiKey');
    localStorage.removeItem('aiProvider');
    setApiKey('');
    setProvider('gemini');
    setError('');
    alert(tai('apiKeyDeletedTitle'));
    if (onSave) onSave({ provider: 'gemini', apiKey: '' });
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        {/* Título dinámico */}
        <h2 style={styles.title}>
          {getTitle()}
        </h2>
        {/* Selector de proveedor */}
        <div style={styles.providerSection}>
          <label style={styles.providerLabel}>{tai('providerLabel')}</label>
          <select 
            value={provider} 
            onChange={e => setProvider(e.target.value)}
            style={styles.select}
          >
            <option value="gemini">{tai('providerGemini')}</option>
            <option value="openai">{tai('providerOpenAI')}</option>
          </select>
        </div>
        {/* Instrucciones */}
        <p style={styles.description}>
          {provider === 'gemini' ? tai('configureApiKeyDescriptionGemini') : tai('configureApiKeyDescriptionOpenAI')}
        </p>
        <p style={styles.responsibility}>
          {tai('responsibilityNote')}
        </p>
        {/* Input de API Key */}
        <div style={styles.inputSection}>
          <label style={styles.inputLabel}>
            {provider === 'gemini' ? tai('apiKeyLabelGemini') : tai('apiKeyLabelOpenAI')}
          </label>
          <input
            type="password"
            value={apiKey}
            onChange={e => {
              setApiKey(e.target.value);
              setError(''); // Limpiar error al escribir
            }}
            placeholder={tai('apiKeyPlaceholder')}
            style={styles.input}
          />
          {/* Enlace de ayuda */}
          <div style={styles.helpSection}>
            💡 <a 
              href={getHelpLink()} 
              target="_blank" 
              rel="noopener noreferrer"
              style={styles.helpLink}
            >
              {tai('helpLinkText')}
            </a>
          </div>
        </div>
        {/* Error */}
        {error && (
          <div style={styles.error}>
            ⚠️ {error}
          </div>
        )}
        {/* Aviso de seguridad */}
        <div style={styles.securityNote}>
          {tai('securityNote')}
        </div>
        {/* Botones */}
        <div style={styles.buttonContainer}>
          <button onClick={onCancel} style={styles.cancelButton}>
            {tai('cancelButton')}
          </button>
          <button onClick={handleSave} style={styles.saveButton}>
            {tai('saveKeyButton')}
          </button>
          <button onClick={handleDeleteApiKey} style={{...styles.saveButton, backgroundColor: '#ff0033', color: '#fff', marginLeft: 8}}>
            {tai('deleteApiKeyButton')}
          </button>
        </div>
      </div>
    </div>
  );
}

// Estilos manteniendo tu tema hacker
const styles = {
  overlay: {
    position: 'fixed' as 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  modal: {
    backgroundColor: '#000',
    color: '#00ff00',
    padding: '20px',
    borderRadius: '8px',
    border: '2px solid #00ff00',
    width: '90%',
    maxWidth: '500px',
    fontFamily: 'monospace',
  },
  title: {
    color: '#00ff00',
    fontSize: '18px',
    fontWeight: 'bold',
    marginBottom: '15px',
    textAlign: 'left' as 'left',
  },
  providerSection: {
    marginBottom: '15px',
  },
  providerLabel: {
    color: '#00ff00',
    fontSize: '14px',
    display: 'block',
    marginBottom: '5px',
  },
  select: {
    width: '100%',
    padding: '8px',
    backgroundColor: '#000',
    color: '#00ff00',
    border: '1px solid #00ff00',
    borderRadius: '4px',
    fontFamily: 'monospace',
    fontSize: '14px',
  },
  description: {
    color: '#00ff00',
    fontSize: '12px',
    lineHeight: '1.4',
    marginBottom: '10px',
  },
  responsibility: {
    color: '#00ff00',
    fontSize: '12px',
    marginBottom: '15px',
    fontWeight: 'bold',
  },
  inputSection: {
    marginBottom: '15px',
  },
  inputLabel: {
    color: '#00ff00',
    fontSize: '14px',
    display: 'block',
    marginBottom: '5px',
  },
  input: {
    width: '100%',
    padding: '10px',
    backgroundColor: '#000',
    color: '#00ff00',
    border: '1px solid #00ff00',
    borderRadius: '4px',
    fontFamily: 'monospace',
    fontSize: '14px',
    marginBottom: '8px',
    boxSizing: 'border-box' as 'border-box',
  },
  helpSection: {
    fontSize: '12px',
    color: '#00ff00',
  },
  helpLink: {
    color: '#00ff00',
    textDecoration: 'underline',
  },
  error: {
    backgroundColor: 'rgba(255, 0, 0, 0.2)',
    border: '1px solid #ff0000',
    color: '#ff0000',
    padding: '8px',
    borderRadius: '4px',
    marginBottom: '10px',
    fontSize: '12px',
    fontFamily: 'monospace',
  },
  securityNote: {
    fontSize: '11px',
    color: '#00ff00',
    opacity: 0.8,
    marginBottom: '15px',
    textAlign: 'center' as 'center',
  },
  buttonContainer: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '10px',
  },
  cancelButton: {
    padding: '8px 15px',
    backgroundColor: 'transparent',
    color: '#00ff00',
    border: '1px solid #00ff00',
    borderRadius: '4px',
    cursor: 'pointer',
    fontFamily: 'monospace',
    fontSize: '14px',
  },
  saveButton: {
    padding: '8px 15px',
    backgroundColor: '#00ff00',
    color: '#000',
    border: '1px solid #00ff00',
    borderRadius: '4px',
    cursor: 'pointer',
    fontFamily: 'monospace',
    fontSize: '14px',
    fontWeight: 'bold',
  },
}; 