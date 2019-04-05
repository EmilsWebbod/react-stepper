#React stepper

## How to use

### Provider
```
import { StepperProvider } from '@ewb/react-stepper';

function App() {
    return (
        <StepperProvider start>
            {...}
        </StepperProvider>
    );
}
```

### Step
```
import { useStepper } from '@ewb/react-stepper';

function SomeStepComponent() {
  const [state, setState] = useState(false);
  const { nextStep } = useStepper(action, {
    state: [state, setState], // This is used for going prevState
    preNext
  });

  function action() {
    setState(true);
  }

  function preNext() {
    setState(false);
  }
  
  return (
    { active ? <>Active</> : <>Not active</> }
  )
}
```

### Watcher
```
import { useStepWatcher } from '@ewb/react-stepper';

function SomeWatcherComponent() {
    const { reset } = useStepWatcher(state => {
        console.log('state change', state);
    });
    
    return (
    <div>
      ResetStepper
      <button onClick={reset}>Reset</button>
    </div>
    )
}
```
