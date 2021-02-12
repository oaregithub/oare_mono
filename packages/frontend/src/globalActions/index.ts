import EventBus, { ACTIONS } from '@/EventBus';
import sl from '../serviceLocator';

export interface SnackbarActions {
  onAction?: () => void;
  actionText?: string;
}
const showSnackbar = (text: string, options: SnackbarActions = {}): void => {
  EventBus.$emit(ACTIONS.TOAST, { text, ...options });
};

const showErrorSnackbar = async (
  text: string,
  devErrorText?: string
): Promise<void> => {
  const server = sl.get('serverProxy');
  const description = devErrorText || text;

  await server.logError({
    description,
    stacktrace: null,
    status: 'New',
  });

  EventBus.$emit(ACTIONS.TOAST, { text, error: true });
};

const logError = async (description: string, error?: Error): Promise<void> => {
  const server = sl.get('serverProxy');
  let stacktrace = null;
  if (error) {
    stacktrace = error.stack ? error.stack : null;
  }
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
};

export type GlobalActionsType = typeof globalActions;

export default globalActions;
