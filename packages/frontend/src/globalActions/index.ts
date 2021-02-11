import EventBus, { ACTIONS } from '@/EventBus';

export interface SnackbarActions {
  onAction?: () => void;
  actionText?: string;
}
const showSnackbar = (text: string, options: SnackbarActions = {}): void => {
  EventBus.$emit(ACTIONS.TOAST, { text, ...options });
};

const showErrorSnackbar = (text: string): void => {
  EventBus.$emit(ACTIONS.TOAST, { text, error: true });
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
  showUnsavedChangesWarning,
};

export type GlobalActionsType = typeof globalActions;

export default globalActions;
