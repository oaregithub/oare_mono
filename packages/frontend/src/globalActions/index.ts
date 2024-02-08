import EventBus, { ACTIONS } from '@/EventBus';
import sl from '../serviceLocator';

/**
 * Snackbar configuration.
 */
interface SnackbarActions {
  onAction?: () => void;
  actionText?: string;
}

/**
 * Displays a snackbar with the given text and options.
 * @param text The text to display in the snackbar.
 * @param options Various options for the snackbar, including an action and action text.
 */
const showSnackbar = (text: string, options: SnackbarActions = {}): void => {
  EventBus.$emit(ACTIONS.TOAST, { text, ...options });
};

/**
 * Closes the snackbar.
 */
const closeSnackbar = (): void => {
  EventBus.$emit(ACTIONS.CLOSE_TOAST);
};

/**
 * Displays an error snackbar with the given text and logs the error to the server.
 * @param text The text to display in the snackbar.
 * @param error The error object, used for logging.
 * @param devErrorText Error text to write to the error log instead of the user-facing displayed text. If not provided, the displayed text will be used.
 */
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

/**
 * Inputs a special character into the focused input. Used for inserting markup characters in the editor.
 * @param char The special character to input.
 */
const inputSpecialChar = async (char: string) => {
  await EventBus.$emit(ACTIONS.SPECIAL_CHAR_INPUT, char);
};

/**
 * Logs an error to the server.
 * @param description A text description of the error.
 * @param error The error object, used for logging.
 */
const logError = async (description: string, error?: Error): Promise<void> => {
  const server = sl.get('serverProxy');
  const stacktrace = error && error.stack ? error.stack : null;
  await server.logError({
    description,
    stacktrace,
    status: 'New',
  });
};

/**
 * Displays a warning to the user that they have unsaved changes and asks if they would like to continue.
 * The next function, which prompts a route change, is called only if the user chooses to continue.
 */
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

/**
 * The various global actions that can be used throughout the app.
 */
const globalActions = {
  showSnackbar,
  showErrorSnackbar,
  logError,
  showUnsavedChangesWarning,
  closeSnackbar,
  inputSpecialChar,
};

/**
 * A type representing the various supported global actions.
 */
export type GlobalActionsType = typeof globalActions;

export default globalActions;
