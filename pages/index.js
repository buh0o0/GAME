// pages/index.js - Página principal
import { useState } from 'react';
import dynamic from 'next/dynamic';
import Head from 'next/head';

// Importar WorldIDWidget dinámicamente para evitar problemas de SSR
const WorldIDWidget = dynamic(
  () => import('@worldcoin/idkit').then((mod) => mod.WorldIDWidget),
  { ssr: false }
);

export default function Home() {
  const [isVerified, setIsVerified] = useState(false);
  const [verificationData, setVerificationData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Configuración de World ID
  const app_id = process.env.NEXT_PUBLIC_WORLDCOIN_APP_ID || 'app_staging_your_app_id_here';
  const action = 'verify-human';

  // Función que se ejecuta cuando la verificación es exitosa
  const onSuccess = async (verificationResponse) => {
    console.log('Verificación exitosa:', verificationResponse);
    setLoading(true);
    setError('');

    try {
      // Enviar la verificación al backend para validar
      const response = await fetch('/api/verify-worldid', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          merkle_root: verificationResponse.merkle_root,
          nullifier_hash: verificationResponse.nullifier_hash,
          proof: verificationResponse.proof,
          verification_level: verificationResponse.verification_level,
          action: action,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        setIsVerified(true);
        setVerificationData(result);
        console.log('Verificación confirmada en el servidor:', result);
      } else {
        setError('Error en la verificación: ' + result.message);
      }
    } catch (err) {
      console.error('Error:', err);
      setError('Error de conexión. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  // Función que se ejecuta si hay error en la verificación
  const onError = (errorResponse) => {
    console.error('Error en verificación:', errorResponse);
    setError('Error en la verificación de World ID');
    setLoading(false);
  };

  // Resetear verificación
  const resetVerification = () => {
    setIsVerified(false);
    setVerificationData(null);
    setError('');
  };

  return (
    <>
      <Head>
        <title>Verificación World ID</title>
        <meta name="description" content="Aplicación de verificación humana con World ID" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="container">
        <header className="header">
          <h1>🌍 Verificación World ID</h1>
          <p>Demuestra que eres un humano real usando World ID de Worldcoin</p>
        </header>

        <main className="main">
          {!isVerified ? (
            <div className="verification-section">
              <div className="info-card">
                <h2>¿Qué es World ID?</h2>
                <p>
                  World ID es un protocolo de verificación de identidad que permite 
                  demostrar que eres un humano único sin revelar información personal.
                </p>
                <ul>
                  <li>✅ Verificación biométrica segura</li>
                  <li>✅ Preserva tu privacidad</li>
                  <li>✅ Una identidad por persona</li>
                  <li>✅ Resistente a bots y cuentas falsas</li>
                </ul>
              </div>

              {error && (
                <div className="error-message">
                  <p>❌ {error}</p>
                  <button onClick={() => setError('')}>Cerrar</button>
                </div>
              )}

              <div className="widget-container">
                <h3>Verificar tu identidad</h3>
                <p>Haz clic en el botón para abrir la aplicación World ID:</p>
                
                <WorldIDWidget
                  app_id={app_id}
                  action={action}
                  onSuccess={onSuccess}
                  onError={onError}
                  signal="user_verification_request"
                  enableTelemetry={true}
                >
                  {({ open }) => (
                    <button 
                      className="verify-button"
                      onClick={open}
                      disabled={loading}
                    >
                      {loading ? '🔄 Verificando...' : '🔐 Verificar con World ID'}
                    </button>
                  )}
                </WorldIDWidget>
              </div>
            </div>
          ) : (
            <div className="success-section">
              <div className="success-card">
                <h2>✅ ¡Verificación Exitosa!</h2>
                <p>Tu identidad humana ha sido confirmada exitosamente.</p>
                
                <div className="verification-details">
                  <h3>Detalles de la verificación:</h3>
                  <div className="detail-item">
                    <strong>ID de verificación:</strong>
                    <code>{verificationData?.verification_id}</code>
                  </div>
                  <div className="detail-item">
                    <strong>Timestamp:</strong>
                    <code>{new Date(verificationData?.timestamp).toLocaleString()}</code>
                  </div>
                  <div className="detail-item">
                    <strong>Nivel de verificación:</strong>
                    <span className="verification-level">
                      {verificationData?.verification_level === 'orb' ? '🔵 Orb' : '📱 Device'}
                    </span>
                  </div>
                </div>

                <div className="actions">
                  <button 
                    className="reset-button"
                    onClick={resetVerification}
                  >
                    🔄 Nueva Verificación
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>

        <footer className="footer">
          <p>
            Desarrollado con{' '}
            <a href="https://nextjs.org" target="_blank" rel="noopener noreferrer">
              Next.js
            </a>{' '}
            y{' '}
            <a href="https://worldcoin.org" target="_blank" rel="noopener noreferrer">
              World ID
            </a>
          </p>
        </footer>

        <style jsx>{`
          .container {
            min-height: 100vh;
            padding: 2rem;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            display: flex;
            flex-direction: column;
          }

          .header {
            text-align: center;
            margin-bottom: 3rem;
            color: white;
          }

          .header h1 {
            font-size: 3rem;
            margin-bottom: 1rem;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
          }

          .header p {
            font-size: 1.2rem;
            opacity: 0.9;
          }

          .main {
            flex: 1;
            max-width: 800px;
            margin: 0 auto;
            width: 100%;
          }

          .verification-section,
          .success-section {
            display: flex;
            flex-direction: column;
            gap: 2rem;
          }

          .info-card,
          .success-card {
            background: white;
            border-radius: 15px;
            padding: 2rem;
            box-shadow: 0 10px 30px rgba(0,0,0,0.2);
          }

          .info-card h2,
          .success-card h2 {
            color: #333;
            margin-bottom: 1rem;
          }

          .info-card ul {
            list-style: none;
            padding: 0;
            margin: 1rem 0;
          }

          .info-card li {
            padding: 0.5rem 0;
            color: #555;
          }

          .widget-container {
            background: white;
            border-radius: 15px;
            padding: 2rem;
            text-align: center;
            box-shadow: 0 10px 30px rgba(0,0,0,0.2);
          }

          .widget-container h3 {
            color: #333;
            margin-bottom: 1rem;
          }

          .verify-button {
            background: linear-gradient(45deg, #f093fb 0%, #f5576c 100%);
            border: none;
            border-radius: 50px;
            padding: 1rem 2rem;
            font-size: 1.1rem;
            color: white;
            cursor: pointer;
            transition: all 0.3s ease;
            font-weight: bold;
            box-shadow: 0 5px 15px rgba(240, 147, 251, 0.4);
          }

          .verify-button:hover:not(:disabled) {
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(240, 147, 251, 0.6);
          }

          .verify-button:disabled {
            opacity: 0.7;
            cursor: not-allowed;
          }

          .error-message {
            background: #ffebee;
            border: 1px solid #f44336;
            border-radius: 10px;
            padding: 1rem;
            color: #d32f2f;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }

          .error-message button {
            background: #f44336;
            color: white;
            border: none;
            border-radius: 5px;
            padding: 0.5rem 1rem;
            cursor: pointer;
          }

          .verification-details {
            margin: 1.5rem 0;
            padding: 1rem;
            background: #f8f9fa;
            border-radius: 10px;
          }

          .detail-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin: 0.5rem 0;
            padding: 0.5rem;
          }

          .detail-item code {
            background: #e9ecef;
            padding: 0.2rem 0.5rem;
            border-radius: 3px;
            font-family: monospace;
            font-size: 0.9rem;
          }

          .verification-level {
            font-weight: bold;
            color: #007bff;
          }

          .actions {
            text-align: center;
            margin-top: 2rem;
          }

          .reset-button {
            background: #6c757d;
            color: white;
            border: none;
            border-radius: 25px;
            padding: 0.75rem 1.5rem;
            cursor: pointer;
            font-size: 1rem;
            transition: background 0.3s ease;
          }

          .reset-button:hover {
            background: #545b62;
          }

          .footer {
            text-align: center;
            margin-top: 3rem;
            padding: 2rem;
            color: white;
            opacity: 0.8;
          }

          .footer a {
            color: #ffd700;
            text-decoration: none;
          }

          .footer a:hover {
            text-decoration: underline;
          }

          @media (max-width: 768px) {
            .container {
              padding: 1rem;
            }
            
            .header h1 {
              font-size: 2rem;
            }
            
            .info-card,
            .widget-container,
            .success-card {
              padding: 1.5rem;
            }
          }
        `}</style>
      </div>
    </>
  );
}