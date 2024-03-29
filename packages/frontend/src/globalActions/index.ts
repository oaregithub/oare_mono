import EventBus, { ACTIONS } from '@/EventBus';
import sl from '../serviceLocator';

export interface SnackbarActions {
  onAction?: () => void;
  actionText?: string;
}
const showSnackbar = (text: string, options: SnackbarActions = {}): void => {
  EventBus.$emit(ACTIONS.TOAST, { text, ...options });
};

const closeSnackbar = (): void => {
  EventBus.$emit(ACTIONS.CLOSE_TOAST);
};

const showErrorSnackbar = async (
  text: string,
  error?: Error,
  devErrorText?: string
): Promise<void> => {
  const server = sl.get('serverProxy');
  const description = devErrorText || text;

  EventBus.$emit(ACTIONS.TOAST, {
    text,
    error: true,
    errorMessage: error ? error.message : undefined,
  });

  try {
    await server.logError({
      description,
      stacktrace: error && error.stack ? error.stack : null,
      status: 'New',
    });
  } catch {
    // eslint-disable-next-line no-console
    console.error('Error logging error', {
      description,
      stacktrace: error && error.stack ? error.stack : null,
      status: 'New',
    });
  }
};

const inputSpecialChar = async (char: string) => {
  await EventBus.$emit(ACTIONS.SPECIAL_CHAR_INPUT, char);
};

const logError = async (description: string, error?: Error): Promise<void> => {
  const server = sl.get('serverProxy');
  const stacktrace = error && error.stack ? error.stack : null;
  await server.logError({
    description,
    stacktrace,
    status: 'New',
  });
};

const showUnsavedChangesWarning = (next: Function): void => {
  // eslint-disable-next-line no-alert
  const response = window.confirm(
    'Any changes made will be lost. Would you like to continue anyways?'
  );
  if (response) {
    next();
  } else {
    next(false);
  }
};

const globalActions = {
  showSnackbar,
  showErrorSnackbar,
  logError,
  showUnsavedChangesWarning,
  closeSnackbar,
  inputSpecialChar,
};

export type GlobalActionsType = typeof globalActions;

export default globalActions;
