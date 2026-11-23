export interface TrustedDeviceQuickUnlock {
  userId: string;
  fullName: string;
  email: string;
  role: string;
  mode: 'Pin' | 'Pattern';
  hasBiometricCredential: boolean;
  credentialId?: string;
  deviceId?: string;
  deviceName?: string;
  deviceToken: string;
  savedAtIso: string;
}

const TRUSTED_DEVICE_STORAGE_KEY = 'crisync_trusted_device_unlock';

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlToBytes(base64Url: string): Uint8Array {
  let padded = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  while (padded.length % 4 !== 0) {
    padded += '=';
  }
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

export function detectCurrentDeviceName(): string {
  if (typeof navigator === 'undefined' || typeof window === 'undefined') {
    return 'Trusted Browser';
  }
  const ua = navigator.userAgent || '';
  let platformLabel = 'Desktop Browser';
  if (/android/i.test(ua)) {
    platformLabel = 'Android Phone';
  } else if (/iphone/i.test(ua)) {
    platformLabel = 'iPhone';
  } else if (/ipad/i.test(ua)) {
    platformLabel = 'iPad';
  } else if (/windows/i.test(ua)) {
    platformLabel = 'Windows PC';
  } else if (/macintosh|mac os/i.test(ua)) {
    platformLabel = 'Mac';
  } else if (/linux/i.test(ua)) {
    platformLabel = 'Linux Device';
  }
  return `${platformLabel} (${window.location.host})`;
}

export function loadTrustedDeviceUnlock(): TrustedDeviceQuickUnlock | null {
  try {
    const raw = localStorage.getItem(TRUSTED_DEVICE_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.userId || !parsed?.deviceToken || !parsed?.mode) {
      return null;
    }
    return parsed as TrustedDeviceQuickUnlock;
  } catch {
    return null;
  }
}

export function saveTrustedDeviceUnlock(record: TrustedDeviceQuickUnlock): void {
  try {
    localStorage.setItem(TRUSTED_DEVICE_STORAGE_KEY, JSON.stringify(record));
  } catch {
  }
}

export function clearTrustedDeviceUnlock(): void {
  try {
    localStorage.removeItem(TRUSTED_DEVICE_STORAGE_KEY);
  } catch {
  }
}

export async function isPlatformBiometricSupported(): Promise<boolean> {
  if (
    typeof window === 'undefined' ||
    typeof PublicKeyCredential === 'undefined' ||
    typeof PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable !== 'function'
  ) {
    return false;
  }
  try {
    return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
  } catch {
    return false;
  }
}

export async function enrollDeviceBiometric(email: string, fullName: string): Promise<string> {
  if (!window.PublicKeyCredential || !navigator.credentials?.create) {
    throw new Error('This browser does not support WebAuthn biometrics over this connection.');
  }

  const challenge = new Uint8Array(32);
  crypto.getRandomValues(challenge);
  const userBytes = new TextEncoder().encode(email);

  const createOptions: PublicKeyCredentialCreationOptions = {
    challenge,
    rp: {
      name: 'CriSync Humanitarian Platform'
    },
    user: {
      id: userBytes,
      name: email,
      displayName: fullName || email
    },
    pubKeyCredParams: [
      { alg: -7, type: 'public-key' },
      { alg: -257, type: 'public-key' }
    ],
    authenticatorSelection: {
      authenticatorAttachment: 'platform',
      userVerification: 'required',
      residentKey: 'preferred'
    },
    timeout: 60000,
    attestation: 'none'
  };

  let credential: PublicKeyCredential | null = null;
  try {
    credential = (await navigator.credentials.create({ publicKey: createOptions })) as PublicKeyCredential | null;
  } catch (err: any) {
    if (err?.name === 'NotSupportedError') {
      createOptions.authenticatorSelection = {
        userVerification: 'required'
      };
      credential = (await navigator.credentials.create({ publicKey: createOptions })) as PublicKeyCredential | null;
    } else {
      throw err;
    }
  }

  if (!credential) {
    throw new Error('Biometric enrollment was cancelled on this device.');
  }

  return bytesToBase64Url(new Uint8Array(credential.rawId));
}

export async function verifyDeviceBiometric(
  challengeBase64Url: string,
  credentialIdBase64Url: string
): Promise<{ credentialId: string; clientDataJsonBase64Url: string }> {
  if (!window.PublicKeyCredential || !navigator.credentials?.get) {
    throw new Error('This browser does not support WebAuthn biometrics over this connection.');
  }

  const challengeBytes = base64UrlToBytes(challengeBase64Url);
  const credIdBytes = base64UrlToBytes(credentialIdBase64Url);

  const assertion = (await navigator.credentials.get({
    publicKey: {
      challenge: challengeBytes.buffer as ArrayBuffer,
      allowCredentials: [
        {
          id: credIdBytes.buffer as ArrayBuffer,
          type: 'public-key'
        }
      ],
      userVerification: 'required',
      timeout: 60000
    }
  })) as PublicKeyCredential | null;

  if (!assertion || !assertion.response) {
    throw new Error('Biometric verification was cancelled.');
  }

  const authResponse = assertion.response as AuthenticatorAssertionResponse;
  return {
    credentialId: bytesToBase64Url(new Uint8Array(assertion.rawId)),
    clientDataJsonBase64Url: bytesToBase64Url(new Uint8Array(authResponse.clientDataJSON))
  };
}
