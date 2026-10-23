# E-08 FOOTING — pressure redistribution, moment, shear
Method: VK Raina Ch.14 pressure redistribution (Fig. 14.2 / 14.3).

## Chain
1. e = M / P per axis; if e > L/6 redistribute:
     el = L/2 - e ;  lf = 3 * el
     eb = B/2 - e_b ;  lb = 3 * eb
2. K = (L - lf) / L ;  y = ... ; area in tension excluded
3. Trapezoidal stress diagram over the compressed length -> centroid
4. Cantilever moment about the pier face from that diagram
5. R, k, j for the concrete grade; Ast = M / (j * d * sigma_st)
6. Distribution steel >= 2000 mm2
7. Shear at d from the face, tau_v = V / (b*d), tau_c from the table, stirrups
   Asv = 0.4 * b * sv / (0.87 * fy), sv <= min(0.75d, 300)   [IRC:21 cl.304.7]

## Oracle
SOM-KHW footing Pmax 137.304 kN/m2. Ayad footing workbook as a third case.

## Edge cases
e > L/2 -> reject. e <= L/6 -> uniform, no redistribution. Negative pressure ->
redistribute, never clamp to 0 silently.

## Tests
Assert redistribution triggers exactly at e > L/6. Assert the stress diagram area
equals P. Assert Ast is monotonic in M. Assert distribution steel never below 2000 mm2.
