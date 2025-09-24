import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

// Función para validar token de Azure AD
async function validateAzureToken(token: string) {
  try {
    // Decodificar el token sin verificar (para obtener información básica)
    const decoded = jwt.decode(token, { complete: true });

    if (!decoded || !decoded.header || !decoded.payload) {
      throw new Error('Invalid token format');
    }

    // Verificar que sea de Azure AD
    const issuer = decoded.payload.iss;
    const audience = decoded.payload.aud;

    if (!issuer.includes('login.microsoftonline.com') && !issuer.includes('sts.windows.net')) {
      throw new Error('Token not from Azure AD');
    }

    // Verificar audience (tu app registration)
    const expectedAudience = process.env.AZURE_AD_CLIENT_ID || 'your-client-id';
    if (audience !== expectedAudience && !decoded.payload.aud.includes(expectedAudience)) {
      throw new Error('Invalid audience');
    }

    // Verificar expiración
    const now = Math.floor(Date.now() / 1000);
    if (decoded.payload.exp < now) {
      throw new Error('Token expired');
    }

    return {
      userId: decoded.payload.oid || decoded.payload.sub,
      email: decoded.payload.preferred_username || decoded.payload.upn || decoded.payload.email,
      name: decoded.payload.name,
      tenantId: decoded.payload.tid,
    };
  } catch (error) {
    console.error('Token validation error:', error);
    throw error;
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get the authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);

    // Validate Azure AD token
    const tokenInfo = await validateAzureToken(token);

    // Here you could call Microsoft Graph API to get additional user info
    // const graphResponse = await fetch(`https://graph.microsoft.com/v1.0/me`, {
    //   headers: { 'Authorization': `Bearer ${token}` }
    // });
    // const graphData = await graphResponse.json();

    // Mock organization and role data (replace with real database lookup)
    const organization = {
      id: tokenInfo.tenantId,
      name: 'ECONEURA Organization',
    };

    const role = {
      id: 'user-role',
      name: 'User',
    };

    const permissions = ['read:own', 'write:own']; // Basic permissions

    return NextResponse.json({
      user: {
        id: tokenInfo.userId,
        email: tokenInfo.email,
        name: tokenInfo.name,
      },
      organization,
      role,
      permissions,
    });
  } catch (error) {
    console.error('Error in /api/me:', error);
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }
}