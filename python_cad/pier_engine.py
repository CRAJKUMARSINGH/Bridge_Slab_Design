import os
import ezdxf
from ezdxf.gfxattribs import GfxAttribs
from ezdxf.enums import TextEntityAlignment

_LAYER_SPEC = [
    # (name,                color, linetype,  description)
    ("STRUCTURE",           7,     "CONTINUOUS", "Main structural concrete outlines"),
    ("REINFORCEMENT",       1,     "CONTINUOUS", "Reinforcing bar centrelines and cages"),
    ("DIMENSIONS",          3,     "CONTINUOUS", "Dimension strings, leaders and ticks"),
    ("HATCHING",            8,     "CONTINUOUS", "Sectional hatching and solid fills"),
    ("TEXT_ANNOT",          7,     "CONTINUOUS", "Text notes, labels and callouts"),
    ("HFL_LEVEL",           1,     "DASHED",     "Highest Flood Level reference line"),
    ("SCOUR_LEVEL",         2,     "DASHED",     "Design scour depth reference line"),
    ("BED_LEVEL",           3,     "DASHED",     "Average / Normal bed level line"),
    ("GEOMETRY",            5,     "CONTINUOUS", "Construction / setting-out geometry"),
    ("FOUNDATION",          6,     "CONTINUOUS", "Footing, pile and founding geometry"),
    ("PIER",                4,     "CONTINUOUS", "Pier stem and cap beam outlines"),
    ("ABUTMENT",            6,     "CONTINUOUS", "Abutment stem, wing and return walls"),
    ("WINGWALL",            2,     "CONTINUOUS", "Wing-wall and return-wall details"),
    ("SECTIONS",            1,     "PHANTOM",    "Section and cut-plane markers"),
    ("PLAN_VIEW",           5,     "CONTINUOUS", "Plan-view arrangement geometry"),
    ("GAD",                 7,     "CONTINUOUS", "General Arrangement Drawing title block"),
]


class PierParametricEngine:
    """
    Generates parametric pier drawings based on master inputs.

    Output conventions:
    - DXF version AC1021 (AutoCAD 2007 / LT 2007) — the most widely
      compatible format accepted by every Indian CAD package used in
      PWD / R&B / MORTH offices.
    - All 16 engineering layers are pre-registered with colour,
      linetype and a description so that imported drawings display
      correctly on first open.
    - `doc.save()` writes with ezdxf's default encoding; ezdxf handles
      `\r\n` line endings automatically when producing the binary
      DXF, so no manual line-ending fixup is needed.
    """

    def __init__(self, output_dir: str = "output"):
        self.output_dir = output_dir

    def generate_dxf(self, params: dict) -> str:
        """
        Generates a DXF based on the JSON contract parameters.
        params expected keys:
        - project_name (str, optional)
        - pier_type (str)
        - height (float)  — mm or units as passed
        - width (float)
        - columns (int)
        - stem_thickness (float)
        - cap_beam_depth (float)
        - foundation_type (str)
        - units (str, optional)  — e.g. "mm", "m"; used only in the title
        """
        os.makedirs(self.output_dir, exist_ok=True)

        # AC1021 for broadest AutoCAD / BricsCAD / ZWCAD compatibility
        # across the PWD ecosystem. Setting `setup=True` pre-populates
        # LTSCALE, INSUNITS, and a basic paperspace viewport so files
        # open with sensible defaults.
        doc = ezdxf.new(dxfversion="AC1021", setup=True)

        # Units header — AutoCAD and clones interpret INSUNITS so
        # dimension styles display the drawing correctly. 4 = mm,
        # 6 = m; default to mm when the caller didn't specify.
        units_in = (params.get("units") or "mm").lower()
        insunits = 6 if units_in.startswith("m") else 4
        doc.header["$INSUNITS"] = insunits
        doc.header["$LTSCALE"] = 1.0
        doc.header["$DIMSCALE"] = 1.0

        self._setup_layers(doc)
        self._write_title_block(doc, params)

        msp = doc.modelspace()

        p_type = params.get("pier_type", "single_column")
        h = params.get("height", 8000)
        w = params.get("width", 2000)
        c = params.get("columns", 1)

        if p_type == "wall_type":
            self._draw_wall_pier(msp, h, w)
        else:
            self._draw_column_pier(msp, h, w, c)

        output_path = os.path.join(self.output_dir, "generated_pier.dxf")
        doc.saveas(output_path)
        return output_path

    def _setup_layers(self, doc):
        """Register every layer with a linetype, colour and description."""
        for name, color, linetype, description in _LAYER_SPEC:
            layer_entry = doc.layers.add(name)
            layer_entry.color = color
            try:
                layer_entry.linetype = linetype
            except ValueError:
                # Fallback if the table somehow lacks the linetype definition
                layer_entry.linetype = "CONTINUOUS"
            try:
                layer_entry.description = description
            except Exception:
                # ezdxf < 1.0 lacks description; silently skip.
                pass

    def _write_title_block(self, doc, params: dict) -> None:
        """Write project-level metadata into the DXF $EXTMIN / HEADER area
        so downstream reviewers and sheet-indexing tools can read it."""
        project = params.get("project_name") or params.get("pier_type") or "Unnamed Pier"
        doc.header["$PROJECTNAME"] = str(project)

        # A single GAD-layer text entity at the origin acts as a title
        # block anchor that drawings packages can pick up.
        msp = doc.modelspace()
        attribs = GfxAttribs(layer="GAD")
        try:
            msp.add_text(
                f"BRIDGE PIER - {project}",
                dxfattribs={
                    "layer": attribs.layer,
                    "height": max(params.get("height", 8000) / 80.0, 100.0),
                },
            ).set_placement((0, params.get("height", 8000) + 500), align=TextEntityAlignment.LEFT)
        except Exception:
            # Text placement helpers differ slightly across ezdxf versions;
            # fall back to a basic add_text so the file is still usable.
            msp.add_text(
                f"BRIDGE PIER - {project}",
                dxfattribs={"layer": attribs.layer, "height": 200},
            )

    def _draw_wall_pier(self, msp, height, width):
        attribs = GfxAttribs(layer="PIER")
        msp.add_lwpolyline(
            [(0, 0), (width, 0), (width, height), (0, height)],
            close=True,
            dxfattribs=attribs,
        )

    def _draw_column_pier(self, msp, height, width, cols):
        attribs = GfxAttribs(layer="PIER")
        col_width = width / (cols * 2)
        spacing = width / cols
        for i in range(cols):
            x_start = i * spacing + (spacing - col_width) / 2
            msp.add_lwpolyline(
                [
                    (x_start, 0),
                    (x_start + col_width, 0),
                    (x_start + col_width, height),
                    (x_start, height),
                ],
                close=True,
                dxfattribs=attribs,
            )
