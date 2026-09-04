import { createContext, useContext, useEffect, useReducer } from 'react';
import type { Dispatch, ReactNode } from 'react';
import { initialState, machineReducer } from '../domain/machineReducer.ts';
import type { MachineAction, MachineState } from '../domain/machineReducer.ts';
import { fetchMachineBank, fetchProducts } from '../services/productsApi.ts';

/**
 * State and dispatch are split into two contexts so a component that only
 * dispatches (e.g. a coin button) never re-renders when state changes.
 */
const StateContext = createContext<MachineState | null>(null);
const DispatchContext = createContext<Dispatch<MachineAction> | null>(null);

export function MachineProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(machineReducer, initialState);

  // Runs once on mount: loads the mocked external service, in parallel, then
  // dispatches success or failure — the only I/O in the whole state machine.
  useEffect(() => {
    let cancelled = false;

    dispatch({ type: 'LOAD_START' });

    Promise.all([fetchProducts(), fetchMachineBank()])
      .then(([products, bank]) => {
        if (!cancelled) dispatch({ type: 'LOAD_SUCCESS', products, bank });
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          dispatch({
            type: 'LOAD_FAILURE',
            error: error instanceof Error ? error.message : 'Failed to load the vending machine.',
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <StateContext.Provider value={state}>
      <DispatchContext.Provider value={dispatch}>{children}</DispatchContext.Provider>
    </StateContext.Provider>
  );
}

export function useMachineState(): MachineState {
  const state = useContext(StateContext);
  if (state === null) {
    throw new Error('useMachineState must be used within a MachineProvider');
  }
  return state;
}

export function useMachineDispatch(): Dispatch<MachineAction> {
  const dispatch = useContext(DispatchContext);
  if (dispatch === null) {
    throw new Error('useMachineDispatch must be used within a MachineProvider');
  }
  return dispatch;
}
