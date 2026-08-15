import React from "react";

/**
 * STRUDS-style Table of Contents with leader dots and section page anchors.
 * Page numbers are illustrative print positions — actual paginated numbers
 * appear via the @page counter footer.
 */
export interface TOCEntry {
  sn: string;
  label: string;
  href: string;
  page?: string;
}

export function StrudsTOC({ entries }: { entries: TOCEntry[] }) {
  return (
    <section className="struds-toc">
      <div className="toc-eyebrow">Contents</div>
      <h1>Table of Contents</h1>
      <div className="struds-toc-list">
        {entries.map((e, idx) => (
          <a
            key={idx}
            href={"#" + e.href}
            className="struds-toc-leader"
            style={{ textDecoration: "none" }}
          >
            <span className="sn">{e.sn}</span>
            <span className="lbl">{e.label}</span>
            <span className="dots" />
            <span className="pg">{e.page ?? ""}</span>
          </a>
        ))}
      </div>
    </section>
  );
}
