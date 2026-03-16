import * as React from "react";

import type { ToastActionElement, ToastProps } from "@/components/ui/toast";

const TOAST_LIMIT = 1;
const TOAST_REMOVE_DELAY = 3000; // Réduit à 3 secondes pour une fermeture plus rapide
const TOAST_CLOSE_ANIMATION_DURATION = 300; // Durée de l'animation de fermeture

type ToasterToast = ToastProps & {
  id: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: ToastActionElement;
  isClosing?: boolean; // Nouveau flag pour indiquer la fermeture
};

const actionTypes = {
  ADD_TOAST: "ADD_TOAST",
  UPDATE_TOAST: "UPDATE_TOAST",
  DISMISS_TOAST: "DISMISS_TOAST",
  REMOVE_TOAST: "REMOVE_TOAST",
  CLOSE_TOAST: "CLOSE_TOAST", // Nouvelle action pour la fermeture avec loader
} as const;

let count = 0;

function genId() {
  count = (count + 1) % Number.MAX_SAFE_INTEGER;
  return count.toString();
}

type ActionType = typeof actionTypes;

type Action =
  | {
      type: ActionType["ADD_TOAST"];
      toast: ToasterToast;
    }
  | {
      type: ActionType["UPDATE_TOAST"];
      toast: Partial<ToasterToast>;
    }
  | {
      type: ActionType["DISMISS_TOAST"];
      toastId?: ToasterToast["id"];
    }
  | {
      type: ActionType["CLOSE_TOAST"]; // Nouvelle action
      toastId?: ToasterToast["id"];
    }
  | {
      type: ActionType["REMOVE_TOAST"];
      toastId?: ToasterToast["id"];
    };

interface State {
  toasts: ToasterToast[];
}

const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>();

const addToRemoveQueue = (toastId: string) => {
  if (toastTimeouts.has(toastId)) {
    return;
  }

  const timeout = setTimeout(() => {
    toastTimeouts.delete(toastId);
    dispatch({
      type: "REMOVE_TOAST",
      toastId: toastId,
    });
  }, TOAST_REMOVE_DELAY);

  toastTimeouts.set(toastId, timeout);
};

const addToCloseQueue = (toastId: string) => {
  // Marquer le toast comme en cours de fermeture
  dispatch({
    type: "CLOSE_TOAST",
    toastId,
  });

  // Programmer la suppression après l'animation
  setTimeout(() => {
    dispatch({
      type: "REMOVE_TOAST",
      toastId,
    });
  }, TOAST_CLOSE_ANIMATION_DURATION);
};

export const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case "ADD_TOAST":
      return {
        ...state,
        toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT),
      };

    case "UPDATE_TOAST":
      return {
        ...state,
        toasts: state.toasts.map((t) => (t.id === action.toast.id ? { ...t, ...action.toast } : t)),
      };

    case "DISMISS_TOAST": {
      const { toastId } = action;

      if (toastId) {
        addToCloseQueue(toastId); // Utiliser la nouvelle queue avec animation
      } else {
        state.toasts.forEach((toast) => {
          addToCloseQueue(toast.id);
        });
      }

      return {
        ...state,
        toasts: state.toasts.map((t) =>
          toastId === undefined || t.id === toastId
            ? {
                ...t,
                open: false,
                isClosing: true, // Marquer comme en cours de fermeture
              }
            : t,
        ),
      };
    }
    
    case "CLOSE_TOAST":
      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === action.toastId
            ? {
                ...t,
                isClosing: true,
              }
            : t,
        ),
      };

    case "REMOVE_TOAST":
      if (action.toastId === undefined) {
        return {
          ...state,
          toasts: [],
        };
      }
      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== action.toastId),
      };
  }
};

const listeners: Array<(state: State) => void> = [];

let memoryState: State = { toasts: [] };

function dispatch(action: Action) {
  memoryState = reducer(memoryState, action);
  listeners.forEach((listener) => {
    listener(memoryState);
  });
}

type Toast = Omit<ToasterToast, "id" | "isClosing">;

type ToastVariant = "default" | "destructive" | "success" | "warning" | "error";

function toast({ variant = "default", ...props }: Toast & { variant?: ToastVariant }) {
  const id = genId();

  const update = (props: ToasterToast) =>
    dispatch({
      type: "UPDATE_TOAST",
      toast: { ...props, id },
    });
  
  const dismiss = () => dispatch({ type: "DISMISS_TOAST", toastId: id });

  const close = () => {
    // Animation de fermeture avec loader
    dispatch({ type: "CLOSE_TOAST", toastId: id });
    
    // Suppression après l'animation
    setTimeout(() => {
      dispatch({ type: "REMOVE_TOAST", toastId: id });
    }, TOAST_CLOSE_ANIMATION_DURATION);
  };

  dispatch({
    type: "ADD_TOAST",
    toast: {
      ...props,
      id,
      variant,
      open: true,
      isClosing: false,
      onOpenChange: (open) => {
        if (!open) dismiss();
      },
    },
  });

  return {
    id: id,
    dismiss,
    close, // Nouvelle méthode pour fermer avec loader
    update,
  };
}

function useToast() {
  const [state, setState] = React.useState<State>(memoryState);

  React.useEffect(() => {
    listeners.push(setState);
    return () => {
      const index = listeners.indexOf(setState);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    };
  }, [state]);

  return {
    ...state,
    toast,
    dismiss: (toastId?: string) => dispatch({ type: "DISMISS_TOAST", toastId }),
    close: (toastId?: string) => {
      if (toastId) {
        dispatch({ type: "CLOSE_TOAST", toastId });
        setTimeout(() => {
          dispatch({ type: "REMOVE_TOAST", toastId });
        }, TOAST_CLOSE_ANIMATION_DURATION);
      } else {
        state.toasts.forEach((toast) => {
          dispatch({ type: "CLOSE_TOAST", toastId: toast.id });
          setTimeout(() => {
            dispatch({ type: "REMOVE_TOAST", toastId: toast.id });
          }, TOAST_CLOSE_ANIMATION_DURATION);
        });
      }
    },
  };
}

export { useToast, toast };