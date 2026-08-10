export interface ContactPayload {
  name: string;
  email: string;
  organization: string;
  subject: string;
  message: string;
}

export interface DemoPayload {
  name: string;
  email: string;
  organization: string;
  orgType?: string;
  role?: string;
  subject?: string;
  message?: string;
}

export interface SubmissionResult {
  success: boolean;
  message?: string;
  error?: string;
  id?: string;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateEmail(email: string): boolean {
  return EMAIL_REGEX.test(email.trim());
}

async function postForm<T>(endpoint: string, payload: T): Promise<SubmissionResult> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 12000);

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      return {
        success: false,
        error: data?.error || `HTTP_ERROR_${response.status}`,
        message: data?.message || 'Server returned an error.',
      };
    }

    return {
      success: true,
      message: data?.message || 'Submission successful.',
      id: data?.id,
    };
  } catch (err: unknown) {
    clearTimeout(timeoutId);
    if (err instanceof Error && err.name === 'AbortError') {
      return {
        success: false,
        error: 'TIMEOUT_ERROR',
        message: 'Request timed out. Please try again.',
      };
    }
    return {
      success: false,
      error: 'NETWORK_ERROR',
      message: err instanceof Error ? err.message : 'Network error occurred.',
    };
  }
}

export async function submitContactForm(data: ContactPayload): Promise<SubmissionResult> {
  const trimmedName = data.name.trim();
  const trimmedEmail = data.email.trim();
  const trimmedOrg = data.organization.trim();
  const trimmedSubject = data.subject.trim();
  const trimmedMessage = data.message.trim();

  if (!trimmedName || !trimmedEmail || !trimmedOrg || !trimmedSubject || !trimmedMessage) {
    return { success: false, error: 'REQUIRED_FIELDS_MISSING' };
  }

  if (!validateEmail(trimmedEmail)) {
    return { success: false, error: 'INVALID_EMAIL_FORMAT' };
  }

  return postForm<ContactPayload>('/api/contact', {
    name: trimmedName.slice(0, 100),
    email: trimmedEmail.slice(0, 100),
    organization: trimmedOrg.slice(0, 100),
    subject: trimmedSubject.slice(0, 150),
    message: trimmedMessage.slice(0, 2000),
  });
}

export async function submitDemoRequest(data: DemoPayload): Promise<SubmissionResult> {
  const trimmedName = data.name.trim();
  const trimmedEmail = data.email.trim();
  const trimmedOrg = data.organization.trim();
  const trimmedMessage = (data.message || '').trim();

  if (!trimmedName || !trimmedEmail || !trimmedOrg) {
    return { success: false, error: 'REQUIRED_FIELDS_MISSING' };
  }

  if (!validateEmail(trimmedEmail)) {
    return { success: false, error: 'INVALID_EMAIL_FORMAT' };
  }

  return postForm<DemoPayload>('/api/demo', {
    name: trimmedName.slice(0, 100),
    email: trimmedEmail.slice(0, 100),
    organization: trimmedOrg.slice(0, 100),
    orgType: (data.orgType || '').slice(0, 100),
    role: (data.role || '').slice(0, 100),
    subject: (data.subject || '').slice(0, 150),
    message: trimmedMessage.slice(0, 2000),
  });
}

export async function submitNewsletterSubscription(email: string): Promise<SubmissionResult> {
  const trimmedEmail = email.trim();

  if (!trimmedEmail) {
    return { success: false, error: 'REQUIRED_FIELDS_MISSING' };
  }

  if (!validateEmail(trimmedEmail)) {
    return { success: false, error: 'INVALID_EMAIL_FORMAT' };
  }

  return postForm<{ email: string }>('/api/subscribe', {
    email: trimmedEmail.slice(0, 100),
  });
}
