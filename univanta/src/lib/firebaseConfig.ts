export interface FirebaseIntegrationStatus {
  configured: boolean;
  projectId: string | null;
  modeLabel: string;
  setupNotice: string;
}

export function getFirebaseIntegrationStatus(): FirebaseIntegrationStatus {
  const apiKey = import.meta.env.VITE_FIREBASE_API_KEY as string | undefined;
  const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID as string | undefined;

  const configured = Boolean(apiKey && projectId && apiKey.trim() !== '' && projectId.trim() !== '');

  return {
    configured,
    projectId: configured ? projectId! : null,
    modeLabel: configured ? 'Firebase Connected' : 'Demo Mode (Local Browser Persistence)',
    setupNotice: configured
      ? 'Firebase project environment variables detected.'
      : 'Firebase Authentication & Cloud Firestore are not provisioned in this workspace. Accounts, profile edits, saved opportunities, and reminders run in Demo Mode with local browser persistence.',
  };
}
