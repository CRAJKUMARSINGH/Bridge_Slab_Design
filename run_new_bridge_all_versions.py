#!/usr/bin/env python3
"""
Design a NEW bridge and generate outputs in four versions:
1) Base report (bridge_design_app)
2) Base estimate JSON (export_estimate)
3) Enhanced report (enhanced_bridge_design_app)
4) Enhanced detailed results JSON
"""

from bridge_design_app import BridgeDesignApp, ConcreteGrade, SteelGrade
from enhanced_bridge_design_app import EnhancedBridgeDesignApp
import json
import os
from datetime import datetime


def sample_survey_points(num_points: int = 15):
    pts = []
    for i in range(num_points):
        pts.append({
            'point_id': i + 1,
            'chainage': i * 5.0,
            'left_distance': i * 5.0,
            'right_distance': (num_points - 1 - i) * 5.0,
            'ground_level': 95.0 + i * 0.1,
            'bed_level': 94.0 + i * 0.05,
        })
    return pts


def sample_longitudinal_points(num_points: int = 10):
    pts = []
    for i in range(num_points):
        pts.append({
            'chainage': i * 25.0,
            'ground_level': 95.0 + i * 0.2,
        })
    return pts


def run_base_design() -> dict:
    app = BridgeDesignApp()
    app.input_survey_data(sample_survey_points(), sample_longitudinal_points())
    app.input_project_parameters(
        bridge_name="New Bridge Base",
        location="Auto-Generated Test Location",
        effective_span=9.6,
        pier_spacing_cc=11.1,
        bridge_width=12.0,
        pier_cap_width=15.0,
        num_spans=4,
        skew_angle=20.0,
    )
    app.input_hydraulic_parameters(
        discharge=1100.0,
        design_velocity=3.5,
        hfl=101.0,
        manning_n=0.033,
    )
    app.input_soil_parameters(safe_bearing_capacity=450)
    app.input_material_parameters(concrete_grade=ConcreteGrade.M25, steel_grade=SteelGrade.Fe415)

    results = app.design_bridge_one_click()

    # Base report
    base_report = app.generate_design_report()
    print("\n===== BASE REPORT =====\n")
    print(base_report)

    # Base estimate JSON
    base_estimate = app.export_estimate()
    base_json_path = os.path.join(os.getcwd(), f"base_estimate_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json")
    with open(base_json_path, 'w') as f:
        json.dump(base_estimate, f, indent=2)
    print(f"\n💾 Base estimate JSON saved to: {base_json_path}")

    return results


def run_enhanced_design() -> dict:
    app = EnhancedBridgeDesignApp()
    app.input_survey_data(sample_survey_points(), sample_longitudinal_points())
    app.input_project_parameters(
        bridge_name="New Bridge Enhanced",
        location="Auto-Generated Test Location",
        effective_span=9.6,
        pier_spacing_cc=11.1,
        bridge_width=12.0,
        pier_cap_width=15.0,
        num_spans=4,
        skew_angle=25.0,
    )
    app.input_hydraulic_parameters(
        discharge=1265.76,
        design_velocity=3.5,
        hfl=101.2,
        manning_n=0.033,
    )
    app.input_soil_parameters(safe_bearing_capacity=450)
    app.input_material_parameters(concrete_grade=ConcreteGrade.M25, steel_grade=SteelGrade.Fe415)

    results = app.design_bridge_complete()

    # Enhanced report
    enhanced_report = app.generate_enhanced_design_report()
    print("\n===== ENHANCED REPORT =====\n")
    print(enhanced_report)

    # Enhanced detailed results JSON
    enhanced_json_path = app.export_detailed_results(
        f"enhanced_results_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
    )
    print(f"\n💾 Enhanced detailed results saved to: {enhanced_json_path}")

    return results


def main():
    print("🚀 Designing NEW bridge in base and enhanced modes...")
    base = run_base_design()
    enhanced = run_enhanced_design()
    print("\n🎯 SUMMARY OUTPUTS GENERATED:")
    print("- Base report (printed above)")
    print("- Base estimate JSON (path printed above)")
    print("- Enhanced report (printed above)")
    print("- Enhanced detailed results JSON (path printed above)")


if __name__ == "__main__":
    main()

