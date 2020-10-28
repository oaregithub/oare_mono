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

const globalActions = {
  showSnackbar,
  showErrorSnackbar,
};

export type GlobalActionsType = typeof globalActions;

export default globalActions;
