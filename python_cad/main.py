import json
import os
import argparse
from pydantic import BaseModel
from pier_engine import PierParametricEngine

# JSON API Contract Definition
class BridgeDrawingPayload(BaseModel):
    project_name: str
    pier_type: str
    height: float
    width: float
    columns: int
    stem_thickness: float
    cap_beam_depth: float
    foundation_type: str
    seismic_zone: str

def process_payload(payload_json_path: str, output_dir: str):
    """
    Reads the JSON payload, validates via Pydantic, and generates DXF.
    """
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)
        
    with open(payload_json_path, 'r') as f:
        data = json.load(f)
        
    # Validate payload
    payload = BridgeDrawingPayload(**data)
    
    print(f"Generating drawings for {payload.project_name}...")
    engine = PierParametricEngine(output_dir=output_dir)
    output_path = engine.generate_dxf(payload.model_dump())
    
    print(f"Drawing successfully generated at {output_path}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Antigravity Pier CAD Engine")
    parser.add_argument("--payload", type=str, required=True, help="Path to JSON payload")
    parser.add_argument("--outdir", type=str, default="output", help="Output directory")
    
    args = parser.parse_args()
    process_payload(args.payload, args.outdir)
