import { Toaster } from 'sonner';
import { useTheme } from '@/lib/theme-context';

export function ThemedToaster() {
  const { theme } = useTheme();
  return <Toaster position="top-right" richColors theme={theme} closeButton />;
}
