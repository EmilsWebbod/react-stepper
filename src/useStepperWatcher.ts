import {useContext, useEffect} from "react";
import {StepperContext, StepperContextProps, StepWatcherAction} from "./StepperContext";

export function useStepperWatcher(watch: StepWatcherAction): StepperContextProps {
  const context = useContext(StepperContext);

  useEffect(() => {
    context.addWatcher(watch)
  }, []);

  return context;
}
