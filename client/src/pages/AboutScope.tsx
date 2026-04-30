export function AboutScope() {
  return (
    <div className="glass-panel p-6 md:p-8">
      <h2 className="text-xl font-semibold text-app-fg">Current Drawing Scope</h2>
      <p className="mt-2 text-sm text-app-muted">
        This page clarifies what the drawing module currently delivers, and what is intentionally not implemented yet.
      </p>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/10 p-4">
          <h3 className="text-sm font-semibold text-app-fg">Available now</h3>
          <ul className="mt-2 space-y-1 text-sm text-app-muted">
            <li>Live SVG drawings rendered directly from current design inputs.</li>
            <li>Plan GAD export as `.dxf` for opening in AutoCAD.</li>
            <li>Pier, abutment, and slab visual output currently via SVG routes.</li>
          </ul>
        </div>

        <div className="rounded-xl border border-amber-500/25 bg-amber-500/10 p-4">
          <h3 className="text-sm font-semibold text-app-fg">What drawings are NOT (yet)</h3>
          <ul className="mt-2 space-y-1 text-sm text-app-muted">
            <li>No reinforcement bar bending schedule as a printable PDF.</li>
            <li>No cross-section at each pier location.</li>
            <li>No wing wall / return wall drawings.</li>
            <li>No foundation plan drawing.</li>
            <li>No AutoCAD DXF for pier or abutment (only plan GAD is DXF).</li>
            <li>No longitudinal section with soil strata.</li>
          </ul>
        </div>
      </div>

      <p className="mt-6 text-xs text-app-muted">
        Scope note: SVG drawings render live in the browser from your design inputs. DXF downloads as a `.dxf` file you can open in AutoCAD.
      </p>
    </div>
  );
}
