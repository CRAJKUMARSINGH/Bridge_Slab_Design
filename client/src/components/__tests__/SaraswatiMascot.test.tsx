/**
 * @vitest-environment jsdom
 *
 * Ported from CODE-JUNCTION/00 FOR ALL APPS/SARASWATI.test.tsx.
 *
 * Three things the source artefact could not carry as written:
 *   1. its import path — `../../client/src/components/SaraswatiMascot.tsx`
 *      assumed a checkout layout this repo never had, and the component did not
 *      exist at all until it was created alongside this file;
 *   2. its environment — every other vitest lane here runs on `node`, and
 *      `render()` needs a DOM, so the environment is pinned per file instead of
 *      flipping the global default for the 16 lanes that do not want a DOM;
 *   3. its `import * as mockDependencies from './__mocks__/mock-dependencies'` —
 *      an unused import of a module that was never shipped. Dropped rather than
 *      given an empty stand-in, because an empty mock exists only to keep dead
 *      code compiling.
 */
import { describe, it, expect, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { SARASWATI } from '../SaraswatiMascot';

/**
 * Testing Library only self-registers cleanup when `afterEach` is a global,
 * which holds under Jest but not under vitest's default (globals: false). Without
 * this, every render stays mounted and the second test's `getByAltText` matches
 * the first test's mascot as well as its own.
 */
afterEach(cleanup);

/**
 * The emitted asset URL is vite's, not the component's: `saraswati.jpg` is
 * imported so the bundler can fingerprint it, and the resolved `src` is whatever
 * that transform produces. Pinning it in a snapshot would assert the bundler's
 * output path rather than the mascot's markup, so a change there would fail a
 * test about this component. Normalising it keeps the snapshot about the mascot.
 */
const normalise = (el: Element) => el.outerHTML.replace(/src="[^"]*saraswati[^"]*"/i, 'src="[asset]"');

describe('SARASWATI Component', () => {
  it('renders without crashing', () => {
    const { container } = render(<SARASWATI />);
    expect(container).toBeTruthy();
  });

  it('handles basic props correctly', () => {
    const { container, getByText, getByAltText } = render(
      <SARASWATI message="Consult the guide." size="sm" />,
    );
    expect(container).toBeTruthy();
    expect(getByAltText('Saraswati, the design guide')).toBeInTheDocument();
    expect(getByText('Consult the guide.')).toBeInTheDocument();
  });

  it('matches snapshot', () => {
    const { container } = render(<SARASWATI />);
    expect(normalise(container.firstChild as Element)).toMatchSnapshot();
  });
});
