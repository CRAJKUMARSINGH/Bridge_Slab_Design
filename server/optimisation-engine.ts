import { ProjectInput } from '../bridge-excel-generator/types';
import { calculateCompleteDesign } from '../bridge-excel-generator/design-engine';

export interface OptimisationResult {
  success: boolean;
  original: ProjectInput;
  optimised: ProjectInput;
  trials: {
    iteration: number;
    dimensions: { width: number; length: number; height?: number };
    status: string;
    costIndex: number;
  }[];
  message: string;
}

/**
 * Bounded because this runs inside the API process: every trial is a full synchronous
 * recalculation (~4 ms measured), so without a budget a caller-supplied input could pin
 * the event loop for the whole request.
 */
export interface OptimisationBudget {
  maxIterations?: number;
  deadlineMs?: number;
}

const DEFAULT_MAX_ITERATIONS = 50;
const DEFAULT_DEADLINE_MS = 5_000;

/**
 * Iteratively optimises bridge dimensions based on structural and stability compliance.
 * Follows the 1:2 ratio increment logic defined in PIER ABUT OPTIMISATION.md
 */
export async function optimiseBridgeDesign(
  input: ProjectInput,
  budget: OptimisationBudget = {}
): Promise<OptimisationResult> {
  let currentInput = { ...input };
  const trials: OptimisationResult['trials'] = [];
  const maxIterations = budget.maxIterations ?? DEFAULT_MAX_ITERATIONS;
  const deadline = Date.now() + (budget.deadlineMs ?? DEFAULT_DEADLINE_MS);

  let success = false;
  let message = '';

  for (let i = 1; i <= maxIterations; i++) {
    // Yield between trials so the bounded loop cannot starve other requests.
    await new Promise<void>((resolve) => setImmediate(resolve));
    if (Date.now() > deadline) {
      message = `Stopped at iteration ${i - 1}: ${DEFAULT_DEADLINE_MS} ms compute budget exhausted before a safe design was reached.`;
      break;
    }
    const design = calculateCompleteDesign(currentInput);
    
    // Check if everything is safe
    const isPierSafe = design.pier.loadCases.every(c => c.status === 'SAFE');
    const isAbutSafe = design.abutmentType1.loadCases.every(c => c.status === 'SAFE');
    
    const costIndex = (currentInput.pierWidth * currentInput.pierLength) + 
                      (currentInput.abutmentWidth * currentInput.abutmentHeight);

    trials.push({
      iteration: i,
      dimensions: { 
        width: currentInput.pierWidth, 
        length: currentInput.pierLength 
      },
      status: (isPierSafe && isAbutSafe) ? 'SAFE' : 'UNSAFE',
      costIndex
    });

    if (isPierSafe && isAbutSafe) {
      success = true;
      message = `Optimisation successful at iteration ${i}.`;
      break;
    }

    // If unsafe, increment
    // Pier: 250mm width, 500mm length (1:2 ratio)
    if (!isPierSafe) {
      currentInput.pierWidth += 0.25;
      currentInput.pierLength += 0.50;
    }

    // Abutment: 250mm width, 500mm depth (as per general 1:2 logic in MD)
    if (!isAbutSafe) {
      currentInput.abutmentWidth += 0.25;
      currentInput.abutmentDepth += 0.50;
    }
  }

  if (!success && !message) {
    message = `Could not reach a safe design within ${maxIterations} iterations.`;
  }

  return {
    success,
    original: input,
    optimised: currentInput,
    trials,
    message
  };
}
