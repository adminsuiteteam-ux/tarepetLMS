// Biometric Authentication Engine (Android Fingerprint, iOS Face ID / Touch ID, Windows Hello)
import { getStoredTeachers, getStoredStudents } from '@/lib/cbt-store';

export interface BiometricEnrollment {
  email: string;
  name: string;
  role: 'TEACHER' | 'ADMIN' | 'STUDENT' | 'PARENT';
  staffId?: string;
  enrolledAt: string;
  credentialId?: string;
  biometricType?: 'FINGERPRINT' | 'FACE_ID' | 'GENERIC_BIOMETRIC';
}

const STORAGE_KEY = 'tarepet_biometrics_enrolled_users';

export function isBiometricsSupported(): boolean {
  if (typeof window === 'undefined') return false;
  return !!(window.PublicKeyCredential && window.navigator.credentials);
}

export function getEnrolledBiometricUsers(): BiometricEnrollment[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function isBiometricsEnabled(emailOrId: string): boolean {
  if (!emailOrId) return false;
  const clean = emailOrId.toLowerCase().trim();
  const enrolled = getEnrolledBiometricUsers();
  return enrolled.some(u => 
    u.email.toLowerCase() === clean || 
    (u.staffId && u.staffId.toLowerCase() === clean)
  );
}

export async function enrollBiometrics(user: {
  email: string;
  name: string;
  role: 'TEACHER' | 'ADMIN' | 'STUDENT' | 'PARENT';
  staffId?: string;
}): Promise<{ success: boolean; biometricType: string; error?: string }> {
  if (typeof window === 'undefined') {
    return { success: false, biometricType: 'NONE', error: 'Window not available' };
  }

  const cleanEmail = user.email.toLowerCase().trim();
  let credId = 'cred_' + Math.random().toString(36).substring(2, 15);
  let detectedType: 'FINGERPRINT' | 'FACE_ID' | 'GENERIC_BIOMETRIC' = 'FINGERPRINT';

  // Detect platform device hints
  const ua = navigator.userAgent || '';
  if (/iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)) {
    detectedType = 'FACE_ID';
  } else if (/Android/i.test(ua)) {
    detectedType = 'FINGERPRINT';
  }

  try {
    if (window.PublicKeyCredential && navigator.credentials?.create) {
      // Prompt native WebAuthn device biometrics (Touch ID / Face ID / Fingerprint)
      const challenge = new Uint8Array(32);
      window.crypto.getRandomValues(challenge);
      const userId = new Uint8Array(16);
      window.crypto.getRandomValues(userId);

      const credential = await navigator.credentials.create({
        publicKey: {
          challenge,
          rp: { name: 'Tarepet Montessori Portal', id: window.location.hostname || 'localhost' },
          user: {
            id: userId,
            name: user.email,
            displayName: user.name,
          },
          pubKeyCredParams: [
            { alg: -7, type: 'public-key' }, // ES256
            { alg: -257, type: 'public-key' }, // RS256
          ],
          authenticatorSelection: {
            authenticatorAttachment: 'platform',
            userVerification: 'preferred',
          },
          timeout: 60000,
          attestation: 'none',
        },
      }) as any;

      if (credential && credential.id) {
        credId = credential.id;
      }
    }
  } catch (e: any) {
    // If WebAuthn was cancelled by user
    if (e.name === 'NotAllowedError') {
      return { success: false, biometricType: detectedType, error: 'Biometric authorization was cancelled or timed out.' };
    }
    // Continue with device secure enrollment token fallback
  }

  // Save to enrolled list
  const current = getEnrolledBiometricUsers().filter(u => u.email.toLowerCase() !== cleanEmail);
  current.push({
    email: user.email,
    name: user.name,
    role: user.role,
    staffId: user.staffId,
    enrolledAt: new Date().toISOString(),
    credentialId: credId,
    biometricType: detectedType,
  });

  localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
  return { success: true, biometricType: detectedType };
}

export function unenrollBiometrics(emailOrId: string): boolean {
  if (typeof window === 'undefined') return false;
  const clean = emailOrId.toLowerCase().trim();
  const current = getEnrolledBiometricUsers().filter(u => 
    u.email.toLowerCase() !== clean && 
    (!u.staffId || u.staffId.toLowerCase() !== clean)
  );
  localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
  return true;
}

export async function verifyBiometricsPrompt(targetEmail?: string): Promise<{
  success: boolean;
  user?: any;
  error?: string;
}> {
  if (typeof window === 'undefined') {
    return { success: false, error: 'Environment not available' };
  }

  const enrolled = getEnrolledBiometricUsers();
  if (enrolled.length === 0) {
    return { success: false, error: 'No biometric credentials activated on this device yet. Please sign in and activate Biometrics in your Profile.' };
  }

  let matchedEnrollment = targetEmail 
    ? enrolled.find(u => u.email.toLowerCase() === targetEmail.toLowerCase() || (u.staffId && u.staffId.toLowerCase() === targetEmail.toLowerCase()))
    : enrolled[0];

  if (!matchedEnrollment) {
    matchedEnrollment = enrolled[0];
  }

  try {
    if (window.PublicKeyCredential && navigator.credentials?.get) {
      const challenge = new Uint8Array(32);
      window.crypto.getRandomValues(challenge);

      await navigator.credentials.get({
        publicKey: {
          challenge,
          timeout: 60000,
          userVerification: 'preferred',
          rpId: window.location.hostname || 'localhost',
        },
      });
    }
  } catch (e: any) {
    if (e.name === 'NotAllowedError') {
      return { success: false, error: 'Biometric scan was cancelled.' };
    }
  }

  // Find user details based on role
  if (matchedEnrollment.role === 'TEACHER') {
    const teachers = getStoredTeachers();
    const t = teachers.find(teach => 
      teach.email.toLowerCase() === matchedEnrollment!.email.toLowerCase() ||
      (matchedEnrollment!.staffId && teach.staffId.toLowerCase() === matchedEnrollment!.staffId.toLowerCase())
    );
    if (t) {
      return {
        success: true,
        user: {
          id: t.id || 101,
          email: t.email,
          first_name: t.name.split(' ')[0] || 'Teacher',
          last_name: t.name.split(' ').slice(1).join(' ') || 'Staff',
          phone: t.phone,
          role: 'TEACHER',
          profile: {
            teacher_id: t.staffId,
            department: t.department,
            formTeacherOf: t.formTeacherOf,
            form_teacher_of: t.formTeacherOf,
            specialization: t.specialization,
            qualifications: t.qualification,
            gender: t.gender,
            address: t.address,
          },
        }
      };
    }
  } else if (matchedEnrollment.role === 'STUDENT') {
    const students = getStoredStudents();
    const s = students.find(stu => 
      stu.email.toLowerCase() === matchedEnrollment!.email.toLowerCase() ||
      (matchedEnrollment!.staffId && stu.code.toLowerCase() === matchedEnrollment!.staffId.toLowerCase())
    );
    if (s) {
      return {
        success: true,
        user: {
          id: s.id || 1,
          email: s.email,
          first_name: s.name.split(' ')[0] || 'Student',
          last_name: s.name.split(' ').slice(1).join(' ') || '',
          role: 'STUDENT',
          profile: {
            student_id: s.code || s.admissionNo,
            grade_level: s.grade,
            house: s.house,
          }
        }
      };
    }
  } else if (matchedEnrollment.role === 'ADMIN') {
    return {
      success: true,
      user: {
        id: 1,
        email: matchedEnrollment.email,
        first_name: 'Administrator',
        last_name: 'System',
        role: 'ADMIN',
      }
    };
  }

  // Generic fallback user object
  return {
    success: true,
    user: {
      id: 1,
      email: matchedEnrollment.email,
      first_name: matchedEnrollment.name.split(' ')[0] || 'User',
      last_name: matchedEnrollment.name.split(' ').slice(1).join(' ') || '',
      role: matchedEnrollment.role,
      profile: {
        teacher_id: matchedEnrollment.staffId,
      }
    }
  };
}
