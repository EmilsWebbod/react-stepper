import * as React from 'react';
import {useEffect, useRef, MutableRefObject} from "react";
import useSerialState from "@ewb/react-serial-state";

export type StepAction = () => Promise<{}> | void;
export type StepWatcherAction = (state: StepperState) => Promise<{}> | void;

export interface StepperOpts {
  id?: string;
  index?: number;
  stepDelay?: number;
  state?: [any, (state: any) => void];
  ref?: MutableRefObject<HTMLDivElement | null>;
  preAction?: () => Promise<{}> | void;
  postAction?: () => Promise<{}> | void;
  preNext?: () => Promise<{}> | void;
  data?: any;
}

export interface StepperState {
  activeStep: number;
  steps: StepperStep[];
  watchers: StepperWatcher[];
  completed: boolean;
}

export interface StepperActions {
  addStep: (action: StepAction, opts?: StepperOpts) => void;
  addWatcher: (watcher: any) => void;
  prevStep: () => void;
  nextStep: () => void;
  runAll: () => void;
  reset: () => void;
}

export interface StepperStep extends StepperOpts {
  action: StepAction;
}

export interface StepperWatcher {
  action: StepWatcherAction;
}

export interface StepperContextProps extends StepperActions {
  state: StepperState;
  StepWrapper?: any;
}

const defaultState = (activeStep: number): StepperState => ({
  activeStep,
  steps: [] as StepperStep[],
  watchers: [] as StepperWatcher[],
  completed: false
});

const StepperContext = React.createContext<StepperContextProps>({
  state: defaultState(-1),
  addStep: (action: StepAction, opts?: StepperOpts) => {},
  addWatcher: () => {},
  runAll: () => {},
  prevStep: () => {},
  nextStep: () => {},
  reset: () => {}
});

interface ProviderProps extends JSX.ElementChildrenAttribute {
  start?: boolean;
  runNew?: boolean;
}

function StepperProvider({
  start,
  runNew,
  children
}: ProviderProps) {
  const [state, setState] = useSerialState(defaultState(-1));
  const runningStep = useRef(false);

  useEffect(() => {
    if (state.steps.length > 0) {
      if (start && !state.completed) {
        nextStep().then();
      }

      if (runNew && !runningStep.current && state.completed) {
        nextStep().then();
      }
    }
  }, [state.steps.length]);

  useEffect(() => {
    state.watchers.map(runWatch(state));
  }, [state.activeStep]);

  function addStep(action: StepAction, opts?: StepperOpts) {
    if (opts && opts.id && state.steps.some(x => x.id === opts.id)) {
      return;
    }

    const step = {action, ...opts};

    if (opts && opts.index) {
      state.steps.splice(opts.index, 0, step);
    } else {
      state.steps.push(step);
    }

    setState(state);
  }

  async function runAll() {
    for(let i = state.activeStep + 1; i < state.steps.length; i++) {
      await runStep(state.steps[i]);
    }
    setState({
      activeStep: state.steps.length - 1
    })
  }

  async function prevStep(currentStep?: number) {
    if (runningStep.current) {
      return;
    }
    runningStep.current = true;

    const current = typeof currentStep === 'number' ? currentStep : state.activeStep;
    const newState: Partial<StepperState> = {};
    const prev = current - 1;
    const activeStep = state.steps[current];

    if (activeStep && activeStep.state) {
      activeStep.state[1](activeStep.state[0]);
    }

    if (prev < 0) {
      newState.activeStep = -1;
      setState(newState);
      runningStep.current = false;
      return; // todo: Add on start
    }

    await runStep(state.steps[prev]);
    newState.activeStep = current - 1;
    setState(newState);

    runningStep.current = false;
  }

  async function nextStep(currentStep?: number) {
    if (runningStep.current) {
      return;
    }
    runningStep.current = true;

    const current = typeof currentStep === 'number' ? currentStep : state.activeStep;
    const newState: Partial<StepperState> = {};
    const next = current + 1;

    const activeStep = state.steps[current];
    if (activeStep && typeof activeStep.preNext === 'function') {
      await activeStep.preNext();
    }

    console.log(current, next, state.steps.length, activeStep);

    if (next >= state.steps.length) {
      newState.activeStep = state.steps.length - 1;
      newState.completed = true;
      setState(newState);
      runningStep.current = false;
      return;
    }

    await runStep(state.steps[next]);
    newState.activeStep = current + 1;

    setState(newState);

    runningStep.current = false;
  }

  function addWatcher(action: StepWatcherAction) {
    state.watchers.push({ action });
  }

  async function reset() {
    const activeStep = state.steps[state.activeStep];
    if (activeStep && typeof activeStep.preNext === 'function') {
      await activeStep.preNext();
    }

    setState({
      activeStep: -1,
      completed: false
    });
    nextStep(-1).then()
  }

  const value = {state, addStep, runAll, prevStep, nextStep, addWatcher, reset};

  return (
    <StepperContext.Provider value={value}>
      {children}
    </StepperContext.Provider>
  )
}

function runWatch(state: StepperState) {
  return async (watcher: StepperWatcher) => {
    await watcher.action(state);
  }
}

async function runStep(step: StepperStep) {
  if (typeof step.preAction === 'function') {
    await step.preAction();
  }

  return new Promise(async (res) => {
    if (step.stepDelay) {
      setTimeout(() => runAction(res), step.stepDelay)
    } else {
      await runAction(res);
    }
  });

  async function runAction(res: () => void) {
    await step.action();

    if (typeof step.postAction === 'function') {
      await step.postAction();
    }

    res();
  }
}

export { StepperContext, StepperProvider };
