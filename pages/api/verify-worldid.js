// pages/api/verify-worldid.js - API endpoint para verificar World ID
import crypto from 'crypto';

export default async function handler(req, res) {
  // Solo permitir método POST
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      message: 'Método no permitido. Use POST.' 
    });
  }

  try {
    const {
      merkle_root,
      nullifier_hash,
      proof,
      verification_level,
      action
    } = req.body;

    // Validar que todos los campos requeridos estén presentes
    if (!merkle_root || !nullifier_hash || !proof || !verification_level || !action) {
      return res.status(400).json({
        success: false,
        message: 'Faltan campos requeridos para la verificación'
      });
    }

    // Configuración de World ID
    const app_id = process.env.WORLDCOIN_APP_ID || 'app_staging_your_app_id_here';
    const worldid_api_url = 'https://developer.worldcoin.org/api/v1/verify';

    console.log('🔍 Iniciando verificación World ID...');
    console.log('App ID:', app_id);
    console.log('Action:', action);
    console.log('Verification Level:', verification_level);

    // Preparar datos para enviar a la API de World ID
    const verificationData = {
      nullifier_hash,
      merkle_root,
      proof,
      verification_level,
      action: action
    };

    // Realizar verificación con la API de World ID
    const worldidResponse = await fetch(worldid_api_url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.WORLDCOIN_API_KEY}`
      },
      body: JSON.stringify({
        app_id: app_id,
        ...verificationData
      })
    });

    const worldidResult = await worldidResponse.json();

    console.log('📡 Respuesta de World ID API:', worldidResult);

    if (worldidResponse.ok && worldidResult.success) {
      // Verificación exitosa
      console.log('✅ Verificación exitosa');

      // Aquí puedes guardar la verificación en tu base de datos
      const verificationRecord = {
        verification_id: generateVerificationId(),
        nullifier_hash: nullifier_hash, // Hash único por persona y acción
        timestamp: new Date().toISOString(),
        verification_level: verification_level,
        action: action,
        app_id: app_id,
        verified: true
      };

      // En una aplicación real, guardarías esto en una base de datos
      console.log('💾 Registro de verificación:', verificationRecord);

      return res.status(200).json({
        success: true,
        message: 'Verificación exitosa',
        verification_id: verificationRecord.verification_id,
        timestamp: verificationRecord.timestamp,
        verification_level: verification_level,
        data: {
          verified: true,
          unique_human: true,
          nullifier_hash: nullifier_hash.substring(0, 10) + '...', // Solo mostrar parte del hash
        }
      });

    } else {
      // Error en la verificación
      console.log('❌ Error en verificación:', worldidResult);
      
      return res.status(400).json({
        success: false,
        message: worldidResult.detail || 'Error en la verificación World ID',
        error_code: worldidResult.code || 'VERIFICATION_FAILED'
      });
    }

  } catch (error) {
    console.error('💥 Error en el servidor:', error);
    
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Error interno'
    });
  }
}

// Función auxiliar para generar ID de verificación
function generateVerificationId() {
  return 'wid_' + crypto.randomBytes(16).toString('hex');
}

// Función auxiliar para validar formato de hash (opcional)
function isValidHash(hash) {
  return /^0x[a-fA-F0-9]{64}$/.test(hash);
}

// Middleware de rate limiting simple (opcional)
const rateLimitMap = new Map();

function rateLimit(ip, limit = 10, windowMs = 60000) {
  const now = Date.now();
  const windowStart = now - windowMs;
  
  if (!rateLimitMap.has(ip)) {
    rateLimitMap.set(ip, []);
  }
  
  const requests = rateLimitMap.get(ip);
  const recentRequests = requests.filter(timestamp => timestamp > windowStart);
  
  if (recentRequests.length >= limit) {
    return false; // Rate limit exceeded
  }
  
  recentRequests.push(now);
  rateLimitMap.set(ip, recentRequests);
  return true;
}