#!/usr/bin/env python3
"""
SAMPLE SLAB BRIDGE DESIGN WITH INPUT FILE
Complete bridge design using the input parameters provided on screen
"""

from enhanced_bridge_design_app import EnhancedBridgeDesignApp, ConcreteGrade, SteelGrade

def design_sample_slab_bridge():
    """Design a slab bridge using the provided input parameters"""
    
    print("🌉 SAMPLE SLAB BRIDGE DESIGN")
    print("="*60)
    print("Using input parameters provided on screen...")
    
    # Initialize enhanced app
    app = EnhancedBridgeDesignApp()
    
    # Cross-section survey data (15 points as specified in input)
    cross_section_data = [
        {'point_id': 1, 'chainage': 0.0, 'left_distance': 0.0, 'right_distance': 70.0, 'ground_level': 95.0, 'bed_level': 94.0},
        {'point_id': 2, 'chainage': 5.0, 'left_distance': 5.0, 'right_distance': 65.0, 'ground_level': 95.1, 'bed_level': 94.05},
        {'point_id': 3, 'chainage': 10.0, 'left_distance': 10.0, 'right_distance': 60.0, 'ground_level': 95.2, 'bed_level': 94.1},
        {'point_id': 4, 'chainage': 15.0, 'left_distance': 15.0, 'right_distance': 55.0, 'ground_level': 95.3, 'bed_level': 94.15},
        {'point_id': 5, 'chainage': 20.0, 'left_distance': 20.0, 'right_distance': 50.0, 'ground_level': 95.4, 'bed_level': 94.2},
        {'point_id': 6, 'chainage': 25.0, 'left_distance': 25.0, 'right_distance': 45.0, 'ground_level': 95.5, 'bed_level': 94.25},
        {'point_id': 7, 'chainage': 30.0, 'left_distance': 30.0, 'right_distance': 40.0, 'ground_level': 95.6, 'bed_level': 94.3},
        {'point_id': 8, 'chainage': 35.0, 'left_distance': 35.0, 'right_distance': 35.0, 'ground_level': 95.7, 'bed_level': 94.35},
        {'point_id': 9, 'chainage': 40.0, 'left_distance': 40.0, 'right_distance': 30.0, 'ground_level': 95.8, 'bed_level': 94.4},
        {'point_id': 10, 'chainage': 45.0, 'left_distance': 45.0, 'right_distance': 25.0, 'ground_level': 95.9, 'bed_level': 94.45},
        {'point_id': 11, 'chainage': 50.0, 'left_distance': 50.0, 'right_distance': 20.0, 'ground_level': 96.0, 'bed_level': 94.5},
        {'point_id': 12, 'chainage': 55.0, 'left_distance': 55.0, 'right_distance': 15.0, 'ground_level': 96.1, 'bed_level': 94.55},
        {'point_id': 13, 'chainage': 60.0, 'left_distance': 60.0, 'right_distance': 10.0, 'ground_level': 96.2, 'bed_level': 94.6},
        {'point_id': 14, 'chainage': 65.0, 'left_distance': 65.0, 'right_distance': 5.0, 'ground_level': 96.3, 'bed_level': 94.65},
        {'point_id': 15, 'chainage': 70.0, 'left_distance': 70.0, 'right_distance': 0.0, 'ground_level': 96.4, 'bed_level': 94.7}
    ]
    
    # Longitudinal section data (10 points covering bridge length)
    longitudinal_data = [
        {'chainage': 0.0, 'ground_level': 95.0},
        {'chainage': 25.0, 'ground_level': 95.5},
        {'chainage': 50.0, 'ground_level': 96.0},
        {'chainage': 75.0, 'ground_level': 96.5},
        {'chainage': 100.0, 'ground_level': 97.0},
        {'chainage': 125.0, 'ground_level': 97.5},
        {'chainage': 150.0, 'ground_level': 98.0},
        {'chainage': 175.0, 'ground_level': 98.5},
        {'chainage': 200.0, 'ground_level': 99.0},
        {'chainage': 225.0, 'ground_level': 99.5}
    ]
    
    print("\n📊 INPUT DATA SUMMARY:")
    print(f"• Cross-section points: {len(cross_section_data)}")
    print(f"• Longitudinal points: {len(longitudinal_data)}")
    print(f"• Bridge spans: 3")
    print(f"• Effective span: 12.0m")
    print(f"• Bridge width: 12.5m")
    print(f"• Skew angle: 10.0°")
    
    # Input survey data to app
    app.input_survey_data(cross_section_data, longitudinal_data)
    
    # Input project parameters from the provided input file
    app.input_project_parameters(
        bridge_name="Sample Slab Bridge Design",
        location="River Crossing - Sample Location",
        effective_span=12.0,
        pier_spacing_cc=13.5,
        bridge_width=12.5,
        pier_cap_width=15.0,
        num_spans=3,
        skew_angle=10.0
    )
    
    # Input hydraulic parameters from the provided input file
    app.input_hydraulic_parameters(
        discharge=1265.76,
        design_velocity=3.5,
        hfl=101.2,
        manning_n=0.033
    )
    
    # Input soil parameters from the provided input file
    app.input_soil_parameters(
        safe_bearing_capacity=450,
        angle_of_friction=30,
        unit_weight=18.0
    )
    
    # Input material parameters from the provided input file
    app.input_material_parameters(
        concrete_grade=ConcreteGrade.M25,
        steel_grade=SteelGrade.Fe415
    )
    
    print("\n🚀 Starting Complete Bridge Design...")
    print("This includes:")
    print("✅ Hydraulic Analysis")
    print("✅ Pier Design with Detailed Geometry")
    print("✅ Foundation Optimization")
    print("✅ Type-1 & Type-2 Abutment Design")
    print("✅ Comprehensive Cost Estimation")
    print("✅ Material Quantity Takeoff")
    
    # Run the complete enhanced design
    results = app.design_bridge_complete()
    
    # Generate and display the complete design report
    report = app.generate_enhanced_design_report()
    print(report)
    
    # Export detailed results
    export_file = app.export_detailed_results("sample_slab_bridge_design_results.json")
    print(f"\n💾 Complete design results saved to: {export_file}")
    
    # Display key design outputs
    print("\n🎯 KEY DESIGN OUTPUTS:")
    print("="*40)
    print(f"✅ Design Status: {results['design_status']}")
    print(f"📐 Bridge Configuration: 3 spans × 12.0m = 36.0m total length")
    print(f"🌊 Hydraulic Check: {results['hydraulic_analysis']['effective_waterway']:.1f}m waterway")
    print(f"🏗️ Pier Height: {results['detailed_pier_geometry']['total_pier_height']:.2f}m")
    print(f"🏛️ Foundation Size: {results['detailed_pier_geometry']['footing_details']['length']:.1f}m × {results['detailed_pier_geometry']['footing_details']['width']:.1f}m")
    print(f"💰 Total Cost: ₹{results['comprehensive_estimation']['total_project_cost']:,.0f}")
    print(f"🏗️ Concrete: {results['comprehensive_estimation']['material_summary']['total_concrete']:.1f} m³")
    print(f"🔩 Steel: {results['comprehensive_estimation']['material_summary']['total_steel']:.1f} tonnes")
    print(f"📋 Recommended Abutment: {results['complete_abutment_design']['comparison_summary']['recommended_type']}")
    
    return app, results

if __name__ == "__main__":
    print("🚀 RUNNING SAMPLE SLAB BRIDGE DESIGN")
    print("Using the input file parameters provided on screen")
    print("="*80)
    
    try:
        app, results = design_sample_slab_bridge()
        
        print("\n🏆 BRIDGE DESIGN COMPLETED SUCCESSFULLY!")
        print("✅ All design calculations completed")
        print("✅ Cost estimation generated") 
        print("✅ Results exported to JSON file")
        print("✅ Ready for detailed review and construction")
        
    except Exception as e:
        print(f"\n❌ Error during bridge design: {str(e)}")
        print("Please check the input parameters and try again.")