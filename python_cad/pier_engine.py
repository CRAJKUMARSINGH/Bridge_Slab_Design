import ezdxf
from ezdxf.gfxattribs import GfxAttribs

class PierParametricEngine:
    """
    Generates parametric pier drawings based on master inputs.
    """
    def __init__(self, output_dir: str = "output"):
        self.output_dir = output_dir
        
    def generate_dxf(self, params: dict) -> str:
        """
        Generates a DXF based on the JSON contract parameters.
        params expected keys:
        - pier_type (str)
        - height (float)
        - width (float)
        - columns (int)
        - stem_thickness (float)
        - cap_beam_depth (float)
        - foundation_type (str)
        """
        # Create a new DXF document (AC1021 for max compatibility)
        doc = ezdxf.new(dxfversion="AC1021")
        
        # Setup 16 professional engineering layers
        self._setup_layers(doc)
        
        msp = doc.modelspace()
        
        p_type = params.get("pier_type", "single_column")
        h = params.get("height", 8000)
        w = params.get("width", 2000)
        c = params.get("columns", 1)
        
        if p_type == "wall_type":
            self._draw_wall_pier(msp, h, w)
        else:
            self._draw_column_pier(msp, h, w, c)
            
        output_path = f"{self.output_dir}/generated_pier.dxf"
        doc.saveas(output_path)
        return output_path
        
    def _setup_layers(self, doc):
        layers = [
            "STRUCTURE", "REINFORCEMENT", "DIMENSIONS", "HATCHING", 
            "TEXT_ANNOT", "HFL_LEVEL", "SCOUR_LEVEL", "BED_LEVEL",
            "GEOMETRY", "FOUNDATION", "PIER", "ABUTMENT", "WINGWALL",
            "SECTIONS", "PLAN_VIEW", "GAD"
        ]
        for idx, layer in enumerate(layers):
            doc.layers.new(layer, color=idx % 7 + 1)
            
    def _draw_wall_pier(self, msp, height, width):
        attribs = GfxAttribs(layer="PIER")
        msp.add_lwpolyline([
            (0, 0), 
            (width, 0), 
            (width, height), 
            (0, height)
        ], close=True, dxfattribs=attribs)
        
    def _draw_column_pier(self, msp, height, width, cols):
        attribs = GfxAttribs(layer="PIER")
        col_width = width / (cols * 2)
        spacing = width / cols
        for i in range(cols):
            x_start = i * spacing + (spacing - col_width)/2
            msp.add_lwpolyline([
                (x_start, 0), 
                (x_start + col_width, 0), 
                (x_start + col_width, height), 
                (x_start, height)
            ], close=True, dxfattribs=attribs)
