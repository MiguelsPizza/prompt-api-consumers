import { DB_NAME } from "./AppSchema";

const SYNC_KEY = 'syncEnabled';

export function getSyncEnabled() {
  try {
    const key = `${SYNC_KEY}-${DB_NAME}`;
    console.debug('Getting sync enabled status for key:', key);
    const value = localStorage.getItem(key);

    if (!value) {
      console.debug('No sync status found, defaulting to false');
      setSyncEnabled(false);
      return false;
    }

    const isEnabled = value === 'TRUE';
    console.debug('Current sync status:', isEnabled);
    return isEnabled;
  } catch (error) {
    console.error('Error getting sync enabled status:', error);
    return false;
  }
}

export function setSyncEnabled(enabled: boolean) {
  try {
    const key = `${SYNC_KEY}-${DB_NAME}`;
    const enabledString = enabled ? 'TRUE' : 'FALSE';
    console.debug('Setting sync enabled status:', { key, enabled });
    localStorage.setItem(key, enabledString);
  } catch (error) {
    console.error('Error setting sync enabled status:', error);
    throw error; // Re-throw to allow caller to handle
  }
}
