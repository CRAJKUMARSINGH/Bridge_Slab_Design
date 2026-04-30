import os
import glob
import ezdxf

class PierAssetScanner:
    """
    Scans the existing Pier Geometry drawings to establish templates and bounds.
    """
    def __init__(self, asset_dir: str):
        self.asset_dir = asset_dir
        self.templates = {}
        
    def scan(self):
        """
        Scans all DXF/DWG files in the asset directory and catalogs them.
        """
        if not os.path.exists(self.asset_dir):
            print(f"Warning: Asset directory {self.asset_dir} not found.")
            return self.templates
            
        dxf_files = glob.glob(os.path.join(self.asset_dir, "*.dxf"))
        
        for file in dxf_files:
            basename = os.path.basename(file).lower()
            pier_type = self._classify_pier_type(basename)
            
            # Read DXF basic stats (simulated analysis)
            try:
                doc = ezdxf.readfile(file)
                msp = doc.modelspace()
                entities = len(msp)
                
                self.templates[pier_type] = {
                    "source_file": file,
                    "entities_count": entities,
                    "status": "ready"
                }
                print(f"Scanned {basename} -> Classified as {pier_type}")
            except Exception as e:
                print(f"Error reading {file}: {e}")
                
        return self.templates
        
    def _classify_pier_type(self, filename: str) -> str:
        if "circular" in filename:
            return "circular"
        elif "wall" in filename or "rect" in filename:
            return "wall_type"
        elif "hammer" in filename:
            return "hammerhead"
        elif "portal" in filename:
            return "portal"
        else:
            return "single_column"

if __name__ == "__main__":
    scanner = PierAssetScanner(r"..\assets\COMPONENT_DRAWINGS_SORTED\Pier Geometry & Dimensions")
    results = scanner.scan()
    print("Scan Results:", results)
