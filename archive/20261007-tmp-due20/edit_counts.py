import io
import re

def load(p):
    return io.open(p, encoding='utf-8', newline='').read()

def save(p, t):
    io.open(p, 'w', encoding='utf-8', newline='').write(t)

NEWB = '**25 comparison lines / 33 literal occurrences across 10 files** (19 distinct values)'

P = 'august-due.md'
t = load(P)

n1 = t.count('**28 comparison lines / 34 literals across 10 files**')
t = t.replace('**28 comparison lines / 34 literals across 10 files**', NEWB)
n2 = t.count('**28 lines / 34 literals across 10 files**')
t = t.replace('**28 lines / 34 literals across 10 files**',
              '**25 comparison lines / 33 literal occurrences across 10 files** (19 distinct values) as the gate measures it')
n3 = t.count('28 comparison lines / 34 literals')
t = t.replace('28 comparison lines / 34 literals', '25 comparison lines / 33 literal occurrences')

assert n1 == 4 and n2 == 1 and n3 == 1, (n1, n2, n3)

# AB-1: record why two scans of the same thing differ
AB1_TAIL = ('most of them the seismic band or the report model. | Corrected here rather than re-stated quietly')
assert t.count(AB1_TAIL) == 1
t = t.replace(AB1_TAIL,
              'most of them the seismic band or the report model. **A second correction, against this turn\'s own first count:** the hand scan '
              '(`tmp-due21-fosscan.txt`) reported 28 lines / 34 literals across *9* files, and the gate\'s matcher reports 25 / 33 across 10. '
              'The delta is two named things -- `AbutmentStability.tsx` contributed 6 lines by hand but 2 under the gate, because four of those six are '
              'print-only strings the operator-adjacency rule refuses (`(req >= 1.5)` exposes the token `req`, and the `>= 1.50` in JSX text carries no '
              'matchable variable), and `OptimisationAtAGlance.tsx` (1 line / 3 literals) was absent from the hand list. The register quotes the gate, '
              'because the gate recomputes on every run; `measure-client-thresholds.ts` reproduces the figure. '
              '| Corrected here rather than re-stated quietly')

# T31 read-back: admit the same failure mode one level up
T31_ANCHOR = "and AB-1 corrects AA-6's \"42\" from the same measurement."
assert t.count(T31_ANCHOR) == 1
t = t.replace(T31_ANCHOR,
              T31_ANCHOR +
              ' AB-1 also corrects **this turn\'s own first count** -- a hand scan of 28 / 34 across 9 files against the gate\'s 25 / 33 across 10, which is '
              'the same failure mode one level up: a manual sweep missing a file while counting strings the rule does not match. '
              '`archive/20261007-tmp-due20/measure-client-thresholds.ts` reproduces the quoted figure, so every count in §AB is the gate\'s, not a sentence\'s.')

save(P, t)

C = 'CREAT-CHATLOG.MD'
c = load(C)
m1 = c.count('**28 comparison lines / 34 literals across 10 files**')
c = c.replace('**28 comparison lines / 34 literals across 10 files**', NEWB)
m2 = c.count('28 comparison lines / 34 literals')
c = c.replace('28 comparison lines / 34 literals', '25 comparison lines / 33 literal occurrences')
assert m1 == 1 and m2 == 1, (m1, m2)

LESSON = 'A gate that finds what the human missed is the argument for gating rather than typing.'
assert c.count(LESSON) == 1
c = c.replace(LESSON, LESSON + ' The lesson repeated itself before this entry was written: the register\'s first DUE-21 count -- 28 lines / 34 literals '
              'across 9 files, from a hand-written scan -- did not match the gate\'s own matcher either. Re-running that regex as '
              '`measure-client-thresholds.ts` gives **25 / 33 across 10**: four of `AbutmentStability.tsx`\'s six lines are print-only strings the adjacency '
              'rule refuses, and `OptimisationAtAGlance.tsx` was missing from the hand list. §AB-1 now carries the correction, because a count that has to be '
              'restated by hand is exactly the thing this turn was supposed to stop doing.')
save(C, c)

left = len(re.findall(r'28 (?:comparison )?lines / 3[34] ', t)) + len(re.findall(r'28 (?:comparison )?lines / 3[34] ', c))
print('register+chatlog stale "28/34" claims remaining (should be the 3 deliberate historical mentions):', left)
