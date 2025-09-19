import pandas as pd
import numpy as np
import json
from typing import Dict, List, Tuple, Any

class BridgeHydraulicDataExtractor:
    def __init__(self, excel_file_path: str):
        self.excel_file_path = excel_file_path
        # Reuse a single ExcelFile handle for all sheet parses (significantly faster)
        self.xl_file = pd.ExcelFile(excel_file_path)
        self.extracted_data = {}
    
    def _parse_sheet(self, sheet_name: str):
        """Safely parse a sheet using the cached ExcelFile. Returns DataFrame or raises."""
        if sheet_name not in self.xl_file.sheet_names:
            raise ValueError(f"Sheet '{sheet_name}' not found. Available: {self.xl_file.sheet_names}")
        return self.xl_file.parse(sheet_name=sheet_name, header=None)
        
    def extract_afflux_calculation(self) -> Dict[str, Any]:
        """Extract afflux calculation data"""
        try:
            df = self._parse_sheet('afflux calculation')
            
            # Extract key afflux parameters
            afflux_data = {
                'sheet_name': 'afflux calculation',
                'description': 'Afflux calculation for bridge hydraulics',
                'key_parameters': {},
                'raw_data': []
            }
            
            # Look for specific values in the data
            for idx, row in df.iterrows():
                row_data = []
                for col in df.columns:
                    cell_value = df.iloc[idx, col]
                    if pd.notna(cell_value):
                        row_data.append(str(cell_value))
                    else:
                        row_data.append('')
                
                if any(row_data):  # Only add non-empty rows
                    afflux_data['raw_data'].append({
                        'row': idx,
                        'data': row_data
                    })
                    
                    # Extract specific parameters
                    row_text = ' '.join(row_data).lower()
                    if 'afflux' in row_text and any(char.isdigit() for char in row_text):
                        afflux_data['key_parameters'][f'parameter_{idx}'] = row_data
            
            return afflux_data
            
        except Exception as e:
            return {'error': f'Error extracting afflux data: {str(e)}'}
    
    def extract_hydraulics_data(self) -> Dict[str, Any]:
        """Extract hydraulics data"""
        try:
            df = self._parse_sheet('HYDRAULICS')
            
            hydraulics_data = {
                'sheet_name': 'HYDRAULICS',
                'description': 'Bridge hydraulics calculations',
                'water_levels': {},
                'discharge_data': {},
                'velocity_data': {},
                'raw_data': []
            }
            
            for idx, row in df.iterrows():
                row_data = []
                for col in df.columns:
                    cell_value = df.iloc[idx, col]
                    if pd.notna(cell_value):
                        if isinstance(cell_value, (int, float)):
                            row_data.append(cell_value)
                        else:
                            row_data.append(str(cell_value))
                    else:
                        row_data.append('')
                
                if any(str(x) for x in row_data if x != ''):
                    hydraulics_data['raw_data'].append({
                        'row': idx,
                        'data': row_data
                    })
                    
                    # Extract water levels, discharge, velocity data
                    row_text = ' '.join(str(x) for x in row_data).lower()
                    if 'discharge' in row_text or 'flow' in row_text:
                        hydraulics_data['discharge_data'][f'row_{idx}'] = row_data
                    elif 'velocity' in row_text or 'speed' in row_text:
                        hydraulics_data['velocity_data'][f'row_{idx}'] = row_data
                    elif 'level' in row_text or 'elevation' in row_text:
                        hydraulics_data['water_levels'][f'row_{idx}'] = row_data
            
            return hydraulics_data
            
        except Exception as e:
            return {'error': f'Error extracting hydraulics data: {str(e)}'}
    
    def extract_deck_anchorage_data(self) -> Dict[str, Any]:
        """Extract deck anchorage data"""
        try:
            df = self._parse_sheet('Deck Anchorage')
            
            anchorage_data = {
                'sheet_name': 'Deck Anchorage',
                'description': 'Deck anchorage calculations for submersible bridge',
                'uplift_calculations': {},
                'anchorage_requirements': {},
                'design_parameters': {},
                'raw_data': []
            }
            
            for idx, row in df.iterrows():
                row_data = []
                for col in df.columns:
                    cell_value = df.iloc[idx, col]
                    if pd.notna(cell_value):
                        row_data.append(str(cell_value))
                    else:
                        row_data.append('')
                
                if any(row_data):
                    anchorage_data['raw_data'].append({
                        'row': idx,
                        'data': row_data
                    })
                    
                    # Extract specific calculations
                    row_text = ' '.join(row_data).lower()
                    if 'uplift' in row_text:
                        anchorage_data['uplift_calculations'][f'row_{idx}'] = row_data
                    elif 'anchor' in row_text:
                        anchorage_data['anchorage_requirements'][f'row_{idx}'] = row_data
                    elif any(keyword in row_text for keyword in ['pressure', 'force', 'area']):
                        anchorage_data['design_parameters'][f'row_{idx}'] = row_data
            
            return anchorage_data
            
        except Exception as e:
            return {'error': f'Error extracting deck anchorage data: {str(e)}'}
    
    def extract_cross_section_data(self) -> Dict[str, Any]:
        """Extract cross section data"""
        try:
            df = self._parse_sheet('CROSS SECTION')
            
            cross_section_data = {
                'sheet_name': 'CROSS SECTION',
                'description': 'River cross section data',
                'chainage_data': [],
                'elevation_data': [],
                'coordinates': [],
                'raw_data': []
            }
            
            chainages = []
            elevations = []
            
            for idx, row in df.iterrows():
                row_data = []
                for col in df.columns:
                    cell_value = df.iloc[idx, col]
                    if pd.notna(cell_value):
                        row_data.append(cell_value)
                    else:
                        row_data.append('')
                
                if any(str(x) for x in row_data if x != ''):
                    cross_section_data['raw_data'].append({
                        'row': idx,
                        'data': row_data
                    })
                    
                    # Extract chainage and elevation pairs
                    if len(row_data) >= 2:
                        try:
                            chainage = float(row_data[0]) if str(row_data[0]).replace('.', '').isdigit() else None
                            elevation = float(row_data[1]) if str(row_data[1]).replace('.', '').isdigit() else None
                            
                            if chainage is not None and elevation is not None:
                                chainages.append(chainage)
                                elevations.append(elevation)
                                cross_section_data['coordinates'].append({
                                    'chainage': chainage,
                                    'elevation': elevation
                                })
                        except (ValueError, TypeError):
                            pass
            
            cross_section_data['chainage_data'] = chainages
            cross_section_data['elevation_data'] = elevations
            
            return cross_section_data
            
        except Exception as e:
            return {'error': f'Error extracting cross section data: {str(e)}'}
    
    def extract_bed_slope_data(self) -> Dict[str, Any]:
        """Extract bed slope data"""
        try:
            df = self._parse_sheet('Bed Slope')
            
            bed_slope_data = {
                'sheet_name': 'Bed Slope',
                'description': 'River bed slope determination',
                'longitudinal_profile': [],
                'slope_calculations': {},
                'bed_levels': [],
                'chainages': [],
                'raw_data': []
            }
            
            chainages = []
            bed_levels = []
            
            for idx, row in df.iterrows():
                row_data = []
                for col in df.columns:
                    cell_value = df.iloc[idx, col]
                    if pd.notna(cell_value):
                        row_data.append(cell_value)
                    else:
                        row_data.append('')
                
                if any(str(x) for x in row_data if x != ''):
                    bed_slope_data['raw_data'].append({
                        'row': idx,
                        'data': row_data
                    })
                    
                    # Extract chainage and bed level pairs
                    if len(row_data) >= 2:
                        try:
                            chainage = float(row_data[0]) if str(row_data[0]).replace('.', '').isdigit() else None
                            bed_level = float(row_data[1]) if str(row_data[1]).replace('.', '').isdigit() else None
                            
                            if chainage is not None and bed_level is not None:
                                chainages.append(chainage)
                                bed_levels.append(bed_level)
                                bed_slope_data['longitudinal_profile'].append({
                                    'chainage': chainage,
                                    'bed_level': bed_level
                                })
                        except (ValueError, TypeError):
                            pass
            
            bed_slope_data['chainages'] = chainages
            bed_slope_data['bed_levels'] = bed_levels
            
            # Calculate slope
            if len(chainages) > 1 and len(bed_levels) > 1:
                total_distance = max(chainages) - min(chainages)
                total_fall = max(bed_levels) - min(bed_levels)
                if total_distance > 0:
                    bed_slope_data['slope_calculations']['overall_slope'] = total_fall / total_distance
                    bed_slope_data['slope_calculations']['slope_percentage'] = (total_fall / total_distance) * 100
            
            return bed_slope_data
            
        except Exception as e:
            return {'error': f'Error extracting bed slope data: {str(e)}'}
    
    def extract_all_data(self) -> Dict[str, Any]:
        """Extract all hydraulic data from the Excel file"""
        self.extracted_data = {
            'file_info': {
                'file_path': self.excel_file_path,
                'available_sheets': self.xl_file.sheet_names,
                'extraction_timestamp': pd.Timestamp.now().isoformat()
            },
            'afflux_calculation': self.extract_afflux_calculation(),
            'hydraulics': self.extract_hydraulics_data(),
            'deck_anchorage': self.extract_deck_anchorage_data(),
            'cross_section': self.extract_cross_section_data(),
            'bed_slope': self.extract_bed_slope_data()
        }
        
        return self.extracted_data
    
    def save_extracted_data(self, output_file: str = 'extracted_bridge_hydraulic_data.json'):
        """Save extracted data to JSON file"""
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(self.extracted_data, f, indent=2, default=str)
        
        return output_file

if __name__ == "__main__":
    # Extract data from the Excel file
    import os
    file_path = os.path.join(
        'PROJECT FILES USED',
        'Bundan River Bridge TAD',
        '3 Stability Analysis SUBMERSIBLE BRIDGE  ACROSS BHUNDAN RIVER ON KATUMBI CHANDROD ROAD.xls'
    )
    
    extractor = BridgeHydraulicDataExtractor(file_path)
    all_data = extractor.extract_all_data()
    
    # Save to file
    output_file = extractor.save_extracted_data()
    print(f"Data extracted and saved to: {output_file}")
    
    # Print summary
    print("\n=== EXTRACTION SUMMARY ===")
    for key, value in all_data.items():
        if key != 'file_info':
            if isinstance(value, dict) and 'error' not in value:
                print(f"\n{key.upper()}:")
                if 'coordinates' in value and value['coordinates']:
                    print(f"  - Found {len(value['coordinates'])} coordinate pairs")
                if 'raw_data' in value:
                    print(f"  - Total rows: {len(value['raw_data'])}")
                if 'slope_calculations' in value and value['slope_calculations']:
                    print(f"  - Slope calculations: {value['slope_calculations']}")
            elif isinstance(value, dict) and 'error' in value:
                print(f"\n{key.upper()}: {value['error']}")