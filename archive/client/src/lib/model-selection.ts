export type MergeModel = 'A' | 'B';
import { useModelStore } from '@/stores/useModelStore';

export function readSelectedModel(): MergeModel {
  const { activeModel } = useModelStore.getState();
  return activeModel === 'model-b' ? 'B' : 'A';
}

export function writeSelectedModel(model: MergeModel): void {
  useModelStore.getState().setModel(model === 'B' ? 'model-b' : 'model-a');
}
