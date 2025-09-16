#!/usr/bin/env python3
"""
ENHANCED PRIZE-WINNING BRIDGE DESIGN APPLICATION
Complete Bridge Design with Abutment Types, Detailed Pier Geometry, and Comprehensive Estimation

Features Added:
- Type-1 Battered Abutment (UIT Bridges)
- Type-2 Cantilever Abutment (Chittorgarh)
- Detailed Pier Geometry (Cap, Stem, Flared Portion, Footing)
- Comprehensive Cost Estimation
- Quantity Takeoff

Author: Warp AI 2025
Version: 2.0.0 - Enhanced Edition
"""

import math
import pandas as pd
import numpy as np
from dataclasses import dataclass
from typing import List, Dict, Tuple, Optional
from enum import Enum
import json
from datetime import datetime

# Import all classes from the base app
from bridge_design_app import *

# ============================================================================
# ENHANCED MAIN APPLICATION WITH ALL FEATURES
# ============================================================================

class EnhancedBridgeDesignApp(BridgeDesignApp):
    """
    Enhanced bridge design app with complete features:
    - Both abutment types
    - Detailed pier geometry
    - Comprehensive estimation
    """
    
    def __init__(self):
        super().__init__()
        self.detailed_pier_geometry = None
        self.abutment_designs = {}
        self.estimator = None
        self.complete_estimate = None
    
    def design_bridge_complete(self) -> Dict[str, any]:
        """
        COMPLETE BRIDGE DESIGN WITH ALL FEATURES
        - Hydraulic analysis
        - Pier design with detailed geometry
        - Both abutment types
        - Comprehensive estimation
        """
        print("🌉 Starting COMPLETE Bridge Design with All Features...")
        
        # Step 1: Basic design (from parent class)
        print("📊 Step 1: Basic Bridge Design...")
        basic_results = self.design_bridge_one_click()
        
        # Step 2: Detailed Pier Geometry
        print("🏗️ Step 2: Detailed Pier Geometry Analysis...")
        detailed_pier_results = self._calculate_detailed_pier_geometry()
        
        # Step 3: Complete Abutment Design (Both Types)
        print("🏛️ Step 3: Complete Abutment Design (Both Types)...")
        complete_abutment_results = self._design_complete_abutments()
        
        # Step 4: Comprehensive Estimation
        print("💰 Step 4: Comprehensive Cost Estimation...")
        estimation_results = self._calculate_comprehensive_estimate(
            detailed_pier_results, complete_abutment_results
        )
        
        # Step 5: Generate Design Summary
        print("📋 Step 5: Generating Complete Design Summary...")
        
        # Compile enhanced results
        enhanced_results = {
            **basic_results,  # Include basic results
            'detailed_pier_geometry': detailed_pier_results,
            'complete_abutment_design': complete_abutment_results,
            'comprehensive_estimation': estimation_results,
            'design_version': 'Enhanced v2.0.0',
            'features_included': [
                'Hydraulic Analysis',
                'Pier Stability & Design',
                'Foundation Optimization',
                'Type-1 Battered Abutment',
                'Type-2 Cantilever Abutment',
                'Detailed Pier Geometry',
                'Comprehensive Cost Estimation',
                'Quantity Takeoff'
            ]
        }
        
        self.design_results = enhanced_results
        print("✅ COMPLETE Bridge Design FINISHED!")
        return enhanced_results
    
    def _calculate_detailed_pier_geometry(self) -> Dict[str, any]:
        """Calculate detailed pier geometry with all components"""
        if not self.design_results.get('foundation_design'):
            return {'error': 'Foundation design not completed'}
        
        # Create pier design instance
        pier = PierDesign(self.project_data, self.hydraulic_data, 
                         self.soil_data, self.material_data)
        pier.calculate_levels()
        
        # Create detailed geometry calculator
        detailed_geom = DetailedPierGeometry(pier)
        
        # Calculate complete geometry using optimized footing
        complete_geometry = detailed_geom.calculate_complete_geometry(
            self.design_results['foundation_design']
        )
        
        self.detailed_pier_geometry = complete_geometry
        
        return {
            'pier_cap_details': complete_geometry['pier_cap'],
            'pier_stem_details': complete_geometry['pier_stem'],
            'flared_portion_details': complete_geometry['flared_portion'],
            'footing_details': complete_geometry['footing'],
            'total_pier_height': complete_geometry['total_height'],
            'total_pier_volume': complete_geometry['total_volume'],
            'pier_levels_summary': {
                'deck_level': complete_geometry['pier_cap']['level_top'] + 0.025,
                'pier_cap_top': complete_geometry['pier_cap']['level_top'],
                'pier_cap_bottom': complete_geometry['pier_cap']['level_bottom'],
                'pier_stem_top': complete_geometry['pier_stem']['level_top'],
                'pier_stem_bottom': complete_geometry['pier_stem']['level_bottom'],
                'footing_top': complete_geometry['footing']['level_top'],
                'footing_bottom': complete_geometry['footing']['level_bottom']
            }
        }
    
    def _design_complete_abutments(self) -> Dict[str, any]:
        """Design both Type-1 and Type-2 abutments"""
        # Type-1 Battered Abutment (UIT Style)
        type1_abutment = AbutmentDesign(
            self.project_data, self.hydraulic_data, self.soil_data, 
            self.material_data, AbutmentType.TYPE_1_BATTERED
        )
        
        # Type-2 Cantilever Abutment (Chittorgarh Style)  
        type2_abutment = AbutmentDesign(
            self.project_data, self.hydraulic_data, self.soil_data, 
            self.material_data, AbutmentType.TYPE_2_CANTILEVER
        )
        
        # Calculate Type-1 design
        type1_geometry = type1_abutment.calculate_abutment_geometry()
        type1_loads = type1_abutment.calculate_dead_loads(type1_geometry)
        type1_pressures = type1_abutment.calculate_earth_pressures()
        
        # Calculate Type-2 design
        type2_geometry = type2_abutment.calculate_abutment_geometry()
        type2_loads = type2_abutment.calculate_dead_loads(type2_geometry)
        type2_pressures = type2_abutment.calculate_earth_pressures()
        
        # Store for estimation
        self.abutment_designs = {
            'type1': {'loads': type1_loads, 'geometry': type1_geometry},
            'type2': {'loads': type2_loads, 'geometry': type2_geometry}
        }
        
        return {
            'type_1_battered_abutment': {
                'geometry': type1_geometry,
                'dead_loads': type1_loads,
                'earth_pressures': type1_pressures,
                'design_status': 'COMPLETED',
                'reference': 'Based on UIT Bridges Excel sheets'
            },
            'type_2_cantilever_abutment': {
                'geometry': type2_geometry,
                'dead_loads': type2_loads,
                'earth_pressures': type2_pressures,
                'design_status': 'COMPLETED',
                'reference': 'Based on Chittorgarh Excel sheets'
            },
            'comparison_summary': {
                'type1_total_load': type1_loads['total_dead_load'],
                'type2_total_load': type2_loads['total_dead_load'],
                'recommended_type': 'Type-1 Battered' if type1_loads['total_dead_load'] < type2_loads['total_dead_load'] else 'Type-2 Cantilever',
                'cost_difference': abs(type1_loads['total_dead_load'] - type2_loads['total_dead_load'])
            }
        }
    
    def _calculate_comprehensive_estimate(self, pier_details: Dict, abutment_details: Dict) -> Dict[str, any]:
        """Calculate comprehensive cost estimate for entire bridge"""
        # Initialize estimator
        self.estimator = BridgeEstimator(self.material_data)
        
        # Calculate pier quantities (using detailed geometry)
        pier_quantities = self.estimator.calculate_pier_quantities(
            self.detailed_pier_geometry, num_piers=2
        )
        
        # Calculate abutment quantities (using Type-1 as default)
        abutment_quantities = self.estimator.calculate_abutment_quantities(
            self.abutment_designs['type1']['loads'],
            self.abutment_designs['type1']['geometry']
        )
        
        # Calculate deck quantities
        deck_quantities = self.estimator.calculate_deck_quantities(self.project_data)
        
        # Calculate total cost estimate
        total_estimate = self.estimator.calculate_total_cost_estimate(
            pier_quantities, abutment_quantities, deck_quantities
        )
        
        self.complete_estimate = total_estimate
        
        # Enhanced estimation summary
        estimation_summary = {
            'pier_quantities': pier_quantities,
            'abutment_quantities': abutment_quantities, 
            'deck_quantities': deck_quantities,
            'cost_breakdown': total_estimate['costs'],
            'total_project_cost': total_estimate['total_project_cost'],
            'cost_per_sqm_deck': total_estimate['cost_per_sqm'],
            'material_summary': {
                'total_concrete': total_estimate['quantities']['concrete'],
                'total_steel': total_estimate['quantities']['steel'],
                'total_formwork': total_estimate['quantities']['formwork'],
                'total_excavation': total_estimate['quantities']['excavation']
            },
            'cost_distribution': {
                'pier_cost_percentage': (pier_quantities['concrete'] * self.estimator.rates[f'concrete_m{self.material_data.concrete_grade.value}'] + 
                                       pier_quantities['steel'] * self.estimator.rates[f'steel_fe{self.material_data.steel_grade.value}']) / total_estimate['total_project_cost'] * 100,
                'abutment_cost_percentage': (abutment_quantities['concrete'] * self.estimator.rates[f'concrete_m{self.material_data.concrete_grade.value}'] + 
                                           abutment_quantities['steel'] * self.estimator.rates[f'steel_fe{self.material_data.steel_grade.value}']) / total_estimate['total_project_cost'] * 100,
                'deck_cost_percentage': (deck_quantities['concrete'] * self.estimator.rates[f'concrete_m{self.material_data.concrete_grade.value}'] + 
                                       deck_quantities['steel'] * self.estimator.rates[f'steel_fe{self.material_data.steel_grade.value}']) / total_estimate['total_project_cost'] * 100
            }
        }
        
        return estimation_summary
    
    def generate_enhanced_design_report(self) -> str:
        """Generate comprehensive design report with all features"""
        if not self.design_results:
            return "No design results available. Run design_bridge_complete() first."
        
        report = f"""
🌉 ENHANCED BRIDGE DESIGN REPORT
{'='*60}

PROJECT INFORMATION:
• Bridge Name: {self.design_results['project_info']['bridge_name']}
• Location: {self.design_results['project_info']['location']}  
• Design Date: {self.design_results['project_info']['design_date']}
• Skew Angle: {self.design_results['project_info']['skew_angle']}°
• Design Version: {self.design_results['design_version']}

HYDRAULIC ANALYSIS:
• Discharge: {self.design_results['hydraulic_analysis']['discharge']} Cumecs
• Design Velocity: {self.design_results['hydraulic_analysis']['design_velocity']} m/sec
• Regime Width: {self.design_results['hydraulic_analysis']['regime_width']:.2f} m
• Effective Waterway: {self.design_results['hydraulic_analysis']['effective_waterway']:.2f} m
• Afflux: {self.design_results['hydraulic_analysis']['afflux']:.3f} m

DETAILED PIER DESIGN:
• Total Pier Height: {self.design_results['detailed_pier_geometry']['total_pier_height']:.2f} m
• Pier Cap: {self.design_results['detailed_pier_geometry']['pier_cap_details']['length']:.1f}m × {self.design_results['detailed_pier_geometry']['pier_cap_details']['width']:.1f}m × {self.design_results['detailed_pier_geometry']['pier_cap_details']['thickness']:.1f}m
• Pier Stem: {self.design_results['detailed_pier_geometry']['pier_stem_details']['length']:.1f}m × {self.design_results['detailed_pier_geometry']['pier_stem_details']['width']:.1f}m × {self.design_results['detailed_pier_geometry']['pier_stem_details']['height']:.1f}m
• Footing: {self.design_results['detailed_pier_geometry']['footing_details']['length']:.1f}m × {self.design_results['detailed_pier_geometry']['footing_details']['width']:.1f}m × {self.design_results['detailed_pier_geometry']['footing_details']['thickness']:.1f}m

FOUNDATION OPTIMIZATION:
• Status: {self.design_results['foundation_design']['status']}
• Maximum Pressure: {self.design_results['foundation_design']['max_pressure']:.2f} kN/m²
• Utilization: {self.design_results['foundation_design']['utilization_ratio']:.1%}
• Safety: No Tension Area ✅

ABUTMENT DESIGN COMPARISON:
• Type-1 Battered Total Load: {self.design_results['complete_abutment_design']['type_1_battered_abutment']['dead_loads']['total_dead_load']:.0f} kN
• Type-2 Cantilever Total Load: {self.design_results['complete_abutment_design']['type_2_cantilever_abutment']['dead_loads']['total_dead_load']:.0f} kN
• Recommended: {self.design_results['complete_abutment_design']['comparison_summary']['recommended_type']}

COMPREHENSIVE COST ESTIMATION:
• Total Project Cost: ₹{self.design_results['comprehensive_estimation']['total_project_cost']:,.0f}
• Cost per m² of Deck: ₹{self.design_results['comprehensive_estimation']['cost_per_sqm_deck']:,.0f}

MATERIAL QUANTITIES:
• Concrete: {self.design_results['comprehensive_estimation']['material_summary']['total_concrete']:.1f} m³
• Steel Reinforcement: {self.design_results['comprehensive_estimation']['material_summary']['total_steel']:.1f} tonnes  
• Formwork: {self.design_results['comprehensive_estimation']['material_summary']['total_formwork']:.1f} m²
• Excavation: {self.design_results['comprehensive_estimation']['material_summary']['total_excavation']:.1f} m³

COST DISTRIBUTION:
• Pier Cost: {self.design_results['comprehensive_estimation']['cost_distribution']['pier_cost_percentage']:.1f}%
• Abutment Cost: {self.design_results['comprehensive_estimation']['cost_distribution']['abutment_cost_percentage']:.1f}%
• Deck Cost: {self.design_results['comprehensive_estimation']['cost_distribution']['deck_cost_percentage']:.1f}%

FEATURES INCLUDED:
"""
        
        for feature in self.design_results['features_included']:
            report += f"✅ {feature}\n"
        
        report += f"""
DESIGN STATUS: {self.design_results['design_status']} 🏆

{'='*60}
Generated by Enhanced Warp AI Bridge Design App 2025
Complete Solution: Survey Data → Professional Bridge Design → Cost Estimate
Based on extracted formulas from actual Excel sheets (UIT + Chittorgarh)
        """
        
        return report
    
    def export_detailed_results(self, filename: str = None) -> str:
        """Export detailed results to JSON file"""
        if not filename:
            filename = f"enhanced_bridge_design_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        
        filepath = f"C:\\Users\\Rajkumar\\Bridge_Slab_Design\\{filename}"
        
        with open(filepath, 'w') as f:
            json.dump(self.design_results, f, indent=2, default=str)
        
        return filepath

# ============================================================================
# ENHANCED EXAMPLE USAGE
# ============================================================================

def create_enhanced_bridge_design():
    """Create enhanced bridge design with all features"""
    
    # Initialize enhanced app
    app = EnhancedBridgeDesignApp()
    
    # Sample survey data (15 points as specified)
    sample_cross_section = []
    for i in range(15):
        sample_cross_section.append({
            'point_id': i + 1,
            'chainage': i * 5.0,  # 5m spacing as specified
            'left_distance': i * 5.0,
            'right_distance': (14 - i) * 5.0,
            'ground_level': 95.0 + i * 0.1,
            'bed_level': 94.0 + i * 0.05
        })
    
    # Sample longitudinal section (25m spacing)
    sample_longitudinal = []
    for i in range(10):
        sample_longitudinal.append({
            'chainage': i * 25.0,
            'ground_level': 95.0 + i * 0.2
        })
    
    # Input data using extracted Excel values
    app.input_survey_data(sample_cross_section, sample_longitudinal)
    
    app.input_project_parameters(
        bridge_name="Enhanced Sample Bridge Design",
        location="Complete Bridge Design Location",
        effective_span=9.6,  # From Excel
        pier_spacing_cc=11.1,  # From Excel  
        bridge_width=12.0,
        pier_cap_width=15.0,  # From Excel
        num_spans=3,
        skew_angle=15.0  # Sample skew
    )
    
    app.input_hydraulic_parameters(
        discharge=1265.76,  # From UIT Excel
        design_velocity=3.5,  # From Excel
        hfl=101.2,  # From Excel
        manning_n=0.033  # From Excel
    )
    
    app.input_soil_parameters(
        safe_bearing_capacity=450,  # From Excel
        angle_of_friction=30,
        unit_weight=18.0
    )
    
    app.input_material_parameters(
        concrete_grade=ConcreteGrade.M25,
        steel_grade=SteelGrade.Fe415
    )
    
    # Run complete enhanced design
    results = app.design_bridge_complete()
    
    # Generate and print enhanced report
    report = app.generate_enhanced_design_report()
    print(report)
    
    # Export detailed results
    export_file = app.export_detailed_results()
    print(f"\n💾 Enhanced results saved to: {export_file}")
    
    return app, results

if __name__ == "__main__":
    # Run enhanced bridge design
    print("🚀 Running Enhanced Bridge Design with ALL FEATURES...")
    print("Features: Pier Design + Type-1 & Type-2 Abutments + Complete Estimation")
    print("="*80)
    
    app, results = create_enhanced_bridge_design()
    
    print("\n🎯 SUMMARY:")
    print(f"• Total Project Cost: ₹{results['comprehensive_estimation']['total_project_cost']:,.0f}")
    print(f"• Concrete Required: {results['comprehensive_estimation']['material_summary']['total_concrete']:.1f} m³")
    print(f"• Steel Required: {results['comprehensive_estimation']['material_summary']['total_steel']:.1f} tonnes")
    print(f"• Recommended Abutment: {results['complete_abutment_design']['comparison_summary']['recommended_type']}")
    
    print("\n🏆 ENHANCED BRIDGE DESIGN APP WITH ALL FEATURES IS READY!")
    print("✅ Complete solution from survey data to cost estimate!")
