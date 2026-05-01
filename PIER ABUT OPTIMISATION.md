Design has data >>>>coefficients or parameters >>>
Length, breadth, width, numbers and situations like >>>> in example excel workbooks having formulae visible >>>>if any data is hardcore (not a result of any previous computation) >>>it can be coefficient or assumed/ adopted variable >>>>>ASSUMED VARIABLE VALUE LATER BECOMES ADOPTED VARIABLE VALUE PROVIDED IT SATISFIES>>>1. structural STRESS COMPLIANCE 2 ECONOMY >>>>SOME TIMES TRIAL AND ERROR IS USED FOR OPTIMISATION >>>

I THOUGH I HAVE A BRILLIANT TESTED IDES >>>>>in pier stability user gives increment of 250 mm in pier width and 500 mmin pier length >>>>or reduces in same a:2 ratio till the stresses are optimisely safe }}}}}}}} in hydraulics >>>user opts span length and no. of spans for the afflux hfl passes just near the soffit of submersible bridge >>>>for hfl it will be suitable free herad >>>>>IN GRAVITY ABUT TOE SIZE IS INCREASED IN INCREMENTS OF 25 MM AND HEEL IN INCREMENT OF 50 MM (1:2) TILL STRESSES ARE SAFE >>>>>REDUCTION IN SAME MANNER >>>SAME FOR CANTILEVER BRIDGE >>>>>USER MODIFICATION>>>RECALCULATION WINDOWS CAN BE DESIGN FRO OPTIMISATION AT A GLANCE >>>PLEASE HELP
>>>>>>give this idea a brilliant prompt shape
yes for all oine by one

Create an intelligent civil/structural design optimization software module where all engineering design data is classified into:

Input Parameters → fixed user inputs such as span, loading, HFL, SBC, material grades, pier height, wall height, roadway width, etc.
Assumed Variables → trial dimensions like width, length, toe, heel, thickness, number of spans, etc.
Derived Results → stresses, overturning ratio, sliding factor, bearing pressure, afflux, discharge capacity, economy index, quantities, cost.
Adopted Variables → assumed values that successfully satisfy all design checks and are economical.

The software should mimic expert engineering trial-and-error optimization used in practice.

Core Optimization Logic
General Principle

Any assumed variable becomes an Adopted Design Value only when it satisfies:

Structural stress compliance
Stability safety factors
Hydraulic requirements
Code provisions
Practical constructability
Minimum cost / economy
Module 1: Pier Stability Optimization

For bridge piers:

User enters starting pier width and length.
Program automatically increases dimensions in this ratio:
Width increment = 250 mm
Length increment = 500 mm (1:2 ratio)

OR decreases in same ratio if over-safe and uneconomical.

At each iteration calculate:

Direct stress
Eccentricity
Max/min base pressure
Sliding
Overturning
Reinforcement demand
Concrete quantity
Cost index

Goal: smallest safe and economical pier size.

Module 2: Hydraulic Span Optimization (Submersible Bridge / Causeway)

User enters:

Trial span length
Number of spans
Waterway width
HFL / afflux criteria

Software iterates span arrangement until:

Afflux remains within allowable limit
HFL passes near soffit for submersible bridge
Adequate freeboard for non-submersible bridge
Velocity within permissible range
Economical number of spans

Show multiple alternatives ranked by cost and safety.

Module 3: Gravity Abutment Optimization

Trial dimensions adjusted automatically:

Toe increment = 25 mm
Heel increment = 50 mm (1:2 ratio)

Recalculate after each iteration:

Resultant location
Base pressure
Tension check
Overturning safety
Sliding safety
Section stresses
Quantity and cost

Increase or reduce dimensions until optimum safe section is reached.

Module 4: Cantilever Retaining Wall / Abutment Optimization

Auto-adjust:

Base slab width
Toe / heel proportion
Stem thickness
Counterfort spacing (if needed)

Check:

Soil pressure
Stem moments
Shear
Stability
Reinforcement economy
User Interface Concept
Interactive Recalculation Window

A live dashboard where user changes any variable and instantly sees:

Trial No	Dimensions	Stress Status	Stability	Quantity	Cost	Rank

Color coding:

Green = Safe & economical
Yellow = Safe but costly
Red = Unsafe
Smart Features
Auto-trial engine
Manual override mode
Compare 10 alternatives instantly
Graph of safety vs cost
Sensitivity analysis
Excel export with visible formula sheets
Printable design report
IS code based checks
Final Vision

Develop software that behaves like an experienced Executive Engineer who keeps modifying dimensions until the design becomes:

Safe + Code Compliant + Practical + Economical + Elegant

One-Line Premium Prompt

Build an AI-powered civil engineering design optimizer that uses iterative trial dimensions (1:2 increment logic), checks structural/hydraulic safety in real time, compares alternatives, and automatically selects the most economical safe design.

My Honest Opinion

Your idea is very strong and commercially practical. Most engineering software only checks design. Your concept optimizes design like a real engineer. That is rare and valuable.

If you want, I can also convert this into a full software blueprint for STRUDS / Excel VBA / Python / Windows EXE civil design suite.
>>>>>>>>>>>>>>
Recommended Development Roadmap (Best Order)
Phase 1: Core Engine
Excel VBA Prototype
Fastest way to test formulas, trial iterations, visible calculations, reports.
Python Design Engine
Cleaner logic, optimization loops, future AI integration.
Windows EXE Desktop App
Standalone software for engineers (no Excel required).
Advanced Commercial Suite
Database + drawings + reports + multi-project management.
Modules We Will Build One by One
Module A — Pier Stability Optimizer
Auto increase/decrease width & length (250 / 500 mm)
Stress checks
Stability checks
Quantity + cost
Best section suggestion
Module B — Hydraulic Bridge Span Optimizer
Span length + no. of spans trials
Waterway adequacy
Afflux checks
HFL vs soffit
Best economical arrangement
Module C — Gravity Abutment Optimizer
Toe + heel auto sizing (25 / 50 mm)
Base pressure
Overturning/sliding
Quantity economy
Module D — Cantilever Retaining / Abutment Optimizer
Stem/base sizing
Reinforcement demand
Safe + economical design
Module E — Universal Recalculation Dashboard
Change any variable
Instant redesign
Compare alternatives
Color safety alerts
My Suggestion: Start with Excel VBA First

Because:

Fastest prototype
Formula visibility
Easy trial-and-error tables
Already familiar to engineers
Can later convert to EXE
Step-by-Step Plan
Step 1

Create Pier Stability Optimizer Excel Workbook

Step 2

Then Gravity Abutment Workbook

Step 3

Then Hydraulic Span Workbook

Step 4

Merge all into one Civil Design Suite

What I Need From You for First Module

Send only:

Pier type (circular / rectangular / wall type)
Load inputs available? (DL, LL, impact etc.)
Foundation type (open / well / pile / raft)
Design code used (IRC / IS / Rajasthan PWD style)
Excel preferred or EXE preferred first?
My Strong Recommendation

Start with Rectangular Bridge Pier Stability Optimizer (Excel VBA).
It is easiest and powerful showcase module. >>>>>>>>>
MODULE 1 — RECTANGULAR BRIDGE PIER OPTIMIZER

(Excel VBA + future EXE compatible)

Objective

Automatically optimize bridge pier dimensions by:

Increasing / decreasing size
Checking stresses
Checking stability
Finding economical section
User Inputs Sheet
Fixed Inputs
Parameter	Unit
Pier Height	m
Dead Load from Superstructure	kN
Live Load	kN
Braking / Seismic / Wind Horizontal Load	kN
SBC of Soil	kN/m²
Concrete Grade	M30 etc
Unit Weight Concrete	kN/m³
Water Level / Scour Level	m
Trial Dimensions
Parameter	Initial
Pier Width B	1.50 m
Pier Length L	3.00 m

Increment logic:

Width change = 0.25 m
Length change = 0.50 m

(1:2 ratio)

Calculations Each Trial
Vertical Load
P=DL+LL+SelfWeight
Self Weight
W=B×L×H×γ
c
	​

Moment at Base
M=H
load
	​

×h
Eccentricity
e=
P
M
	​

Base Area
A=B×L
Direct Stress
σ
d
	​

=
A
P
	​

Max / Min Soil Pressure
σ
max
	​

=
A
P
	​

(1+
B
6e
	​

)
σ
min
	​

=
A
P
	​

(1−
B
6e
	​

)
Safety Checks
Must satisfy:

✅ σmax ≤ SBC
✅ σmin ≥ 0
✅ e ≤ B/6
✅ Sliding FOS ≥ 1.5
✅ Overturning FOS ≥ 2.0

Optimization Logic
If Unsafe:

Increase:

B = B + 0.25
L = L + 0.50
If Too Safe / Uneconomical:

Reduce dimensions similarly.

Final Output:

Smallest safe section.

Excel Workbook Structure
Sheet 1 — INPUT

User enters loads and starting dimensions.

Sheet 2 — TRIAL TABLE

| Trial | B | L | σmax | σmin | Sliding | O/T | Qty | Status |

Sheet 3 — BEST DESIGN

Final adopted dimensions.

VBA Macro Logic
For i = 1 To 100

Calculate stresses

If Safe Then
Store result
Reduce size for economy trial
Else
Increase size
End If

Next i
Smart Dashboard

Green = Safe
Red = Unsafe
Yellow = Safe but costly

Next Step (Need from You)

Please give one real pier example:

Height = ? m
DL = ? kN
LL = ? kN
Horizontal load = ? kN
SBC = ? kN/m²

Then I will create real Excel sheet formulas + ready VBA code.

Just send:

PIER DATA: followed by values.
>>>>
Excellent. Using your real data, I’ll now prepare the Pier Stability Optimizer – Trial Design Calculation.

Given Data
Parameter	Value
Pier Height	6 m
DL	4200 kN
LL	1800 kN
Horizontal Load	250 kN
Load Height	5.5 m
SBC	300 kN/m²
Concrete Unit Weight	25 kN/m³
Initial Width B	1.5 m
Initial Length L	3.0 m
Code	IRC
Step 1: Self Weight of Pier
W=B×L×H×γ

W=B×L×H×γ

For initial size:

W=1.5×3.0×6×25=675 kN
Step 2: Total Vertical Load
P=DL+LL+W

P=DL+LL+W

P=4200+1800+675=6675 kN
Step 3: Horizontal Moment at Base
M=H×h

M=H×h

M=250×5.5=1375 kN\cdotpm
Step 4: Eccentricity
e=
P
M
	​


e=
P
M
	​


e=
6675
1375
	​

=0.206 m
Step 5: Base Area
A=B×L=1.5×3=4.5 m
2
Step 6: Average Pressure
A
P
	​

=1483 kN/m
2
Step 7: Check vs SBC

Allowed SBC = 300 kN/m²

Result: Unsafe (heavily overstressed)

Conclusion on Initial Trial (1.5 × 3.0 m)

❌ Not safe
❌ Bearing pressure too high
❌ Need larger base dimensions

Auto Optimization by Your Logic

(Width +250 mm, Length +500 mm)

Trial Table
Trial	B (m)	L (m)	Area m²	Avg Pressure
1	1.5	3.0	4.50	1483
2	1.75	3.5	6.13	1089
3	2.0	4.0	8.00	834
4	2.25	4.5	10.13	659
5	2.5	5.0	12.50	534
6	2.75	5.5	15.13	441
7	3.0	6.0	18.00	371
8	3.25	6.5	21.13	316
9	3.5	7.0	24.50	273
First Safe Approx Trial
Adopted Size:
3.5 m × 7.0 m

Because average pressure drops below SBC.

Engineering Comment

This indicates your load is very heavy compared to starting pier size. Realistically:

Combined footing / pile foundation may be better
Multiple columns or twin piers possible
Open foundation may become uneconomical
Excel Formula Setup
Cells
B2 = Width
B3 = Length
B4 = Height
B5 = DL
B6 = LL
B7 = Horizontal Load
B8 = Load Height
B9 = SBC
Formulas
B10 = =B2*B3*B4*25
B11 = =B5+B6+B10
B12 = =B7*B8
B13 = =B12/B11
B14 = =B2*B3
B15 = =B11/B14
VBA Auto Trial Macro
Sub OptimizePier()

B = 1.5
L = 3

Do While True

Area = B * L
SW = B * L * 6 * 25
P = 4200 + 1800 + SW
Stress = P / Area

If Stress <= 300 Then Exit Do

B = B + 0.25
L = L + 0.5

Loop

MsgBox "Safe Size = " & B & " m x " & L & " m"

End Sub
My Expert Suggestion

Your optimization logic is excellent. Next improvement:

✅ Include eccentricity pressure
✅ Include overturning
✅ Sliding check
✅ Cost minimization

Next Step Options

Reply:

1. MAKE ADVANCED PIER VBA

(Full professional optimizer)

2. MAKE EXCEL FILE LAYOUT
3. PILE FOUNDATION VERSION
4. NEXT MODULE ABUTMENT
STEP 1 — ADVANCED PIER VBA OPTIMIZER

(Professional Engineering Version)

Features Included

✅ Auto trial dimensions (0.25 m / 0.50 m increments)
✅ Self weight included
✅ Bearing pressure check
✅ Eccentricity check
✅ Max / Min pressure
✅ Sliding check
✅ Overturning check
✅ Quantity estimate
✅ Best economical safe size
✅ Trial-by-trial output sheet

Excel Sheet Assumption
INPUT SHEET Values
Cell	Meaning
B2	Start Width
B3	Start Length
B4	Height
B5	DL
B6	LL
B7	Horizontal Load
B8	Load Height
B9	SBC
B10	Friction Coefficient (0.5 default)
VBA CODE
Sub AdvancedPierOptimizer()

Dim B As Double, L As Double, H As Double
Dim DL As Double, LL As Double, HL As Double
Dim hLoad As Double, SBC As Double, Mu As Double
Dim SW As Double, P As Double, M As Double
Dim Area As Double, e As Double
Dim Smax As Double, Smin As Double
Dim Sliding As Double, OT As Double
Dim Qty As Double
Dim i As Integer, row As Integer

Sheets("TRIAL").Cells.ClearContents

B = Sheets("INPUT").Range("B2")
L = Sheets("INPUT").Range("B3")
H = Sheets("INPUT").Range("B4")
DL = Sheets("INPUT").Range("B5")
LL = Sheets("INPUT").Range("B6")
HL = Sheets("INPUT").Range("B7")
hLoad = Sheets("INPUT").Range("B8")
SBC = Sheets("INPUT").Range("B9")
Mu = Sheets("INPUT").Range("B10")

row = 2

For i = 1 To 100

SW = B * L * H * 25
P = DL + LL + SW
M = HL * hLoad

Area = B * L
e = M / P

Smax = (P / Area) * (1 + (6 * e / B))
Smin = (P / Area) * (1 - (6 * e / B))

Sliding = (Mu * P) / HL
OT = (P * B / 2) / M

Qty = B * L * H

Sheets("TRIAL").Cells(row, 1) = i
Sheets("TRIAL").Cells(row, 2) = B
Sheets("TRIAL").Cells(row, 3) = L
Sheets("TRIAL").Cells(row, 4) = Smax
Sheets("TRIAL").Cells(row, 5) = Smin
Sheets("TRIAL").Cells(row, 6) = Sliding
Sheets("TRIAL").Cells(row, 7) = OT
Sheets("TRIAL").Cells(row, 8) = Qty

If Smax <= SBC And Smin >= 0 And Sliding >= 1.5 And OT >= 2 Then
    Sheets("TRIAL").Cells(row, 9) = "SAFE"
    MsgBox "Best Safe Pier = " & B & " m x " & L & " m"
    Exit Sub
Else
    Sheets("TRIAL").Cells(row, 9) = "UNSAFE"
End If

B = B + 0.25
L = L + 0.5
row = row + 1

Next i

MsgBox "No Safe Size Found"

End Sub
>>>>>>>>>>>>>>>>>>>>
STEP 2 — EXCEL FILE LAYOUT

Pier Stability Optimizer Workbook (Professional Format)

I’ll give you a ready workbook structure with sheet names, cells, formulas, formatting, and dashboard arrangement so you can build it quickly in Excel.

Workbook Name
PIER_OPTIMIZER_v1.xlsx
Sheets Required
INPUT
TRIAL
BEST DESIGN
CHARTS
REPORT
SHEET 1 — INPUT
Layout
Cell	Label	Value
A1	PIER STABILITY OPTIMIZER	
A2	Start Width B (m)	1.5
A3	Start Length L (m)	3.0
A4	Pier Height H (m)	6
A5	Dead Load DL (kN)	4200
A6	Live Load LL (kN)	1800
A7	Horizontal Load HL (kN)	250
A8	Load Height h (m)	5.5
A9	SBC (kN/m²)	300
A10	Friction Coefficient μ	0.50
A11	Width Increment (m)	0.25
A12	Length Increment (m)	0.50
A13	Concrete Density	25
Formatting
A1 merged to D1
Dark blue heading
Yellow input cells in column B
Borders all around
SHEET 2 — TRIAL
Heading Row
Col	Heading
A	Trial No
B	Width B
C	Length L
D	Area
E	Self Weight
F	Total Load P
G	Moment M
H	Eccentricity e
I	Smax
J	Smin
K	Sliding FOS
L	O/T FOS
M	Qty m³
N	Status
Conditional Formatting
Column N
SAFE = Green
UNSAFE = Red
COSTLY = Yellow
SHEET 3 — BEST DESIGN
Display Box
Cell	Content
B2	Final Width
B3	Final Length
B4	Final Stress
B5	Sliding FOS
B6	O/T FOS
B7	Concrete Qty
B8	Rank

Large bold font.

SHEET 4 — CHARTS
Recommended Charts
Chart 1

Trial No vs Stress

Chart 2

Trial No vs Quantity

Chart 3

Trial No vs Safety Factors

Chart 4

Width vs Cost

SHEET 5 — REPORT

Printable summary:

PROJECT NAME
PIER DESIGN REPORT

Loads:
DL = ...
LL = ...

Adopted Pier Size:
... x ...

Checks:
Stress SAFE
Sliding SAFE
Overturning SAFE
Formula Examples in TRIAL Sheet
Row 2
D2 = B2*C2
E2 = B2*C2*INPUT!B4*25
F2 = INPUT!B5+INPUT!B6+E2
G2 = INPUT!B7*INPUT!B8
H2 = G2/F2
I2 = (F2/D2)*(1+(6*H2/B2))
J2 = (F2/D2)*(1-(6*H2/B2))
K2 = (INPUT!B10*F2)/INPUT!B7
L2 = (F2*B2/2)/G2
M2 = B2*C2*INPUT!B4
N2 = IF(AND(I2<=INPUT!B9,J2>=0,K2>=1.5,L2>=2),"SAFE","UNSAFE")
Buttons to Add
INPUT Sheet
Button 1:

RUN OPTIMIZER

(assign VBA macro)

Button 2:

CLEAR RESULTS

Button 3:

PRINT REPORT

UI Design Suggestion

Use these colors:

Navy Blue headings
Light Yellow inputs
Green safe results
Red unsafe alerts
Grey formulas
Professional Add-ons Later

✅ Auto PDF report
✅ Cost based ranking
✅ Twin pier option
✅ Pile foundation mode
✅ IRC load combinations
>>>>>>>>>>>>>>>>
STEP 3 — PILE FOUNDATION VERSION

Pier Stability Optimizer with Pile Foundation Module
(Professional / Commercial Grade)

This module is ideal when open foundation pier size becomes too large or SBC is low.

Why Pile Foundation Mode?

From your earlier pier example, required open footing size became large. In such cases:

✅ Lower excavation risk
✅ Better for weak soil
✅ Economical for deep strata
✅ Better lateral resistance
✅ Smaller pile cap footprint

Design Philosophy

Loads from pier are transferred to:

Vertical piles
Batter piles (optional)
Pile cap
Group action
User Inputs Sheet (PILE MODE)
Cell	Input	Example
B2	Pier Width	1.5 m
B3	Pier Length	3.0 m
B4	Pier Height	6 m
B5	DL	4200 kN
B6	LL	1800 kN
B7	Horizontal Load	250 kN
B8	Load Height	5.5 m
B9	Pile Safe Capacity	600 kN
B10	Pile Diameter	0.60 m
B11	Initial No. of Piles	6
B12	Spacing	1.8 m
B13	Pile Cap Depth	1.2 m
Core Calculations
Total Load
P=DL+LL+Pier Weight+Cap Weight

P=DL+LL+W
pier
	​

+W
cap
	​


Number of Piles Required
N=
Q
safe
	​

P
	​


N=
Q
safe
	​

P
	​


Round upward to next whole number.

Example Using Your Data

Assume:

Total load ≈ 7000 kN
Safe pile load = 600 kN
N=
600
7000
	​

=11.67

Adopt:

12 piles
Suggested Arrangement
3 × 4 Grid
●   ●   ●   ●
●   ●   ●   ●
●   ●   ●   ●

Spacing = 1.8 m c/c

Horizontal Load Check

Horizontal load = 250 kN handled by:

pile group passive resistance
batter piles optional
pile cap rigidity
Pile Cap Size Approx

If 4 piles in row:

L=(3×spacing)+edge

Approx:

Length = 6.0 m
Width = 4.2 m
Depth = 1.2 m
Excel Workbook Sheets
INPUT_PILE
PILE_TRIAL
PILE_LAYOUT
BEST_PILE_DESIGN
REPORT
VBA Optimizer Logic
Auto Increase / Reduce Piles
Start with 6 piles
Increase by 2 piles each iteration
Check pile load ≤ safe capacity
Check spacing
Check cap economy
Select minimum safe group
VBA CODE
Sub OptimizePileFoundation()

Dim Load As Double, Cap As Double
Dim N As Integer

Load = 7000
Cap = 600
N = 6

Do While True

If (Load / N) <= Cap Then Exit Do

N = N + 2

Loop

MsgBox "Required Piles = " & N

End Sub
Final Result for Your Example
Recommended Preliminary Scheme
Item	Value
No. of Piles	12
Diameter	600 mm
Layout	3 × 4
Spacing	1.8 m
Cap Size	6.0 × 4.2 × 1.2 m
Commercial Upgrade Options

✅ Pile group efficiency
✅ Settlement estimation
✅ Lateral pile analysis
✅ Reinforcement design
✅ Auto pile drawing plan
✅ BOQ report

Engineering Advice

For your heavy load case, pile foundation may be superior to 3.5 × 7.0 open footing.
>>>>>>>>>>>>>>>>>>>>>>>>
STEP 4 — GRAVITY ABUTMENT OPTIMIZER

Based on Your 1:2 Toe/Heel Increment Logic
(Toe +25 mm, Heel +50 mm auto-optimization)

This is a very practical engineering idea because abutment base dimensions are often finalized by repeated trials. We’ll automate that.

Objective

Automatically vary:

Toe by 25 mm increments
Heel by 50 mm increments
(same ratio for reduction if over-safe)

Until the abutment is:

✅ Safe in bearing
✅ No tension at base
✅ Safe against sliding
✅ Safe against overturning
✅ Economical in concrete quantity

User Inputs (INPUT_ABUTMENT Sheet)
Cell	Parameter	Example
B2	Wall Height	6.0 m
B3	Stem Top Thickness	0.60 m
B4	Stem Bottom Thickness	1.20 m
B5	Starting Toe	0.75 m
B6	Starting Heel	1.50 m
B7	Base Slab Thickness	0.80 m
B8	Soil Unit Weight	18 kN/m³
B9	Angle of Repose φ	30°
B10	SBC	250 kN/m²
B11	Friction Coefficient μ	0.50
B12	Concrete Density	25 kN/m³
Core Earth Pressure

Use Rankine active pressure:

K
a
	​

=
1+sinϕ
1−sinϕ
	​


K
a
	​

=
1+sinϕ
1−sinϕ
	​


For φ = 30°:

K
a
	​

=0.333
Horizontal Earth Force
P
a
	​

=
2
1
	​

K
a
	​

γH
2

P
a
	​

=
2
1
	​

K
a
	​

γH
2

Acts at height:

H/3
Stability Checks
Sliding
FOS=
P
a
	​

μW
	​


FOS
sliding
	​

=
P
a
	​

μW
	​


Required ≥ 1.5

Overturning
FOS=
Overturning Moment
Resisting Moment
	​


Required ≥ 2.0

Bearing Pressure
q
max
	​

,q
min
	​


Need:

qmax ≤ SBC
qmin ≥ 0
Optimization Logic (Your Concept)
Unsafe Condition:

Increase:

Toe = Toe + 0.025 m
Heel = Heel + 0.050 m
Over-safe / Heavy:

Reduce:

Toe = Toe − 0.025 m
Heel = Heel − 0.050 m
Trial Table (TRIAL_ABUTMENT)
Trial	Toe	Heel	Base Width	Sliding	O/T	qmax	qmin	Qty	Status
VBA Macro
Sub OptimizeAbutment()

Dim Toe As Double, Heel As Double
Dim H As Double, SBC As Double
Dim Sliding As Double, OT As Double
Dim qmax As Double, qmin As Double
Dim i As Integer

Toe = 0.75
Heel = 1.5

For i = 1 To 100

Call CalculateChecks(Toe, Heel, Sliding, OT, qmax, qmin)

If Sliding >= 1.5 And OT >= 2 And qmax <= 250 And qmin >= 0 Then
    MsgBox "Best Safe Abutment: Toe=" & Toe & " Heel=" & Heel
    Exit Sub
Else
    Toe = Toe + 0.025
    Heel = Heel + 0.05
End If

Next i

End Sub
Suggested Initial Geometry

If stem base thickness = 1.2 m:

Base width:

B=Toe+Stem+Heel

Example:

B=0.75+1.2+1.5=3.45m
Smart Dashboard

Color Codes:

Green = Safe optimum
Yellow = Safe but uneconomical
Red = Unsafe