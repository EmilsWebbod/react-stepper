import {useContext, useEffect} from 'react';
import {StepAction, StepperContextProps, StepperOpts, StepperContext} from "./StepperContext";

export function useStepper(action: StepAction, opts?: StepperOpts): StepperContextProps {
  const context = useContext(StepperContext);

  useEffect(() => {
    context.addStep(action, opts);
  }, []);

  return context;
}
