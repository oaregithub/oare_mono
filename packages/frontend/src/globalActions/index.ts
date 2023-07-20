import EventBus, { ACTIONS } from '@/EventBus';
import sl from '../serviceLocator';

export interface SnackbarActions {
  onAction?: () => void;
  actionText?: string;
}

/**
 * Shows a snackbar with the given text and options.
 * @param text The text to display in the snackbar.
 * @param options The options for the snackbar. Allows for an optional action button to be showed and a callback to be called when the action button is clicked.
 */
const showSnackbar = (text: string, options: SnackbarActions = {}): void => {
  EventBus.$emit(ACTIONS.TOAST, { text, ...options });
};

/**
 * Closes the current snackbar.
 */
const closeSnackbar = (): void => {
  EventBus.$emit(ACTIONS.CLOSE_TOAST);
};

/**
 * Shows an error snackbar. Also logs the error to the server.
 * @param text The text to display in the snackbar.
 * @param error The error to log.
 * @param devErrorText Optional text to display in the error log instead of the snackbar text.
 */
const showErrorSnackbar = async (
  text: string,
  error?: Error,
  devErrorText?: string
): Promise<void> => {
  const server = sl.get('serverProxy');

  const description = devErrorText || text;
  const stacktrace = error && error.stack ? error.stack : null;

  EventBus.$emit(ACTIONS.TOAST, {
    text,
    error: true,
    errorMessage: error ? error.message : undefined,
  });

  try {
    await server.logError({ description, stacktrace });
  } catch {
    // eslint-disable-next-line no-console
    console.error('Error logging error', {
      description,
      stacktrace,
    });
  }
};

/**
 * Action for inputting a special character using the onscreen special character keyboard.
 * @param char The special character to input.
 */
const inputSpecialChar = (char: string) => {
  EventBus.$emit(ACTIONS.SPECIAL_CHAR_INPUT, char);
};

/**
 * Displays a confirm dialog to the user asking if they want to continue with unsaved changes.
 * @param next Where to go next if the user confirms.
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

const globalActions = {
  showSnackbar,
  showErrorSnackbar,
  showUnsavedChangesWarning,
  closeSnackbar,
  inputSpecialChar,
};

export default globalActions;
