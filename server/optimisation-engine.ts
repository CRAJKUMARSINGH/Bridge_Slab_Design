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
 * Iteratively optimises bridge dimensions based on structural and stability compliance.
 * Follows the 1:2 ratio increment logic defined in PIER ABUT OPTIMISATION.md
 */
export async function optimiseBridgeDesign(input: ProjectInput): Promise<OptimisationResult> {
  let currentInput = { ...input };
  const trials: OptimisationResult['trials'] = [];
  const MAX_ITERATIONS = 50;
  
  let success = false;
  let message = '';

  for (let i = 1; i <= MAX_ITERATIONS; i++) {
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

  if (!success) {
    message = 'Could not reach a safe design within maximum iterations.';
  }

  return {
    success,
    original: input,
    optimised: currentInput,
    trials,
    message
  };
}
